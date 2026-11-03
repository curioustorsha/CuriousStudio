// Generates narration (per scene, with word timings), sound effects and a music bed
// with ElevenLabs.
//   npm run audio                       episode 1 (Amazon): scripts/script.json → public/audio, src/manifest.json
//   npm run ep:audio -- HIS-003 --only=vo
//                                       an engine episode: src/episodes/his-003/script.json → public/episodes/his-003,
//                                       src/episodes/his-003/manifest.json. Sound effects always go to the shared
//                                       library public/audio/sfx (built-ins below + the episode's sfx.json).
// Flags: --only=vo,sfx,music  --scenes=hook,outro (redo only those lines)  --force (remake existing sfx)
// A scene may have "say": the text sent to the voice (e.g. a respelling for pronunciation) while "text" stays
// what the captions show. When both have the same number of words the captions keep "text"'s spelling.
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { Readable } from "stream";

const client = new ElevenLabsClient();
const epCode = process.argv.slice(2).find((a) => /^[A-Za-z]+-\d+$/.test(a))?.toUpperCase();
const slug = epCode?.toLowerCase();
const P = epCode
  ? {
      script: `src/episodes/${slug}/script.json`,
      manifest: `src/episodes/${slug}/manifest.json`,
      vo: `episodes/${slug}/vo`,
      music: `episodes/${slug}/music.mp3`,
      sfx: `src/episodes/${slug}/sfx.json`,
    }
  : { script: "scripts/script.json", manifest: "src/manifest.json", vo: "audio/vo", music: "audio/music.mp3", sfx: null };
for (const dir of [`public/${P.vo}`, "public/audio/sfx", `public/${P.music.split("/").slice(0, -1).join("/")}`]) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}
const script = JSON.parse(readFileSync(P.script, "utf8"));
const only = (process.argv.find((a) => a.startsWith("--only=")) ?? "--only=vo,sfx,music").slice(7).split(",");
const force = process.argv.includes("--force");

const toBuffer = async (stream) => {
  const chunks = [];
  for await (const c of Readable.fromWeb(stream)) chunks.push(c);
  return Buffer.concat(chunks);
};

// Group character-level alignment into words with start/end seconds.
const toWords = ({ characters, characterStartTimesSeconds: s, characterEndTimesSeconds: e }) => {
  const words = [];
  let cur = null;
  characters.forEach((ch, i) => {
    if (/\s/.test(ch)) { if (cur) words.push(cur); cur = null; return; }
    if (!cur) cur = { text: "", start: s[i], end: e[i] };
    cur.text += ch;
    cur.end = e[i];
  });
  if (cur) words.push(cur);
  return words;
};

const manifestPath = P.manifest;
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : { scenes: [], sfx: {} };

// --scenes=outro,hook regenerates only those narration lines and keeps the rest.
const pick = process.argv.find((a) => a.startsWith("--scenes="))?.slice(9).split(",");

if (only.includes("vo")) {
  const previous = new Map(manifest.scenes.map((s) => [s.id, s]));
  manifest.scenes = [];
  const { scenes, voiceId } = script;
  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];
    if (pick && !pick.includes(sc.id) && previous.has(sc.id)) {
      manifest.scenes.push(previous.get(sc.id));
      continue;
    }
    const spoken = (s) => s.say ?? s.text;
    const res = await client.textToSpeech.convertWithTimestamps(voiceId, {
      text: spoken(sc),
      modelId: "eleven_v4",
      outputFormat: "mp3_44100_128",
      voiceSettings: { stability: 0.45, similarityBoost: 0.8 },
      previousText: scenes.slice(0, i).map(spoken).join(" ") || undefined,
      nextText: scenes[i + 1] ? spoken(scenes[i + 1]) : undefined,
    });
    const file = `${P.vo}/${sc.id}.mp3`;
    writeFileSync(`public/${file}`, Buffer.from(res.audioBase64, "base64"));
    const words = toWords(res.alignment);
    if (sc.say) {
      const shown = sc.text.split(/\s+/).filter(Boolean);
      if (shown.length === words.length) shown.forEach((w, j) => (words[j].text = w));
      else console.warn(`  ${sc.id}: "say" has ${words.length} words, "text" has ${shown.length}; captions use the spoken spelling`);
    }
    manifest.scenes.push({ id: sc.id, file, text: sc.text, words, end: words.at(-1).end });
    console.log(`vo ${sc.id}: ${words.at(-1).end.toFixed(2)}s, ${words.length} words`);
  }
}

const SFX = {
  whoosh:  { text: "Fast clean cinematic whoosh transition, airy, modern tech video", duration: 1.0 },
  swoosh:  { text: "Short soft swoosh, UI slide-in, subtle and smooth", duration: 0.6 },
  pop:     { text: "Single soft bubbly pop, clean UI sound, no reverb", duration: 0.5 },
  thud:    { text: "Small cardboard box dropped into a plastic bin, short soft thud", duration: 0.6 },
  scan:    { text: "Retail barcode scanner beep, single clean beep", duration: 0.5 },
  data:    { text: "Futuristic digital data processing chirps, quick computer bleeps, sci-fi interface", duration: 1.5 },
  error:   { text: "Short UI error buzz, low double tone, clean", duration: 0.6 },
  ding:    { text: "Bright positive success chime, modern app notification", duration: 1.0 },
  robot:   { text: "Small warehouse robot driving on concrete, electric motor whir and servo, steady", duration: 3.0 },
  impact:  { text: "Deep cinematic bass impact hit with short tail, trailer style", duration: 1.5 },
  riser:   { text: "Tension riser building up, synth swell, ends abruptly", duration: 2.0 },
  ticker:  { text: "Fast digital counter ticking up rapidly, mechanical tally clicks", duration: 2.5 },
  ambience:{ text: "Large warehouse room tone, distant conveyor belts and soft machinery hum, no voices", duration: 10, loop: true },
};

// An episode adds its own effects in sfx.json: { "name": { "text": "…", "duration": 1.0, "loop": false } }.
if (P.sfx && existsSync(P.sfx)) Object.assign(SFX, JSON.parse(readFileSync(P.sfx, "utf8")));

if (only.includes("sfx")) {
  manifest.sfx ??= {};
  for (const [name, s] of Object.entries(SFX)) {
    const path = `public/audio/sfx/${name}.mp3`;
    if (existsSync(path) && !force) continue;
    const audio = await client.textToSoundEffects.convert({
      text: s.text, durationSeconds: s.duration, promptInfluence: 0.6, loop: s.loop ?? false,
      modelId: "eleven_text_to_sound_v2",
    });
    writeFileSync(path, await toBuffer(audio));
    manifest.sfx[name] = `audio/sfx/${name}.mp3`;
    console.log(`sfx ${name}`);
  }
}

if (only.includes("music")) {
  const total = Math.ceil((manifest.scenes.reduce((a, s) => a + s.end + 0.5, 0) + 3) * 1000);
  const audio = await client.music.compose({
    prompt:
      script.musicPrompt ??
      "Minimal modern tech documentary underscore for a short explainer video. Curious and confident. " +
        "Pulsing analog synth bass, clean plucked arpeggios, light glitchy percussion, soft pads. " +
        "Steady 110 BPM, builds gently, satisfying resolved ending. Instrumental, no vocals.",
    musicLengthMs: Math.min(Math.max(total, 10000), 120000),
    modelId: "music_v2_5",
    forceInstrumental: true,
  });
  writeFileSync(`public/${P.music}`, await toBuffer(audio));
  manifest.music = P.music;
  console.log(`music ${total}ms`);
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log("manifest written");
