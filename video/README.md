# Curiously video pipeline (Remotion + ElevenLabs)

First episode: "Why Amazon warehouses look like chaos on purpose" → `out/amazon-chaos.mp4`

## Steps
1. Edit the narration and voice in `scripts/script.json` (one entry per scene; sources are listed there too).
2. `npm run audio`: makes the ElevenLabs narration (with word timings), sound effects and music → `public/audio`, `src/manifest.json`.
   - `npm run audio -- --only=vo` regenerates only the narration; add `--scenes=outro` to redo one line. Sound effects are skipped if they already exist (`--force` remakes them).
3. `npm run studio`: preview and tweak in the browser.
4. `npm run render`: renders `out/raw.mp4`, masters loudness to -14 LUFS / -1.5 dBTP → `out/amazon-chaos.mp4`, and writes the thumbnail `out/cover.png`.

Scene visuals are in `src/scenes/*.tsx`. Animations are cued off spoken words via `wf(scene, "word")`, so they stay in sync when the narration changes.
The API key is read from `../.env.local` (ELEVENLABS_API_KEY). Never commit it.

Note: keep `"type": "module"` OUT of package.json. With it, Remotion's renderer hangs on "Waiting for root component to load".

Product art uses Phosphor icons (MIT, `src/products.tsx`). No emoji in videos (user preference).

Brand (wordmark, asterisk, C mark) lives in `src/brand.tsx`; the animated logo end card is `src/scenes/LogoSting.tsx`.
Music ducks automatically under the narration (Root.tsx).

## Episodes from the tracker (engine)

New episodes are built by the tracker's stage skills, one folder per episode, sharing episode 1's look through `src/engine/` (backdrop, word-synced captions, music ducking, watermark, progress bar, logo end card).

```
src/episodes/<code>/        script.json (narration), sfx.json (new effects), manifest.json (word timings),
                            index.tsx (registers scenes), scenes/*.tsx, Cover.tsx
public/episodes/<code>/     vo/*.mp3, music.mp3
out/<code>/                 final.mp4, cover.png, vo-preview.mp3, stills/, frames/sheet.jpg, measure.json, stt-*.json
```

| Command (`npm run …` here, or `npm --prefix video run …` from the project root) | Does |
|---|---|
| `ep:new -- HIS-003 --title "…" --tag "HOW IT SCALES"` | scaffold + register in `src/episodes/index.ts` (never overwrites) |
| `ep:audio -- HIS-003 --only=vo [--scenes=a,b]` / `--only=sfx` / `--only=music` | ElevenLabs narration / effects (shared library `public/audio/sfx`) / music |
| `ep:stt -- HIS-003 [--final]` | Scribe listen-back vs the script, per clip or the finished video |
| `ep:preview -- HIS-003` | all narration joined → `out/<code>/vo-preview.mp3` |
| `ep:still -- HIS-003 --scenes \| --scene id --at N \| --frame N \| --cover` | PNG frames to check while building; `--cover` re-renders just the cover |
| `ep:render -- HIS-003 [--draft]` | render + master to -14 LUFS + cover (draft: half size, fast) |
| `ep:measure -- HIS-003` | resolution, fps, length, loudness, true peak |
| `ep:frames -- HIS-003 [--every 2]` | frames + a timestamped contact sheet for visual review |

A scene uses `const wf = useWord(); wf("hook", "purpose")` for the frame of a spoken word, and `<Sfx name="pop" at={…} />` for library sounds. A script scene may carry `"say"` (what the voice reads, e.g. a respelling) next to `"text"` (what the captions show).
