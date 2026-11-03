---
name: qa
description: Automatic quality checks on a rendered Curiously episode or carousel: technical specs and loudness, a speech-to-text listen-back against the script, a frame-by-frame pass for overlaps, cut-off text, unsafe zones and wrong numbers, and an optional earshot scorecard. The last step of the make skill; the phone review afterwards is done by people.
---

# QA checks (part of Make)

Be the fresh pair of eyes. Find everything that would embarrass the channel, with timestamps, so the person reviewing on their phone knows exactly where to look. You don't fix anything here: the make skill fixes what it can and re-runs you before submitting; the rest is reported with timestamps.

## 1. Load the episode

```bash
node tracker/scripts/episode.mjs get <CODE>
```

Run from the Curiously project root. Read `script`, `factcheck`, `storyboard`, `renderNotes`, `title`, `series.format`, `series.visualStyle`.

**Carousel series** (`series.format` is `carousel`): skip sections 2–5 and do section 5b instead; the rest (report, checklist, send-back, submit) is the same, with `design` as the usual send-back target.

**Where this runs.** Inside the **make** skill, as its last step, after the render (`stage` is `make`). `video/out/<slug>/final.mp4` (or the slides) must exist. If a Major issue is something make can fix itself (an overlap, a wrong number on screen), tell make so it fixes it and runs you again before submitting.

**Revision:** on a re-run after fixes, re-check everything and say for each issue in the previous report whether it's fixed.

## 2. Technical

```bash
npm --prefix video run ep:measure -- <CODE>
```

Must be 1080×1920, 30 fps, 15–90 s, about -14 LUFS, true peak ≤ -1 dBTP, with audio.

## 3. Listen back

```bash
npm --prefix video run ep:stt -- <CODE> --final
```

Scribe transcribes the finished video and compares it with the script (the **elevenlabs-speech-to-text** skill covers Scribe's options). Missing words in the mix usually mean a sound effect or the music is masking the narration: note the line and roughly where it falls. Ignore number-format differences.

## 4. Look

```bash
npm --prefix video run ep:frames -- <CODE>              # one frame every 2 s + sheet.jpg
npm --prefix video run ep:frames -- <CODE> --every 1    # closer look if needed
```

Open `video/out/<slug>/frames/sheet.jpg` with Read, then the single frames (`t012.0.jpg` = 12 s) around anything suspicious. Check:
- **Hook:** something moving and readable within the first 1–2 s; the first spoken line is the hook.
- **Text:** nothing cut off or running off the frame; no typos; on-screen text short and readable at phone size.
- **Captions:** never covered by a visual; visuals don't sit in 1300–1500.
- **Safe zones:** nothing important below ~1550 px or in the right ~120 px (platform buttons).
- **Facts:** every number and name on screen matches the fact-check; fact scenes show a source line.
- **Brand:** watermark and series tag present, logo end card at the end, no emoji.
- **Style:** the look matches `series.visualStyle` (isometric: one consistent iso world, flat-shaded blocks, colour roles kept; flat-metaphor: flat shapes, each idea keeps its metaphor). A scene in the wrong style is a Major issue for Animation.
- **Flow:** no empty or frozen stretches; the last frame flows back into the first (loop).

## 5. Audio scorecard (if available)

If `tools/earshot/.venv` exists, use the **earshot** skill:
```bash
tools/earshot/.venv/bin/python -m earshot critique video/out/<slug>/final.mp4 --fast
```
Quote its numbers in the report. If a model command fails because its models aren't downloaded yet, use `earshot measure` (no models needed) and write "earshot models not downloaded: measured loudness only".

## 5b. Carousel: check the slides

Slides are listed in the episode's `slides` field (4:5) and also exist at `video/out/<slug>/slides/9x16/`. The slideshow Short is `video/out/<slug>/final.mp4`.
- Open **every** slide in both sizes with Read. Check: text fits and nothing is cut off; readable at phone size; nothing important in the bottom ~380 px or right 120 px of the 9:16 versions; no typos; every number and name matches the fact-check; every story slide has a source with a date; page dots match the slide count; brand and series tag on every slide; no logos or photos of real companies or people.
- The cover slide is the hook: it should make someone swipe. Say whether it does.
- Short: `npm --prefix video run ep:measure -- <CODE>` (1080×1920, 30 fps, about -14 LUFS if it has music) and `npm --prefix video run ep:frames -- <CODE>`; check each slide is on screen long enough to read (about 3 s).
- Use slide numbers instead of timestamps in the Issues table ("Slide 3"), with "Fix in: Make" (or Script for wording or facts).

## 6. Write the report

Write `reviewReport` as Markdown:

```markdown
**Verdict:** Ready to package / Fix first: 2 issues

| Check | Result |
|---|---|
| Specs | 1080×1920 · 30 fps · 58.4 s |
| Loudness | -14.1 LUFS · -1.6 dBTP |
| Listen-back | 98% match |

## Issues
| Time | Scene | What | Severity | Fix in |
|---|---|---|---|---|
| 0:12 | kiva | Counter overlaps the caption | Major | Animation |

## Worth a look on the phone
Moments that are fine on paper but need human eyes.

## Previous issues
(revisions only: each earlier issue → fixed / still there)
```

## 7. Hand back to make

You're running inside the **make** skill (Make stage), which submits everything in one go. Don't call `episode.mjs submit` and don't tick the checklist yourself. Give make back:
- the report (the `reviewReport` field), with every issue timestamped and marked Major or Minor
- for the checklist: whether the automatic checks pass, and what a person should watch for on the phone
- any problem that belongs to an earlier stage, written as exact, minimal fixes ("scene id: current line → replacement line"), so make can propose the send-back. Never over taste or style; only over something that's wrong.
