import React from "react";
import { Img, interpolate, spring, staticFile } from "remotion";
import { C, F } from "../../../theme";
import { Label, useProofText } from "../../../productui";

/** Stars 97,473 on 17 Nov 2026 (F1), shown as ★97.5k. */
export const STARS = 97473;
export const KICKER = "CLAUDE SKILLS · github.com/tt-a1i/archify · ★97.5k";
export const PROOF = "episodes/cs-009/proof";
export const REPO_URL = "github.com/tt-a1i/archify";

export const clampI = (f: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/** Critically damped move 0→1 starting at `at`. */
export const move = (f: number, at: number, fps: number, stiffness = 90) => spring({ frame: f - at, fps, config: { damping: 200, stiffness } });

/** Kicker + title in the header area (170–400). */
export const Header: React.FC<{ title: string; opacity?: number; accent?: string }> = ({ title, opacity = 1, accent }) => (
  <div style={{ opacity }}>
    <Label text={KICKER} style={{ top: 200, left: 60, right: 60, fontSize: 20, letterSpacing: 1.5 }} />
    <div style={{ position: "absolute", top: 248, left: 60, right: 60, fontFamily: F.sans, fontSize: 70, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05, color: accent ?? C.text }}>{title}</div>
  </div>
);

export const SourceLine: React.FC<{ text: string; opacity?: number }> = ({ text, opacity = 1 }) => (
  <div style={{ position: "absolute", top: 1262, left: 60, right: 60, fontFamily: F.mono, fontSize: 19, color: C.muted, letterSpacing: 0.5, opacity }}>{text}</div>
);

/** "Demo · tt-a1i / Archify": on screen whenever the maker's diagrams show. */
export const Credit: React.FC<{ top: number; opacity?: number }> = ({ top, opacity = 1 }) => (
  <Label text="DEMO · TT-A1I / ARCHIFY" color={C.muted} style={{ top, right: 90, fontSize: 19, letterSpacing: 2, opacity }} />
);

/** A small outlined tag that pops on at `p`. */
export const Tag: React.FC<{ text: string; p: number; top: number; left?: number; right?: number; color?: string; size?: number }> = ({ text, p, top, left, right, color = C.accent, size = 22 }) => (
  <Label
    text={text}
    color={color}
    style={{ top, left, right, fontSize: size, letterSpacing: 2, padding: "8px 16px", borderRadius: 10, border: "2px solid currentColor", background: "rgba(12,13,18,0.97)", whiteSpace: "nowrap", opacity: p, transform: `scale(${0.85 + 0.15 * p})`, transformOrigin: left !== undefined ? "0 50%" : "100% 50%" }}
  />
);

/**
 * The maker's committed case page docs/cases/mco-runtime.architecture.html, screenshotted in dark theme at 2×
 * (layout units 1440×820): `map` is the page as it opens, `src` is the same page with Command Router focused
 * (#focus=router), its Semantic passport open on the verified source runtime/cli.py L1945.
 */
export const MCO = {
  map: `${PROOF}/mco-map.png`,
  src: `${PROOF}/mco-router-src.png`,
  natW: 1440,
  natH: 820,
  /** Command Router centre in each shot; the focused view is zoomed 111% vs 100%. */
  routerMap: { x: 513, y: 402 },
  routerSrc: { x: 562, y: 378 },
  zoom: 1.11,
  /** The main row Callers → Entry Surfaces → Command Router, in map units. */
  row: { x: 56, y: 362, w: 556, h: 80 },
  /** Whole diagram frame, map units. */
  frame: { x: 45, y: 105, w: 1351, h: 682 },
  /** VERIFIED SOURCE block (CLI main · runtime/cli.py · L1945), src units. */
  verified: { x: 74, y: 275, w: 254, h: 67 },
  /** The Semantic passport panel, src units. */
  passport: { x: 62, y: 168, w: 350, h: 439 },
};

/**
 * One camera over the MCO page that can show the plain map or the focused view (`focus` 0→1 crossfades),
 * keeping Command Router fixed on screen across the swap so it reads as the panel opening, not a cut.
 * `cx`/`cy`/`scale` are in map units; children are drawn in map units over the map.
 */
export const McoPane: React.FC<{
  pw: number;
  ph: number;
  cx: number;
  cy: number;
  scale: number;
  focus?: number;
  /** extra pan in src units once focused (to travel to the passport) */
  srcCam?: { cx: number; cy: number; scale: number; mix: number };
  dim?: React.ReactNode;
  children?: React.ReactNode;
  srcChildren?: React.ReactNode;
}> = ({ pw, ph, cx, cy, scale, focus = 0, srcCam, dim, children, srcChildren }) => {
  const mapLeft = pw / 2 - cx * scale;
  const mapTop = ph / 2 - cy * scale;
  // Router lands on the same screen point in both shots.
  const rx = mapLeft + MCO.routerMap.x * scale;
  const ry = mapTop + MCO.routerMap.y * scale;
  const s2 = scale / MCO.zoom;
  let srcLeft = rx - MCO.routerSrc.x * s2;
  let srcTop = ry - MCO.routerSrc.y * s2;
  let srcScale = s2;
  if (srcCam && srcCam.mix > 0) {
    const m = srcCam.mix;
    const l2 = pw / 2 - srcCam.cx * srcCam.scale;
    const t2 = ph / 2 - srcCam.cy * srcCam.scale;
    srcLeft = srcLeft + (l2 - srcLeft) * m;
    srcTop = srcTop + (t2 - srcTop) * m;
    srcScale = srcScale + (srcCam.scale - srcScale) * m;
  }
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: pw, height: ph, overflow: "hidden", background: "#070B12" }}>
      {focus < 1 && (
        <div style={{ position: "absolute", left: mapLeft, top: mapTop, width: MCO.natW, height: MCO.natH, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
          <Img src={staticFile(MCO.map)} style={{ width: MCO.natW, height: MCO.natH, display: "block" }} />
          {dim}
          {children}
        </div>
      )}
      {focus > 0 && (
        <div style={{ position: "absolute", left: srcLeft, top: srcTop, width: MCO.natW, height: MCO.natH, transform: `scale(${srcScale})`, transformOrigin: "0 0", opacity: focus }}>
          <Img src={staticFile(MCO.src)} style={{ width: MCO.natW, height: MCO.natH, display: "block" }} />
          {srcChildren}
        </div>
      )}
    </div>
  );
};

/**
 * Dims the MCO map except the main row and (optionally) everything left of `wipe` (map x). Drawn inside McoPane
 * as `dim`: two bright copies of the real screenshot clipped over a darkened one, so nothing is redrawn.
 */
export const McoDim: React.FC<{ amount: number; wipe?: number }> = ({ amount, wipe = 0 }) => {
  if (amount <= 0) return null;
  const r = MCO.row;
  const img = (clip: string) => (
    <Img src={staticFile(MCO.map)} style={{ position: "absolute", left: 0, top: 0, width: MCO.natW, height: MCO.natH, clipPath: clip }} />
  );
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: 0, width: MCO.natW, height: MCO.natH, background: `rgba(4,6,10,${0.72 * amount})` }} />
      {img(`inset(${r.y}px ${MCO.natW - r.x - r.w}px ${MCO.natH - r.y - r.h}px ${r.x}px round 10px)`)}
      {wipe > 0 && img(`inset(0px ${Math.max(0, MCO.natW - wipe)}px 0px 0px)`)}
      {wipe > 0 && wipe < MCO.natW - 10 && (
        <div style={{ position: "absolute", left: wipe - 2, top: MCO.frame.y, width: 4, height: MCO.frame.h, background: C.accent, boxShadow: `0 0 24px 6px ${C.accent}88`, opacity: 0.85 }} />
      )}
    </>
  );
};

/** An editor-style fold of the real file: only the given 1-based line ranges, "⋯" between. `at(n)` maps a line to its row. */
export const fold = (code: string, ranges: [number, number][], dedent = 0) => {
  const lines = code.replace(/\n$/, "").split("\n");
  const out: string[] = [];
  const map = new Map<number, number>();
  ranges.forEach(([a, b], k) => {
    if (k > 0) out.push("⋯");
    for (let n = a; n <= b; n++) {
      out.push(lines[n - 1].slice(Math.min(dedent, lines[n - 1].length - lines[n - 1].trimStart().length)));
      map.set(n, out.length);
    }
  });
  return { text: out.join("\n"), at: (n: number) => map.get(n) ?? 0 };
};

/** The real job-search lifecycle JSON from docs/cases/life (what Claude writes as candidate.json). */
export const useCandidate = () => useProofText(`${PROOF}/job-search.lifecycle.json`);
