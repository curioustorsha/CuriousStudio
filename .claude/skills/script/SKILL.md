---
name: script
description: Write the voiceover script (or, for a carousel series, the slide copy) for a Curiously episode from its approved research, fact-check it claim by claim in a fresh subagent, apply the fixes, and submit both to the tracker for review. Use when asked to write or rewrite an episode's script, usually from the tracker's Run button, including a new version after "request changes" notes.
---

# Script stage

Write a voiceover script of the series' target length (`series.targetSeconds`), built only from the approved research, then have it fact-checked before you submit. A person reviews the script and the fact-check together and either moves the episode to Make or requests changes, which brings you back here for the next version.

## 1. Load the episode

```bash
node tracker/scripts/episode.mjs get <CODE>
```

Run from the Curiously project root. Read:
- **Research:** `research` (the one insight, facts F1…Fn, story beats, the "Don't say" list) and `sources`.
- **Idea:** `title`, `hook`, `audience`. The target length is `series.targetSeconds`.
- **Series:** `series.formatNotes`. Follow its structure. `series.format` is `video` (a spoken script, sections 2–5) or `carousel` (slide copy, section 5b instead of 2 and 5).
- **Revision context:** `review.openFeedback` entries with `stage: "script"`, and the current `script` (previous version).
- **Direction for v1:** open notes with `stage: "script"` and no `version` were written before the first version: they're the team's brief. "Build the script around these research facts" lists the facts they picked. Those facts are the backbone: give each one real time in the script. Use other facts only where the story needs them to make sense, and say in "Changes in this version" how each picked fact was used (or why one couldn't fit).
- **Series playbook:** `series.formatNotes`. Follow its structure, length, depth, links between episodes and company rules.
- **Fact-check context:** if a `factcheck` exists from an earlier round, apply every "Fix wording" and "Unsupported" item it lists.

**Check the stage.** If `stage` is not `script`, stop and say which stage it's in. Only a person moves stages. If `review.stale.script` is set, the research changed after the last script, so write against the new research. No review note is needed for that: the change itself is the reason for the run.

For a revision, treat each open note as a required change, keep what wasn't criticised, and answer every note in "Changes in this version".

## 2. Write it for the ear

This is spoken by an ElevenLabs voice (Monika Sogam: young, Indian, natural and conversational) over animated visuals.

- **Hook in the first line.** It has to stop the scroll in 2 seconds: a surprising claim, a visible contradiction, or a question the viewer already has. No "Have you ever wondered".
- **One takeaway:** the research's one insight. Cut anything that doesn't serve it, however interesting.
- **Length:** about `series.targetSeconds × 2.3` words (≈140 for 60s), never over `series.targetSeconds × 2.5`. The visuals need breathing room.
- **Short spoken sentences.** One idea each. Contractions are fine. Write numbers the way they should be said: "seven hundred seventy-five million dollars"; years as digits.
- **Ending:** loops back to the hook or lands the payoff in one line. No "like and subscribe".
- **Tone:** curious, calm, confident. Explain jargon or drop it.
- Avoid words that TTS often mispronounces, or flag them (see the output format).

## 3. Facts: research only

- Every factual statement must come from a fact in the research. Track which F-number each line uses.
- Keep numbers and dates exactly as the research has them. "Nearly half" for 47% is fine; "half" for 41% is not.
- Say "reportedly" for facts marked Reported.
- Nothing from the "Don't say" list.
- **No new facts.** If the story needs something the research doesn't have, leave it out and list it under "Needs research". Don't look it up and slip it in: that would skip the review.
- **Several companies are fine.** Don't cut a fact because it comes from a peer company. Say whose it is ("Zepto says a packer needs about fifty seconds"), so a peer's fact never sounds like the headline company's. The visuals will show each company's logo when it's named.

**Go one level deeper, every series.** Every script carries the research's "Technical layer": a viewer should learn one real mechanism and its proper name, not only what happened. The series playbook (`series.formatNotes`) says what that means here and how the episode links to others. For Claude Lab that means lesson rules: teach only this lesson, use the earlier lessons' terms, and close with a tease for the next one. Follow those rules exactly.

**Name the mechanism.** Include at least one concept from the research's "Technical layer" by its real name (the playbook gives examples for the series), explained in one plain line through the story, so viewers learn the term. A short worked calculation is good when the research has one: say the inputs, the result and what it means. Words like "say" or "roughly" mark any input from the Assumptions list, and the table lists A-numbers next to F-numbers. If the depth pushes the script past the word limit, cut a weaker beat first. If it still doesn't fit, say so under "Needs research" and flag that it needs a longer series target or a narrower topic instead of rushing the read. Only a person changes the target, on the Series page.

## 4. Remove AI tells

Run the narration through the **humanizer** skill (embedded mode: return only the final text). Two exceptions for spoken shorts:
- Short punchy fragments are fine in the hook and the payoff. That's spoken rhythm, not a tell.
- One deliberate contrast is allowed if it *is* the insight (e.g. "So it's not chaos. It's a system."). Anywhere else, rewrite it.

## 5. Write the script field

Use exactly this shape. Each scene line becomes one voiceover clip and one scene later, so keep one beat per line and give each a short lowercase id:

```markdown
**hook:** Amazon's warehouses are a mess. On purpose.
**stow:** It's called random stow. Items go into whatever bin has space.
**track:** …
**outro:** So it's not chaos. It's a system.

---

**Words:** 138 · **Est. length:** ~58s

| Scene | Facts used |
|---|---|
| hook | F1 |
| stow | F1, F2 |

**Say it right:** Kiva (KEE-vuh), DeepFleet. Leave this out if there's nothing tricky.

**Needs research:** anything the story wanted but the research didn't support. Leave this out if empty.

**Changes in this version:** (revisions only) one line per review note: the note, then what changed.
```

Before submitting, check yourself: every factual line has an F-number in the table, the word count is in range, the first line is the hook, and there are no em dashes in the narration.

## 5b. Carousel series: slide copy instead of a voiceover

When `series.format` is `carousel` (AI This Week), nobody speaks: people read slides while swiping. Write the copy for each slide in the fixed weekly template, still built only from the research facts:

```markdown
**cover:** 3 AI stories you missed
- kicker: AI this week · #4
- date: Week of 2 Nov 2026

**story1:** Claude gets a new memory feature
- kicker: Anthropic
- body: Projects now remember your files between chats. (≤ 22 words)
- why: You stop re-uploading the same docs every time. (≤ 12 words)
- stat: 2× (optional, a number from the research only)
- source: Anthropic blog, 30 Oct 2026

**story2:** …
**story3:** …

**takeaway:** The short version
- point: … (3 points, ≤ 8 words each)

**outro:** New stories every Friday
- cta: Follow @curiously
```

Rules: 3–4 stories (from `series.formatNotes`); headline ≤ 9 words; every story has a source with a date from this week; the cover is the hook (same job as a video's first line); plain words, no hype, no em dashes. Run the copy through the **humanizer** skill (headlines may stay punchy). Replace the header line with `**Slides:** 7 · **Words:** 118` and keep the facts table (one row per slide id). The script checklist items about voiceover length apply as: "~150 words or less" = total slide copy; "Ending loops or has a CTA" = the outro slide.

## 5c. Fact-check before you submit

Script and fact-check are one stage, so the person reviews a script that has already been checked.
1. Hand the finished draft to a fresh `general-purpose` subagent (model `sonnet`) with the **factcheck** skill's instructions, the draft, the research and the sources. It works independently: it opens every source itself and returns the report (the `factcheck` field) with a **Script fixes** section.
2. Apply every "Fix wording" item to the script exactly. Cut or rephrase every "Unsupported" claim. Keep the facts table in step.
3. If you changed any line, update the report's verdict to say the fixes are applied. Don't run a second full check; one pass is enough.
4. If a fix needs a fact the research doesn't have, leave the claim out and list it under "Needs research".

## 6. Checklist

`review.checklist` from step 1 lists this stage's checklist items (`item`, `text`, `done`, `humanOnly`). Go through every item and decide, honestly, against the work you're about to submit:

- **Confirmed:** `done: true`, with a short note on what confirms it ("138 words, ~58s").
- **Unsure or not met:** `done: false`, with a note telling the reviewer exactly where to look and what to decide ("Ending doesn't loop back to the hook; outro is a plain summary. Check the outro line."). This is how they know which section needs their eyes, so be specific: name the fact, scene, claim or source.
- **`humanOnly` items:** always `done: false`. You may add a note to help the person check it.

Never tick something you didn't check. A flagged item with a clear note is more useful than a tick the reviewer can't trust.

Write the result as JSON:

```json
[
  { "item": 0, "done": true, "note": "Hook is the first line: Amazon warehouses are a mess. On purpose." },
  { "item": 1, "done": false, "note": "162 words, slightly over target. Kiva scene is the longest; trim there if it feels slow." }
]
```

## 7. Send back (only when an earlier stage has to change)

Your own output is one thing; a problem that lives in an **earlier stage** is another. Don't work around it here. Propose a send-back when the story needs a fact the research doesn't have (the "Needs research" items: what to find and why). Typical target for this stage: `research`.

Write the proposal as JSON, with exact, minimal fixes the earlier stage's skill can apply without guessing:

```json
{ "stage": "research", "notes": "- **outro:** \"current line\" → \"replacement line\"\n- …" }
```

Submit it with `sendBack=@<path>/sendback.json`. If nothing needs to go back, submit `sendBack=none` (this also clears an old proposal from an earlier run). The tracker shows the proposal with a **Send fixes to …** button, and a person decides. Never send back over taste or style; only over something that's wrong.

## 8. Submit

Write the field to a file in your scratchpad, then:

```bash
node tracker/scripts/episode.mjs submit <CODE> script=@<path>/script.md factcheck=@<path>/factcheck.md checks=@<path>/checks.json sendBack=none
```

Checklist item "Every claim checked against its source" is yours to tick once the fact-check fixes are applied. "Second person read-through" is for a person (`humanOnly`).

## 9. Report back

- Checklist: what you ticked, and every item you flagged with its note, so the reviewer knows where to look first.
- The script itself (it's short; paste it in full).
- Word count and estimated length.
- Anything in "Needs research".
- For a revision, how each note was handled.
- The fact-check verdict and the fixes you applied.
- The link `/episodes/<id>`. Tell them to read the script and the fact-check, then approve it by moving to Make, or request changes.
