import React from "react";
import { interpolate } from "remotion";
import { C, F } from "../../../theme";
import { Label, useProofText } from "../../../productui";

export const KICKER = "CLAUDE SKILLS · github.com/DietrichGebert/ponytail · ★191k";
export const PROOF = "episodes/cs-016/proof";

export const clampI = (f: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/** Kicker + title in the header area (170–400). */
export const Header: React.FC<{ title: string; opacity?: number; accent?: string }> = ({ title, opacity = 1, accent }) => (
  <div style={{ opacity }}>
    <Label text={KICKER} style={{ top: 200, left: 60, right: 60, fontSize: 20, letterSpacing: 1.5 }} />
    <div style={{ position: "absolute", top: 248, left: 60, right: 60, fontFamily: F.sans, fontSize: 70, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05, color: accent ?? C.text }}>{title}</div>
  </div>
);

export const SourceLine: React.FC<{ text: string; opacity?: number }> = ({ text, opacity = 1 }) => (
  <div style={{ position: "absolute", top: 1262, left: 60, right: 60, fontFamily: F.mono, fontSize: 20, color: C.muted, letterSpacing: 1, opacity }}>{text}</div>
);

/** The three proof files: the maker's benchmark output (before/after) and the SKILL.md excerpt. */
export const useProof = () => ({
  before: useProofText(`${PROOF}/before.js`),
  after: useProofText(`${PROOF}/after.js`),
  ladder: useProofText(`${PROOF}/skill-ladder.md`),
});

/** Code window that types `before.js` line by line and keeps the newest line in view. */
export const typedScroll = (lines: number, visible: number, lh: number) => Math.max(0, (lines - visible) * lh);
