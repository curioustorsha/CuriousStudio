import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  random,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, F, FPS } from "./theme";
import { scene, SceneId, sfxFile } from "./timing";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 0→1 spring that starts at `at` (scene-local frame).
export const useIn = (at: number, cfg: { damping?: number; stiffness?: number; mass?: number } = {}) => {
  const frame = useCurrentFrame();
  return spring({ frame: frame - at, fps: FPS, config: { damping: 18, stiffness: 140, mass: 0.9, ...cfg } });
};

export const ease = (frame: number, from: number, to: number, a = 0, b = 1) =>
  interpolate(frame, [from, to], [a, b], { ...clamp, easing: Easing.bezier(0.22, 1, 0.36, 1) });

export const Sfx: React.FC<{ name: string; at: number; volume?: number; dur?: number }> = ({
  name,
  at,
  volume = 0.5,
  dur = 120,
}) => (
  <Sequence from={Math.max(0, at)} durationInFrames={dur} layout="none" name={`sfx:${name}`}>
    <Audio src={staticFile(sfxFile(name))} volume={volume} />
  </Sequence>
);

// Fades/slides/blur-reveals its children at a given frame.
export const Reveal: React.FC<{
  at: number;
  out?: number;
  y?: number;
  blur?: number;
  scaleFrom?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ at, out, y = 40, blur = 12, scaleFrom = 1, style, children }) => {
  const frame = useCurrentFrame();
  const p = useIn(at);
  const o = out === undefined ? 1 : 1 - ease(frame, out, out + 8);
  return (
    <div
      style={{
        opacity: Math.min(p, 1) * o,
        transform: `translateY(${(1 - p) * y}px) scale(${scaleFrom + (1 - scaleFrom) * p})`,
        filter: `blur(${(1 - Math.min(p, 1)) * blur}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Kicker: React.FC<{ text: string; color?: string }> = ({ text, color = C.accent }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 14,
      padding: "12px 24px",
      borderRadius: 999,
      background: "rgba(255,255,255,0.05)",
      border: `1px solid ${C.stroke}`,
      fontFamily: F.mono,
      fontWeight: 700,
      fontSize: 26,
      letterSpacing: 3,
      color: C.text,
    }}
  >
    <span style={{ width: 12, height: 12, borderRadius: 6, background: color, boxShadow: `0 0 16px ${color}` }} />
    {text}
  </div>
);

export const Title: React.FC<{ children: React.ReactNode; size?: number; color?: string }> = ({
  children,
  size = 84,
  color = C.text,
}) => (
  <div
    style={{
      fontFamily: F.sans,
      fontWeight: 900,
      fontSize: size,
      lineHeight: 1.02,
      letterSpacing: -size * 0.035,
      color,
      textAlign: "center",
    }}
  >
    {children}
  </div>
);

// Header block, centered at the top of the frame.
export const Header: React.FC<{ children: React.ReactNode; top?: number }> = ({ children, top = 170 }) => (
  <div
    style={{
      position: "absolute",
      top,
      left: 0,
      right: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 26,
    }}
  >
    {children}
  </div>
);

// A shelf bin: dark panel with an amber label strip.
export const Bin: React.FC<{
  w: number;
  h: number;
  code?: string;
  glow?: number;
  glowColor?: string;
  dashed?: boolean;
  dim?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ w, h, code, glow = 0, glowColor = C.accent, dashed, dim = 0, children, style }) => (
  <div
    style={{
      position: "relative",
      width: w,
      height: h,
      borderRadius: 18,
      background: dashed ? "rgba(255,255,255,0.015)" : `linear-gradient(180deg, ${C.panel2}, ${C.panel})`,
      border: dashed ? `2px dashed rgba(255,255,255,0.18)` : `1px solid ${C.stroke}`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 ${glow * 4}px ${glowColor}, 0 0 ${glow * 50}px ${glowColor}`,
      overflow: "visible",
      opacity: 1 - dim,
      ...style,
    }}
  >
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
      {children}
    </div>
    {code && (
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: 10,
          fontFamily: F.mono,
          fontSize: 15,
          fontWeight: 700,
          color: "rgba(255,181,71,0.7)",
          letterSpacing: 1,
        }}
      >
        {code}
      </div>
    )}
  </div>
);

export const Source: React.FC<{ text: string; at?: number }> = ({ text, at = 10 }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        top: 1262,
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily: F.mono,
        fontSize: 22,
        color: C.muted,
        letterSpacing: 1,
        opacity: ease(frame, at, at + 15) * 0.8,
      }}
    >
      SOURCE · {text}
    </div>
  );
};

// Scene wrapper: blur-in on enter, quick fade on exit. The first and last scenes skip
// one side so the video loops seamlessly (last frame flows into the first).
export const SceneShell: React.FC<{ children: React.ReactNode; enter?: boolean; exit?: boolean }> = ({
  children,
  enter: hasEnter = true,
  exit: hasExit = true,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const enter = hasEnter ? ease(frame, 0, 10) : 1;
  const exit = hasExit ? ease(frame, durationInFrames - 7, durationInFrames) : 0;
  return (
    <AbsoluteFill
      style={{
        opacity: enter * (1 - exit),
        transform: `scale(${1.035 - 0.035 * enter - 0.02 * exit})`,
        filter: `blur(${(1 - enter) * 14 + exit * 10}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// Word-synced captions: up to 3 words per page, active word in accent.
type Page = { words: { text: string; start: number; end: number }[]; start: number; end: number };
const pagesFor = (id: SceneId): Page[] => {
  const pages: Page[] = [];
  let cur: Page | null = null;
  for (const w of scene(id).words) {
    if (!cur) cur = { words: [], start: w.start, end: w.end };
    cur.words.push(w);
    cur.end = w.end;
    if (cur.words.length >= 3 || /[.,?!…]$/.test(w.text)) {
      pages.push(cur);
      cur = null;
    }
  }
  if (cur) pages.push(cur);
  return pages;
};

export const Captions: React.FC<{ id: SceneId }> = ({ id }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const pages = React.useMemo(() => pagesFor(id), [id]);
  const idx = pages.findIndex((p, i) => t >= p.start - 0.05 && t < (pages[i + 1]?.start ?? p.end + 0.5) - 0.05);
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
        const active = t >= w.start - 0.03 && (i === page.words.length - 1 || t < page.words[i + 1].start - 0.03);
        const spoken = t >= w.start - 0.03;
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

// Static-ish film grain + vignette + soft grid for the whole video.
export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2) % 8;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(1100px 900px at 50% 38%, rgba(255,181,71,0.10), transparent 60%), radial-gradient(900px 700px at 15% 90%, rgba(79,209,255,0.07), transparent 60%)",
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          backgroundPosition: `0 ${(frame * 0.4) % 60}px`,
          maskImage: "radial-gradient(ellipse at 50% 45%, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 45%, black 30%, transparent 75%)",
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.65) 100%)" }} />
      <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.07, mixBlendMode: "overlay" }}>
        <filter id={`g${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#g${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

export const rnd = (k: string | number) => random(`curiously-${k}`);
