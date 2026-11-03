---
name: animate
description: Build and render a Curiously video episode in Remotion from its approved storyboard and voiceover: one scene per script line cued to the spoken words, sound effects, a music bed and the cover. A step of the make skill for video series.
---

# Animation (part of Make)

Build the video the storyboard describes, on top of the narration's word timings, and render it. This is the stage where quality is won or lost: episode 1's scenes (`video/src/scenes/`) are the bar.

## 1. Load the episode

```bash
node tracker/scripts/episode.mjs get <CODE>
```

Run from the Curiously project root. Read `storyboard` (the plan), `script`, `factcheck` (numbers on screen must match it), `title`, `series.name`, `series.visualStyle`.

**Where this runs.** Inside the **make** skill, after the voiceover (`stage` is `make`, video series only). Check that `video/src/episodes/<slug>/manifest.json` has every scene with words; if not, the voiceover step hasn't run. If the storyboard or voiceover changed since the last render, rebuild the affected scenes.

**Revision:** open notes (stage `make`) that name scenes or moments ("0:12 the counter overlaps the caption") mean: change only those scenes, re-render, and answer every note in "Changes in this version".

## 2. Read before you write

- The **remotion-best-practices** skill: load `remotion-markup/REFERENCE.md` (animate with `useCurrentFrame()` and `interpolate()`/`spring()`; CSS transitions and animations don't render; fonts; sequencing; transitions).
- `video/src/engine/kit.tsx` and `video/src/engine/Episode.tsx`: what the engine already does (backdrop, captions, music ducking, watermark, progress bar, logo end card, scene enter/exit).
- Two or three of episode 1's scenes, e.g. `video/src/scenes/Hook.tsx`, `Stow.tsx`, `Kiva.tsx`: the level of craft expected (layered motion, springs, word cues, product icons, sound on every beat).
- `video/src/theme.ts` (colours `C`, fonts `F`), `video/src/products.tsx` (Phosphor icons via `<Product p="…" />`), `video/src/brand.tsx`.

## 2b. Visual style

Build in the style named by `series.visualStyle`. The storyboard's "Look" section is written in it; these are the build rules.

### isometric
How It Scales. Systems are drawn as an isometric 2D world.
- **The reference is HIS-003 (10-minute delivery, v3)**, which the team approved. Read `video/src/episodes/his-003/scenes/world.tsx` and two of its scenes (e.g. `Stores.tsx`, `Scale.tsx`) before you build. Match that level of detail. (`scenes/map.tsx` in that folder is the old flat map and is unused, so ignore it.) `video/src/engine/IsoDemo.tsx` shows the bare kit.
- Use the iso kit from `../../../engine/kit`: `IsoStage`, `IsoGrid`, `IsoTile` (zones), `IsoBox` (`rise` grows it from the floor, `glow` marks the busy one), `IsoRoof` (gable roofs), `isoFaceMatrix` (signs, doors, windows and shutters drawn on a block's face), `IsoPoly` (floor shapes such as territories and zones), `IsoPath` (`progress` draws it on; `width`, `glow`), `IsoPulse` (the neon traveller with a trail and a sonar ring), `IsoPacket`, `IsoLabel`.
- **One world per episode** in `scenes/world.tsx`: one `World` component that every scene draws, with per-scene state (what has risen, glowing, lit) passed in as props. The viewer learns the map, so never redraw the world somewhere else.
- **Camera:** define 2–4 named cameras in world.tsx as a focus point plus zoom (HIS-003 uses `CLOSE` / `DISTRICT` / `CITY`, then `mixCam`, `stageOf`, `useMove`), and move between them with a critically damped spring on the word that calls for it. Fade the world out above y 400 and below about 1250 with a mask so it never runs into the header or the captions.

**What the team asked for in HIS-003. These are standing rules for every isometric episode:**
- **Every thing reads by its shape.** Each kind of building or block has its own form, so it's recognisable without an icon: houses are gabled, with varied wall and roof colours, sizes, roof heights and ridge directions, plus doors and windows; flats are taller with lit windows; a warehouse is a long low shed with a pitched roof and loading docks; a store is flat-roofed with a shutter and a sign. Give servers, databases and queues the same care (rack lines, cylinders, lanes). Same-kind blocks must vary, never a row of identical boxes.
- **No icons or emoji on blocks.** Where the story names a thing, show a short text label (`YOUR HOME`, `DARK STORE`, `WAREHOUSE`). Small props are simple shapes (parcels are green boxes, not food icons).
- **Travellers (riders, requests, orders) are solid objects, never badges.** Use either a neon pulse (`IsoPulse`: a comet trail while moving, a slow sonar ring while waiting) or an icon that is a real object in the world: a small isometric scooter, van, parcel or envelope with flat-shaded faces that sits on the route and turns with it, or a filled, coloured icon on its own. Never use a thin outline icon inside a circle or any round badge. Anything they carry is shown by colour (green means loaded). Speed or status tags can ride along with them.
- **Routes follow a network.** Lay out a street grid (avenues plus lanes, some broken so blocks vary) or, for systems, a wiring layout, and route every path along it with turns at junctions. No straight diagonal lines across the world, not even for measurements.
- **Zones are organic, not symmetrical.** Territories, regions and shards are uneven, each sized by its own position and reach (HIS-003 uses a weighted Voronoi). Never use a grid of equal squares.
- **Adding blocks is staged:** a dashed plot appears on an empty spot (never overlapping existing blocks), the block drops in with a small bounce and a landing ring, then its effect (territory, traffic) spreads out from it. When many are added, they land one by one in a sensible order (e.g. outward from the first).
- **Whenever the script names a company, show that company's logo**, every company, not only the headline one (a peer quoted for one fact gets its logo too). It goes where the name would appear: on kickers (`LogoKicker`), on the tag for that fact and on that company's own buildings. When two companies are compared, keep their logos and colours distinct so the viewer can tell whose number is whose. Logos live in `video/src/logos.tsx` as inline SVG. Use a public-domain or properly licensed source (e.g. Wikimedia Commons, PD-textlogo), and note the source and licence in the render notes. If no clean logo exists, use the name as text and flag it under "Worth a second look". Source lines stay as plain-text citations.
- Illustrative geometry (city layout, territories) is fine, but say in the render notes that it is illustrative.

**Colour, depth and motion**
- Colour carries meaning: cyan = your system, amber = the user/request/traveller, green = healthy/data/served, red = overload, failure or the slow path. Flat-shaded faces only (the kit does this). No gradients or photo textures on blocks. Glow is reserved for pulses and the active block.
- Draw back to front (smaller x + y first). Packets that pass behind a block are drawn before it.
- Motion: blocks rise or drop on the word that names them, and paths draw on before anything travels them. Traffic loops continuously while a route is "live". Overload means packets pile up and the block turns red and shakes slightly. Keep something moving in every frame (a pulse, traffic or a ring).
- If the reviewer asks for something that applies to every episode, not only this one, mention in the render notes that this section should gain a rule.

### flat-metaphor
Claude Lab. Flat 2D vector shapes, and every idea shown as a concrete metaphor instead of a screenshot.
- Build each metaphor from simple shapes plus Phosphor duotone icons (`<Product p="toolbox" />`, `team`, `idea`, `plugin`, `robot`, `files`, `terminal`, `flow`, `branch`…; add icons to `products.tsx` if needed). No gradients, no glows beyond the kit's soft icon shadow, no 3D, no emoji.
- One metaphor per concept, from the series' metaphor world when the playbook names one (Claude Lab: the **Claude's workshop** sheet in `docs/claude-lab-curriculum.md`). Build each object once as a shared component (`video/src/workshop/` for the workshop; create it on first use) and reuse it in every later episode, so the desk in lesson 40 is the same desk as in lesson 3. Keep the same objects, colours and positions every time a concept comes back.
- If the playbook numbers its episodes, every scene's header has the kicker (`LESSON 14 · PROJECTS`), and the final scene shows the "Next:" tease card on the closing line, then the logo end card.
- Palette: the theme colours on the dark background, with amber as the one accent; at most 3 colours in a scene.
- Real UI (a terminal or editor) only as a short "proof" beat, drawn as a simple flat mockup, never a screen recording.
- Motion: objects snap in with springs on their words, then hold still so the viewer can read them. Prefer one big object over many small ones.

## 3. Sound

- Library: `ls video/public/audio/sfx`. Reuse these first; play them with `<Sfx name="pop" at={frame} volume={0.5} />`.
- **New effects come from real recordings first.** Use the **real-sound** skill's sourcing and licence rules (Freesound CC0 / CC BY, Mixkit; never NC, ND or SA; licence read on each item's own page) and the **earshot** skill to choose and trim the cleanest moment (`earshot rank`, `earshot find`). Download with `curl -sSfL -o video/public/audio/assets/<category>/<source>-<id>_<slug>.<ext> <url>` (one at a time, politely), cut the chosen window with `tools/earshot/.venv/bin/ffmpeg -ss <start> -to <end> -i <asset> video/public/audio/sfx/<name>.wav`, and add a line per sound to `video/public/audio/sfx/CREDITS.md` (name, source URL, author, licence). Then play it with `<Sfx>` like any library sound. Use only real-sound's sourcing, licences, earshot trims and credits: **not** its mixer or mux. Our narration is mixed and ducked by the video engine, which real-sound doesn't handle.
- Only if no real recording fits: generate it with ElevenLabs. Add it to `video/src/episodes/<slug>/sfx.json` as `{ "name": { "text": "short clean description", "duration": 1.0 } }` (the **elevenlabs-sound-effects** skill has the prompt rules), then `npm --prefix video run ep:audio -- <CODE> --only=sfx`.
- Every new sound joins the shared library for future episodes. Say in the render notes which sounds are new, and which are CC BY (they need a credit in the description).
- Music: put the storyboard's Music prompt into `script.json` as `"musicPrompt"` and run `npm --prefix video run ep:audio -- <CODE> --only=music` (see **elevenlabs-music**). Generate it once; reuse it on revisions unless a note asks for new music.
- Check the mix with the **earshot** skill: `tools/earshot/.venv/bin/python -m earshot timeline video/out/<slug>/final.mp4` (what happens when, sync to picture, loudness). `earshot measure` works without its models; if a model command fails with a missing-model error, say so and fall back to `measure` and the listen-back.

## 4. Build

- One file per scene: `video/src/episodes/<slug>/scenes/<PascalCaseId>.tsx`, exporting a component. Cue everything to words: `const wf = useWord(); const t = wf("hook", "purpose");` (scene-local frame; `wf(id, word, nth, "end")` for the end of a word).
- Register each scene in `video/src/episodes/<slug>/index.tsx`: the import below `// @scene-imports` and `id: Component,` below `// @scenes`.
- Replace `Cover.tsx` with the storyboard's cover (static, no animation; cover text ≤ 3 words).
- Import shared pieces from `../../../engine/kit` and `../../../theme` (paths are relative to the scenes folder).

**Layout rules (1080×1920):** watermark 0–160 (automatic); header 170–400; main visual 400–1250; `<Source text="…" />` sits at 1262 on fact scenes; captions own 1300–1500 (automatic, keep clear); nothing important below 1550 or in the right 120 px (platform buttons). On-screen text is short. No emoji. Every number on screen matches the fact-check. The last scene ends on the first scene's layout so the video loops.

**Check as you go:**
```bash
npm --prefix video run typecheck
npm --prefix video run ep:still -- <CODE> --scenes          # middle + end of every scene → video/out/<slug>/stills/
npm --prefix video run ep:still -- <CODE> --scene hook --at 40
```
Open the PNGs with Read and look properly: overlaps with captions, text running off the frame, empty frames, unreadable contrast, things placed in the unsafe zones. Fix and re-check before rendering.

## 5. Render

```bash
npm --prefix video run ep:render -- <CODE>      # → video/out/<slug>/final.mp4 (mastered to -14 LUFS) + cover.png
npm --prefix video run ep:measure -- <CODE>     # resolution, fps, length, loudness checks
npm --prefix video run ep:frames -- <CODE>      # → video/out/<slug>/frames/sheet.jpg, one frame every 2 s
```
Open `sheet.jpg` and do a final pass. Use `ep:render -- <CODE> --draft` for quick half-size checks while iterating.

## 6. Notes for the reviewer

Write `renderNotes` as Markdown: length and measure results; one line per scene (what it shows, what's cued to which word, sounds used); new sound effects added to the library; anything you'd want a second look at, with timestamps; "Changes in this version" for revisions.

## 7. Hand back to make

You're running inside the **make** skill (Make stage), which submits everything in one go. Don't call `episode.mjs submit` and don't tick the checklist yourself. Give make back:
- `renderUrl=/media/out/<slug>/final.mp4` and the notes (the `renderNotes` field)
- for the checklist: the measure results, and the timestamps worth a second look
- any problem that belongs to an earlier stage, written as exact, minimal fixes ("scene id: current line → replacement line"), so make can propose the send-back. Never over taste or style; only over something that's wrong.
