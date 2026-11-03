import React, { createContext, useContext } from "react";
import { Audio, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F, FPS } from "../theme";
import type { Timing } from "./timing";

// Everything in ../lib.tsx except Sfx and Captions is episode-independent: reuse it from there.
export { Backdrop, Bin, clamp, ease, Header, Kicker, Reveal, rnd, SceneShell, Source, Title, useIn } from "../lib";
// Isometric 2D blocks, grids and routes for How It Scales (see iso.tsx).
export { isoAlong, IsoBox, isoFaceMatrix, IsoGrid, IsoLabel, IsoPacket, IsoPath, isoPoint, IsoPoly, IsoPulse, IsoRoof, isoShade, IsoStage, IsoTile, useIsoStage } from "./iso";
export type { IsoStageValue } from "./iso";

export const TimingContext = createContext<Timing | null>(null);

export const useTiming = () => {
  const t = useContext(TimingContext);
  if (!t) throw new Error("useTiming() must be used inside an episode composition");
  return t;
};

/**
 * A sound effect from the shared library in public/audio/sfx/<name>.mp3, starting at a scene-local frame.
 * List them with `ls public/audio/sfx`; add new ones to the episode's sfx.json and run `npm run ep:audio`.
 */
export const Sfx: React.FC<{ name: string; at: number; volume?: number; dur?: number }> = ({ name, at, volume = 0.5, dur = 120 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={dur} layout="none" name={`sfx:${name}`}>
    <Audio src={staticFile(`audio/sfx/${name}.mp3`)} volume={volume} />
  </Sequence>
);

type Page = { words: { text: string; start: number; end: number }[]; start: number; end: number };

/** Word-synced captions for one scene: up to 3 words per page, active word in accent. Same look as episode 1. */
export const Captions: React.FC<{ id: string }> = ({ id }) => {
  const t = useTiming();
  const frame = useCurrentFrame();
  const sec = frame / FPS;
  const pages = React.useMemo(() => {
    const out: Page[] = [];
    let cur: Page | null = null;
    for (const w of t.scene(id).words) {
      if (!cur) cur = { words: [], start: w.start, end: w.end };
      cur.words.push(w);
      cur.end = w.end;
      if (cur.words.length >= 3 || /[.,?!…]$/.test(w.text)) {
        out.push(cur);
        cur = null;
      }
    }
    if (cur) out.push(cur);
    return out;
  }, [t, id]);
  const idx = pages.findIndex((p, i) => sec >= p.start - 0.05 && sec < (pages[i + 1]?.start ?? p.end + 0.5) - 0.05);
  if (idx < 0) return null;
  const page = pages[idx];
  const local = frame - Math.round((page.start - 0.05) * FPS);
  const p = spring({ frame: local, fps: FPS, config: { damping: 16, stiffness: 220 } });
  return (
    <div
      style={{
        position: "absolute",
        top: 1340,
        left: 120,
        right: 120,
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "0 22px",
        transform: `translateY(${(1 - p) * 18}px) scale(${0.94 + 0.06 * p})`,
        opacity: Math.min(1, p * 1.4),
      }}
    >
      {page.words.map((w, i) => {
        const active = sec >= w.start - 0.03 && (i === page.words.length - 1 || sec < page.words[i + 1].start - 0.03);
        const spoken = sec >= w.start - 0.03;
        return (
          <span
            key={i}
            style={{
              fontFamily: F.sans,
              fontWeight: 900,
              fontSize: 76,
              letterSpacing: -2,
              color: active ? C.accent : spoken ? C.text : "rgba(245,245,247,0.55)",
              textShadow: "0 6px 30px rgba(0,0,0,0.85), 0 2px 4px rgba(0,0,0,0.9)",
              transform: `scale(${active ? 1.06 : 1})`,
              display: "inline-block",
            }}
          >
            {w.text.replace(/\.\.\.$/, "")}
          </span>
        );
      })}
    </div>
  );
};

/** Scene-local frame of a spoken word, for cueing animation and sound to the narration. */
export const useWord = () => {
  const t = useTiming();
  return t.wf;
};

/** Scene length in frames (inside a scene, same as useVideoConfig().durationInFrames). */
export const useSceneFrames = () => useVideoConfig().durationInFrames;
