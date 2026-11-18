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

- Remotion rules: animate with `useCurrentFrame()` and `interpolate()`/`spring()`; CSS transitions and animations don't render.
- `video/src/engine/kit.tsx` and `video/src/engine/Episode.tsx`: what the engine already does (backdrop, captions, music ducking, progress bar, logo end card, scene enter/exit).
- Two or three of episode 1's scenes, e.g. `video/src/scenes/Hook.tsx`, `Stow.tsx`, `Kiva.tsx`: the level of craft expected (layered motion, springs, word cues, product icons, sound on every beat).
- `video/src/theme.ts` (colours `C`, fonts `F`), `video/src/products.tsx` (Phosphor icons via `<Product p="…" />`), `video/src/brand.tsx`.

## 2b. Visual style

Build in the style named by `series.visualStyle`. The storyboard's "Look" section is written in it; these are the build rules.

### isometric
How It Scales. Systems are drawn as an isometric 2D world.
- **The reference is HIS-003 (10-minute delivery, v3)**, which the team approved. Read `video/src/episodes/his-003/scenes/world.tsx` and two of its scenes (e.g. `Stores.tsx`, `Scale.tsx`) before you build. Match that level of detail. (`scenes/map.tsx` in that folder is the old flat map and is unused, so ignore it.) `video/src/engine/IsoDemo.tsx` shows the bare kit.
- Use the iso kit from `../../../engine/kit`: `IsoStage`, `IsoGrid`, `IsoTile` (zones), `IsoBox` (`rise` grows it from the floor, `glow` marks the busy one), `IsoRoof` (gable roofs), `isoFaceMatrix` (signs, doors, windows and shutters drawn on a block's face), `IsoPoly` (floor shapes such as territories and zones), `IsoPath` (`progress` draws it on; `width`, `glow`), `IsoPulse` (the neon traveller with a trail and a sonar ring), `IsoPacket`, `IsoLabel`.
- **One world per episode** in `scenes/world.tsx`: one `World` component that every scene draws, with per-scene state (what has risen, glowing, lit) passed in as props. The viewer learns the map, so never redraw the world somewhere else.
- **Camera:** define 2–4 named cameras in world.tsx as a focus point plus zoom (HIS-003 uses `CLOSE` / `DISTRICT` / `CITY`, then `mixCam`, `stageOf`, `useMove`), and move between them with a critically damped spring on the word that calls for it. Fade the world out above y 500 and below about 1320 with a mask so it never runs into the header or the captions.

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
- Build each metaphor from simple shapes plus Phosphor duotone icons (`<Product p="toolbox" />`, `team`, `idea`, `plugin`, `robot`, `files`, `terminal`, `flow`, `branch`…; add icons to `products.tsx` if needed). No gradients, no glows beyond the kit's soft icon shadow and Aster's own glow, no 3D, no emoji.
- One metaphor per concept, from the series' metaphor world when the playbook names one (Claude Lab: the **Claude's workshop** sheet in `docs/claude-lab-curriculum.md`). Build each object once as a shared component (`video/src/workshop/` for the workshop; create it on first use) and reuse it in every later episode, so the desk in lesson 40 is the same desk as in lesson 3. Keep the same objects, colours and positions every time a concept comes back.
- **Aster, the host (Claude Lab):** draw it with `<Host f={f} {...hands} {...moodAt(f, cues)} />` from `video/src/workshop` (`host.tsx`), in place of any figure. The cues are `[frame, mood]` pairs on the storyboard's words (`idle`, `think`, `no`, `gotit`, `unsure`). Pass the placing "hands" (`placingHands`) and Aster points a ray at each word as it lands. `HOST_C` is its centre, for anything that looks at or into it, like a lens. Copy the intro reveal from `video/src/episodes/cl-005/scenes/Intro.tsx` (Aster rises, then `LogoMark` draws its C around it) and the sign-off from `Cta.tsx` (Aster flies into `EndCard` with `starIn`). The design is `video/src/aster/Aster.tsx`, with its sheet `AsterSheet`. Never draw the Claude logo.
- If the playbook numbers its episodes, every scene's header has the kicker (`LESSON 14 · PROJECTS`), and the final scene shows the "Next:" tease card on the closing line, then the logo end card.
- Palette: the theme colours on the dark background, with amber as the one accent; at most 3 colours in a scene.
- Real UI (a terminal or editor) only as a short "proof" beat, drawn as a simple flat mockup, never a screen recording.
- Motion: objects snap in with springs on their words, then hold still so the viewer can read them. Prefer one big object over many small ones.

### product-ui
Claude Skills. A product launch look: glossy app windows in a dark, deep space, with the repo's real output inside them.
- **Shared components** live in `video/src/productui/` (create them on the first episode, then reuse them so every episode matches): `Space` (near-black backdrop with a soft vignette and a faint grid fading into depth), `Window` (rounded, 1px light border, soft shadow and a slight top sheen; variants `browser` with a URL bar, `terminal`, `editor`, `chat`), `Cursor` (moves on a spring between points and clicks with a small ring), `TypeOn` (text typing at a steady rate, cued to a word), `RepoCard` (owner/repo, maker, star counter that counts up with an ease-out), `Split` (WITHOUT / WITH layout), `Callout` (a glow ring or highlight over a region), `CatchCard`, `InstallBar`.
- **Proof media:** show files from `video/public/episodes/<slug>/proof/` with `<Img src={staticFile(...)} />` for PNGs and `<OffthreadVideo src={staticFile(...)} muted />` for MP4s. A tall screenshot scrolls inside its window by animating `translateY` with `interpolate`. Keep the credit tag on screen whenever the maker's demo shows. Never redraw or fake a tool's output: if a proof file is missing, flag it and ask for it.
- **Depth and motion:** windows sit in 3D space with `perspective` and a small `rotateX`/`rotateY` (≤ 12°), drifting slowly; push in with a critically damped spring on the word that names the detail. Glass sheen and soft shadows are allowed here (unlike flat-metaphor). One accent colour (amber by default) plus white and greys; WITHOUT is desaturated.
- **Fixed moments:** the intro builds the repo card and ticks the stars up to the research count; the close types the install command into the terminal, then the logo end card. Layout rules are the same as every series (header 270–480, visual 500–1320, captions 1420–1540 kept clear).
- **Readable on a phone:** the main window is about 900 px wide; code and text inside it are at least 28 px on screen at their largest moment. Zoom (scale plus translate on a spring) to the one line that matters rather than shrinking the whole file to fit.
- **Cuts:** cut straight between scenes or cross-dissolve in about 6 frames. Never fade the whole frame to black between scenes.
- Make each new component work for the next episode too, and list new or changed components in the render notes.

## 3. Sound

- Library: `ls video/public/audio/sfx`. Reuse these first; play them with `<Sfx name="pop" at={frame} volume={0.5} />`.
- New effect only if nothing in the library fits: generate it with ElevenLabs. Add it to `video/src/episodes/<slug>/sfx.json` as `{ "name": { "text": "short clean description", "duration": 1.0 } }`, then `npm --prefix video run ep:audio -- <CODE> --only=sfx`.
- Every new sound joins the shared library for future episodes. Say in the render notes which sounds are new, and which are CC BY (they need a credit in the description).
- Music: put the storyboard's Music prompt into `script.json` as `"musicPrompt"` and run `npm --prefix video run ep:audio -- <CODE> --only=music`. Generate it once; reuse it on revisions unless a note asks for new music.

## 4. Build

- One file per scene: `video/src/episodes/<slug>/scenes/<PascalCaseId>.tsx`, exporting a component. Cue everything to words: `const wf = useWord(); const t = wf("hook", "purpose");` (scene-local frame; `wf(id, word, nth, "end")` for the end of a word).
- Register each scene in `video/src/episodes/<slug>/index.tsx`: the import below `// @scene-imports` and `id: Component,` below `// @scenes`.
- Replace `Cover.tsx` with the storyboard's cover (static, no animation; cover text ≤ 3 words).
- Import shared pieces from `../../../engine/kit` and `../../../theme` (paths are relative to the scenes folder).

**Layout rules (1080×1920):** nothing in 0–260 (phone clock and platform tabs cover it; no watermark there); header 270–480 (`Header` defaults to 270); main visual 500–1320; `<Source text="…" />` sits at 1340 on fact scenes; captions own 1420–1540 (automatic, keep clear); nothing important below 1560, in the right 160 px below y 1200 (like/comment/share buttons) or in the outer ~60 px each side (tall phones crop them). Never hard-code the old 170 / 1262 / 1340 positions. On-screen text is short. No emoji. Every number on screen matches the fact-check. The last scene ends on the first scene's layout so the video loops.

**Check as you go:**
```bash
npm --prefix video run typecheck
npm --prefix video run ep:still -- <CODE> --scenes          # middle + end of every scene → video/out/<slug>/stills/
npm --prefix video run ep:still -- <CODE> --scene hook --at 40
```
Open the PNGs with Read and look properly: overlaps with captions, text running off the frame, empty frames, unreadable contrast, things placed in the unsafe zones. Fix and re-check before rendering.

## 5. Render

```bash
npm --prefix video run ep:render -- <CODE>      # → video/out/<slug>/final.mp4 (mastered to -14 LUFS) + cover.png. Re-renders only scenes that changed; sound is always redone
npm --prefix video run ep:measure -- <CODE>     # resolution, fps, length, loudness checks
npm --prefix video run ep:frames -- <CODE>      # → video/out/<slug>/frames/sheet.jpg, one frame every 2 s
```
Open `sheet.jpg` and do a final pass. Use `ep:render -- <CODE> --draft` for quick half-size checks while iterating. If reused scenes ever look wrong, `ep:render -- <CODE> --full` renders every frame in one pass.

## 6. Notes for the reviewer

Write `renderNotes` as Markdown: length and measure results; one line per scene (what it shows, what's cued to which word, sounds used); new sound effects added to the library; anything you'd want a second look at, with timestamps; "Changes in this version" for revisions.

## 7. Hand back to make

You're running inside the **make** skill (Make stage), which submits everything in one go. Don't call `episode.mjs submit` and don't tick the checklist yourself. Give make back:
- `renderUrl=/media/out/<slug>/final.mp4` and the notes (the `renderNotes` field)
- for the checklist: the measure results, and the timestamps worth a second look
- any problem that belongs to an earlier stage, written as exact, minimal fixes ("scene id: current line → replacement line"), so make can propose the send-back. Never over taste or style; only over something that's wrong.
