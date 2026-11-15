import React from "react";
import { Aster } from "../aster/Aster";
import { C } from "../theme";
import { CLAUDE_REST, ez, WS, type P2 } from "./world";

/**
 * Aster, the host, hovering behind the workbench where the old figure stood.
 * Scenes keep passing "hands" (where something is being placed): Aster turns so one ray points at it.
 * `mood` + `at` (the frame it started) give the reactions; use moodAt() to switch on word cues.
 */

export type Mood = "idle" | "think" | "no" | "gotit" | "unsure";

export const HOST_C: P2 = [WS.claudeX, 735];
const SIZE = 380; // ray length 95 px

export type HostPose = {
  f: number;
  left?: P2;
  right?: P2;
  look?: number;
  squash?: number;
  opacity?: number;
  mood?: Mood;
  at?: number;
};

const dist = (a: P2, b: P2) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export const Host: React.FC<HostPose> = ({ f, left = CLAUDE_REST.left, right = CLAUDE_REST.right, look = 0, squash = 0, opacity = 1, mood = "idle", at = 0 }) => {
  const t = f - at;
  const bob = Math.sin(f * 0.09) * 6;
  let rot = f * 0.5;
  let dx = look;
  let dy = bob;
  let glow = 0.35 + 0.1 * Math.sin(f * 0.12);
  let droop = 0;
  let tilt = 0;
  let rings = 0;
  let burst = -1;
  if (mood === "think") {
    rot = f * 0.22;
    rings = ez(t, 0, 8);
    glow = 0.45 + 0.25 * (0.5 + 0.5 * Math.sin(f * 0.16));
  } else if (mood === "no" && t >= 0 && t < 18) {
    dx += Math.sin(t * 1.25) * 26 * (1 - t / 18);
  } else if (mood === "gotit" && t >= 0) {
    rot += 120 * ez(t, 0, 12);
    glow = 0.4 + 0.6 * (1 - ez(t, 6, 28));
    if (t < 22) burst = t / 22;
  } else if (mood === "unsure" && t >= 0) {
    const d = ez(t, 0, 10);
    rot = at * 0.5 + (f - at) * 0.08;
    droop = 0.85 * d;
    tilt = Math.sin(t * 0.09) * 9 * d;
    dy += 12 * d;
    glow = 0.35 - 0.2 * d;
  }

  // point one ray at whatever a "hand" is reaching for
  const dl = dist(left, CLAUDE_REST.left);
  const dr = dist(right, CLAUDE_REST.right);
  const hand = dl > dr ? left : right;
  const w = Math.min(1, Math.max(dl, dr) / 50);
  let point: number | null = null;
  if (w > 0.01) {
    const cx = HOST_C[0] + dx;
    const cy = HOST_C[1] + dy;
    const ang = (Math.atan2(hand[0] - cx, -(hand[1] - cy)) * 180) / Math.PI;
    const k = Math.round((ang - rot) / 60);
    rot += (ang - k * 60 - rot) * w;
    point = ((k % 6) + 6) % 6;
  }

  const sx = 1 + 0.1 * squash;
  const sy = 1 - 0.1 * squash;
  const cx = HOST_C[0] + dx;
  const cy = HOST_C[1] + dy;
  return (
    <>
      {rings > 0 && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {[0, 1].map((i) => {
            const ph = ((f * 0.02 + i * 0.5) % 1 + 1) % 1;
            return <circle key={i} cx={cx} cy={cy} r={115 + ph * 65} fill="none" stroke={C.accent} strokeWidth={3} opacity={rings * 0.45 * (1 - ph)} />;
          })}
        </svg>
      )}
      {burst >= 0 && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {[...Array(12)].map((_, i) => {
            const a = (i * 30 * Math.PI) / 180;
            const r0 = 112 + burst * 36;
            const r1 = r0 + 34 * (1 - burst);
            return <line key={i} x1={cx + Math.sin(a) * r0} y1={cy - Math.cos(a) * r0} x2={cx + Math.sin(a) * r1} y2={cy - Math.cos(a) * r1} stroke={C.accent} strokeWidth={6} strokeLinecap="round" opacity={1 - burst} />;
          })}
        </svg>
      )}
      <div style={{ position: "absolute", left: cx - SIZE / 2, top: cy - SIZE / 2, transform: `rotate(${tilt}deg) scale(${sx}, ${sy})`, transformOrigin: "50% 50%" }}>
        <Aster size={SIZE} rot={rot} point={point} reach={w} droop={droop} glow={glow} opacity={opacity} />
      </div>
    </>
  );
};

/** Mood from word cues: the last cue at or before `f` wins. */
export const moodAt = (f: number, cues: [number, Mood][]): { mood: Mood; at: number } => {
  let cur: { mood: Mood; at: number } = { mood: cues[0][1], at: -100 };
  for (const [a, m] of cues) if (f >= a) cur = { mood: m, at: a };
  return cur;
};
