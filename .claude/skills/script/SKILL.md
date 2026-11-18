---
name: script
description: The Write stage of a Curiously episode - find a few solid facts from good sources, write a plain-words voiceover script (or carousel slide copy) on them, fact-check it claim by claim in a fresh subagent, apply the fixes, and submit research notes, script, fact-check and references to the tracker for one review. Use when asked to research or script an episode, usually from the tracker's Run button, including a new version after "request changes" notes.
---

# Write stage

One run turns an approved idea into a checked script: research just enough to answer the idea's question, write the script from those facts, fact-check it, submit. A person reviews it all on one page (research notes, script, fact-check, references) and either moves the episode to Make or requests changes, which brings you back here for the next version.

**Who it's for.** Normal people, not engineers. A viewer with no tech background should follow every line and come away knowing what happens behind the scenes, plus **one real idea** by its proper name, explained so simply they could repeat it to a friend. Short and correct beats deep and rushed.

**Claude Skills is different** (series prefix `CS`): it's for advanced Claude users, each episode features one GitHub repo, and the research is the repo itself plus a proof run. Follow section 2c instead of section 2's research rules, and the shape in its playbook (`series.formatNotes`). Everything else here still applies (intro, sign-off, humanizer, fact-check, checklist, submit).

## 1. Load the episode

```bash
node tracker/scripts/episode.mjs get <CODE>
```

Run from the Curiously project root. If the tracker isn't reachable, tell the user and stop. Read:
- **Idea:** `title`, `hook`, `summary`, `audience`, `keyPoints`, `visualIdeas`. The target length is `series.targetSeconds`.
- **Series playbook:** `series.formatNotes`: structure, hook rule, tone, company and freshness rules. Follow it. `series.format` is `video` (a spoken script) or `carousel` (slide copy, section 5b).
- **Revision context:** `review.openFeedback` entries with `stage: "script"`, and the current `research`, `script`, `factcheck`, `sources` (the previous version).
- **Series lessons:** `.claude/skills/script/lessons/<prefix>.md` (e.g. `HIS.md`), if it exists: the reviewer's standing notes from earlier episodes. Follow them like the playbook; where one disagrees with a default in this skill (length, for example), the lesson wins.
- **Direction for v1:** open notes with `stage: "script"` and no `version` were written before the first version: they're the team's brief. If one says "Build the script around these research facts", those facts are the backbone: give each real time, and say in "Changes in this version" how each was used.

**Check the stage.** If `stage` is not `script`, stop and say which stage it's in. Only a person moves stages.

**First version or revision?** No open feedback and no script: write v1 from scratch. Open feedback: treat each note as a required change, keep what wasn't criticised (including research that still holds; only research again what the notes need), and answer every note in "Changes in this version".

**Notes that apply to every episode.** If a review note reads as a rule for the whole series rather than this episode ("add numbers for scale", not "the counter scene is too long"), add it as one short line to that series' lessons file (create it if needed; keep it under about 10 lines, merging near-duplicates) and say so in "Changes in this version". A note that names a series ("only for Claude Lab") goes in that series' file only.

## 2. Research (just enough)

Find what you need to answer the idea's question correctly, and stop. Aim for **6–10 facts from 3–5 good sources**, including the source behind the episode's one big idea (see below). Don't survey the industry or collect extra detail the script won't use: every fact you gather should earn a line in the script.

Use WebSearch and WebFetch; send independent searches in parallel.

**Source order, best first:** (1) primary: the company's engineering blog, official announcements, docs, papers, talks by the people who built it; (2) reputable reporting (Reuters, AP, Bloomberg, The Verge, TechCrunch, Ars Technica, major Indian outlets for Indian topics); (3) everything else only to find leads. Never cite content farms, SEO listicles or AI summaries.

**Rules:**
- Every number, date, name and version needs a source you actually opened. Note the exact figure or quote and its date.
- If the company never published a number, it's "reported" and the script says "reportedly".
- If the headline company hasn't said how a step works, a peer that has is fine (Zepto for Blinkit, Lyft for Uber), but say whose fact it is.
- Never invent or round into a fact. If you can't verify it, leave it out.
- **Look for a real-world moment** that shows the mechanism at work: an experiment, a stunt, an outage, an incident (e.g. the artist who pulled 99 phones through Berlin in a handcart and turned a street red on Google Maps). It usually makes the best scene after the intro and the episode's number moment.
- Name organisations exactly as the source does (DeepMind is Alphabet's AI lab, which partnered with Google; it is not "Google's lab").
- If the idea's premise or hook turns out wrong ("1 lakh tickets a minute" when the real peak is ~28,000), fix it here: note it under "Corrections to the idea" and write the script on the corrected version. Don't send it back; if the idea can't stand at all, say so in a `done: false` checklist note.

Write `research` as Markdown in this shape (short; it's for the reviewer to scan):

```markdown
## The question
The one question this episode answers, as a viewer would ask it.

## The answer in one line
What a viewer should walk away knowing, in everyday words.

## The big idea
The one real technical term this episode teaches (e.g. graph neural network, caching, a queue; How It Scales: the mechanism and up to 3 named parts), the everyday picture that explains it (dots and lines, a counter with a line of people), and the facts it rests on (F5, F6).

## Picture options
2–3 everyday pictures for the big idea, one line each, with how each part maps onto the real system ("menus on every table = copies near you (CDN); waiter = IRCTC's servers; order = your booking (a write)"). Mark the one the script uses with **(used)**. A picture only counts if every moving part of the mechanism has a match; drop any that leave a part out. The reviewer can pick another with a note. Skip this section when the picture is already fixed (Claude Lab's workshop sheet, Claude Skills, carousels).

## Key facts
- **F1.** Claim in plain words. "Exact quote or figure." ([Publisher, 12 Mar 2025](https://…)) · Primary
- **F2.** … · Reported (company hasn't confirmed)

## Corrections to the idea
(Only if needed.) What the idea says → what's actually true (F2).

## Don't say
(Only if needed.) Tempting claims that aren't supported.
```

Write `sources` (shown as References) as a Markdown list, one line per source actually used: `- [Title](url): publisher, date`.

## 2c. Claude Skills only: the repo, the vetting and the proof run

The episode features one repo (in the idea's title and summary). The playbook decides the shape; this is how to get the material. Proof files go in `video/public/episodes/<slug>/proof/` (`mkdir -p` it first; `<slug>` is the code in lower case, e.g. `cs-016`).

**1. Read the repo** with WebFetch: the README, every SKILL.md, the plugin manifest if any, and every script or hook it ships (raw files from `raw.githubusercontent.com/<owner>/<repo>/<branch>/…`). Get the star count, licence, last push and creation date from `https://api.github.com/repos/<owner>/<repo>` and write them with today's date. If anything turns out different from the idea (renamed, archived, new licence, a different install command), fix it under "Corrections to the idea".

**2. Vet it.** Note what it installs, runs and sends over the network, whether it runs in the background, needs accounts, keys or personal data, and any paid upsell. A repo that runs unknown code or collects data without saying so isn't featured: stop and say so in a `done: false` checklist note. Every claim from the README (benchmarks, "X% fewer tokens", user counts) is the maker's: attribute it in the script ("the maker says") or verify it from an independent source.

**3. Find what it can actually do.** From the README and SKILL.md, list the repo's 2–3 biggest real capabilities: things a viewer would see and think "wait, it can do *that*?" The episode is built on these, not on one subtle detail. If our own channel uses the repo (check `.claude/skills/` and the animate/script skills), say so: our own work is the strongest proof.

**Pick the format** and say which in the research notes, with one line why:
- **Before/after** only when the skill is plain instructions (SKILL.md plus reference files) that can be followed without installing anything, and the task's output is a file you can show: a web page, a diagram, code, text.
- **Showcase** otherwise (plugins with hooks or background services, accounts, personal data, long runs), or when step 4 doesn't give a clear difference.

**4. Before/after runs.** Choose 2–3 small, realistic tasks, one per capability from step 3. For each task, start two fresh `general-purpose` subagents in parallel, each told to write its output only into the proof folder (one task alone is fine only when its difference is dramatic on its own, like Ponytail's 335 → 10 lines):
- **before:** the task alone. Output to `proof/<task>/before/` (`proof/before/` when there is one task).
- **after:** the same task, plus the repo's SKILL.md and the reference files it points to, pasted in full as instructions to follow. Output to `proof/<task>/after/`.
Never install the repo or run its scripts. For web pages and diagrams, screenshot both: `npm --prefix video run ep:shot -- video/public/episodes/<slug>/proof/before/index.html video/public/episodes/<slug>/proof/before.png` (add `--size 1080x1920` for a phone view). For code or text, count what matters (lines, words, files) and keep both versions. Look at the results with Read. A task whose difference isn't clear is dropped (say so in the research notes); if none is clear, switch to a showcase. Never stage or exaggerate a difference.

**5. Showcase media.** Download the repo's own demo images, GIFs or videos (from the README) with `curl -sSfL -o video/public/episodes/<slug>/proof/demo-<n>.<ext> <url>`, one at a time. Convert GIFs to MP4 with `tools/earshot/.venv/bin/ffmpeg -i demo-1.gif -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" demo-1.mp4` (Remotion can't play GIFs). Note each file's source URL and the repo's licence: the maker is credited on screen whenever their demo shows. If our channel uses the repo, list our own renders that show each capability (`video/out/<slug>/final.mp4` with a time range) as proof too.

**6. Write `research`** in the same shape as section 2, read this way: "The question" is the problem the repo fixes; "The big idea" is the one trick inside it (how it works, in plain words); "Key facts" are the repo facts (stars with date, licence, last update, what it installs, maker's claims marked as theirs) and the proof-run results. Add a section:

```markdown
## Proof
Format: Before/after (why in one line)
Task: "…"
- before: proof/before.png — what plain Claude did (e.g. 214 lines, generic gradient hero)
- after: proof/after.png — what Claude with the skill did
- demo-1.mp4 — from the README (source URL), credit: <maker>
```

`sources` lists the repo pages you opened (README, SKILL.md, API data) and any independent source.

**Writing it:** advanced viewers, so naming tools and terms is fine, but keep the sentences plain and spoken. No "one big idea" or "one number" rule: the six beats in the playbook replace them. The hook states the biggest result plainly, never the setup or a name-drop. The "what it can do" beat shows 2–3 capabilities, one short line each. Length: 60–90s (about 140–207 words); use the longer end when there are three strong, real demos. Name the repo and maker the way the repo does. The catch is always said out loud. The install line is said briefly ("Install it with one command, link in the description") and shown on screen.

## 3. Write it for the ear

Spoken by an ElevenLabs voice (Monika Sogam: young, Indian, natural and conversational) over animated visuals.

- **Hook in the first line.** It has to stop the scroll in 2 seconds. Follow the playbook's hook rule (How It Scales always opens with a question the viewer has already half-wondered: "How does Google Maps know there's a traffic jam before you reach it?"). No "Have you ever wondered".
- **Answer the hook.** The script exists to answer that one question. Cut anything that doesn't serve the answer, however interesting.
- **Plain words first.** Explain what happens behind the scenes the way you'd tell a friend, with everyday comparisons.
- **Then one big idea.** Teach exactly one real technical term from "The big idea" (or, when the playbook allows it, as How It Scales does, up to 3 named parts of one mechanism, each matched to a piece of the same picture): name it once, and explain it straight away with its everyday picture ("Think of every stretch of road as a dot…"). The visuals will draw that picture. No other jargon: anything else gets described, not named.
- **One number moment.** At most one simple number moment: a striking sourced figure, or a comparison a viewer can do in their head. No multi-step maths.
- **Length** (intro and sign-off included): about `series.targetSeconds × 2.3` words (≈140 for 60s), never over `series.targetSeconds × 2.5`, never under the playbook's minimum (How It Scales: 2 minutes), and never more than 3 minutes. If it doesn't fit, narrow the answer instead of rushing the read.
- **Short spoken sentences.** One idea each. Contractions are fine. Write numbers the way they should be said: "seven hundred seventy-five million dollars"; years as digits.
- **Series intro (every video):** the second scene is always `**intro:** Welcome to <series.name>, by Curiously.` Nothing else on that line, no facts.
- **Ending:** the last content scene answers the hook in one line (a callback to the opening moment is good).
- **Sign-off (every video):** the final scene is always exactly `**cta:** If you like this kind of content, like, share and follow Curiously.` It's the same for every episode and never mentions the topic.
- **Don't overclaim the cause.** If a source lists several inputs (phones, driver reports, government data), don't let a line imply one is the only one: "the phones stuck in it help tell Google", not "the phones tell Google".
- **Tone:** curious, calm, confident.
- Avoid words that TTS often mispronounces, or flag them (see the output format).

**Facts:** every factual line comes from a fact in your research (track the F-numbers). Keep numbers exactly: "nearly half" for 47% is fine; "half" for 41% is not. Say "reportedly" for Reported facts, and name whose fact it is when it's a peer company's ("Zepto says a packer needs about fifty seconds"); the visuals show each company's logo when it's named. Nothing from "Don't say". If the script needs a fact you don't have, research it and add it to the notes; never slip in an unsourced line.

**Next-lesson tease (Claude Lab only):** Claude Lab is a course, so each lesson hands over to the next one. Teach only this lesson, use earlier lessons' terms, and put one scene between the outro and the sign-off that names the next lesson's topic: `**next:** In the next episode, we'll talk about tokens.` Take the topic from the next row of `docs/claude-lab-curriculum.md` (its "Tease" column is a good lead-in for the outro). Keep it to one short line, and don't explain the next topic. No other series gets this scene: How It Scales and the rest end on the outro and then the sign-off. Follow any other links the playbook describes.

## 4. Remove AI tells

Run the narration through the **humanizer** skill (embedded mode: return only the final text). Two exceptions for spoken shorts:
- Short punchy fragments are fine in the hook and the payoff. That's spoken rhythm, not a tell.
- One deliberate contrast is allowed if it *is* the insight (e.g. "So it's not chaos. It's a system."). Anywhere else, rewrite it.

## 5. Write the script field

Use exactly this shape. Each scene line becomes one voiceover clip and one scene later, so keep one beat per line and give each a short lowercase id:

```markdown
**hook:** How does Google Maps know there's a traffic jam ahead, before you even get there?
**intro:** Welcome to How It Scales, by Curiously.
**cart:** In 2020, an artist in Berlin pulled ninety-nine phones down a street in a handcart. Google Maps turned that street from green to red.
**phones:** That's the trick. Google pools anonymous location data from phones that have location turned on. Lots of phones crawling along one road looks like a jam.
**future:** But a jam right now isn't enough. You need the road twenty minutes from now, when you actually get there.
**memory:** So Google also uses past traffic patterns for roads, and mixes them with what's happening live.
**graph:** The clever part came from DeepMind, Alphabet's AI lab. It's called a graph neural network. Picture every stretch of road as a dot, and connected stretches as lines joining the dots.
**spill:** Each dot passes messages to its neighbours. So the model can learn how a jam on one road spreads to the roads around it.
**outro:** So Google doesn't see the jam. The phones stuck in it help tell Google. Even if they're in a handcart.
**cta:** If you like this kind of content, like, share and follow Curiously.

---

**Words:** 195 · **Est. length:** ~84s

| Scene | Facts used |
|---|---|
| hook | F1 |
| intro | (series intro) |
| cart | F7, F8 |
| phones | F1, F9 |
| … | … |
| cta | (sign-off) |

**Say it right:** DeepMind (DEEP-mind). Leave this out if there's nothing tricky.

(This is the approved reference for the style: a question hook, a real-world moment, plain words, one big idea with its picture, one number moment, an ending that answers the hook.)

**Changes in this version:** (revisions only) one line per review note: the note, then what changed.
```

Before submitting, check yourself: every factual line has an F-number in the table, the word count is in range, the first line is the hook, the second is the series intro, the last is the sign-off (with the `next` tease just before it for Claude Lab, and for no other series), a non-technical viewer could follow every line (for Claude Skills: an advanced user could, and the catch and the install line are there), and there are no em dashes in the narration.

## 5b. Carousel series: slide copy instead of a voiceover

When `series.format` is `carousel` (AI This Week), nobody speaks: people read slides while swiping. Write the copy for each slide in the fixed weekly template, still built only from your research facts:

```markdown
**cover:** 5 tech stories from this week
- kicker: AI this week · #4
- date: Week of 2 Nov 2026

**story1:** Anthropic gave Claude Projects a memory, so files and notes now carry over between chats without being uploaded again. (one sentence, ≤ 35 words)
- source: Anthropic (1–2 words; the dated link goes in the references)

**story2:** …
**story3:** …
**story4:** …
**story5:** …

**outro:** Like, share and follow
- cta: Follow Curiously for more
```

Rules: exactly 5 stories, the top 5 tech stories of the week (from `series.formatNotes`); each story is one plain sentence (who did what, plus the one detail that matters), no headline, no opinion or adjectives (calm, news-desk tone); the source on the slide is 1–2 words, and every story has a dated source from this week in the references; the cover is the hook (same job as a video's first line); plain words, no hype, no em dashes. Run the copy through the **humanizer** skill (headlines may stay punchy). Replace the header line with `**Slides:** 7 · **Words:** 150` and keep the facts table (one row per slide id). The script checklist items about voiceover length apply as: "~150 words or less" = total slide copy; the last slide is always the like, share and follow slide above (same every week, never about the stories).

## 5c. Fact-check before you submit

Research, script and fact-check are one stage, so the person reviews a script that has already been checked.
1. Hand the finished draft to a fresh `general-purpose` subagent (model `sonnet`) with the **factcheck** skill's instructions, the draft, your research notes and the sources. It works independently: it opens every source itself and returns the report (the `factcheck` field) with a **Script fixes** section.
2. Apply every "Fix wording" item to the script exactly. Cut or rephrase every "Unsupported" claim. Keep the facts table in step.
   If it marks a claim Unsupported but a source you opened quotes it word for word (its fetch tool can return a shortened digest that misses sentences), keep the claim, add the quote to the research notes, and say in the report which finding you overruled and why.
3. If you changed any line, update the report's verdict to say the fixes are applied. Don't run a second full check; one pass is enough.
4. If a fix needs a fact you don't have, research it (add it to the notes and references) or cut the claim.

## 6. Checklist

`review.checklist` from step 1 lists this stage's checklist items (`item`, `text`, `done`, `humanOnly`). Go through every item and decide, honestly, against the work you're about to submit:

- **Confirmed:** `done: true`, with a short note on what confirms it ("138 words, ~58s").
- **Unsure or not met:** `done: false`, with a note telling the reviewer exactly where to look and what to decide ("Ending doesn't loop back to the hook; outro is a plain summary. Check the outro line."). This is how they know which section needs their eyes, so be specific: name the fact, scene, claim or source.
- **`humanOnly` items:** always `done: false`. You may add a note to help the person check it.

Never tick something you didn't check. A flagged item with a clear note is more useful than a tick the reviewer can't trust.

Write the result as JSON:

```json
[
  { "item": 0, "done": true, "note": "Hook is the first line: Amazon warehouses are a mess. On purpose." },
  { "item": 1, "done": false, "note": "162 words, slightly over target. Kiva scene is the longest; trim there if it feels slow." }
]
```

## 7. Submit

Write the four fields to files in your scratchpad, then (`sendBack=none` also clears an old proposal; there is no earlier AI stage to send back to):

```bash
node tracker/scripts/episode.mjs submit <CODE> research=@<path>/research.md script=@<path>/script.md factcheck=@<path>/factcheck.md sources=@<path>/sources.md checks=@<path>/checks.json sendBack=none
```

Checklist item "Every claim checked against its source" is yours to tick once the fact-check fixes are applied. "Second person read-through" is for a person (`humanOnly`).

## 8. Report back

- Checklist: what you ticked, and every item you flagged with its note, so the reviewer knows where to look first.
- The script itself (it's short; paste it in full).
- Word count and estimated length.
- The question, the one-line answer, and how many facts (Primary vs Reported) from how many sources.
- For a revision, how each note was handled.
- The fact-check verdict and the fixes you applied.
- The link `/episodes/<id>`. Tell them to read the research, script and fact-check, then approve it by moving to Make, or request changes.
