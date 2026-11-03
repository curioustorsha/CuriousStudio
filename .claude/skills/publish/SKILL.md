---
name: publish
description: The Publish stage of a Curiously episode, for every series - write the titles, description, captions, hashtags and cover text, pick the next free publishing day, and write the copy-paste upload kit with the pinned comment, then submit it all for a person to schedule on each platform. Use when asked to publish, package or schedule an episode, usually from the tracker's Run button, including re-runs after "request changes" notes.
---

# Publish stage

Everything a person needs to put the episode out, in one run: the words around the video, the date, and an upload kit. This skill can't log in to YouTube, Instagram or TikTok, so it never claims a video is scheduled. A person schedules it in each app and ticks those items.

## 1. Load the episode

```bash
node tracker/scripts/episode.mjs get <CODE>
```

Run from the Curiously project root. Read the series playbook (`series.formatNotes`), `script`, the render or slides, the current packaging fields and `publishDate`, and `review.openFeedback` with `stage: "publish"`.

**Check the stage.** If `stage` is not `publish`, stop and say which stage it's in.

**Revision:** open notes are required changes. A note about words only goes through step 2; a note about the date or times only goes through step 3. Keep everything nobody criticised.

## 2. Packaging

Follow the **package** skill: title and cover (yt-package), description (yt-seo), Instagram and TikTok captions and hashtags. Every company the episode names should be tagged or mentioned in the captions the way the playbook says.

## 3. Date and upload kit

Follow the **schedule** skill. The date comes from `node tracker/scripts/episode.mjs slot <CODE>`, not from guessing. Put the pinned comment's text in the plan's "After posting" section.

## 4. Checklist

Items 0–2 (titles and captions, cover, publish date) are yours: tick each with a short note. Items 3–5 ("Scheduled on YouTube / Instagram / TikTok") are `humanOnly`: leave them unticked with the note "Upload kit ready: see the plan". JSON: `[{ "item": 0, "done": true, "note": "…" }]`.

## 5. Submit

Write each field to its own file, then submit them together:

```bash
node tracker/scripts/episode.mjs submit <CODE> ytTitle=@<p>/title.txt ytDescription=@<p>/description.md igCaption=@<p>/ig.txt tiktokCaption=@<p>/tiktok.txt hashtags=@<p>/hashtags.txt thumbnailNotes=@<p>/cover-notes.md publishDate=YYYY-MM-DD publishPlan=@<p>/plan.md checks=@<p>/checks.json sendBack=none
```

**Send back** (only when something earlier is wrong, never over taste): if the cover frame is unusable, or the video breaks a platform rule, submit `sendBack=@<p>/sendback.json` with `{ "stage": "make", "notes": "exact fix" }`.

## 6. Report back

- **Helpers:** every helper skill you loaded or read this run, each with one line on what it actually changed ("yt-seo: rewrote the first two description lines for search") or "loaded, didn't change anything". Also name any helper these instructions mention that you didn't use, and why. This decides which helpers stay, so be honest.

The chosen title (with its score), the cover text, the first two description lines, the date and why, anything flagged, and: "Schedule it in each app using the plan, tick the three boxes, then move it to Posted." Link: `http://localhost:3000/episodes/<id>`. End with the gate the yt skills use: **ship it, or change it?**
