---
name: make
description: The Make stage of a Curiously episode, for every series - plan it (storyboard, or slide plan for a carousel) and pause for a person's approval, then build it (voiceover and animation for a video series, slides and slideshow Short for a carousel), run the automatic QA checks, and submit everything for the phone review. Use when asked to make, build, storyboard, animate or render an episode, usually from the tracker's Run button, including re-runs after "request changes" notes.
---

# Make stage

One stage builds the episode, whatever the series. It runs in two passes with a person's OK in between, so nothing expensive (voice, animation, renders) is built from a plan nobody has approved.

## 1. Load the episode

```bash
node tracker/scripts/episode.mjs get <CODE>
```

Run from the Curiously project root. Read:
- `series.format` (`video` or `carousel`: what you build), `series.visualStyle` (the style section to follow in the helpers), and `series.formatNotes`: **the series playbook**. Follow it (structure, depth, links between episodes, logos).
- `makeSteps`: which sub-steps already have output.
- `review.checklist`: item 0, "Plan approved", is ticked only by a person.
- `review.openFeedback` with `stage: "make"`, and `review.stale.make` (an earlier stage changed after the last version).

**Check the stage.** If `stage` is not `make`, stop and say which stage it's in.

## 2. Which pass?

**Plan pass:** run this when there's no storyboard yet, when the plan isn't approved (item 0 unticked), when open notes are about the plan, or when `review.stale.make` says the script changed.
1. Follow the **storyboard** skill. It covers the video storyboard and the carousel slide plan.
2. Submit only the plan (section 4) and stop. Don't start the build in the same run.

**Build pass:** run this when item 0 is ticked.
- **Video series:** follow the **voiceover** skill, then the **animate** skill.
- **Carousel series:** follow the **design** skill.
- Then follow the **qa** skill. If it finds a Major issue you can fix (an overlap, a cut-off line, a wrong number on screen), fix it, re-render and run qa again, at most twice. Report anything still open.

**Re-runs with notes:** each open note names what to change (a scene, a line, a slide). Redo only the steps it touches: a voiceover line means re-rendering that scene, and a slide note means re-rendering that slide. Answer every note in "Changes in this version" in the notes of the step you changed. A note that changes the plan itself goes back through the plan pass, so un-tick nothing yourself: say in the report that the plan needs re-approval.

## 3. Checklist

`review.checklist` items: 0 "Plan approved" (`humanOnly`: never tick it; on the plan pass, add a note on what to look at in the plan), 1 rendered at full size, 2 automatic checks pass, 3 brand end card or slide template applied. On the build pass, tick 1–3 only from the measure results, stills and the QA report. A flagged item with a precise note (scene, timestamp, slide) beats a tick nobody can trust. JSON: `[{ "item": 2, "done": false, "note": "…" }]`.

## 4. Submit

Each helper hands back its fields; submit them together, once per pass.

Plan pass:
```bash
node tracker/scripts/episode.mjs submit <CODE> storyboard=@<path>/storyboard.md checks=@<path>/checks.json sendBack=none
```

Build pass, video:
```bash
node tracker/scripts/episode.mjs submit <CODE> voiceoverUrl=/media/out/<slug>/vo-preview.mp3 voiceoverNotes=@<path>/vo-notes.md renderUrl=/media/out/<slug>/final.mp4 renderNotes=@<path>/render-notes.md reviewReport=@<path>/qa.md checks=@<path>/checks.json sendBack=none
```

Build pass, carousel:
```bash
node tracker/scripts/episode.mjs submit <CODE> slides=@<path>/slides.txt renderUrl=/media/out/<slug>/final.mp4 designNotes=@<path>/design-notes.md reviewReport=@<path>/qa.md checks=@<path>/checks.json sendBack=none
```

**Send back** (only when an earlier stage has to change, never over taste): when a helper reports a problem that lives in the script or research (a line that can't be shown, a fact-check fix never applied, a number that contradicts the fact-check), submit `sendBack=@<path>/sendback.json` instead of `none`, with exact minimal fixes: `{ "stage": "script", "notes": "- **outro:** \"current line\" → \"replacement line\"" }`. A person decides with the **Send fixes to …** button.

## 5. Report back

- **Plan pass:** the look in one line, the scene or slide count, the estimated length, anything new to build (components, sounds, logos), and: "Read the plan, tick **Plan approved** and press Run on Make again, or request changes."
- **Build pass:** the length, what each helper did, every open QA issue with its timestamp or slide number, and: "Watch it on your phone, then move it to Review."
- **Helpers:** every helper skill you loaded or read this run, each with one line on what it actually changed ("yt-seo: rewrote the first two description lines for search") or "loaded, didn't change anything". Also name any helper these instructions mention that you didn't use, and why. This decides which helpers stay, so be honest.
- The link `http://localhost:3000/episodes/<id>`.
