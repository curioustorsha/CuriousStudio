import React from "react";
import { C, F } from "../../../theme";
import { Asterisk } from "../../../brand";
import { Kicker } from "../../../engine/kit";
import { ez, lerp } from "../../../workshop";

/**
 * PB-001's one traveller: the Curiously asterisk. It hops between the channel's worlds with a short trail
 * and lands in each as that world's spark. Everything here takes an explicit frame `f` so any scene can draw
 * any moment (the CTA draws the hook's first frame for the loop).
 */

export type Pt = [number, number];

/** The end card's star: LogoMark 250 at top 470 → centre (540, 595), star 250 × 0.42 = 105 px. */
export const LOGO_STAR: Pt = [540, 595];
export const LOGO_STAR_SIZE = 105;

/** Position of a hop from `a` to `b` between frames t0 and t0 + dur, on an arc `arc` px high. */
export const hopAt = (f: number, t0: number, dur: number, a: Pt, b: Pt, arc = 120): Pt => {
  const k = ez(f, t0, t0 + dur);
  return [lerp(a[0], b[0], k), lerp(a[1], b[1], k) - Math.sin(k * Math.PI) * arc];
};

/** The asterisk at a screen point, with a fading trail of where it was over the last frames. */
export const Star: React.FC<{
  f: number;
  at: (f: number) => Pt;
  size: number;
  rotate?: number;
  opacity?: number;
  trail?: number;
  glow?: number;
}> = ({ f, at, size, rotate = 0, opacity = 1, trail = 0, glow = 0.6 }) => {
  if (opacity <= 0.001 || size <= 0.5) return null;
  const [x, y] = at(f);
  const ghosts = trail > 0.01 ? [6, 5, 4, 3, 2, 1] : [];
  return (
    <>
      {ghosts.map((k) => {
        const [gx, gy] = at(f - k);
        const moved = Math.hypot(gx - x, gy - y);
        if (moved < 2) return null;
        const s = size * (1 - k * 0.09);
        return (
          <div key={k} style={{ position: "absolute", left: gx - s / 2, top: gy - s / 2, width: s, height: s, opacity: opacity * trail * (0.42 - k * 0.06) }}>
            <Asterisk size={s} rotate={rotate - k * 14} />
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          opacity,
          filter: glow > 0 ? `drop-shadow(0 0 ${18 * glow}px ${C.accent})` : undefined,
        }}
      >
        <Asterisk size={size} rotate={rotate} />
      </div>
    </>
  );
};

/** A one-shot burst of short amber rays around a point (Aster's "got it" burst), p 0→1. */
export const Burst: React.FC<{ c: Pt; p: number; r?: number; color?: string }> = ({ c, p, r = 90, color = C.accent }) => {
  if (p <= 0 || p >= 1) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {[...Array(12)].map((_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        const r0 = r + p * r * 0.4;
        const r1 = r0 + r * 0.35 * (1 - p);
        return <line key={i} x1={c[0] + Math.sin(a) * r0} y1={c[1] - Math.cos(a) * r0} x2={c[0] + Math.sin(a) * r1} y2={c[1] - Math.cos(a) * r1} stroke={color} strokeWidth={6} strokeLinecap="round" opacity={1 - p} />;
      })}
    </svg>
  );
};

/** A sonar ring spreading from a point, p 0→1. */
export const Ripple: React.FC<{ c: Pt; p: number; r?: number; color?: string }> = ({ c, p, r = 70, color = C.accent }) => {
  if (p <= 0 || p >= 1) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <circle cx={c[0]} cy={c[1]} r={r * (0.4 + p)} fill="none" stroke={color} strokeWidth={5 * (1 - p) + 1} opacity={1 - p} />
    </svg>
  );
};

/** Kicker + title, centred in the header band (170–400). `kicker` may be a node (a logo kicker). */
export const BeatHeader: React.FC<{ kicker: React.ReactNode; title: React.ReactNode; opacity?: number; dy?: number }> = ({ kicker, title, opacity = 1, dy = 0 }) =>
  opacity <= 0.001 ? null : (
    <div style={{ position: "absolute", top: 170 + dy, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 26, opacity }}>
      {typeof kicker === "string" ? <Kicker text={kicker} /> : kicker}
      <div style={{ fontFamily: F.sans, fontWeight: 900, fontSize: 80, lineHeight: 1.02, letterSpacing: -2.8, color: C.text, textAlign: "center" }}>{title}</div>
    </div>
  );

/** Source line at y 1262 (plain-text citation), with its own opacity. */
export const SourceAt: React.FC<{ text: string; opacity: number }> = ({ text, opacity }) =>
  opacity <= 0.001 ? null : (
    <div style={{ position: "absolute", top: 1262, left: 0, right: 0, textAlign: "center", fontFamily: F.mono, fontSize: 22, color: C.muted, letterSpacing: 1, opacity: 0.8 * opacity }}>SOURCE · {text}</div>
  );

/** Crossfade helper: 1 before `t`, 0 after `t + dur`. */
export const outAt = (f: number, t: number, dur = 8) => 1 - ez(f, t, t + dur);
