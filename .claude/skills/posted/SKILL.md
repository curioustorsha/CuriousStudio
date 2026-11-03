---
name: posted
description: Log a live Curiously episode - verify its YouTube, Instagram and TikTok links, record 7-day stats, and write what the channel learned. Not run from the pipeline right now (the Posted stage is filled in by hand); kept for a monthly learnings pass once analytics are live. Use only when asked directly.
---

# Posted stage

Close the loop: confirm it's live, help the first comments, and learn from the numbers. Run it once after posting, and again after 7 days for the stats.

## 1. Load the episode

```bash
node tracker/scripts/episode.mjs get <CODE>
node tracker/scripts/episode.mjs list
```

Run from the Curiously project root. Read `postedYt`, `postedIg`, `postedTiktok` (a person pastes these in the Posted tab), `publishDate`, `views`, `likes`, `shares`, `avgRetention`, `analyticsNotes`, `ytTitle`, `hook`, `script`, `sources`, `series.name`. The list gives other episodes and their views for comparison.

**Check the stage.** If `stage` is not `posted`, stop and say which stage it's in. If no link is filled in, stop: "Paste the links in the Posted tab and save, then run this again." If `review.stale.posted` is set, something earlier changed after the last notes: check the links and notes again.

## 2. Check the links

Open each link with WebFetch. Confirm it loads and is this episode (the title or caption matches). Instagram and TikTok often block automated reads. If a link can't be confirmed, say so; don't mark it broken.

## 3. Pinned comment

Follow the **yt-comment** skill, using `.claude/skills/package/voice.md` as the voice file. Draft one comment to pin on YouTube: a question that invites real answers about the topic, or the main source link with one line of context. Under 30 words, no emoji. A person posts and pins it.

## 4. Stats (7 days after `publishDate`)

- Record only numbers you actually read. YouTube's public page sometimes shows views; likes, shares and retention usually need YouTube Studio, Instagram Insights and TikTok Analytics. Never estimate or guess a number.
- If you couldn't read them, ask in the report: "Enter views, likes, shares and average % viewed from the apps in the Posted tab, then run this again for the learnings."
- When numbers exist (yours or the person's), compare them with the other posted episodes from the list: views against the channel's median, and which hook or series did better.

## 5. Write the notes

Write `analyticsNotes` as Markdown:

```markdown
**Live:** YouTube ✓ · Instagram ✓ · TikTok (couldn't confirm automatically)

## Pinned comment (YouTube)
> …

## 7-day stats
Views 12,400 · Likes 890 · Shares 120 · Avg viewed 71% (from YouTube Studio, entered by …)

## What we learned
- 2–3 specific lessons tied to numbers ("the stat-first hook held 71% vs our 58% median").
- One thing to try in the next episode.
```

Before 7 days, write the "Live" and "Pinned comment" sections and "Stats: due on <date>".

## 6. Checklist

`review.checklist`:
- **"Links saved":** tick it when every filled link loaded and matched, and say which ones you confirmed.
- **"Pinned comment added":** for a person to tick (`humanOnly`). Leave it unticked with the note "Draft ready in What we learned."
- **"7-day stats recorded":** tick it only when the numbers are in the fields.

JSON: `[{ "item": 0, "done": true, "note": "…" }]`.

## 7. Send back (only when an earlier stage has to change)

Your own output is one thing; a problem that lives in an **earlier stage** is another. Don't work around it here. Propose a send-back when a link points to the wrong video or the post went out with the wrong copy (what's wrong where). Typical target for this stage: `scheduled`.

Write the proposal as JSON, with exact, minimal fixes the earlier stage's skill can apply without guessing:

```json
{ "stage": "scheduled", "notes": "- **outro:** \"current line\" → \"replacement line\"\n- …" }
```

Submit it with `sendBack=@<path>/sendback.json`. If nothing needs to go back, submit `sendBack=none` (this also clears an old proposal from an earlier run). The tracker shows the proposal with a **Send fixes to …** button, and a person decides. Never send back over taste or style; only over something that's wrong.

## 8. Submit

```bash
node tracker/scripts/episode.mjs submit <CODE> analyticsNotes=@<path>/notes.md checks=@<path>/checks.json sendBack=none
```

When you read real numbers, add them: `views=12400 likes=890 shares=120 avgRetention=71`.

## 9. Report back

Which links are confirmed, the pinned comment, stats (or what's missing and when they're due), the lessons, and the link `http://localhost:3000/episodes/<id>`.
