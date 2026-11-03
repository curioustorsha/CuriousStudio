// Shared helpers for the per-episode scripts: resolve an episode code to its folders.
import { existsSync, mkdirSync, readFileSync } from "fs";

export function episodeArg(usage) {
  const code = process.argv.slice(2).find((a) => /^[A-Za-z]+-\d+$/.test(a));
  if (!code) {
    console.error(`Usage: ${usage}`);
    process.exit(1);
  }
  return code.toUpperCase();
}

export function paths(code) {
  const slug = code.toLowerCase();
  const p = {
    code,
    slug,
    src: `src/episodes/${slug}`,
    script: `src/episodes/${slug}/script.json`,
    sfx: `src/episodes/${slug}/sfx.json`,
    manifest: `src/episodes/${slug}/manifest.json`,
    publicDir: `public/episodes/${slug}`,
    /** staticFile() paths, relative to public/ */
    voDir: `episodes/${slug}/vo`,
    music: `episodes/${slug}/music.mp3`,
    out: `out/${slug}`,
  };
  return p;
}

export function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function readJson(file, fallback) {
  if (!existsSync(file)) {
    if (fallback !== undefined) return fallback;
    console.error(`Missing ${file}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(file, "utf8"));
}

/** Same scene lengths as src/engine/timing.ts (0.3 s after the last word, 0.6 s on the last scene). */
export function sceneStarts(manifest, fps = 30) {
  let offset = 0;
  return manifest.scenes.map((s, i) => {
    const frames = Math.ceil((s.end + (i === manifest.scenes.length - 1 ? 0.6 : 0.3)) * fps);
    const r = { id: s.id, from: offset, frames };
    offset += frames;
    return r;
  });
}
