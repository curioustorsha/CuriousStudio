---
name: research
description: Research a Curiously episode for its Research stage and submit the notes to the tracker for review. Use when asked to research an episode, usually from the tracker's Run button, including a new version after "request changes" notes.
---

# Research stage

Turn an approved idea into research notes that the script can be written from: one clear insight, a numbered list of facts with sources, and how the thing works. The output goes to the tracker as a new version. A person reviews it and either moves the episode on or requests changes, which brings you back here for the next version.

## 1. Load the episode

```bash
node tracker/scripts/episode.mjs get <CODE>
```

Run from the Curiously project root. If the tracker isn't reachable, tell the user and stop.

From the JSON, read:
- **Idea:** `title`, `hook`, `summary`, `whyNow`, `audience`, `keyPoints`, `visualIdeas`. The target length is `series.targetSeconds`.
- **Series:** `series.formatNotes` (structure, tone, freshness rules for this series).
- **Revision context:** `review.openFeedback` entries with `stage: "research"`, plus the current `research` and `sources` (the previous version).

**Check the stage.** If `stage` is not `research`, stop and say so: "AIW-001 is in Idea. Move it to Research in the tracker first." Only a person moves stages. Continue only if the user explicitly says to go ahead anyway. If `review.stale.research` is set, the idea changed after the last research: redo the research for the updated idea. No review note is needed for that.

## 2. First version or revision?

- **No open feedback and no existing research:** write v1 from scratch.
- **Open feedback:** this is a revision. Treat each note as a required change. Keep the parts of the previous version that the notes didn't criticise, and don't quietly rewrite things nobody asked about. End the notes with a "Changes in this version" section that answers every note one by one.

## 3. Research

Use WebSearch and WebFetch. Send independent searches in parallel.

**Source order, best first:**
1. Primary: the company's engineering blog, official announcements, docs, filings, patents, papers, talks by the people who built it.
2. Reputable reporting: Reuters, AP, Bloomberg, The Verge, TechCrunch, Ars Technica, The Information, and major Indian outlets for Indian topics.
3. Everything else only to find leads. Never cite content farms, SEO listicles, or AI-generated summaries.

**Rules:**
- Every number, date, name and product version needs a source you actually opened. Note the exact figure or quote and the date it was published.
- Back the key claims with two independent sources when possible. If only one exists, say so.
- If the company never published a number, the fact is "reported" and the script must say "reportedly". Mark it.
- Check freshness. *AI This Week* covers the last 7 days. *Claude Lab* versions and features change fast, so note the version and date. Prefer the newest primary source.
- Never invent or "round into" a fact. If you can't verify something, put it under Open questions instead of the facts list.
- Look for the surprising detail that makes people share a short video. That's usually the insight.

**Go one level deeper, every series.** Curiously is a technical channel. The audience wants to know how things actually work, not just what happened. Every episode's research needs a **Technical layer**: the real mechanism under the story, named properly, with numbers. You never need the idea's key points to ask for this. What depth means for this series (system-design concepts, under-the-hood mechanics, the technical detail behind a headline) is in its playbook, `series.formatNotes`. Follow it, including how episodes link to each other (Claude Lab is a course: research only this lesson's topic) and its company rules.

**How to dig:**
- Find the engineering concepts or mechanisms behind the story and how each one works, from primary sources.
- Collect the numbers a viewer could **do the maths** with (orders per day, time per step, distance, capacity). A worked back-of-envelope calculation is welcome if every input is a sourced fact. Any assumption (e.g. "15% of orders in the peak hour") goes in a separate **Assumptions** list (A1, A2…) and is never presented as a fact.
- **Use the whole industry, not one company.** If the headline company hasn't published how a step works, use a peer that has (e.g. Zepto or Instamart for Blinkit, Lyft for Uber) and name whose fact it is in the claim: "**F4.** Zepto: a packer picks an order in just over 50 seconds…". Never let a peer's fact read as the headline company's.

## 4. Write the notes

Write `research` as Markdown in exactly this shape:

```markdown
## The one insight
One or two sentences: the single thing a viewer should walk away knowing.

## Key facts
- **F1.** Claim in plain words. "Exact quote or figure." ([Publisher, 12 Mar 2025](https://…)) · Primary
- **F2.** … · Reported (company hasn't confirmed)
(Number every fact F1, F2… The script and fact-check refer to these IDs. Label each Primary, Secondary or Reported.)

## How it works
A plain explanation pitched for `series.targetSeconds`. Short paragraphs.

## The technical layer
(Every series.) Each concept or mechanism: its name, one line on what it is, how it shows up in this story, and the facts it rests on. Include any worked maths step by step.

## Assumptions
(Only if the maths needs one.) **A1.** The assumption and why it's reasonable. Never a fact.

## Suggested story beats
Hook → setup → 2–3 beats → payoff, each beat pointing to the facts it uses (F1, F3). Fit the series structure and `series.targetSeconds`.

## Visual ideas
Diagrams, counters, comparisons that would make each beat visible. No emoji.

## Don't say
Common misconceptions, outdated numbers, and claims that sound right but aren't supported.

## Open questions
Anything unverified or worth a human decision.

## Changes in this version
(Revisions only. One line per review note: the note, then what changed.)
```

Write `sources` as a Markdown list, one line per source actually used: `- [Title](url): publisher, date`.

## 5. Checklist

`review.checklist` from step 1 lists this stage's checklist items (`item`, `text`, `done`, `humanOnly`). Go through every item and decide, honestly, against the work you're about to submit:

- **Confirmed:** `done: true`, with a short note on what confirms it ("6 sources: 4 primary, 2 reputable press").
- **Unsure or not met:** `done: false`, with a note telling the reviewer exactly where to look and what to decide ("F4 (500M users) has only one source, a 2023 blog post. Decide whether to keep it."). This is how they know which section needs their eyes, so be specific: name the fact, scene, claim or source.
- **`humanOnly` items:** always `done: false`. You may add a note to help the person check it.

Never tick something you didn't check. A flagged item with a clear note is more useful than a tick the reviewer can't trust.

Write the result as JSON:

```json
[
  { "item": 0, "done": true, "note": "5 sources, 3 primary (Amazon blog, patent, INFORMS paper)" },
  { "item": 1, "done": false, "note": "F6 is reported only (company never confirmed). Script must say reportedly, or drop it." }
]
```

## 6. Send back (only when an earlier stage has to change)

Your own output is one thing; a problem that lives in an **earlier stage** is another. Don't work around it here. Propose a send-back when the idea's premise or hook turns out to be false or unprovable ("Hook says IRCTC sells 1 lakh tickets a minute; the real peak is ~28,000. Change the hook to …"). Typical target for this stage: `idea`.

Write the proposal as JSON, with exact, minimal fixes the earlier stage's skill can apply without guessing:

```json
{ "stage": "idea", "notes": "- **outro:** \"current line\" → \"replacement line\"\n- …" }
```

Submit it with `sendBack=@<path>/sendback.json`. If nothing needs to go back, submit `sendBack=none` (this also clears an old proposal from an earlier run). The tracker shows the proposal with a **Send fixes to …** button, and a person decides. Never send back over taste or style; only over something that's wrong.

## 7. Submit

Write both to files in your scratchpad, then:

```bash
node tracker/scripts/episode.mjs submit <CODE> research=@<path>/research.md sources=@<path>/sources.md checks=@<path>/checks.json sendBack=none
```

This saves a new version, marks it "Ready for review", and marks the open notes as addressed. It never moves the stage.

## 8. Report back

- Checklist: what you ticked, and every item you flagged with its note, so the reviewer knows where to look first.
Keep it short:
- The one insight.
- How many facts, and how many are Primary vs Reported.
- Weak spots: single-source claims, open questions, anything the reviewer should look at first.
- For a revision, how each note was handled.
- The link: `/episodes/<id>`. Tell them to approve it by moving the card to Script, or to request changes on the page.
