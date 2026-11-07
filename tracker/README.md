# Curiously Studio

Internal content-pipeline tracker for the Curiously channel: ideas → research → script → fact-check → storyboard → voiceover → animation → review → packaging → scheduled → posted.

## Run it locally (Mac or Windows)

Needs Node.js 20+.

```bash
cd tracker
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local, then fill in values
npm run setup                # creates the database + seeds series and starter ideas
npm run dev                  # http://localhost:3000
```

The first sign-in copies `APP_USERS` from `.env.local` (`username:password,username:password`) into the database as admins. After that, accounts live on the **Users** page and `APP_USERS` is ignored.

### Always-on at login (macOS)

```bash
npm run service:install    # build, register, start → http://localhost:3000
npm run service:restart    # after code or .env.local changes: rebuild + restart
npm run service:status     # is it running?
npm run service:logs       # follow the log (~/Library/Logs/curiously-tracker.log)
npm run service:uninstall  # stop and remove auto-start
```

It runs as a LaunchAgent (`~/Library/LaunchAgents/com.curiously.tracker.plist`). It starts at login and restarts itself if it crashes.

## Share it between two people (Vercel + Turso, free tiers)

Running locally keeps the data on one laptop. To work from the same board on two machines:

1. Create a free database at [turso.tech](https://turso.tech) and copy its URL (`libsql://…`) and auth token.
2. Point `.env.local` at it (`DATABASE_URL`, `DATABASE_AUTH_TOKEN`) and run `npm run setup` once.
3. Push the repo to a private GitHub repo and import it in [Vercel](https://vercel.com) with **Root Directory = `tracker`**.
4. In Vercel → Settings → Environment Variables, add `APP_USERS`, `AUTH_SECRET`, `API_TOKEN`, `DATABASE_URL` and `DATABASE_AUTH_TOKEN`.

Both of you then sign in at the Vercel URL. Pages refresh every 20s, so you see each other’s changes.

## Pages

| Page | What it’s for |
| --- | --- |
| Dashboard | Launch countdown, runway (weeks of ready content per series), what needs attention, activity |
| Ideas | Detailed idea capture and backlog. “Start research →” promotes an idea into the pipeline |
| Pipeline | Kanban across all stages, drag and drop, filter by series or owner |
| Episode | One tab per stage (research, script with word count, fact-check table, storyboard, production, packaging, stats), stage checklist, comments, history |
| Calendar | Publish dates by month, dashed **open slots** where a series is due but nothing is scheduled |
| Series | Name, code prefix, colour, publishing days and format bible per series |

## API for Claude Code

Every request needs `Authorization: Bearer $API_TOKEN`. Changes made this way show up as **claude** in the activity log.

```bash
# list episodes in a stage
curl -H "Authorization: Bearer $API_TOKEN" "http://localhost:3000/api/episodes?stage=research"

# read one
curl -H "Authorization: Bearer $API_TOKEN" http://localhost:3000/api/episodes/HIS-001

# write research notes and flag it for one of us to review
curl -X PATCH -H "Authorization: Bearer $API_TOKEN" -H "Content-Type: application/json" \
  -d '{"research":"## The one insight\n…","readyForReview":true}' \
  http://localhost:3000/api/episodes/HIS-001

# add an idea
curl -X POST -H "Authorization: Bearer $API_TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"How Zomato routes riders","seriesId":1,"hook":"…"}' \
  http://localhost:3000/api/episodes
```

Editable fields: see `TEXT_FIELDS` / `NUMBER_FIELDS` in `src/lib/episodes.ts`, plus `readyForReview`, `priority`, `owner`, `seriesId` and `publishDate`.

## Stage skills and the review loop

Everything runs from the app. The **Skills** section in the sidebar lists the Claude Code skills in `../.claude/skills/`. Each skill page shows its instructions (editable; saving rewrites its `SKILL.md`), a Run button for episodes in that stage, and recent runs.

One 7-stage pipeline for every series. What a series wants (structure, length, depth, visuals, how episodes link) is its **playbook**, edited on the Series page and given to every skill as `series.formatNotes`. Adding a series means writing a playbook, not changing skills. AI runs in four stages; the rest are done by people.

| Stage | Who | Writes | Uses |
|---|---|---|---|
| Idea | People | hook, details, key points | |
| Research | `research` skill | `research` (insight, facts F1…, technical layer, assumptions) + `sources` | web search |
| Script | `script` skill | `script` (one line per scene, or slide copy) + `factcheck` (claim-by-claim, fixes already applied) | **factcheck** helper in a fresh subagent, humanizer |
| Make | `make` skill | Plan pass: `storyboard` (scenes or slide plan), then it pauses until a person ticks **Plan approved**. Build pass: video → `voiceoverUrl`, `voiceoverNotes`, `renderUrl`, `renderNotes`; carousel → `slides`, `renderUrl`, `designNotes`; both → `reviewReport` | helpers **storyboard**, **voiceover**, **animate**, **design**, **qa**; ElevenLabs, Remotion |
| Review | People | phone check | |
| Publish | `publish` skill | titles, captions, hashtags, cover notes, `publishDate` (from `episode.mjs slot`), `publishPlan` (upload kit, pinned comment) | helpers **package**, **schedule**; yt-package, yt-seo |
| Posted | People | links, 7-day stats | |

Board cards in Make show its sub-steps (Storyboard · Voiceover · Animation, or Slide plan · Slides · Short). Old stage keys are listed in `LEGACY_STAGES` in `src/lib/stages.ts`.

Helper skills (installed from open-source repos, listed under Helper Skills in the sidebar): humanizer, remotion-best-practices, elevenlabs-text-to-speech / speech-to-text / sound-effects / music, yt-package, yt-seo, yt-comment, earshot. earshot needs its toolkit in `../tools/earshot` (not installed yet); without it Review checks audio by loudness and listen-back only.

Videos are built per episode in `../video/src/episodes/<code>/` (see `../video/README.md`). Renders, voiceover previews and covers play on the episode page through `/media/…`, which serves only `video/out` and `video/public` to signed-in users.

The loop is the same for every stage:
1. Move the card into the stage and press **Run** in the episode's review panel. Claude Code runs in the background on this Mac, and its progress streams into the panel. When it's done, the new version (v1, v2…) is saved and the card shows **Ready for review**.
2. Review it. To approve, move the card on. To ask for changes, use **Request changes**. The card shows **Changes requested**.
3. Press **Run again with my notes**. It reads your notes and the previous version, writes the next version, and marks the notes as addressed.

Runs use the Claude Code program from the VS Code extension (or a standalone install, or `CLAUDE_BIN` in `.env.local`) and your Claude login. A run may only read and write files, search and read the web, and call `scripts/episode.mjs` to read and submit the episode. Logs are kept in `.runs/`. Claude does one job at a time: every run, idea fills included, joins a first-in, first-out queue (see **Queue**). Running skills needs the tracker running on this Mac; it won't work from a hosted deploy.

**Send back with fixes:** any stage skill that finds a problem belonging to an earlier stage (Make spotting a script problem, Publish finding an unusable cover frame) attaches a proposal: the earlier stage plus exact fixes. The stage shows it in a highlighted panel with **Send fixes to …**, the board card shows "Fixes for …", and Approve warns before carrying the problem forward. Sending moves the episode straight back to that stage (several steps if needed) and files the fixes there as a Request Changes note; run that stage again, and the stages after it are flagged out of date. Skills submit `sendBack=@sendback.json` (`{ "stage": "script", "notes": "…" }`) or `sendBack=none`.

**Checklists:** every stage skill also goes through its stage's checklist when it submits. It ticks what it confirmed (marked "Ticked by Claude", with a short note) and leaves anything it's unsure about unticked, with a highlighted note saying exactly where to look. The checklist card shows "N items need your attention". Items only a person can tick (`HUMAN_CHECKS` in `src/lib/stages.ts`, e.g. Script's second-person read-through and Make's Plan approved) are never ticked by Claude. New skills must include the same Checklist step and submit `checks=@checks.json`.

Every change to a stage's fields (by Claude or by hand) is kept as a version, and you can open any of them in the review panel. If an earlier stage changes after a later one was made, the later stage is flagged **Out of date**. Which fields and skill belong to each stage is set in `src/lib/stages.ts`.

**Stages are human-only.** The API can't move an episode between stages (a `stage` change returns 403), and new ideas always start in Idea. Claude sets `readyForReview: true` when a stage's work is done. The card then shows **Ready for review**, and one of us moves it on in the app, which clears the flag. In the app, stages move one step at a time (forward or back), and moving forward with checklist items still open asks for confirmation first.

## Changing things

- Stages and their checklists: `src/lib/stages.ts`
- Database fields: `src/db/schema.ts`, then run `npm run db:push`
- Browse raw data: `npm run db:studio`
