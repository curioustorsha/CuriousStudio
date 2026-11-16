import React from "react";
import { interpolate } from "remotion";
import { C, F } from "../../../theme";
import { Label, useProofText } from "../../../productui";

export const KICKER = "CLAUDE SKILLS · github.com/DietrichGebert/ponytail · ★190,983";
export const PROOF = "episodes/cs-016/proof";

/** The maker's before/after card (assets/v5/beforeafter.png, Dietrich Gebert, MIT), in its own 1760×1408 units. */
export const DEMO = { src: `${PROOF}/demo-1.png`, natW: 1760, natH: 1408, label: "Maker's before/after card: assets/v5/beforeafter.png" };
/** Regions on the demo card, in its units. */
export const SPOT = {
  wall: { x: 85, y: 448, w: 1590, h: 150 }, // the faint NO SKILL code wall
  calendar: { x: 1184, y: 449, w: 486, h: 26 }, // import { Calendar, type CalendarProps } from "@/components/ui/calendar"
  input: { x: 80, y: 870, w: 640, h: 48 }, // import { Input } from "@/components/ui/input"
  date: { x: 300, y: 1076, w: 172, h: 46 }, // type="date"
  arrow: { x: 1022, y: 1076, w: 492, h: 46 }, // ← the browser's own date picker
};

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

/** "Demo · Dietrich Gebert": on screen whenever the maker's card shows. */
export const Credit: React.FC<{ top: number; opacity?: number }> = ({ top, opacity = 1 }) => (
  <Label text="DEMO · DIETRICH GEBERT" color={C.muted} style={{ top, right: 70, fontSize: 20, letterSpacing: 2, opacity }} />
);

/** Proof text files: our booking-form run (before/after app.js) and the SKILL.md ladder excerpt. */
export const useProof = () => ({
  before: useProofText(`${PROOF}/before.js`),
  after: useProofText(`${PROOF}/after.js`),
  ladder: useProofText(`${PROOF}/skill-ladder.md`),
});
export const useBooking = () => ({
  before: useProofText(`${PROOF}/before/app.js`),
  after: useProofText(`${PROOF}/after/app.js`),
});
