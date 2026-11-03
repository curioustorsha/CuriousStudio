// Listens back with ElevenLabs Scribe and compares what was heard with what should have been said.
//   npm run ep:stt -- HIS-003            each narration clip vs its scene text   → out/his-003/stt-vo.json
//   npm run ep:stt -- HIS-003 --final    the finished video vs the whole script  → out/his-003/stt-final.json
// Optional "keyterms": ["Kiva", "DeepFleet"] in script.json helps Scribe with names.
// Differences are candidates, not verdicts: "2012" heard as "twenty twelve" is fine; "store" for "stow" is not.
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { createReadStream, writeFileSync } from "fs";
import { ensureDir, episodeArg, paths, readJson } from "./_episode.mjs";

const p = paths(episodeArg("ep:stt -- <CODE> [--final]"));
const final = process.argv.includes("--final");
const script = readJson(p.script);
const manifest = readJson(p.manifest);
const client = new ElevenLabsClient();
const norm = (t) => t.toLowerCase().replace(/[^a-z0-9' ]/g, " ").split(/\s+/).filter(Boolean);

// Word-level diff (LCS): which expected words were missed or replaced, and what was heard instead.
function diff(expected, heard) {
  const a = norm(expected), b = norm(heard);
  const L = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--)
    L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const issues = [];
  let i = 0, j = 0, miss = [], extra = [];
  const flush = () => {
    if (miss.length || extra.length) issues.push({ expected: miss.join(" ") || "(nothing)", heard: extra.join(" ") || "(nothing)" });
    miss = []; extra = [];
  };
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { flush(); i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) miss.push(a[i++]);
    else extra.push(b[j++]);
  }
  miss.push(...a.slice(i)); extra.push(...b.slice(j)); flush();
  return { match: a.length ? (L[0][0] / a.length) : 1, issues };
}

async function transcribe(file) {
  const res = await client.speechToText.convert({
    file: createReadStream(file),
    modelId: "scribe_v2",
    languageCode: "eng",
    ...(script.keyterms?.length ? { keyterms: script.keyterms } : {}),
  });
  return res.text ?? "";
}

ensureDir(p.out);
const report = [];
if (final) {
  const expected = script.scenes.map((s) => s.text).join(" ");
  const heard = await transcribe(`${p.out}/final.mp4`);
  report.push({ id: "final", expected, heard, ...diff(expected, heard) });
} else {
  for (const s of manifest.scenes) {
    const heard = await transcribe(`public/${s.file}`);
    report.push({ id: s.id, expected: s.text, heard, ...diff(s.text, heard) });
  }
}
const out = `${p.out}/${final ? "stt-final" : "stt-vo"}.json`;
writeFileSync(out, JSON.stringify(report, null, 2));
for (const r of report) {
  const flag = r.issues.length ? `  ${r.issues.length} difference(s)` : "  clean";
  console.log(`${r.id}: ${(r.match * 100).toFixed(0)}% match${flag}`);
  for (const d of r.issues) console.log(`    expected "${d.expected}" → heard "${d.heard}"`);
}
console.log(`\n${out}`);
