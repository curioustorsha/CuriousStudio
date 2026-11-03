// Renders single frames of an episode as PNGs, to look at a scene while building it.
//   npm run ep:still -- HIS-003 --frame 120          one frame of the whole video
//   npm run ep:still -- HIS-003 --scene hook --at 45 frame 45 of scene "hook"
//   npm run ep:still -- HIS-003 --scenes             the middle and end-hold of every scene
//   npm run ep:still -- HIS-003 --cover              re-render only the cover → out/<slug>/cover.png
// Output: out/<slug>/stills/*.png (open them with your image reader)
import { execFileSync } from "child_process";
import { ensureDir, episodeArg, paths, readJson, sceneStarts } from "./_episode.mjs";

const p = paths(episodeArg("ep:still -- <CODE> (--frame N | --scene ID [--at N] | --scenes | --cover)"));
const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};
if (process.argv.includes("--cover")) {
  ensureDir(p.out);
  execFileSync("node_modules/.bin/remotion", ["still", `${p.code}-cover`, `${p.out}/cover.png`, "--log=error"], { stdio: "inherit" });
  console.log(`${p.out}/cover.png`);
  process.exit(0);
}
const dir = `${p.out}/stills`;
ensureDir(dir);
const starts = sceneStarts(readJson(p.manifest));
const shots = [];
if (arg("frame")) shots.push({ name: `f${arg("frame")}`, frame: Number(arg("frame")) });
else if (arg("scene")) {
  const s = starts.find((x) => x.id === arg("scene"));
  if (!s) throw new Error(`No scene "${arg("scene")}" (has: ${starts.map((x) => x.id).join(", ")})`);
  const at = Number(arg("at") ?? Math.floor(s.frames / 2));
  shots.push({ name: `${s.id}-${at}`, frame: s.from + Math.min(at, s.frames - 1) });
} else if (process.argv.includes("--scenes")) {
  for (const s of starts) {
    shots.push({ name: `${s.id}-mid`, frame: s.from + Math.floor(s.frames / 2) });
    shots.push({ name: `${s.id}-end`, frame: s.from + s.frames - 4 });
  }
}
if (!shots.length) throw new Error("Pass --frame, --scene or --scenes");
for (const s of shots) {
  execFileSync("node_modules/.bin/remotion", ["still", p.code, `${dir}/${s.name}.png`, `--frame=${s.frame}`, "--log=error"], { stdio: "inherit" });
  console.log(`${dir}/${s.name}.png`);
}
