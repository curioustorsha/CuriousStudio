---
name: voiceover
description: Generate a Curiously episode's narration with ElevenLabs (Monika Sogam voice, one clip per scene with word timings) and check every line by listening back with Scribe speech-to-text. A step of the make skill for video series, after the storyboard is approved.
---

# Voiceover (part of Make)

Turn the approved script into narration: one clip per scene, word-level timings for captions and animation cues, every line listened back. Uses the ElevenLabs text-to-speech and speech-to-text skills (**elevenlabs-text-to-speech**, **elevenlabs-speech-to-text**) through the video project's scripts.

## 1. Load the episode

```bash
node tracker/scripts/episode.mjs get <CODE>
```

Run from the Curiously project root. Read `script` (scene lines `**id:** text`, the "Say it right" notes), `title`, `series.name`, `sources`, `factcheck` (its "Pronunciation notes"), `storyboard` (the Music section, for later).

**Where this runs.** Inside the **make** skill, after the storyboard is approved (`stage` is `make`, video series only). If the script changed since the last voiceover, regenerate every line that changed.

**Revision:** open notes (stage `make`) that name lines ("hook sounds rushed", "Kiva is wrong") mean: regenerate only those scenes. Answer each note in "Changes in this version".

## 2. Set up the episode folder

```bash
npm --prefix video run ep:new -- <CODE> --title "<title>" --tag "<SERIES NAME IN CAPITALS>"
```

Safe to re-run; it never overwrites. It creates `video/src/episodes/<code-lowercase>/`.

Write `video/src/episodes/<slug>/script.json`:

```json
{
  "title": "…",
  "voiceId": "EaBs7G1VibMrNAuz2Na7",
  "voiceName": "Monika Sogam - Natural Conversations",
  "scenes": [
    { "id": "hook", "text": "Amazon's warehouses are a mess. On purpose." },
    { "id": "kiva", "text": "In 2012, Amazon bought Kiva Systems…", "say": "In 2012, Amazon bought Keeva Systems…" }
  ],
  "keyterms": ["Kiva", "DeepFleet"],
  "sources": ["…one line per source from the fact-check…"]
}
```

- Scene ids and text come from the script exactly, in order. `text` is what the captions show.
- `say` (optional) is what the voice reads, for pronunciation. Keep the **same number of words** as `text` so captions keep the right spelling ("Kiva" → "Keeva"). Write big numbers as words in `say` if the voice stumbles on digits.
- `keyterms`: names and jargon, to help the listen-back.

## 3. Generate

```bash
npm --prefix video run ep:audio -- <CODE> --only=vo                    # every line
npm --prefix video run ep:audio -- <CODE> --only=vo --scenes=hook,kiva # only these lines
```

Model `eleven_v4`, stability 0.45, similarity 0.8, with neighbouring lines as context so the delivery flows. The account is on a 40k-credit monthly plan (about 1 credit per character), so regenerate only what needs it.

## 4. Listen back

```bash
npm --prefix video run ep:stt -- <CODE>
```

It transcribes every clip with Scribe and lists the differences from the text. Judge each one: "2012" heard as "twenty twelve" is fine; "store" for "stow", a dropped word, or a wrong name is not. For a real problem, add or adjust `say` for that scene and regenerate only it. Run at most two rounds; report whatever is left.

Also check the length: the manifest (`video/src/episodes/<slug>/manifest.json`) has each line's `end` in seconds. The total should land near `targetSeconds` (minus ~3 s for the logo).

## 5. Preview

```bash
npm --prefix video run ep:preview -- <CODE>
```

This writes `video/out/<slug>/vo-preview.mp3`, all lines joined, which plays in the tracker.

## 6. Notes for the reviewer

Write `voiceoverNotes` as Markdown:

```markdown
**Length:** 54.2 s narration (+ ~3 s logo) · target 60 s

| Scene | Seconds | Listen-back | Notes |
|---|---|---|---|
| hook | 3.8 | clean | |
| kiva | 6.1 | fixed | "Kiva" was "Kyva"; respelled as Keeva |

**Pronunciation fixes:** what was respelled and why.
**Still worth a listen:** anything you couldn't fully confirm.
**Changes in this version:** (revisions only)
```

## 7. Hand back to make

You're running inside the **make** skill (Make stage), which submits everything in one go. Don't call `episode.mjs submit` and don't tick the checklist yourself. Give make back:
- `voiceoverUrl=/media/out/<slug>/vo-preview.mp3` and the notes (the `voiceoverNotes` field)
- for the checklist: the listen-back result, and any line a person should hear first
- any problem that belongs to an earlier stage, written as exact, minimal fixes ("scene id: current line → replacement line"), so make can propose the send-back. Never over taste or style; only over something that's wrong.
