import { FPS } from "../theme";

export type Word = { text: string; start: number; end: number };
export type ManifestScene = { id: string; file: string; text: string; words: Word[]; end: number };
/** Written by `npm run ep:audio -- <CODE>` into src/episodes/<slug>/manifest.json. */
export type Manifest = { scenes: ManifestScene[]; music?: string };

const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Timing helpers for one episode, built from its manifest (narration clips with word timings).
 * Scene order is the manifest's order. `tail` gives a scene extra silence after its last word
 * (default 0.3 s); the last scene gets 0.6 s before the logo.
 */
export const makeTiming = (manifest: Manifest, tail: Record<string, number> = {}) => {
  const ORDER = manifest.scenes.map((s) => s.id);
  const last = ORDER.at(-1);
  const scene = (id: string) => {
    const s = manifest.scenes.find((x) => x.id === id);
    if (!s) throw new Error(`scene "${id}" is not in the manifest (has: ${ORDER.join(", ")})`);
    return s;
  };
  const sceneFrames = (id: string) => Math.ceil((scene(id).end + (tail[id] ?? (id === last ? 0.6 : 0.3))) * FPS);
  const totalFrames = () => ORDER.reduce((a, id) => a + sceneFrames(id), 0);

  /** Scene-local frame where a spoken word starts (or ends). Matches by prefix; nth occurrence. */
  const wf = (id: string, word: string, nth = 0, edge: "start" | "end" = "start") => {
    const hits = scene(id).words.filter((w) => norm(w.text).startsWith(norm(word)));
    if (!hits[nth]) throw new Error(`word "${word}" (#${nth}) not found in scene ${id}`);
    return Math.round(hits[nth][edge] * FPS);
  };

  /** Global frame ranges where the narrator is speaking (used to duck the music). */
  const speechRanges = () => {
    const ranges: [number, number][] = [];
    let offset = 0;
    for (const id of ORDER) {
      for (const w of scene(id).words) ranges.push([offset + w.start * FPS, offset + w.end * FPS]);
      offset += sceneFrames(id);
    }
    return ranges;
  };

  return { ORDER, scene, sceneFrames, totalFrames, wf, speechRanges, music: manifest.music };
};

export type Timing = ReturnType<typeof makeTiming>;
