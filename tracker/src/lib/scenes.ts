import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PROJECT_DIR } from "@/lib/skills";

export type SceneSpan = { id: string; from: number; to: number; text: string };

const FPS = 30;
const LOGO_SECONDS = 96 / FPS;

/**
 * Where each scene of a rendered episode falls, in seconds, from its voiceover manifest. Scene lengths match the video
 * engine (0.3 s after the last word, 0.6 s on the last scene), followed by the logo sting.
 * Empty when the episode has no manifest yet, or the tracker is running somewhere without the video project.
 */
export function episodeScenes(code: string): SceneSpan[] {
  let manifest: { scenes: { id: string; text: string; end: number }[] };
  try {
    manifest = JSON.parse(readFileSync(join(PROJECT_DIR, "video", "src", "episodes", code.toLowerCase(), "manifest.json"), "utf8"));
  } catch {
    return [];
  }
  const spans: SceneSpan[] = [];
  let frame = 0;
  manifest.scenes.forEach((s, i) => {
    const frames = Math.ceil((s.end + (i === manifest.scenes.length - 1 ? 0.6 : 0.3)) * FPS);
    spans.push({ id: s.id, from: frame / FPS, to: (frame + frames) / FPS, text: s.text });
    frame += frames;
  });
  if (spans.length) spans.push({ id: "logo", from: frame / FPS, to: frame / FPS + LOGO_SECONDS, text: "" });
  return spans;
}

export function sceneAt(spans: SceneSpan[], seconds: number) {
  return spans.find((s) => seconds < s.to) ?? spans.at(-1) ?? null;
}
