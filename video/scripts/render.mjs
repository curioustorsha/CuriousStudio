// Renders an engine episode, masters loudness (-14 LUFS / -1.5 dBTP) and renders the cover still.
//   npm run ep:render -- HIS-003           → out/his-003/final.mp4 + cover.png, re-rendering only what changed
//   npm run ep:render -- HIS-003 --full    → same, but every frame in one pass, ignoring saved scenes
//   npm run ep:render -- HIS-003 --draft   → out/his-003/draft.mp4 (half size, fast, not mastered)
//
// The normal render keeps each scene's picture in out/<slug>/chunks/, named by a hash of everything that can change
// how it looks: the scene's file and what it imports, its words and position in the video, and all shared code and
// images. A scene whose hash is unchanged is reused. Sound is always rendered fresh for the whole video, so music
// ducking and sound effects can't drift when a scene changes.
import { execFileSync, spawnSync } from "child_process";
import { createHash } from "crypto";
import ffmpeg from "ffmpeg-static";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { dirname, join, relative, resolve } from "path";
import { ensureDir, episodeArg, paths, readJson, sceneStarts } from "./_episode.mjs";

const p = paths(episodeArg("ep:render -- <CODE> [--full | --draft]"));
const draft = process.argv.includes("--draft");
const full = process.argv.includes("--full");
const remotion = "node_modules/.bin/remotion";
ensureDir(p.out);
const run = (cmd, args) => execFileSync(cmd, args, { stdio: "inherit" });
const quiet = (args) => run(remotion, [...args, "--log=error"]);

/** Bump when the chunk settings below change, so old chunks aren't reused. */
const VIDEO_FLAGS = ["--codec=h264", "--crf=16", "--muted"];
const AUDIO_EXT = /\.(mp3|wav|m4a|aac|ogg|flac)$/i;

const sha = (...parts) => {
  const h = createHash("sha256");
  for (const part of parts) h.update(part).update("\0");
  return h.digest("hex");
};

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => !e.name.startsWith("."))
    .flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]))
    .sort();
}

const hashFiles = (files) => sha(...files.flatMap((f) => [f, readFileSync(f)]));

/** Everything every frame can depend on: shared code, this episode's index, images, and the render settings. */
function sharedHash() {
  const code = walk("src").filter((f) => !f.startsWith("src/episodes/"));
  const images = walk("public")
    .filter((f) => !AUDIO_EXT.test(f))
    .map((f) => `${f}:${statSync(f).size}:${statSync(f).mtimeMs}`);
  return sha(
    hashFiles([...code, "src/episodes/index.ts", `${p.src}/index.tsx`, "remotion.config.ts", "package-lock.json"]),
    ...images,
    ...VIDEO_FLAGS,
  );
}

/** A file plus every file it imports from the episode's own folder (world.tsx, or another scene the outro borrows from). */
function importClosure(file, seen = new Set()) {
  if (seen.has(file)) return seen;
  seen.add(file);
  for (const [, spec] of readFileSync(file, "utf8").matchAll(/from\s+["'](\.{1,2}\/[^"']+)["']/g)) {
    const base = resolve(dirname(file), spec);
    const hit = [base, `${base}.tsx`, `${base}.ts`, `${base}/index.tsx`, `${base}/index.ts`].find((c) => existsSync(c) && statSync(c).isFile());
    if (hit && relative(resolve(p.src), hit).split("/")[0] !== "..") importClosure(hit, seen);
  }
  return seen;
}

/** Scene id → its file, read from index.tsx. Null if it can't be worked out, and then any file in the episode invalidates it. */
function sceneFile(id, index) {
  const component = index.match(new RegExp(`^\\s*${id}:\\s*(\\w+),?`, "m"))?.[1];
  const from = component && index.match(new RegExp(`import\\s*\\{[^}]*\\b${component}\\b[^}]*\\}\\s*from\\s*["'](\\./[^"']+)["']`))?.[1];
  if (!from) return null;
  const file = resolve(p.src, `${from}.tsx`);
  return existsSync(file) ? file : null;
}

/** The video's segments in order (scenes, then the logo sting), each with the hash that decides if it can be reused. */
function planSegments() {
  const manifest = readJson(p.manifest);
  const index = readFileSync(`${p.src}/index.tsx`, "utf8");
  if (/^\s*tail\s*:/m.test(index)) return null; // Custom scene lengths aren't in the manifest, so the frame ranges would be wrong.
  const logoFrames = Number(readFileSync("src/scenes/LogoSting.tsx", "utf8").match(/LOGO_FRAMES\s*=\s*(\d+)/)?.[1]);
  if (!logoFrames) return null;
  const scenes = sceneStarts(manifest);
  const total = scenes.reduce((a, s) => a + s.frames, 0) + logoFrames;
  const shared = sharedHash();
  const allFiles = walk(p.src).map((f) => resolve(f));
  const segments = scenes.map((s, i) => {
    const file = sceneFile(s.id, index);
    const own = file ? [...importClosure(file)].sort() : allFiles;
    const place = JSON.stringify({ i, from: s.from, frames: s.frames, total, words: manifest.scenes[i].words, text: manifest.scenes[i].text });
    return { id: s.id, from: s.from, frames: s.frames, hash: sha(shared, place, hashFiles(own)).slice(0, 16) };
  });
  const logoFrom = total - logoFrames;
  segments.push({ id: "logo", from: logoFrom, frames: logoFrames, hash: sha(shared, JSON.stringify({ from: logoFrom, total })).slice(0, 16) });
  return { segments, total };
}

function fullRender() {
  run(remotion, ["render", p.code, `${p.out}/raw.mp4`, "--codec=h264", "--crf=16", "--audio-bitrate=320k"]);
}

function framesIn(file) {
  // ffmpeg reports its frame count on stderr.
  const { stderr } = spawnSync(ffmpeg, ["-hide_banner", "-i", file, "-map", "0:v:0", "-c", "copy", "-f", "null", "-"], { encoding: "utf8" });
  return Number([...stderr.matchAll(/frame=\s*(\d+)/g)].at(-1)?.[1] ?? -1);
}

/** Renders the changed scenes and joins them with the saved ones. Returns false if the video should be rendered in one pass instead. */
function incrementalRender() {
  const plan = planSegments();
  if (!plan) return false;
  const { segments, total } = plan;
  const chunks = `${p.out}/chunks`;
  mkdirSync(chunks, { recursive: true });
  const fileOf = (s) => `${chunks}/${s.id}-${s.hash}.mp4`;
  const todo = segments.filter((s) => !existsSync(fileOf(s)));

  const started = Date.now();
  const bundleDir = mkdtempSync(join(tmpdir(), "curiously-bundle-"));
  try {
    quiet(["bundle", "--out-dir", bundleDir]);
    for (const s of todo) {
      console.log(`rendering ${s.id} (frames ${s.from}–${s.from + s.frames - 1})`);
      const tmp = `${chunks}/.tmp-${s.id}.mp4`;
      quiet(["render", bundleDir, p.code, tmp, ...VIDEO_FLAGS, `--frames=${s.from}-${s.from + s.frames - 1}`]);
      renameSync(tmp, fileOf(s)); // Only a finished chunk gets its final name, so a stopped render can't be reused by mistake.
    }
    console.log("rendering sound");
    quiet(["render", bundleDir, p.code, `${chunks}/audio.wav`, "--codec=wav"]);
  } finally {
    rmSync(bundleDir, { recursive: true, force: true });
  }

  const list = `${chunks}/list.txt`;
  writeFileSync(list, segments.map((s) => `file '${resolve(fileOf(s))}'`).join("\n"));
  run(ffmpeg, [
    "-hide_banner", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-i", `${chunks}/audio.wav`,
    "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "320k", "-movflags", "+faststart", `${p.out}/raw.mp4`,
  ]);
  const frames = framesIn(`${p.out}/raw.mp4`);
  if (frames !== total) {
    console.warn(`joined video has ${frames} frames, expected ${total}: rendering it in one pass instead`);
    return false;
  }

  const keep = new Set([...segments.map((s) => `${s.id}-${s.hash}.mp4`), "audio.wav", "list.txt"]);
  for (const name of readdirSync(chunks)) if (!keep.has(name)) rmSync(join(chunks, name), { force: true });
  const seconds = Math.round((Date.now() - started) / 1000);
  const reused = segments.length - todo.length;
  console.log(`re-rendered ${todo.length ? todo.map((s) => s.id).join(", ") : "nothing"}; reused ${reused} of ${segments.length} segments (${seconds}s)`);
  return true;
}

if (draft) {
  run(remotion, ["render", p.code, `${p.out}/draft.mp4`, "--codec=h264", "--crf=28", "--scale=0.5"]);
  console.log(`\n${p.out}/draft.mp4`);
} else {
  if (full || !incrementalRender()) fullRender();
  run("node", ["scripts/master.mjs", `${p.out}/raw.mp4`, `${p.out}/final.mp4`]);
  run(remotion, ["still", `${p.code}-cover`, `${p.out}/cover.png`]);
  console.log(`\n${p.out}/final.mp4\n${p.out}/cover.png`);
}
