// Renders a carousel episode (AI This Week) from src/carousels/<slug>/slides.json:
//   every slide at 4:5 (Instagram) and 9:16 (TikTok photo mode), then the slideshow Short for YouTube.
//
//   npm run ep:carousel -- AIW-001              → out/aiw-001/slides/4x5/01.png …, slides/9x16/01.png …, final.mp4
//   npm run ep:carousel -- AIW-001 --only 3     → just slide 3, both sizes (to check a fix)
//   npm run ep:carousel -- AIW-001 --no-short   → slides only
//
// slides.json: { "series": "AI THIS WEEK", "music": "music.mp3", "secondsPerSlide": 3, "slides": [ … ] }
// Slide shapes are in src/carousel/Slides.tsx (cover, story, takeaway, outro). `music` is a path under public/.
// Prints the /media/… paths of the 4:5 slides, one per line, ready for the episode's `slides` field.
import { copyFileSync, existsSync, writeFileSync } from "fs";
import { execFileSync } from "child_process";
import { ensureDir, episodeArg, paths, readJson } from "./_episode.mjs";

const p = paths(episodeArg("ep:carousel -- <CODE> [--only N] [--no-short]"));
const file = `src/carousels/${p.slug}/slides.json`;
const deck = readJson(file);
if (!Array.isArray(deck.slides) || !deck.slides.length) throw new Error(`${file} has no slides`);
const series = deck.series ?? "AI THIS WEEK";
const onlyArg = process.argv.indexOf("--only");
const only = onlyArg > -1 ? Number(process.argv[onlyArg + 1]) : null;
const remotion = "node_modules/.bin/remotion";
const run = (args) => execFileSync(remotion, [...args, "--log=error"], { stdio: "inherit" });

const dir = `${p.out}/slides`;
for (const size of ["4x5", "9x16"]) ensureDir(`${dir}/${size}`);

const total = deck.slides.length;
deck.slides.forEach((slide, i) => {
  if (only && only !== i + 1) return;
  const nn = String(i + 1).padStart(2, "0");
  const props = `${dir}/props-${nn}.json`;
  writeFileSync(props, JSON.stringify({ slide, index: i, total, series }));
  for (const size of ["4x5", "9x16"]) run(["still", `Slide-${size}`, `${dir}/${size}/${nn}.png`, `--props=${props}`]);
  console.log(`slide ${nn}/${total} done`);
});

if (!only && !process.argv.includes("--no-short")) {
  const music = deck.music && existsSync(`public/${deck.music}`) ? deck.music : undefined;
  if (deck.music && !music) console.warn(`music public/${deck.music} not found: rendering the Short without music`);
  const props = `${dir}/props-show.json`;
  writeFileSync(props, JSON.stringify({ slides: deck.slides, series, music, secondsPerSlide: deck.secondsPerSlide ?? 3 }));
  run(["render", "Slideshow", `${p.out}/raw.mp4`, `--props=${props}`, "--codec=h264", "--crf=16", "--audio-bitrate=320k"]);
  if (music) execFileSync("node", ["scripts/master.mjs", `${p.out}/raw.mp4`, `${p.out}/final.mp4`], { stdio: "inherit" });
  else copyFileSync(`${p.out}/raw.mp4`, `${p.out}/final.mp4`);
  console.log(`\nShort: /media/out/${p.slug}/final.mp4`);
}

console.log("\nSlides (4:5), for the episode's slides field:");
deck.slides.forEach((_, i) => console.log(`/media/out/${p.slug}/slides/4x5/${String(i + 1).padStart(2, "0")}.png`));
console.log(`9:16 versions: /media/out/${p.slug}/slides/9x16/`);
