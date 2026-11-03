// Loudness-normalises a rendered video to -14 LUFS / -1.5 dBTP (YouTube, Instagram, TikTok targets).
// Two-pass ffmpeg loudnorm; the video stream is copied untouched.
// Usage: node scripts/master.mjs out/raw.mp4 out/final.mp4
import { execFileSync, spawnSync } from "child_process";
import ffmpeg from "ffmpeg-static";

const [input, output] = process.argv.slice(2);
const TARGET = "I=-14:TP=-1.5:LRA=11";

const pass1 = spawnSync(ffmpeg, ["-hide_banner", "-i", input, "-af", `loudnorm=${TARGET}:print_format=json`, "-f", "null", "-"], { encoding: "utf8" });
const m = JSON.parse(pass1.stderr.slice(pass1.stderr.lastIndexOf("{")));
console.log(`measured: ${m.input_i} LUFS, peak ${m.input_tp} dBTP`);

execFileSync(ffmpeg, [
  "-hide_banner", "-y", "-loglevel", "error", "-i", input,
  "-af", `loudnorm=${TARGET}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo`,
  "-c:v", "copy", "-c:a", "aac", "-b:a", "320k", "-movflags", "+faststart", output,
]);

const check = spawnSync(ffmpeg, ["-hide_banner", "-i", output, "-af", `loudnorm=${TARGET}:print_format=json`, "-f", "null", "-"], { encoding: "utf8" });
const c = JSON.parse(check.stderr.slice(check.stderr.lastIndexOf("{")));
console.log(`mastered: ${c.input_i} LUFS, peak ${c.input_tp} dBTP → ${output}`);
