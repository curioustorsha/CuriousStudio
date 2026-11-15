import React from "react";
import { C, F } from "../theme";
import { CLAUDE_REST, COL, ez, lerp, lerpP, sp, WS, type P2 } from "./world";

/**
 * Word cards: one word each. Cream = already written, amber = the word Claude is adding right now
 * (amber is the one accent and only ever means that), ghost = an empty slot, outline = a word we don't show,
 * pinned = a word planned ahead (amber outline + pin). In Lesson 2 the same cards crack into token tiles.
 */
export type CardState = "cream" | "amber" | "ghost" | "outline" | "pinned" | "grey";

export const cardW = (text: string, size = 36) => Math.round(size * 0.75 + text.length * size * 0.6);
export const cardH = (size = 36) => Math.round(size * 2.3);

/** Left x of each card in a row starting at x0. */
export const rowXs = (words: string[], x0: number, gap = 12, size = 36) => {
  const xs: number[] = [];
  let x = x0;
  for (const w of words) {
    xs.push(x);
    x += cardW(w, size) + gap;
  }
  return xs;
};

// The running example: "Why is the sky blue?" → Blue · light · scatters · most
export const ANSWER = ["Blue", "light", "scatters", "most"];
export const ANSWER_X = rowXs(ANSWER, 330);

export const WordCard: React.FC<{
  text: string;
  /** left x, bottom y (world) */
  x: number;
  y?: number;
  state?: CardState;
  size?: number;
  w?: number;
  opacity?: number;
  rot?: number;
  scale?: number;
  /** 0→1 hairline crack drawn down through the card */
  crack?: number;
  shake?: number;
  /** a 0→1 likelihood bar inside the card (candidate cards) */
  bar?: number;
  hideText?: boolean;
  /** draw the pin on top (any state) */
  pin?: boolean;
}> = ({ text, x, y = WS.benchTop + 2, state = "cream", size = 36, w, opacity = 1, rot = 0, scale = 1, crack = 0, shake = 0, bar, hideText, pin }) => {
  const width = w ?? cardW(text, size);
  const h = cardH(size) + (bar !== undefined ? 18 : 0);
  const bg =
    state === "amber" ? C.accent : state === "cream" || state === "pinned" ? COL.cream : state === "grey" ? "#7C7F86" : state === "outline" ? "#1D1F25" : "#16181E";
  const border =
    state === "pinned"
      ? `5px solid ${C.accent}`
      : state === "ghost"
        ? "3px dashed rgba(255,255,255,0.25)"
        : state === "outline"
          ? "3px solid rgba(243,235,221,0.35)"
          : "none";
  const color = state === "amber" ? "#1A1408" : state === "grey" ? "#3A3C40" : COL.ink;
  return (
    <div
      style={{
        position: "absolute",
        left: x + shake,
        top: y - h,
        width,
        height: h,
        opacity,
        transform: `rotate(${rot}deg) scale(${scale})`,
        transformOrigin: "50% 100%",
        borderRadius: 12,
        background: bg,
        border,
        boxSizing: "border-box",
        boxShadow: state === "ghost" || state === "outline" ? "none" : "0 8px 0 rgba(0,0,0,0.28)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        fontFamily: F.sans,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: -0.5,
        color,
      }}
    >
      {!hideText && state !== "ghost" && state !== "outline" && <span style={{ lineHeight: 1 }}>{text}</span>}
      {bar !== undefined && (
        <div style={{ width: width - 30, height: 10, borderRadius: 5, background: "rgba(42,38,32,0.15)" }}>
          <div style={{ width: `${bar * 100}%`, height: "100%", borderRadius: 5, background: state === "amber" ? "#1A1408" : COL.ink, opacity: 0.75 }} />
        </div>
      )}
      {(state === "pinned" || pin) && (
        <svg width={40} height={46} style={{ position: "absolute", top: -34, left: width / 2 - 20, overflow: "visible" }}>
          <line x1={20} y1={18} x2={20} y2={44} stroke="#C9CDD4" strokeWidth={4} strokeLinecap="round" />
          <circle cx={20} cy={16} r={14} fill={C.accent} />
          <circle cx={15} cy={11} r={4} fill="rgba(255,255,255,0.6)" />
        </svg>
      )}
      {crack > 0 && (
        <svg width={width} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <polyline
            points={`${width * 0.46},-2 ${width * 0.56},${h * 0.22} ${width * 0.42},${h * 0.45} ${width * 0.58},${h * 0.7} ${width * 0.48},${h + 2}`}
            fill="none"
            stroke="#1A1408"
            strokeWidth={4}
            strokeLinejoin="miter"
            pathLength={1}
            strokeDasharray={`${crack} 1`}
          />
        </svg>
      )}
    </div>
  );
};

/** Your question, as a dark ticket at the left end of the bench. */
export const QuestionCard: React.FC<{ x?: number; opacity?: number; glow?: number; text?: string; w?: number; shake?: number }> = ({
  x = 100,
  opacity = 1,
  glow = 0,
  text = "Why is the sky blue?",
  w = 214,
  shake = 0,
}) => (
  <div
    style={{
      position: "absolute",
      left: x + shake,
      top: WS.benchTop - 124,
      width: w,
      height: 124,
      borderRadius: 14,
      background: "#1E222C",
      border: `2px solid rgba(255,255,255,${0.14 + 0.3 * glow})`,
      boxSizing: "border-box",
      padding: "12px 16px",
      opacity,
      boxShadow: "0 8px 0 rgba(0,0,0,0.3)",
    }}
  >
    <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 17, letterSpacing: 2, color: C.muted }}>YOU ASK</div>
    <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 31, lineHeight: 1.08, color: C.text, marginTop: 6, letterSpacing: -0.5 }}>
      {text}
    </div>
  </div>
);

/** The answer row on the bench. `placed[i]`: 0 = not there, 0→1 = being placed (lifted in amber), then `fresh[i]` 1→0 fades amber to cream. */
export const AnswerRow: React.FC<{ placed: number[]; amber: number[]; opacity?: number; ghost?: boolean; words?: string[]; xs?: number[] }> = ({
  placed,
  amber,
  opacity = 1,
  ghost = false,
  words = ANSWER,
  xs = ANSWER_X,
}) => (
  <>
    {words.map((w, i) => {
      const p = placed[i] ?? 0;
      if (p <= 0.001) return ghost ? <WordCard key={`g${i}`} text={w} x={xs[i]} state="ghost" opacity={opacity} /> : null;
      const lift = (1 - Math.min(1, p)) * 90;
      return <WordCard key={i} text={w} x={xs[i]} y={WS.benchTop + 2 - lift} state={(amber[i] ?? 0) > 0.5 ? "amber" : "cream"} opacity={opacity * Math.min(1, p * 2.5)} />;
    })}
  </>
);

/**
 * Placement timing for one card: Claude lifts it (amber) just before `at`, it lands at `at`,
 * stays amber for `hold` frames, then turns cream.
 */
export const placeAt = (f: number, at: number, hold = 10) => ({
  p: sp(f, at - 6, { damping: 14, stiffness: 220 }),
  amber: f >= at - 6 && f < at + hold ? 1 : 0,
});

/** Where Claude's right hand is while it places the card at index i of a row (follows the card down). */
export const handForCard = (xs: number[], words: string[], i: number, p: number, size = 36): P2 => [
  xs[i] + cardW(words[i], size) / 2,
  WS.benchTop - cardH(size) - 6 - (1 - Math.min(1, p)) * 90,
];

/**
 * Aster's placing "hand" while it places cards: it reaches for each card a few frames before it lands
 * (`ats[i]`), follows it down, and goes back to rest. (Moved here from Lesson 1's common.tsx.)
 */
export const placingHands = (f: number, ats: number[], xs: number[], words: string[], ps: number[], size = 36): { left: P2; right: P2 } => {
  for (let i = ats.length - 1; i >= 0; i--) {
    const at = ats[i];
    if (f >= at - 12 && f <= at + 10) {
      const w = ez(f, at - 12, at - 6) * (1 - ez(f, at + 2, at + 10));
      const target = handForCard(xs, words, i, ps[i], size);
      return pointHands(target, w);
    }
  }
  return { ...CLAUDE_REST };
};

/** Point one of Aster's rays at `target` with weight `w` (0 = at rest). */
export const pointHands = (target: P2, w: number): { left: P2; right: P2 } =>
  target[0] < WS.claudeX - 40
    ? { left: lerpP(CLAUDE_REST.left, target, w), right: CLAUDE_REST.right }
    : { left: CLAUDE_REST.left, right: lerpP(CLAUDE_REST.right, target, w) };

/** 3 candidate cards fanned above Claude's hands, each with a likelihood bar (no numbers). The first one wins. */
export const CandidateFan: React.FC<{
  f: number;
  at: number;
  words: [string, string, string];
  odds: [number, number, number];
  /** 0→1: the winner leaves the fan (drops into the row), the others fade */
  pick?: number;
  center?: P2;
  out?: number;
}> = ({ f, at, words, odds, pick = 0, center = [640, 790], out = 0 }) => {
  // order on screen: left, middle (winner, raised), right
  const slots = [
    { i: 1, dx: -175, dy: 24, rot: -10 },
    { i: 0, dx: 0, dy: -20, rot: 0 },
    { i: 2, dx: 175, dy: 24, rot: 10 },
  ];
  return (
    <>
      {slots.map(({ i, dx, dy, rot }, k) => {
        const pin = sp(f, at + k * 3, { damping: 13, stiffness: 200 });
        const grow = ez(f, at + 6, at + 22);
        const win = i === 0;
        const fade = win ? 1 - out : (1 - pick) * (1 - out);
        if (win && pick > 0.02) return null; // the winner is drawn by the row once it is picked
        const w = 170;
        return (
          <WordCard
            key={i}
            text={words[i]}
            x={center[0] + dx * pin - w / 2}
            y={center[1] + dy + (1 - pin) * 60}
            w={w}
            size={34}
            rot={rot * pin}
            scale={0.6 + 0.4 * pin}
            opacity={Math.min(1, pin * 1.5) * fade}
            state={win && grow > 0.95 ? "amber" : "cream"}
            bar={odds[i] * grow}
          />
        );
      })}
    </>
  );
};

/** A soft light bar that sweeps left → right over everything written so far ("reads everything so far"). */
export const ReadSweep: React.FC<{ f: number; from: number; to: number; x0?: number; x1?: number }> = ({ f, from, to, x0 = 96, x1 = 940 }) => {
  if (f < from || f > to + 6) return null;
  const t = ez(f, from, to);
  const x = lerp(x0, x1, t);
  const o = Math.min(1, (f - from) / 4) * (1 - ez(f, to, to + 6));
  return (
    <div
      style={{
        position: "absolute",
        left: x - 70,
        top: WS.benchTop - 140,
        width: 140,
        height: 150,
        borderRadius: 20,
        background: "rgba(245,245,247,0.16)",
        border: "2px solid rgba(245,245,247,0.35)",
        opacity: o,
      }}
    />
  );
};
