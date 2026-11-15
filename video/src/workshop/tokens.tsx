import React from "react";
import { C, F } from "../theme";
import { COL, lerp, WS, type P2 } from "./world";

/**
 * Lesson 2 objects (tokens, length and price). Metaphor sheet rows: Tokens, Input / output tokens, Price.
 * - Token tile: a chunky cream tile, shorter and thicker than a word card, slate bottom lip, mono lettering
 *   ("what the machine sees"). Word cards crack and fall apart into tiles.
 * - Trays: IN on the left (what you send), OUT on the right (what Claude writes).
 * - Coins: flat cream coins stacked beside a tray (price).
 */

export const tileW = (text: string, size = 34) => Math.round(size * 0.9 + text.length * size * 0.6);
export const tileH = (size = 34) => Math.round(size * 1.95);

/** Left x of each tile in a row starting at x0. */
export const tileXs = (words: string[], x0: number, gap = 12, size = 34) => {
  const xs: number[] = [];
  let x = x0;
  for (const w of words) {
    xs.push(x);
    x += tileW(w, size) + gap;
  }
  return xs;
};
export const rowWidth = (words: string[], gap = 12, size = 34) => words.reduce((a, w) => a + tileW(w, size), 0) + gap * (words.length - 1);

export const TokenTile: React.FC<{
  text: string;
  /** left x, bottom y (world) */
  x: number;
  y?: number;
  size?: number;
  w?: number;
  opacity?: number;
  /** px lifted off the bench */
  lift?: number;
  /** 0→1: the face goes blank (the tile stays solid) */
  blank?: number;
  /** letter indices to highlight in amber, and how strongly (0→1) */
  glowIdx?: number[];
  glow?: number;
  rot?: number;
  scale?: number;
  shake?: number;
  /** 0→1 a light ring (both versions "brighten") */
  bright?: number;
  /** grey = struck / not used */
  grey?: boolean;
}> = ({ text, x, y = WS.benchTop + 2, size = 34, w, opacity = 1, lift = 0, blank = 0, glowIdx = [], glow = 0, rot = 0, scale = 1, shake = 0, bright = 0, grey = false }) => {
  const width = w ?? tileW(text, size);
  const h = tileH(size);
  const lip = Math.max(4, Math.round(size * 0.26));
  return (
    <div
      style={{
        position: "absolute",
        left: x + shake,
        top: y - h - lift,
        width,
        height: h,
        opacity,
        transform: `rotate(${rot}deg) scale(${scale})`,
        transformOrigin: "50% 100%",
        borderRadius: Math.max(5, size * 0.28),
        background: grey ? "#7C7F86" : COL.cream,
        borderBottom: `${lip}px solid ${grey ? "#55585E" : COL.steel}`,
        boxSizing: "border-box",
        boxShadow: `0 ${Math.round(size * 0.18)}px 0 rgba(0,0,0,0.3)${bright > 0 ? `, 0 0 0 ${3 * bright}px rgba(245,245,247,${0.55 * bright})` : ""}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: F.mono,
        fontWeight: 700,
        fontSize: size,
        color: grey ? "#3A3C40" : COL.ink,
        whiteSpace: "pre",
      }}
    >
      <span style={{ opacity: 1 - blank, lineHeight: 1, display: "flex" }}>
        {text.split("").map((ch, i) => (
          <span key={i} style={{ background: glowIdx.includes(i) && glow > 0 ? `rgba(255,181,71,${glow})` : "transparent", borderRadius: 4 }}>
            {ch}
          </span>
        ))}
      </span>
    </div>
  );
};

/** A small mono label written on the bench front (e.g. EXAMPLE SPLIT). `cx` centre, `y` top. */
export const BenchLabel: React.FC<{ text: string; cx: number; y?: number; opacity?: number; color?: string; size?: number }> = ({
  text,
  cx,
  y = WS.benchTop + 40,
  opacity = 1,
  color = C.muted,
  size = 22,
}) => (
  <div
    style={{
      position: "absolute",
      left: cx,
      top: y,
      transform: "translateX(-50%)",
      opacity,
      fontFamily: F.mono,
      fontWeight: 700,
      fontSize: size,
      letterSpacing: 2,
      color,
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
);

/**
 * A word spelled out letter by letter (the human way of reading): never on tiles.
 * `boxed` puts each letter in a dark cell; `read` lights one cell (step-by-step read-light);
 * `under[i]` draws an amber underline under letter i, with `counts[i]` below it.
 */
export const LetterRow: React.FC<{
  text: string;
  cx: number;
  /** centre y */
  y: number;
  size?: number;
  cell?: number;
  gap?: number;
  appear?: number[];
  read?: number;
  under?: number[];
  counts?: string[];
  boxed?: boolean;
  opacity?: number;
  /** 0→1 every letter flies back into `gatherTo` */
  gather?: number;
  gatherTo?: P2;
}> = ({ text, cx, y, size = 56, cell = 70, gap = 8, appear, read = -1, under = [], counts = [], boxed = false, opacity = 1, gather = 0, gatherTo = [cx, y] }) => {
  const letters = text.split("");
  const total = letters.length * cell + (letters.length - 1) * gap;
  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      {letters.map((ch, i) => {
        const a = appear ? appear[i] ?? 0 : 1;
        if (a <= 0.001) return null;
        const x0 = cx - total / 2 + i * (cell + gap) + cell / 2;
        const px = lerp(x0, gatherTo[0], gather);
        const py = lerp(y, gatherTo[1], gather) + (1 - Math.min(1, a)) * 30;
        const s = (0.6 + 0.4 * Math.min(1.2, a)) * (1 - 0.7 * gather);
        const lit = read >= 0 && Math.floor(read) === i;
        const u = under[i] ?? 0;
        return (
          <div key={i} style={{ position: "absolute", left: px - cell / 2, top: py - cell * 0.6, width: cell, height: cell * 1.2, opacity: Math.min(1, a * 1.6) * (1 - gather * 0.6) }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                transform: `scale(${s})`,
                borderRadius: 12,
                background: boxed ? (lit ? "rgba(245,245,247,0.24)" : "#1E222C") : "transparent",
                border: boxed ? `2px solid ${lit ? "rgba(245,245,247,0.75)" : "rgba(255,255,255,0.14)"}` : "none",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: F.sans,
                fontWeight: 800,
                fontSize: size,
                color: COL.cream,
                lineHeight: 1,
              }}
            >
              {ch}
              {u > 0 && <div style={{ position: "absolute", left: cell * 0.15, bottom: 7, width: cell * 0.7 * u, height: 7, borderRadius: 4, background: C.accent }} />}
            </div>
            {u > 0 && counts[i] && (
              <div
                style={{
                  position: "absolute",
                  left: cell / 2 - 22,
                  width: 44,
                  height: 44,
                  top: cell * 1.2 + 10,
                  borderRadius: 10,
                  background: "#1E222C",
                  border: `2px solid ${C.accent}`,
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: F.mono,
                  fontWeight: 700,
                  fontSize: 26,
                  color: C.accent,
                  opacity: Math.min(1, u * 2),
                  transform: `scale(${0.6 + 0.4 * Math.min(1, u * 1.5)})`,
                }}
              >
                {counts[i]}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/** A thin light cut-line at x, sweeping across something (tokenization). */
export const CutLine: React.FC<{ x: number; y0: number; y1: number; opacity?: number }> = ({ x, y0, y1, opacity = 1 }) => {
  if (opacity <= 0) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity }}>
      <rect x={x - 16} y={y0} width={32} height={y1 - y0} rx={16} fill="rgba(245,245,247,0.14)" />
      <rect x={x - 3} y={y0 - 10} width={6} height={y1 - y0 + 20} rx={3} fill="#F5F5F7" />
    </svg>
  );
};

/**
 * The one flat terminal mockup (proof beat). `typed` = characters typed so far across `lines`;
 * the amber `result` line prints when `resultP` > 0.
 */
export const TerminalPanel: React.FC<{
  x: number;
  y: number;
  w: number;
  lines: string[];
  typed: number;
  result: string;
  resultP: number;
  label?: string;
  scale?: number;
  opacity?: number;
  origin?: string;
}> = ({ x, y, w, lines, typed, result, resultP, label, scale = 1, opacity = 1, origin = "50% 50%" }) => {
  let left = Math.max(0, Math.floor(typed));
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, transform: `scale(${scale})`, transformOrigin: origin, opacity }}>
      <div style={{ borderRadius: 18, background: "#0E1016", border: "2px solid rgba(255,255,255,0.16)", boxShadow: "0 8px 0 rgba(0,0,0,0.35)", overflow: "hidden" }}>
        <div style={{ height: 40, background: "#1A1D26", display: "flex", alignItems: "center", gap: 10, padding: "0 18px" }}>
          {[0, 1, 2].map((k) => (
            <div key={k} style={{ width: 14, height: 14, borderRadius: 7, background: "rgba(255,255,255,0.18)" }} />
          ))}
        </div>
        <div style={{ padding: "18px 26px 22px", fontFamily: F.mono, fontWeight: 500, fontSize: 25, lineHeight: 1.55, color: C.text, whiteSpace: "pre" }}>
          {lines.map((ln, i) => {
            const n = Math.min(ln.length, left);
            left -= ln.length;
            return (
              <div key={i} style={{ minHeight: 39, color: i === 0 ? C.muted : C.text }}>
                {ln.slice(0, Math.max(0, n))}
              </div>
            );
          })}
          <div style={{ minHeight: 39, color: C.accent, fontWeight: 700, opacity: Math.min(1, resultP * 2) }}>{resultP > 0 ? result : ""}</div>
        </div>
        {label && (
          <div style={{ padding: "10px 26px 12px", borderTop: "1px solid rgba(255,255,255,0.1)", fontFamily: F.mono, fontWeight: 700, fontSize: 19, letterSpacing: 1, color: C.muted }}>{label}</div>
        )}
      </div>
    </div>
  );
};

/**
 * A flat shallow tray on the bench. `children` sit inside it (drawn between the back and the front);
 * they are positioned by the caller in world coordinates and aren't affected by `opacity` or `dx`.
 */
export const Tray: React.FC<{ cx: number; w?: number; label: string; opacity?: number; dx?: number; children?: React.ReactNode }> = ({
  cx,
  w = 240,
  label,
  opacity = 1,
  dx = 0,
  children,
}) => {
  const x = cx - w / 2 + dx;
  const top = WS.benchTop;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity }}>
        <rect x={x + 8} y={top - 52} width={w - 16} height={30} rx={6} fill={COL.steelDark} />
      </svg>
      {children}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity }}>
        <rect x={x} y={top - 34} width={w} height={36} rx={6} fill={COL.steel} />
        <rect x={x} y={top - 34} width={w} height={4} rx={2} fill="rgba(255,255,255,0.18)" />
        <text x={x + w / 2} y={top - 8} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={22} letterSpacing={3} fill={COL.cream}>
          {label}
        </text>
      </svg>
    </div>
  );
};

/** Slot i of a tray's 7-wide pile of mini tiles: left x, bottom y (world). */
export const traySlot = (cx: number, i: number, w = 240): P2 => {
  const per = 7;
  const tw = 28;
  const gap = 4;
  const row = Math.floor(i / per);
  const col = i % per;
  const x0 = cx - (per * tw + (per - 1) * gap) / 2;
  return [x0 + col * (tw + gap) + (row % 2) * 6, WS.benchTop - 22 - row * 22];
};

/** A stack of flat cream coins on the bench. `drops[i]` 0→1 drops coin i in from above. */
export const CoinStack: React.FC<{ cx: number; drops: number[]; opacity?: number }> = ({ cx, drops, opacity = 1 }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity, overflow: "visible" }}>
    {drops.map((p, i) => {
      if (p <= 0.001) return null;
      const yb = WS.benchTop - i * 13 - (1 - Math.min(1, p)) * 180;
      const o = Math.min(1, p * 3);
      return (
        <g key={i} opacity={o}>
          <rect x={cx - 34} y={yb - 14} width={68} height={12} fill={COL.sandDark} />
          <ellipse cx={cx} cy={yb - 2} rx={34} ry={10} fill={COL.sandDark} />
          <ellipse cx={cx} cy={yb - 14} rx={34} ry={10} fill={COL.cream} />
          <ellipse cx={cx} cy={yb - 14} rx={20} ry={5.5} fill="none" stroke={COL.sandDark} strokeWidth={2.5} />
        </g>
      );
    })}
  </svg>
);
