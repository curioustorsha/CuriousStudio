---
name: design
description: Render a Curiously carousel's slides at 4:5 for Instagram and 9:16 for TikTok photo mode, plus a slideshow Short for YouTube, from its approved slide plan, and check every slide by eye. A step of the make skill for carousel series.
---

# Design (part of Make)

Turn the storyboard's slide plan into finished slides. The template is fixed (`video/src/carousel/Slides.tsx`), so this stage is about exact copy, the right icons, and checking every slide properly.

## 1. Load the episode

```bash
node tracker/scripts/episode.mjs get <CODE>
```

Run from the Curiously project root. Read `storyboard` (the slide plan), `script` (the slide copy), `factcheck` (numbers on slides must match it), `title`, `series.name`, `series.format`.

**Where this runs.** Inside the **make** skill, after the slide plan is approved (`stage` is `make`, carousel series only). If the script or slide plan changed since the last render, rebuild every slide from the current plan.

**Revision:** open notes (stage `make`) that name slides ("slide 3: headline wraps to 3 lines") mean: change only those slides, re-render them, and answer every note in "Changes in this version".

## 2. Know the template

- `video/src/carousel/Slides.tsx`: slide kinds and their fields:
  - `cover`: `kicker`, `title`, `icon?`, `date?`
  - `story`: `kicker`, `title`, `body`, `why`, `source`, `icon?`, `logo?`, `stat?`
  - `takeaway`: `title`, `points` (3)
  - `outro`: `title`, `cta`
- `video/src/carousels/example/slides.json`: a complete example deck.
- `video/src/products.tsx`: the icon names (`ai`, `robot`, `brain`, `chip`, `code`, `chat`, `image`, `lock`, `bolt`, `chart`, `shield`, `rocket`, `news`…). Use only names that exist; add a Phosphor icon there if the plan asks for a new one (duotone, with a tint). **No emoji, no photos of people.**
- `video/src/logos.tsx`: company logos. **Whenever a story is about a named company, set `"logo": "<key>"`** (it replaces the icon). If the company isn't in `LOGOS` yet, add it: inline SVG from a public-domain or properly licensed source (e.g. Wikimedia Commons, PD-textlogo), with the source and licence in the file's header comment. If no clean logo exists, use the icon and flag it in the notes.

## 3. Write the deck

Create `video/src/carousels/<slug>/slides.json` (slug = code in lowercase, e.g. `aiw-004`):

```json
{
  "series": "AI THIS WEEK",
  "music": "audio/music.mp3",
  "secondsPerSlide": 3,
  "slides": [
    { "kind": "cover", "kicker": "AI this week · #4", "title": "3 AI stories you missed", "icon": "news", "date": "Week of 2 Nov 2026" },
    { "kind": "story", "kicker": "Anthropic", "title": "…", "body": "…", "why": "…", "source": "Anthropic blog, 30 Oct 2026", "icon": "ai" }
  ]
}
```

Copy the text **exactly** from the script and storyboard: they were reviewed and fact-checked. If something won't fit, shorten it only as far as needed and list every change in the notes. `music` is a path under `video/public/`; keep the channel bed unless the storyboard asks for new music (then generate it with the **elevenlabs-music** skill into `video/public/episodes/<slug>/music.mp3` and point `music` at `episodes/<slug>/music.mp3`).

## 4. Render

```bash
npm --prefix video run ep:carousel -- <CODE>              # all slides (4:5 + 9:16) and the slideshow Short
npm --prefix video run ep:carousel -- <CODE> --only 3     # re-render one slide after a fix
```

Output: `video/out/<slug>/slides/4x5/NN.png`, `video/out/<slug>/slides/9x16/NN.png`, `video/out/<slug>/final.mp4`. The script prints the `/media/…` paths for the `slides` field.

## 5. Look at every slide

Open **every** PNG in both sizes with Read. Fix and re-render until all of these hold:
- Nothing cut off or overlapping; headlines at most 3 lines; body text readable at phone size.
- 9:16: nothing important in the bottom ~380 px or the right 120 px (platform buttons).
- Every number and name matches the fact-check; every story slide has a dated source.
- Icons fit the story; the cover makes someone want to swipe.
- Page dots match the slide count.

Then check the Short: `npm --prefix video run ep:measure -- <CODE>` and `npm --prefix video run ep:frames -- <CODE>` (open `video/out/<slug>/frames/sheet.jpg`).

## 6. Notes for the reviewer

Write `designNotes` as Markdown: the slide count and sizes rendered; one line per slide (kind, icon, anything shortened); the Short's length and music; anything you'd want a second look at, by slide number; "Changes in this version" for revisions.

## 7. Hand back to make

You're running inside the **make** skill (Make stage), which submits everything in one go. Don't call `episode.mjs submit` and don't tick the checklist yourself. Give make back:
- the 4:5 slide paths, one per line in order (the `slides` field), `renderUrl=/media/out/<slug>/final.mp4` and the notes (the `designNotes` field)
- for the checklist: anything shortened or flagged, by slide number
- any problem that belongs to an earlier stage, written as exact, minimal fixes ("scene id: current line → replacement line"), so make can propose the send-back. Never over taste or style; only over something that's wrong.
