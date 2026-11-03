import manifest from "./manifest.json";
import { FPS } from "./theme";

export type Word = { text: string; start: number; end: number };
export type SceneId = "hook" | "stow" | "track" | "spread" | "benefits" | "kiva" | "million" | "outro";

// Silence after each scene's last word before the next scene starts.
// Extra breath after the last line, before the logo end card.
const TAIL: Record<string, number> = { outro: 0.6 };
const PAD = 0.3;

export const scene = (id: SceneId) => manifest.scenes.find((s) => s.id === id)!;

export const sceneFrames = (id: SceneId) => Math.ceil((scene(id).end + (TAIL[id] ?? PAD)) * FPS);

export const ORDER: SceneId[] = ["hook", "stow", "track", "spread", "benefits", "kiva", "million", "outro"];

export const totalFrames = () => ORDER.reduce((a, id) => a + sceneFrames(id), 0);

const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, "");

// Frame (scene-local) where a spoken word starts. Matches by prefix, nth occurrence.
export const wf = (id: SceneId, word: string, nth = 0, edge: "start" | "end" = "start") => {
  const hits = scene(id).words.filter((w) => norm(w.text).startsWith(norm(word)));
  if (!hits[nth]) throw new Error(`word "${word}" (#${nth}) not found in scene ${id}`);
  return Math.round(hits[nth][edge] * FPS);
};

export const sfxFile = (name: string) => (manifest.sfx as Record<string, string>)[name];
export const musicFile = () => (manifest as any).music as string;

// Global frame ranges where the narrator is speaking (used to duck the music).
export const speechRanges = () => {
  const ranges: [number, number][] = [];
  let offset = 0;
  for (const id of ORDER) {
    for (const w of scene(id).words) ranges.push([offset + w.start * FPS, offset + w.end * FPS]);
    offset += sceneFrames(id);
  }
  return ranges;
};
