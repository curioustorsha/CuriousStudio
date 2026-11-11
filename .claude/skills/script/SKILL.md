---
name: script
description: The Research & Script stage of a Curiously episode - find a few solid facts from good sources, write a plain-words voiceover script (or carousel slide copy) on them, fact-check it claim by claim in a fresh subagent, apply the fixes, and submit research notes, script, fact-check and references to the tracker for one review. Use when asked to research or script an episode, usually from the tracker's Run button, including a new version after "request changes" notes.
---

# Research & Script stage

One run turns an approved idea into a checked script: research just enough to answer the idea's question, write the script from those facts, fact-check it, submit. A person reviews it all on one page (research notes, script, fact-check, references) and either moves the episode to Make or requests changes, which brings you back here for the next version.

**Who it's for.** Normal people, not engineers. A viewer with no tech background should follow every line and come away knowing what happens behind the scenes, plus **one real idea** by its proper name, explained so simply they could repeat it to a friend. Short and correct beats deep and rushed.

## 1. Load the episode

```bash
node tracker/scripts/episode.mjs get <CODE>
```

Run from the Curiously project root. If the tracker isn't reachable, tell the user and stop. Read:
- **Idea:** `title`, `hook`, `summary`, `audience`, `keyPoints`, `visualIdeas`. The target length is `series.targetSeconds`.
- **Series playbook:** `series.formatNotes`: structure, hook rule, tone, company and freshness rules. Follow it. `series.format` is `video` (a spoken script) or `carousel` (slide copy, section 5b).
- **Revision context:** `review.openFeedback` entries with `stage: "script"`, and the current `research`, `script`, `factcheck`, `sources` (the previous version).
- **Direction for v1:** open notes with `stage: "script"` and no `version` were written before the first version: they're the team's brief. If one says "Build the script around these research facts", those facts are the backbone: give each real time, and say in "Changes in this version" how each was used.

**Check the stage.** If `stage` is not `script`, stop and say which stage it's in. Only a person moves stages.

**First version or revision?** No open feedback and no script: write v1 from scratch. Open feedback: treat each note as a required change, keep what wasn't criticised (including research that still holds; only research again what the notes need), and answer every note in "Changes in this version".

## 2. Research (just enough)

Find what you need to answer the idea's question correctly, and stop. Aim for **6–10 facts from 3–5 good sources**, including the source behind the episode's one big idea (see below). Don't survey the industry or collect extra detail the script won't use: every fact you gather should earn a line in the script.

Use WebSearch and WebFetch; send independent searches in parallel.

**Source order, best first:** (1) primary: the company's engineering blog, official announcements, docs, papers, talks by the people who built it; (2) reputable reporting (Reuters, AP, Bloomberg, The Verge, TechCrunch, Ars Technica, major Indian outlets for Indian topics); (3) everything else only to find leads. Never cite content farms, SEO listicles or AI summaries.

**Rules:**
- Every number, date, name and version needs a source you actually opened. Note the exact figure or quote and its date.
- If the company never published a number, it's "reported" and the script says "reportedly".
- If the headline company hasn't said how a step works, a peer that has is fine (Zepto for Blinkit, Lyft for Uber), but say whose fact it is.
- Never invent or round into a fact. If you can't verify it, leave it out.
- **Look for a real-world moment** that shows the mechanism at work: an experiment, a stunt, an outage, an incident (e.g. the artist who pulled 99 phones through Berlin in a handcart and turned a street red on Google Maps). It usually makes the best scene after the intro and the episode's number moment.
- Name organisations exactly as the source does (DeepMind is Alphabet's AI lab, which partnered with Google; it is not "Google's lab").
- If the idea's premise or hook turns out wrong ("1 lakh tickets a minute" when the real peak is ~28,000), fix it here: note it under "Corrections to the idea" and write the script on the corrected version. Don't send it back; if the idea can't stand at all, say so in a `done: false` checklist note.

Write `research` as Markdown in this shape (short; it's for the reviewer to scan):

```markdown
## The question
The one question this episode answers, as a viewer would ask it.

## The answer in one line
What a viewer should walk away knowing, in everyday words.

## The big idea
The one real technical term this episode teaches (e.g. graph neural network, caching, a queue), the everyday picture that explains it (dots and lines, a counter with a line of people), and the facts it rests on (F5, F6).

## Key facts
- **F1.** Claim in plain words. "Exact quote or figure." ([Publisher, 12 Mar 2025](https://…)) · Primary
- **F2.** … · Reported (company hasn't confirmed)

## Corrections to the idea
(Only if needed.) What the idea says → what's actually true (F2).

## Don't say
(Only if needed.) Tempting claims that aren't supported.
```

Write `sources` (shown as References) as a Markdown list, one line per source actually used: `- [Title](url): publisher, date`.

## 3. Write it for the ear

Spoken by an ElevenLabs voice (Monika Sogam: young, Indian, natural and conversational) over animated visuals.

- **Hook in the first line.** It has to stop the scroll in 2 seconds. Follow the playbook's hook rule (How It Scales always opens with a question the viewer has already half-wondered: "How does Google Maps know there's a traffic jam before you reach it?"). No "Have you ever wondered".
- **Answer the hook.** The script exists to answer that one question. Cut anything that doesn't serve the answer, however interesting.
- **Plain words first.** Explain what happens behind the scenes the way you'd tell a friend, with everyday comparisons.
- **Then one big idea.** Teach exactly one real technical term from "The big idea": name it once, and explain it straight away with its everyday picture ("Think of every stretch of road as a dot…"). The visuals will draw that picture. No other jargon: anything else gets described, not named.
- **One number moment.** At most one simple number moment: a striking sourced figure, or a comparison a viewer can do in their head. No multi-step maths.
- **Length** (intro and sign-off included): about `series.targetSeconds × 2.3` words (≈140 for 60s), never over `series.targetSeconds × 2.5`, and never more than 2 minutes. If it doesn't fit, narrow the answer instead of rushing the read.
- **Short spoken sentences.** One idea each. Contractions are fine. Write numbers the way they should be said: "seven hundred seventy-five million dollars"; years as digits.
- **Series intro (every video):** the second scene is always `**intro:** Welcome to <series.name>, by Curiously.` Nothing else on that line, no facts.
- **Ending:** the last content scene answers the hook in one line (a callback to the opening moment is good).
- **Sign-off (every video):** the final scene is always exactly `**cta:** If you like this kind of content, like, share and follow Curiously.` It's the same for every episode and never mentions the topic.
- **Don't overclaim the cause.** If a source lists several inputs (phones, driver reports, government data), don't let a line imply one is the only one: "the phones stuck in it help tell Google", not "the phones tell Google".
- **Tone:** curious, calm, confident.
- Avoid words that TTS often mispronounces, or flag them (see the output format).

**Facts:** every factual line comes from a fact in your research (track the F-numbers). Keep numbers exactly: "nearly half" for 47% is fine; "half" for 41% is not. Say "reportedly" for Reported facts, and name whose fact it is when it's a peer company's ("Zepto says a packer needs about fifty seconds"); the visuals show each company's logo when it's named. Nothing from "Don't say". If the script needs a fact you don't have, research it and add it to the notes; never slip in an unsourced line.

**Series links:** the playbook says how episodes connect (Claude Lab is a course: teach only this lesson, use earlier lessons' terms, end with a tease for the next). Follow it exactly.

## 4. Remove AI tells

Run the narration through the **humanizer** skill (embedded mode: return only the final text). Two exceptions for spoken shorts:
- Short punchy fragments are fine in the hook and the payoff. That's spoken rhythm, not a tell.
- One deliberate contrast is allowed if it *is* the insight (e.g. "So it's not chaos. It's a system."). Anywhere else, rewrite it.

## 5. Write the script field

Use exactly this shape. Each scene line becomes one voiceover clip and one scene later, so keep one beat per line and give each a short lowercase id:

```markdown
**hook:** How does Google Maps know there's a traffic jam ahead, before you even get there?
**intro:** Welcome to How It Scales, by Curiously.
**cart:** In 2020, an artist in Berlin pulled ninety-nine phones down a street in a handcart. Google Maps turned that street from green to red.
**phones:** That's the trick. Google pools anonymous location data from phones that have location turned on. Lots of phones crawling along one road looks like a jam.
**future:** But a jam right now isn't enough. You need the road twenty minutes from now, when you actually get there.
**memory:** So Google also uses past traffic patterns for roads, and mixes them with what's happening live.
**graph:** The clever part came from DeepMind, Alphabet's AI lab. It's called a graph neural network. Picture every stretch of road as a dot, and connected stretches as lines joining the dots.
**spill:** Each dot passes messages to its neighbours. So the model can learn how a jam on one road spreads to the roads around it.
**outro:** So Google doesn't see the jam. The phones stuck in it help tell Google. Even if they're in a handcart.
**cta:** If you like this kind of content, like, share and follow Curiously.

---

**Words:** 195 · **Est. length:** ~84s

| Scene | Facts used |
|---|---|
| hook | F1 |
| intro | (series intro) |
| cart | F7, F8 |
| phones | F1, F9 |
| … | … |
| cta | (sign-off) |

**Say it right:** DeepMind (DEEP-mind). Leave this out if there's nothing tricky.

(This is the approved reference for the style: a question hook, a real-world moment, plain words, one big idea with its picture, one number moment, an ending that answers the hook.)

**Changes in this version:** (revisions only) one line per review note: the note, then what changed.
```

Before submitting, check yourself: every factual line has an F-number in the table, the word count is in range, the first line is the hook, the second is the series intro, the last is the sign-off, a non-technical viewer could follow every line, and there are no em dashes in the narration.

## 5b. Carousel series: slide copy instead of a voiceover

When `series.format` is `carousel` (AI This Week), nobody speaks: people read slides while swiping. Write the copy for each slide in the fixed weekly template, still built only from your research facts:

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

**outro:** Like, share and follow
- cta: Follow Curiously for more
```

Rules: 3–4 stories (from `series.formatNotes`); headline ≤ 9 words; every story has a source with a date from this week; the cover is the hook (same job as a video's first line); plain words, no hype, no em dashes. Run the copy through the **humanizer** skill (headlines may stay punchy). Replace the header line with `**Slides:** 7 · **Words:** 118` and keep the facts table (one row per slide id). The script checklist items about voiceover length apply as: "~150 words or less" = total slide copy; the last slide is always the like, share and follow slide above (same every week, never about the stories).

## 5c. Fact-check before you submit

Research, script and fact-check are one stage, so the person reviews a script that has already been checked.
1. Hand the finished draft to a fresh `general-purpose` subagent (model `sonnet`) with the **factcheck** skill's instructions, the draft, your research notes and the sources. It works independently: it opens every source itself and returns the report (the `factcheck` field) with a **Script fixes** section.
2. Apply every "Fix wording" item to the script exactly. Cut or rephrase every "Unsupported" claim. Keep the facts table in step.
   If it marks a claim Unsupported but a source you opened quotes it word for word (its fetch tool can return a shortened digest that misses sentences), keep the claim, add the quote to the research notes, and say in the report which finding you overruled and why.
3. If you changed any line, update the report's verdict to say the fixes are applied. Don't run a second full check; one pass is enough.
4. If a fix needs a fact you don't have, research it (add it to the notes and references) or cut the claim.

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

## 7. Submit

Write the four fields to files in your scratchpad, then (`sendBack=none` also clears an old proposal; there is no earlier AI stage to send back to):

```bash
node tracker/scripts/episode.mjs submit <CODE> research=@<path>/research.md script=@<path>/script.md factcheck=@<path>/factcheck.md sources=@<path>/sources.md checks=@<path>/checks.json sendBack=none
```

Checklist item "Every claim checked against its source" is yours to tick once the fact-check fixes are applied. "Second person read-through" is for a person (`humanOnly`).

## 8. Report back

- Checklist: what you ticked, and every item you flagged with its note, so the reviewer knows where to look first.
- The script itself (it's short; paste it in full).
- Word count and estimated length.
- The question, the one-line answer, and how many facts (Primary vs Reported) from how many sources.
- For a revision, how each note was handled.
- The fact-check verdict and the fixes you applied.
- The link `/episodes/<id>`. Tell them to read the research, script and fact-check, then approve it by moving to Make, or request changes.
