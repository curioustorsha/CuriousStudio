// Renders an engine episode, masters loudness (-14 LUFS / -1.5 dBTP) and renders the cover still.
//   npm run ep:render -- HIS-003           → out/his-003/final.mp4 + cover.png
//   npm run ep:render -- HIS-003 --draft   → out/his-003/draft.mp4 (half size, fast, not mastered)
import { execFileSync } from "child_process";
import { ensureDir, episodeArg, paths } from "./_episode.mjs";

const p = paths(episodeArg("ep:render -- <CODE> [--draft]"));
const draft = process.argv.includes("--draft");
const remotion = "node_modules/.bin/remotion";
ensureDir(p.out);
const run = (cmd, args) => execFileSync(cmd, args, { stdio: "inherit" });

if (draft) {
  run(remotion, ["render", p.code, `${p.out}/draft.mp4`, "--codec=h264", "--crf=28", "--scale=0.5"]);
  console.log(`\n${p.out}/draft.mp4`);
} else {
  run(remotion, ["render", p.code, `${p.out}/raw.mp4`, "--codec=h264", "--crf=16", "--audio-bitrate=320k"]);
  run("node", ["scripts/master.mjs", `${p.out}/raw.mp4`, `${p.out}/final.mp4`]);
  run(remotion, ["still", `${p.code}-cover`, `${p.out}/cover.png`]);
  console.log(`\n${p.out}/final.mp4\n${p.out}/cover.png`);
}
