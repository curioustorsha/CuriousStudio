import React from "react";
import { Freeze, interpolate, Loop, Sequence } from "remotion";
import { C, F } from "../../../theme";
import { Label, PreviewWindow, useProofText } from "../../../productui";
import { RemotionLogo } from "../../../logos";
// The proof runs' real components, unchanged (edited = the after file with one hand-made Studio-style edit, see proof/edited/README.md).
import { TitleCard as BeforeCard } from "../../../../public/episodes/cs-032/proof/before/src/TitleCard";
import { TitleCard as AfterCard } from "../../../../public/episodes/cs-032/proof/after/src/TitleCard";
import { TitleCard as EditedCard } from "../../../../public/episodes/cs-032/proof/edited/src/TitleCard";

/** Stars 7,269 on 15 Nov 2026 (F1), shown as ★7.3k. */
export const STARS = 7269;
export const KICKER = "CLAUDE SKILLS · github.com/remotion-dev/skills · ★7.3k";
export const PROOF = "episodes/cs-032/proof";
export const REPO_URL = "github.com/remotion-dev/skills";
export const TEST_SOURCE = "SOURCE · Curiously test, 15 Nov 2026";

export const clampI = (f: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/** Kicker (with the Remotion mark, the company maker) + title in the header area (170–400; the episode shifts it 80 px down). */
export const Header: React.FC<{ title: string; opacity?: number; accent?: string }> = ({ title, opacity = 1, accent }) => (
  <div style={{ opacity }}>
    <div style={{ position: "absolute", top: 194, left: 60 }}>
      <RemotionLogo size={32} />
    </div>
    <Label text={KICKER} style={{ top: 200, left: 104, right: 60, fontSize: 19, letterSpacing: 1 }} />
    <div style={{ position: "absolute", top: 248, left: 60, right: 60, fontFamily: F.sans, fontSize: 70, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05, color: accent ?? C.text }}>{title}</div>
  </div>
);

export const SourceLine: React.FC<{ text: string; opacity?: number }> = ({ text, opacity = 1 }) => (
  <div style={{ position: "absolute", top: 1262, left: 60, right: 60, fontFamily: F.mono, fontSize: 19, color: C.muted, letterSpacing: 0.5, opacity }}>{text}</div>
);

/** A small outlined tag that pops on at `p`. */
export const Tag: React.FC<{ text: string; p: number; top: number; left?: number; right?: number; color?: string; size?: number }> = ({ text, p, top, left, right, color = C.accent, size = 19 }) => (
  <Label
    text={text}
    color={color}
    style={{ top, left, right, fontSize: size, letterSpacing: 2, padding: "6px 14px", borderRadius: 10, border: "2px solid currentColor", background: "rgba(12,13,18,0.97)", whiteSpace: "nowrap", opacity: p, transform: `scale(${0.85 + 0.15 * p})`, transformOrigin: left !== undefined ? "0 50%" : "100% 50%" }}
  />
);

/** The proof files as text (tabs as two spaces so the after file fits the editor). Line numbers are unchanged. */
export const useCode = () => {
  const tidy = (s: string | null) => (s === null ? null : s.replace(/\t/g, "  "));
  return {
    before: tidy(useProofText(`${PROOF}/before/src/TitleCard.tsx`)),
    after: tidy(useProofText(`${PROOF}/after/src/TitleCard.tsx`)),
    edited: tidy(useProofText(`${PROOF}/edited/src/TitleCard.tsx`)),
  };
};

const CARDS = { before: BeforeCard, after: AfterCard, edited: EditedCard };
export type CardKind = keyof typeof CARDS;

/**
 * The real card, rendered live from the proof file. `from` starts it (scene frame); it plays once and holds its
 * last frame (`loop` replays every 3 s instead). `freeze` pins one card frame.
 */
export const Card: React.FC<{ kind: CardKind; from?: number; loop?: boolean; freeze?: number }> = ({ kind, from = 0, loop, freeze }) => {
  const Comp = CARDS[kind];
  // Freeze at 0, then a long Sequence shifted back by `freeze`: the card sees frame `freeze` inside a sequence long
  // enough to show it, even in the one-frame cover still (a plain <Freeze frame={89}> renders nothing there).
  if (freeze !== undefined)
    return (
      <Freeze frame={0}>
        <Sequence from={-freeze} durationInFrames={freeze + 300} layout="none">
          <Comp />
        </Sequence>
      </Freeze>
    );
  return (
    <Sequence from={from} layout="none">
      {loop ? (
        <Loop durationInFrames={90} layout="none">
          <Comp />
        </Loop>
      ) : (
        <Comp />
      )}
    </Sequence>
  );
};

/** A preview window playing a card. */
export const CardWindow: React.FC<{ kind: CardKind; x: number; y: number; w: number; from?: number; loop?: boolean; freeze?: number; dim?: boolean; tilt?: number; overlay?: React.ReactNode; title?: string }> = ({ kind, x, y, w, from, loop, freeze, dim, tilt, overlay, title }) => (
  <PreviewWindow x={x} y={y} w={w} dim={dim} tilt={tilt} title={title ?? "Preview"} overlay={overlay}>
    <Card kind={kind} from={from} loop={loop} freeze={freeze} />
  </PreviewWindow>
);

/**
 * An editor-style fold: only the given 1-based line ranges, with a "⋯" row between them (the lines themselves are
 * the real file, untouched). `at(n)` maps an original line number to its row in the folded text.
 */
export const fold = (code: string, ranges: [number, number][], dedent = 0) => {
  const lines = code.replace(/\n$/, "").split("\n");
  const out: string[] = [];
  const map = new Map<number, number>();
  ranges.forEach(([a, b], k) => {
    if (k > 0) out.push(" ".repeat(Math.max(0, 4 - dedent)) + "⋯");
    for (let n = a; n <= b; n++) {
      out.push(lines[n - 1].slice(Math.min(dedent, lines[n - 1].length - lines[n - 1].trimStart().length)));
      map.set(n, out.length);
    }
  });
  return { text: out.join("\n"), at: (n: number) => map.get(n) ?? 0 };
};

/** Line top (scene y) of 1-based `line` inside a Window at `winY` showing a CodePane of font `size` scrolled by `scroll`. */
export const lineTop = (winY: number, line: number, size: number, scroll = 0) => winY + 52 + 18 - scroll + (line - 1) * size * 1.55;

/** Scroll that puts 1-based `line` at `rowsFromTop` rows below the top of the pane. */
export const scrollTo = (line: number, size: number, rowsFromTop = 3) => Math.max(0, (line - 1 - rowsFromTop) * size * 1.55);

/** Our own renders, cut and cropped to their main picture (proof/clips, see the script's sources). */
export const CLIPS = {
  network: { file: "network", label: "HIS-007 · How It Scales" },
  magnifier: { file: "magnifier", label: "CL-005 · Claude Lab" },
  numbers: { file: "numbers", label: "HIS-003 · How It Scales" },
  product: { file: "product", label: "CS-016 · Claude Skills" },
  city: { file: "city", label: "HIS-007 · How It Scales" },
  workshop: { file: "workshop", label: "CL-005 · Claude Lab" },
} as const;
export type ClipId = keyof typeof CLIPS;

/** Clip crop is 1080×860; the window shows it 960 wide. */
export const CLIP_WIN = { x: 60, y: 430, w: 960, h: 52 + Math.round((860 * 960) / 1080) };
