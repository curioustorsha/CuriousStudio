// Technical check of a rendered episode: resolution, frame rate, duration, loudness, true peak.
//   npm run ep:measure -- HIS-003 [--file out/his-003/final.mp4]   → prints JSON and writes out/<slug>/measure.json
import { spawnSync } from "child_process";
import { existsSync, writeFileSync } from "fs";
import ffmpeg from "ffmpeg-static";
import { episodeArg, paths } from "./_episode.mjs";

const p = paths(episodeArg("ep:measure -- <CODE> [--file path]"));
const i = process.argv.indexOf("--file");
const file = i > -1 ? process.argv[i + 1] : `${p.out}/final.mp4`;
if (!existsSync(file)) {
  console.error(`No render at ${file}. Run npm run ep:render -- ${p.code} first.`);
  process.exit(1);
}
const probe = spawnSync(ffmpeg, ["-hide_banner", "-i", file], { encoding: "utf8" }).stderr;
const loud = spawnSync(ffmpeg, ["-hide_banner", "-i", file, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], { encoding: "utf8" }).stderr;
const ln = JSON.parse(loud.slice(loud.lastIndexOf("{")));
const dur = probe.match(/Duration: (\d+):(\d+):([\d.]+)/);
const video = probe.match(/Video: .*?, (\d{2,5})x(\d{2,5}).*?, ([\d.]+) fps/);
const result = {
  file,
  width: video ? Number(video[1]) : null,
  height: video ? Number(video[2]) : null,
  fps: video ? Number(video[3]) : null,
  seconds: dur ? Number(dur[1]) * 3600 + Number(dur[2]) * 60 + Number(dur[3]) : null,
  hasAudio: /Audio: /.test(probe),
  lufs: Number(ln.input_i),
  truePeakDb: Number(ln.input_tp),
  lra: Number(ln.input_lra),
  checks: {},
};
result.checks = {
  "1080x1920": result.width === 1080 && result.height === 1920,
  "30 fps": result.fps === 30,
  "15-90 s": result.seconds >= 15 && result.seconds <= 90,
  "-14 LUFS ±1": Math.abs(result.lufs + 14) <= 1,
  "true peak ≤ -1 dBTP": result.truePeakDb <= -1,
};
writeFileSync(`${p.out}/measure.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
