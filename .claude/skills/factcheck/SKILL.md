---
name: factcheck
description: Independently fact-check a Curiously script claim by claim against the original sources. Run by the script skill inside the Script stage, in a fresh subagent, before the script is submitted.
---

# Fact-check (part of Script)

Check every claim in the script as it will be **spoken**, against the original sources. Don't trust the research notes' summary of a source: open the source itself. The script skill applies your fixes before it submits; a person then reads the script and your report together and signs off.

## 1. Load the episode

```bash
node tracker/scripts/episode.mjs get <CODE>
```

Run from the Curiously project root. Read `script`, `research`, `sources`, `title`, `series.formatNotes`, any `review.openFeedback` with `stage: "script"`, and the current `factcheck` (previous version). The script to check is the draft the script skill gives you.

**Where this runs.** Inside the **script** skill, in the Script stage (`stage` is `script`), after the script is written and before it's submitted. Check the draft the script skill hands you, not the version in the tracker. Re-check everything from scratch on every run; don't reuse old verdicts.

## 2. Stay independent

If this conversation researched or wrote the script, don't verify it yourself. Hand the checking (steps 3 and 4) to a fresh `general-purpose` subagent. Give it only the script, the sources list and these instructions, so it doesn't inherit the writer's assumptions. Then write up its findings.

## 3. List every claim

Go through the narration line by line and extract every checkable statement:
- numbers, amounts, percentages, dates, durations
- names of people, companies, products, and their versions
- superlatives and firsts ("biggest", "first", "only")
- cause and effect ("so the system grabs the closest copy")
- implied claims: what a viewer would reasonably take away even if it isn't literally said

## 4. Verify each claim

For each one, open the source with WebFetch, preferring the primary source, and decide:

- **Verified:** the source says this, and the spoken wording is fair, rounding included.
- **Fix wording:** basically right, but the wording overstates, rounds unfairly, drops "reportedly", or is ambiguous. Give the exact replacement line.
- **Unsupported:** no source you opened supports it, or the sources contradict it. Say whether to cut it or what source would be needed.
- **Recheck before posting:** true today but likely to change (prices, versions, "latest", rankings, live numbers).

**Attribution:** when an episode uses several companies, check that each fact is said as that company's, and that a peer's number (e.g. Zepto's) is never heard as the headline company's (e.g. Blinkit's). Wrong attribution is "Fix wording".

**Maths:** redo every calculation in the script. Check that each input traces to a fact or to a labelled assumption in the research, and that assumptions are voiced as estimates ("say", "roughly"). A result presented as a hard fact when it rests on an assumption is "Fix wording".

Also check that dates are still current, that the narration's ids and names match the sources' spellings, and that nothing from the research's "Don't say" list slipped in. If a source link is dead or paywalled, find another source or mark the claim Unsupported.

## 5. Write the report

Write `factcheck` as Markdown in this shape:

```markdown
**Verdict:** Ready / Needs script changes · 12 claims: 10 verified, 1 fix wording, 1 unsupported

| # | Claim (as spoken) | Source | What the source says | Verdict | Fix |
|---|---|---|---|---|---|
| 1 | "In 2012, Amazon bought Kiva Systems for $775M" | [TechCrunch, 19 Mar 2012](https://…) | "Amazon acquires Kiva Systems for $775M in cash" | Verified | |
| 2 | … | … | … | Fix wording | Say "about 10%" |

## Script fixes
Each Fix wording / Unsupported item as: scene id: current line → replacement line (or "cut").

## Recheck before posting
Time-sensitive claims to re-verify on posting day.

## Pronunciation notes
Names and terms the voiceover might get wrong, with how to say them.

## Changes in this version
(Revisions only. One line per review note.)
```

Don't edit the script yourself. When changes are needed, propose a send-back to Script with exactly these fixes (see "Send back" below). The reviewer accepts it with one click.

## 6. Hand back to script

You're running inside the **script** skill (Script stage), which submits everything in one go. Don't call `episode.mjs submit` and don't tick the checklist yourself. Give script back:
- the report (the `factcheck` field), with the **Script fixes** section the script skill must apply before it submits
- the verdict line, and for the checklist: whether every claim was checked against its source, with notes on anything a person should look at
- any problem that belongs to an earlier stage, written as exact, minimal fixes ("scene id: current line → replacement line"), so script can propose the send-back. Never over taste or style; only over something that's wrong.
