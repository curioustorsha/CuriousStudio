---
name: storyboard
description: Plan a Curiously episode scene by scene (or slide by slide for a carousel) in the series' visual style, cued to the spoken words. The first step of the make skill, which pauses for a person's approval after it.
---

# Storyboard (part of Make)

Plan every scene of the video before anything is built, so the build is mechanical and the reviewer can change the plan cheaply. One script line = one scene.

## 1. Load the episode

```bash
node tracker/scripts/episode.mjs get <CODE>
```

Run from the Curiously project root. Read `script` (lines like `**hook:** …`, plus the facts table and "Say it right"), `factcheck` (its script fixes must already be in the script; if they aren't, flag it in the checklist), `research` (facts F1…, visual ideas and "Corrections to the idea"), `visualIdeas` (the idea's; drop or fix any that research corrected, research wins), `title`, `series.formatNotes`, `series.format`, `series.visualStyle`, `series.targetSeconds`.

`series.format` is `video` (sections 2–3) or `carousel` (section 3b instead). `series.visualStyle` names the style to plan in (section 2b).

**Where this runs.** Inside the **make** skill, as its first step (`stage` is `make`). If the script changed after the last storyboard (`review.stale.make` is `script`), plan against the new script.

**Revision:** each open note in `review.openFeedback` (stage `make`) about the plan is a required change. Keep the scenes nobody criticised. Answer every note in "Changes in this version".

## 2. Know what can be built

The video is made in Remotion (`video/`). Before planning, look at:
- `video/src/engine/kit.tsx`: ready components (`Header`, `Kicker`, `Title`, `Reveal`, `Bin`, `Source`, `Sfx`; captions are added automatically) and the isometric kit (`IsoStage`, `IsoGrid`, `IsoTile`, `IsoBox`, `IsoPath`, `IsoPacket`, `IsoLabel`; see `video/src/engine/IsoDemo.tsx`).
- `video/src/scenes/*.tsx`: episode 1 ("Why Amazon warehouses look like chaos"), the bar for craft and timing (its look predates the series styles below).
- `video/src/products.tsx`: Phosphor duotone icons available as product art. **No emoji, ever.**
- `video/src/theme.ts`: colours (dark `#07080C`, amber accent `#FFB547`, cyan, green, red) and fonts (Inter, Space Grotesk, JetBrains Mono).
- `ls video/public/audio/sfx`: sound effects already in the library (reuse before inventing new ones).

**Frame layout (1080×1920), fixed for every episode:**
- Top 0–160: watermark and series tag (automatic).
- 170–400: header area (kicker + title, ≤ 6 words).
- 400–1250: the main visual.
- 1262: the source line on fact scenes (`SOURCE · TechCrunch, 2012`).
- 1300–1500: captions (automatic). Keep it clear.
- Below 1550 and the right 120 px: covered by platform buttons on Shorts, Reels and TikTok. Nothing important there.

## 2b. Visual style

Plan every scene in the style named by `series.visualStyle`. Name the style in "Look", and describe each scene's Visual in its terms. If it's empty, follow `series.formatNotes` and say in your report that the series has no style set.

**Show the technical layer, every series.** Each named mechanism, concept or calculation in the script gets its own visible beat, not just a caption. For example: a skill card where only the title line glows until it's triggered, then the full card unfolds (Claude Lab); a counter that works out the maths step by step (How It Scales); none for AI This Week, whose story slides are one plain sentence. Say which scene shows which concept.

### isometric
How It Scales. The system is an isometric 2D world seen at 30°: servers, databases, stores and warehouses are blocks on a floor grid; requests, orders and riders are packets moving along routes.
- In "Look", define the **one world** for the episode. Every scene reuses it; scenes move the camera (zoom into a zone, pull back to the whole system) instead of switching to new pictures. List:
  - **Blocks by kind, each with its own shape** so it reads without an icon (e.g. gabled houses in varied colours and sizes, taller flats, a long warehouse shed with loading docks, a flat-roofed store with a shutter and sign; for tech: server racks, database cylinders, queue lanes). Say which ones get a text label and on which word. No icons or emoji on blocks.
  - **The network** routes follow: a street grid (avenues and lanes) or a wiring layout. Every route runs along it with turns, never as a straight diagonal.
  - **Zones** (territories, regions, shards) as uneven shapes, never equal squares.
  - **Travellers** (riders, requests, orders): a neon pulse with a trail, or a solid object drawn in the world's style (an isometric scooter, van, parcel or envelope, or a filled icon on its own). Never a thin outline icon inside a circle. Loaded or status is shown by colour or a tag.
  - **2–4 named cameras** (e.g. CLOSE on one street, DISTRICT, the whole CITY) and which scenes use each.
  - **Logos:** every company the script names appears with its own logo on the beat where it's named (on kickers, the tag for its fact, its own buildings). Name each company and the scenes it appears in.
  - **The technical layer:** (every series does this; see the rule above the styles) for each engineering concept or worked calculation in the script, plan how it becomes visible in the world (e.g. packer and rider starting at the same moment for pipelining, a counter doing riders = orders/min × trip time for Little's Law, hex cells lighting up for sharding).
- Colour roles: cyan = the system, amber = users/requests/travellers, green = healthy/data/served, red = overload/failure/the slow path.
- Typical beats: the naive setup (one block, packets pile up, it turns red) → the fix (new blocks land on dashed plots with a bounce and ring, routes draw on, traffic spreads out) → the payoff number as a label over the world.
- The approved reference is HIS-003 (10-minute delivery): its storyboard and `video/src/episodes/his-003/scenes/world.tsx`.
- In "Build with", use the iso kit names (`IsoBox rise`, `IsoRoof`, `IsoPoly`, `IsoPath progress`, `IsoPulse`…).

### flat-metaphor
Claude Lab. Flat 2D vector shapes with one concrete **visual metaphor per idea**: context is a desk that fills up, a subagent is a teammate at their own desk passing back one card, a skill is a manual on a shelf whose spine is all Claude reads until it needs it, a hook is a tripwire.
- **Use the series' metaphor world when the playbook names one.** Claude Lab's is "Claude's workshop", with its metaphor sheet in `docs/claude-lab-curriculum.md` (context window = the desk, subagent = a teammate at their own desk, skill = a manual on a shelf). Use those objects exactly. When an episode introduces a new idea that isn't on the sheet yet, define its object, add a row to the sheet (idea, object, episode), and say so in your report.
- **Aster hosts every Claude Lab lesson.** Aster is the Curiously asterisk, hovering behind the workbench where Claude works, and it acts out what Claude does. It has no face, arms or eyes: it acts only through motion, so keep it grown-up, never cartoony. Plan its part in every scene with a mood timed to a word:
  - **idle:** turns slowly (default)
  - **think:** slower turn with pulsing rings (reading, weighing options)
  - **no:** a quick side-to-side shake (rejecting a wrong idea, like "not a search engine")
  - **gotit:** a crisp spin with a burst of light (a word lands, the payoff)
  - **unsure:** its rays sag and it slows (a limit, a surprise, a dead end)
  - **pointing:** when something is placed, one ray reaches towards it
  - **Fixed moments:** in the intro, Aster rises and a C draws around it on "Curiously", so the host becomes the logo. In the sign-off, Aster flies up and settles into the end card's logo.
- In "Look", list the metaphors this lesson uses: idea → object, with its colour. Each idea keeps its object (and colour) in every lesson.
- If the playbook numbers its episodes (Claude Lab's lessons), every scene shows the kicker in the header (`LESSON 14 · PROJECTS`), and the last scene shows the tease for the next episode as a small "Next:" card, timed to the closing line.
- Flat shapes and Phosphor duotone icons only (`video/src/products.tsx` has `toolbox`, `team`, `idea`, `plugin`, `robot`, `files`, `terminal`, `flow`, `branch`, `chat`…). No gradients, no 3D, no emoji. Aster's soft glow is the one exception. Dark background only. Never the Claude logo.
- At most one "proof" beat with a simple flat terminal or editor mockup. Never a screenshot or screen recording.
- Big objects, few per scene, amber as the only accent.

### product-ui
Claude Skills. It looks like a product launch film (Apple, Linear, Vercel): dark, glossy app windows and terminals floating in a deep space, a moving cursor, code typing itself, and the repo's **real output** shown inside the windows. Each episode features one repo; its proof files are in `video/public/episodes/<slug>/proof/` (listed in the research notes' "Proof" section).
- In "Look", list the windows the episode uses (browser, terminal, editor, chat) and which proof file each shows, plus the accent colour (amber by default).
- **Recurring pieces, the same every episode:**
  - **Repo card** on the intro: `owner/repo`, the maker, and a star counter that ticks up to the research's count on the word "Curiously". Kicker: `CLAUDE SKILLS · github.com/owner/repo · ★191k`.
  - **Before/after split** (before/after episodes): two windows side by side or stacked, labelled `WITHOUT` (dimmed, grey accent) and `WITH <REPO>` (bright, amber accent). For a tall page, the window scrolls through the screenshot. For code, a line counter.
  - **Demo window** (showcases): the repo's own demo playing inside a browser window, with a credit tag `Demo · <maker>` on screen the whole time.
  - **The trick:** one glowing callout over the real output (a highlighted line of the SKILL.md, a circled detail on the page), timed to the word that names it.
  - **The catch card:** a small amber-outlined warning card with one line.
  - **Install bar:** a terminal window typing the install command, with the link `github.com/owner/repo` under it.
- Real screenshots and recordings are welcome here (unlike flat-metaphor), but only of real proof files: never a mockup of a tool's output. Simple drawn windows are fine for the frame around them.
- Logos: the maker's logo when it's a company (HeyGen, Cloudflare, Obsidian…), from `video/src/logos.tsx`. Never the Claude logo.
- Camera: windows move in slow 3D space (a gentle tilt, a push-in on the detail that matters), never fast spins. One or two windows per scene.
- **What it can do:** plan 2–3 quick demo scenes (about 8–10s each), one per capability in the research's Proof section, each ending on a visible result. Vary them (a split, a single big window, a montage of real clips) so the episode doesn't look like the same dark window over and over.
- **Readable on a phone:** the main window fills about 900 of the 1080 px width; for code or long text, zoom in on the one line that matters instead of showing the whole file. If a viewer couldn't read it on a phone, plan a closer shot. Plan hard cuts between scenes, never a fade to black.

### carousel-editorial
AI This Week carousels. See section 3b.

## 3. Plan

Find one visual metaphor for the research's one-line answer and carry it through. Every scene shows something moving *because of* a spoken word: cue animations to words ("on 'purpose': a stamp slams in").

Two scenes are the same in every video:
- **intro** ("Welcome to <series>, by Curiously."): a short series title card: the series name with the Curiously wordmark and asterisk (`video/src/brand.tsx`), over the episode's world from the hook. Keep it under 3 seconds.
- **cta** ("If you like this kind of content, like, share and follow Curiously."): the logo end card (the engine's), with like, share and follow drawn as Phosphor duotone icons cued to each word. Never anything about the topic.

The big idea gets the picture the script uses for it (e.g. roads as dots joined by lines), built up on screen as the words say it.

Write `storyboard` as Markdown in exactly this shape:

```markdown
## Look
The visual metaphor, recurring objects, palette notes. One paragraph.

## Scenes

### hook · ~4s
> Amazon's warehouses are a mess. On purpose.
- **Visual:** what fills 400–1250.
- **Animation:** what moves and on which spoken word ("on 'mess': items jitter; on 'purpose': stamp slams").
- **On-screen text:** kicker + title, ≤ 6 words.
- **Source line:** none / `SOURCE · …` (fact scenes: name the fact F#).
- **Sound:** library effects (`impact`, `pop` ×3) or a new one with a one-line description.
- **Build with:** existing components or "new: …".

(one block per script line, in order; ~seconds from word count at ~2.4 words/s)

## Loop
How the last frame lands on the first frame's layout so the video loops.

## Cover
The thumbnail frame: what's on it and the cover text (≤ 3 words, different from the likely title).

## Music
One-sentence prompt for the music bed (mood, tempo, instruments, "instrumental, no vocals").
```

Rules: on-screen text is short and never repeats the captions word for word; every number on screen matches the fact-check exactly; fact scenes carry a source line; no emoji; nothing important outside the safe area.

## 3b. Carousel series: a slide plan instead of scenes

When `series.format` is `carousel`, plan one entry per slide of the script's slide copy, for the fixed template in `video/src/carousel/Slides.tsx` (kinds: `cover`, `story`, `outro`; 4:5 for Instagram and 9:16 for TikTok photo mode; image posts only, no video). Write `storyboard` in this shape:

```markdown
## Look
Same weekly template. This week's cover icon and anything unusual. One or two lines.

## Slides

### cover
- **Kind:** cover · **Icon:** `news`
- **Text:** kicker / title / date, exactly as the script has them.

### story1
- **Kind:** story (text only, no logo or icon)
- **Text:** the one sentence / source (1–2 words).
- **Fact:** F3 (the fact-check row this slide's numbers come from).

(… one block per slide, in swipe order)

## Cover
Which slide is the cover for each platform (usually slide 1).
```

Rules: text fits the template's lengths (story sentence ≤ 35 words, source 1–2 words); icons only from `video/src/products.tsx` (say "new icon: …" if one is needed); every number matches the fact-check; no logos on news slides; no photos of people.

## 4. Hand back to make

You're running inside the **make** skill (Make stage), which submits everything in one go. Don't call `episode.mjs submit` and don't tick the checklist yourself. Give make back:
- the storyboard (the `storyboard` field)
- for the checklist: anything a person should look at in the plan, by scene
- any problem that belongs to an earlier stage, written as exact, minimal fixes ("scene id: current line → replacement line"), so make can propose the send-back. Never over taste or style; only over something that's wrong.
