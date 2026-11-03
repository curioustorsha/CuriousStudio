// Pulls frames out of a rendered episode for visual review: one JPG every N seconds plus a contact sheet.
//   npm run ep:frames -- HIS-003 [--every 2] [--file out/his-003/draft.mp4]
// Output: out/<slug>/frames/t000.0.jpg … and out/<slug>/frames/sheet.jpg (open them with your image reader)
import { execFileSync } from "child_process";
import { readdirSync, renameSync, rmSync } from "fs";
import ffmpeg from "ffmpeg-static";
import { ensureDir, episodeArg, paths } from "./_episode.mjs";

const p = paths(episodeArg("ep:frames -- <CODE> [--every 2] [--file path]"));
const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const every = Number(arg("every") ?? 2);
const file = arg("file") ?? `${p.out}/final.mp4`;
const dir = `${p.out}/frames`;
rmSync(dir, { recursive: true, force: true });
ensureDir(dir);

execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-i", file, "-vf", `fps=1/${every},scale=540:-1`, "-q:v", "3", `${dir}/f%03d.jpg`]);
const frames = readdirSync(dir).filter((f) => /^f\d+\.jpg$/.test(f)).sort();
frames.forEach((f, i) => renameSync(`${dir}/${f}`, `${dir}/t${(i * every).toFixed(1).padStart(5, "0")}.jpg`));
const cols = 6;
const rows = Math.ceil(frames.length / cols);
execFileSync(ffmpeg, [
  "-hide_banner", "-loglevel", "error", "-i", file,
  "-vf", `fps=1/${every},scale=240:-1,drawtext=text='%{pts\\:hms}':x=8:y=8:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6,tile=${cols}x${rows}:padding=6:color=0x222222`,
  "-frames:v", "1", "-q:v", "3", `${dir}/sheet.jpg`,
]);
console.log(`${frames.length} frames every ${every}s in ${dir}/ (t<seconds>.jpg) and ${dir}/sheet.jpg`);
