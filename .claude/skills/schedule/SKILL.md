---
name: schedule
description: Pick a Curiously episode's publish date with `episode.mjs slot` and write the per-platform publishing plan with a copy-paste upload kit and step-by-step scheduling instructions for YouTube, Instagram and TikTok. The second step of the publish skill.
---

# Scheduling (part of Publish)

Choose the date and prepare everything a person needs to schedule the video in each app in a few minutes. This skill can't log in to YouTube, Instagram or TikTok, so it never claims a video is scheduled: a person does that and ticks those checklist items.

## 1. Load the episode and the calendar

```bash
node tracker/scripts/episode.mjs get <CODE>
node tracker/scripts/episode.mjs list
```

Run from the Curiously project root. From the episode, read `series` (`name`, `cadenceDays`: comma-separated weekdays, 0 = Sunday … 6 = Saturday), `series.formatNotes` (freshness rules), the packaging fields, `publishDate` (if one is already set), and `title`. The list gives every episode's code, stage, series id and publish date.

**Where this runs.** Inside the **publish** skill, after packaging (`stage` is `publish`). Build the upload kit from the packaging publish has just written.

**Revision:** notes (stage `publish`) that move the date or change times: apply them and answer each in "Changes in this version".

## 2. Pick the date

Run `node tracker/scripts/episode.mjs slot <CODE>`. It returns the next free publishing day for the series: one of its weekdays, not before launch (2027-01-01) or tomorrow, and not a day another episode of the same series already has. Use it, unless:
- `publishDate` is already set and still valid (keep it), or a note asks for another date.
- Freshness says otherwise: *AI This Week* goes out within days of being made; *Claude Lab* and *Claude Skills* at most 2–4 weeks ahead; *How It Scales* is evergreen. If the slot is too far out for a fresh series, say so in the plan.

## 3. Times

Default to the evening in India Standard Time: YouTube 6:00 PM IST, Instagram 7:30 PM IST, TikTok 7:30 PM IST (adjust if a note or past results say otherwise). Write times in IST and UTC.

TikTok has been unavailable in India since 2020. If the team posts from India, say so in the plan and mark TikTok as "skip unless posting from an account outside India".

## 4. The publishing plan

Write `publishPlan` as Markdown:

```markdown
**Date:** Fri 8 Jan 2027 · How It Scales (Mon) → next free slot

| Platform | When (IST) | When (UTC) | Status |
|---|---|---|---|
| YouTube Shorts | 6:00 PM | 12:30 | to schedule |
| Instagram Reels | 7:30 PM | 14:00 | to schedule |
| TikTok | 7:30 PM | 14:00 | to schedule |

## Files
Video: Download video (Scheduled tab) · Cover: Download cover

## YouTube Shorts
Title: … · Description: (paste) · Visibility: Schedule → date/time · Audience: not made for kids · Category: Science & Technology · Altered or synthetic content: the narration is AI-generated; tick the disclosure if YouTube asks about realistic synthetic content
Steps: YouTube Studio → Create → Upload video → … → Visibility → Schedule.

## Instagram Reels
Caption: (paste) · Cover: upload the cover · "AI info" label if Instagram asks
Steps: Instagram app or Meta Business Suite → Create Reel → … → Advanced → Schedule.

## TikTok
Caption: (paste) · Steps: TikTok web (tiktok.com/upload) → Schedule (up to 10 days ahead).

## After posting
Paste the three links into the Posted tab.
```

**Carousel series** (`series.format` is `carousel`): the files are the slides, not one video. Change the plan like this:
- **Files:** Instagram uses the 4:5 slides (the episode's `slides` field, `video/out/<slug>/slides/4x5/01.png …`, in order). TikTok uses the 9:16 slides (`…/slides/9x16/`). YouTube uses the slideshow Short (`video/out/<slug>/final.mp4`).
- **Instagram carousel:** Create → Post → select the slides in order (up to 20) → caption → schedule in the app or Meta Business Suite. Rows: "Instagram carousel" instead of "Instagram Reels".
- **TikTok photo post:** Upload → Photo mode → slides in order → title + caption from `tiktokCaption`. If TikTok's web scheduler doesn't offer photo posts on the day, write "post from the app at the time".
- **YouTube Shorts:** as a normal Short, with the slideshow video and slide 1 as the cover. The narration line about AI content doesn't apply (no voice); only tick the altered-content box if the slides contain generated imagery.

Copy the title, description, captions and hashtags in exactly from the packaging fields (the reviewer approved them); don't rewrite them.

If the team later wants real automatic scheduling, Postiz (open source, self-hosted, 40k+ GitHub stars) can post to all three through their APIs. Mention it in one line; don't set it up.

## 5. Hand back to publish

You're running inside the **publish** skill (Publish stage), which submits everything in one go. Don't call `episode.mjs submit` and don't tick the checklist yourself. Give publish back:
- `publishDate` and the plan (the `publishPlan` field)
- for the checklist: the date and why; the three "Scheduled on …" items are for a person, so note "Upload kit ready"
- any problem that belongs to an earlier stage, written as exact, minimal fixes ("scene id: current line → replacement line"), so publish can propose the send-back. Never over taste or style; only over something that's wrong.
