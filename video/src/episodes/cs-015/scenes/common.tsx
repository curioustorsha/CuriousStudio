import React from "react";
import { interpolate } from "remotion";
import { C, F } from "../../../theme";
import { chatBlocks, Label, useProofText } from "../../../productui";

export const KICKER = "CLAUDE SKILLS · github.com/multica-ai/andrej-karpathy-skills · ★233k";
export const PROOF = "episodes/cs-015/proof";
export const REPO_URL = "github.com/multica-ai/andrej-karpathy-skills";

/** Karpathy's words, verbatim from his X post as quoted in the README (F6). */
export const QUOTE = "The models make wrong assumptions on your behalf and just run along with them without checking.";
/** One fragment per rule, verbatim from the same post (F6). */
export const FRAGMENTS = ["wrong assumptions", "overcomplicate code", "change/remove comments and code", "give it success criteria"];

export const clampI = (f: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/** Kicker + title in the header area (170–400; the episode shifts it 80 px down). */
export const Header: React.FC<{ title: string; opacity?: number; accent?: string }> = ({ title, opacity = 1, accent }) => (
  <div style={{ opacity }}>
    <Label text={KICKER} style={{ top: 200, left: 60, right: 60, fontSize: 19, letterSpacing: 1 }} />
    <div style={{ position: "absolute", top: 248, left: 60, right: 60, fontFamily: F.sans, fontSize: 70, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05, color: accent ?? C.text }}>{title}</div>
  </div>
);

export const SourceLine: React.FC<{ text: string; opacity?: number }> = ({ text, opacity = 1 }) => (
  <div style={{ position: "absolute", top: 1262, left: 60, right: 60, fontFamily: F.mono, fontSize: 19, color: C.muted, letterSpacing: 0.5, opacity }}>{text}</div>
);

/** A small outlined tag ("OUR TEST · …") that blinks on at `p`. */
export const Tag: React.FC<{ text: string; p: number; top: number; left?: number; right?: number; color?: string; blinkFrom?: number; f?: number }> = ({ text, p, top, left, right, color = C.accent, blinkFrom, f = 0 }) => {
  const blink = blinkFrom !== undefined && f < blinkFrom + 12 && f >= blinkFrom ? (Math.floor((f - blinkFrom) / 3) % 2 ? 0.4 : 1) : 1;
  return (
    <Label
      text={text}
      color={color}
      style={{ top, left, right, fontSize: 19, letterSpacing: 2, padding: "6px 14px", borderRadius: 10, border: "2px solid currentColor", opacity: p * blink, transform: `scale(${0.85 + 0.15 * p})`, transformOrigin: left !== undefined ? "0 50%" : "100% 50%" }}
    />
  );
};

/** Proof files from our run: the 31-line fixture, plain Claude's edit and reply, the reply with the file, and the four rules. */
export const useProof = () => {
  const fixture = useProofText(`${PROOF}/fixture/cart.js`);
  const before = useProofText(`${PROOF}/before/cart.js`);
  const beforeReply = useProofText(`${PROOF}/before/reply.md`);
  const after = useProofText(`${PROOF}/after/cart.js`);
  const afterReply = useProofText(`${PROOF}/after/reply.md`);
  const rules = useProofText(`${PROOF}/rules.md`);
  return { fixture, before, beforeReply, after, afterReply, rules };
};

export const lineCount = (s: string) => s.replace(/\n$/, "").split("\n").length;

/** 1-based lines of `next` that are new or changed against `base` (blank lines skipped): the diff gutter. */
export const changedLines = (base: string, next: string) => {
  const old = new Set(base.split("\n").map((l) => l.trim()));
  return next
    .split("\n")
    .map((l, i) => (l.trim() && !old.has(l.trim()) ? i + 1 : 0))
    .filter(Boolean);
};

/** The four rules as { head, line } from rules.md. */
export const parseRules = (md: string) => {
  const ls = md.replace(/\n$/, "").split("\n");
  const out: { head: string; line: string }[] = [];
  for (let i = 0; i + 1 < ls.length; i += 2) out.push({ head: ls[i].replace(/^\d+\.\s*/, ""), line: ls[i + 1] });
  return out;
};

export { chatBlocks };

/** The line counter plus a "+N" tag, sitting in a window's title bar (centre line `cy`), right-aligned at `right`. */
export const BarCount: React.FC<{ lines: number; delta: number; deltaP: number; cy: number; right?: number; color: string; deltaColor: string; opacity?: number }> = ({ lines, delta, deltaP, cy, right = 80, color, deltaColor, opacity = 1 }) => (
  <div style={{ position: "absolute", right, top: cy - 24, height: 48, display: "flex", alignItems: "center", gap: 12, opacity, fontFamily: F.mono, fontWeight: 800 }}>
    <div style={{ padding: "4px 14px", borderRadius: 12, background: deltaColor, color: "#140d05", fontSize: 28, opacity: deltaP, transform: `scale(${0.5 + 0.5 * deltaP})`, boxShadow: `0 0 30px ${deltaColor}66` }}>
      {delta >= 0 ? `+${delta}` : delta}
    </div>
    <div style={{ padding: "4px 16px", borderRadius: 12, border: `2px solid ${color}`, background: `${color}1F`, color, fontSize: 28, fontWeight: 700 }}>{Math.round(lines)} lines</div>
  </div>
);
