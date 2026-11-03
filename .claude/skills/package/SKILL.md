---
name: package
description: Write a Curiously episode's packaging (YouTube Shorts title and description, Instagram and TikTok captions, hashtags, cover text) using the yt-package, yt-seo and humanizer skills, lint the title and check the cover frame. The first step of the publish skill.
---

# Packaging (part of Publish)

Title, cover, description and captions decide whether anyone watches. Built from the verified script, in the channel's voice.

## 1. Load the episode

```bash
node tracker/scripts/episode.mjs get <CODE>
```

Run from the Curiously project root. Read `title`, `hook`, `script`, `research` (the main insight), `factcheck` (only verified claims go in copy; "reportedly" stays "reportedly"), `sources`, `series.name`, `renderNotes`, and the current packaging fields (previous version).

**Where this runs.** Inside the **publish** skill, as its first step (`stage` is `publish`). If the render or script changed since the last packaging, rewrite anything that no longer matches.

**Revision:** each open note (stage `publish`) about titles, captions or the cover is a required change. Keep what wasn't criticised, and answer every note in "Changes in this version" inside `thumbnailNotes`.

**Carousel series** (`series.format` is `carousel`, AI This Week): the same fields, adjusted per platform:
- **YouTube:** the title and description are for the **slideshow Short** (`video/out/<slug>/final.mp4`). The "cover" is slide 1; check `video/out/<slug>/slides/4x5/01.png` instead of `cover.png`. If slide 1's text must change, that's a send-back to `design`.
- **Instagram carousel caption:** first line is the hook and ends with a swipe cue ("3 stories, swipe →"); then one line per story; then the follow line and hashtags.
- **TikTok photo post:** TikTok photo posts have a title (≤ 90 characters) and a caption. Put the title on the first line of `tiktokCaption`, then a blank line, then a 1–2 line caption.
- Hashtags: 5–8, e.g. #ai #ainews plus the companies named in the stories.

## 2. Voice

Read `.claude/skills/package/voice.md`. When the **yt-package** or **yt-seo** skills (or yt-comment) ask for `~/.claude/youtube/voice.md`, use this file instead. Don't ask for three videos and don't create the home-folder file. No emoji anywhere.

## 3. Title and cover (yt-package)

Follow the **yt-package** skill: title and cover are one unit.
1. Write 10 YouTube Shorts titles to a file, one per line. They must be ≤ 60 characters, front-load the subject, use a number, name or date where the facts allow, and contain no clickbait the video doesn't pay off.
2. Lint them: `python3 .claude/skills/yt-package/title.py <path>/titles.txt --thumb "<cover text>"`.
3. Keep the best. The cover text (≤ 3 words) must say something the title doesn't.
4. Look at the cover: open `video/out/<slug>/cover.png` with Read. If its text doesn't match the chosen cover text, update `video/src/episodes/<slug>/Cover.tsx` and re-render only the cover with `npm --prefix video run ep:still -- <CODE> --cover`, then check it again.

## 4. Description (yt-seo)

Follow **yt-seo**:
- The first two lines say what the viewer learns, in words people search.
- Then "Sources:", one line per source from the fact-check.
- End with `#Shorts`.
- Write down the three search queries it should win. Check that the title or first two lines contain their words.

## 4b. Sound credits

If the episode uses any CC BY sound (see the render notes and `video/public/audio/sfx/CREDITS.md`), end the YouTube description with a short "Sound:" line crediting each one (title, author, licence, link). CC0 and Mixkit sounds need no credit.

## 5. Captions and hashtags

- **Instagram:** the hook as the first line, 2–3 short lines of payoff, a soft follow line ("Follow for how big systems really work"), then the hashtags on their own line.
- **TikTok:** one or two short lines, under about 150 characters before the hashtags.
- **Hashtags:** 5–8, mixing broad (#tech) and specific (#systemdesign, #amazon). No banned or misleading tags.

Run the description and both captions through **humanizer** (embedded mode). Keep them short; plain spoken sentences are fine.

## 6. Notes

Write `thumbnailNotes` as Markdown: the cover text and why; the top 3 titles with their lint scores and the main issue each; the 3 search queries; "Changes in this version" for revisions.

## 7. Hand back to publish

You're running inside the **publish** skill (Publish stage), which submits everything in one go. Don't call `episode.mjs submit` and don't tick the checklist yourself. Give publish back:
- `ytTitle`, `ytDescription`, `igCaption`, `tiktokCaption`, `hashtags` and `thumbnailNotes`, each in its own file
- for the checklist: the chosen title with its score, the cover, and anything flagged
- any problem that belongs to an earlier stage, written as exact, minimal fixes ("scene id: current line → replacement line"), so publish can propose the send-back. Never over taste or style; only over something that's wrong.
