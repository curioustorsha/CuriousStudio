// Joins an episode's narration clips (in scene order, 0.3 s apart) into one MP3 for review in the tracker.
// Usage: npm run ep:preview -- HIS-003     → out/his-003/vo-preview.mp3
import { execFileSync } from "child_process";
import ffmpeg from "ffmpeg-static";
import { ensureDir, episodeArg, paths, readJson } from "./_episode.mjs";

const p = paths(episodeArg("ep:preview -- <CODE>"));
const manifest = readJson(p.manifest);
if (!manifest.scenes.length) {
  console.error(`No narration yet in ${p.manifest}. Run npm run ep:audio -- ${p.code} --only=vo first.`);
  process.exit(1);
}
ensureDir(p.out);
const inputs = manifest.scenes.flatMap((s) => ["-i", `public/${s.file}`]);
const pads = manifest.scenes.map((_, i) => `[${i}:a]aresample=44100,apad=pad_dur=0.3[a${i}]`).join(";");
const joined = manifest.scenes.map((_, i) => `[a${i}]`).join("");
const out = `${p.out}/vo-preview.mp3`;
execFileSync(ffmpeg, [
  "-hide_banner", "-y", "-loglevel", "error", ...inputs,
  "-filter_complex", `${pads};${joined}concat=n=${manifest.scenes.length}:v=0:a=1[out]`,
  "-map", "[out]", "-c:a", "libmp3lame", "-b:a", "192k", out,
]);
const total = manifest.scenes.reduce((a, s) => a + s.end + 0.3, 0);
console.log(`${out} (${manifest.scenes.length} lines, ~${total.toFixed(1)}s)`);
