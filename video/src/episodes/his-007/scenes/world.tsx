import React from "react";
import { random, spring, useCurrentFrame } from "remotion";
import { C, F, FPS } from "../../../theme";
import { IsoBox, isoFaceMatrix, IsoLabel, IsoPath, isoPoint, IsoPulse, IsoRoof, isoShade, IsoStage, IsoTile, useIsoStage, type IsoStageValue } from "../../../engine/kit";
import { GoogleMapsPin } from "../../../logos";

/**
 * The one isometric city for HIS-007 (Google Maps traffic). 15 × 15 floor grid, illustrative scale.
 * A street grid (avenues + lanes, some broken) that your route follows, gabled houses, flats and towers,
 * a park, your office tower, one Google server block, and the handcart of 99 phones (Berlin, 2020).
 * Every road is cut into short pieces (1.25 units) that tint by live speed; in graph mode each piece becomes
 * a node and pieces that touch are joined by edges. Colour roles: cyan = Google's system / graph, amber = you,
 * phones and pings, green = free-flowing, red = jam.
 */

export type P2 = [number, number];

// ---------------------------------------------------------------- camera

/** A camera: world focus (fx, fy) shown at screen point (sx, sy), `u` px per grid unit. */
export type Cam = { fx: number; fy: number; u: number; sx: number; sy: number };

/** The whole city and your route (hook, intro, future, memory, number, outro). */
export const CITY: Cam = { fx: 7.0, fy: 7.5, u: 36, sx: 520, sy: 850 };
/** Low and near on the lane beside the park (y = 7.5), where the handcart walks (cart). */
export const CLOSE: Cam = { fx: 5.2, fy: 7.5, u: 112, sx: 520, sy: 860 };
/** CLOSE pulled back to show the red trail across two blocks. */
export const CLOSE_WIDE: Cam = { fx: 5.4, fy: 7.3, u: 74, sx: 520, sy: 850 };
/** Close on the main-road block by the Google block (phones). */
export const STREET: Cam = { fx: 8.1, fy: 5.2, u: 105, sx: 470, sy: 930 };
/** Same framing as CITY; the roads are swapped for nodes and edges by the `graph` prop. */
export const GRAPH: Cam = CITY;
/** Where the side lane (x = 7.5) meets the avenue (y = 5) by the Google block (spill). */
export const JUNCTION: Cam = { fx: 7.6, fy: 3.9, u: 110, sx: 540, sy: 830 };

export const mixCam = (a: Cam, b: Cam, p: number): Cam => ({
  fx: a.fx + (b.fx - a.fx) * p,
  fy: a.fy + (b.fy - a.fy) * p,
  sx: a.sx + (b.sx - a.sx) * p,
  sy: a.sy + (b.sy - a.sy) * p,
  u: a.u * Math.pow(b.u / a.u, p),
});

const COS = Math.cos(Math.PI / 6);
const SIN = Math.sin(Math.PI / 6);
export const stageOf = (c: Cam): IsoStageValue => ({ ox: c.sx - (c.fx - c.fy) * COS * c.u, oy: c.sy - (c.fx + c.fy) * SIN * c.u, unit: c.u });
/** Screen point of a world point under a camera (for HTML overlays outside the stage). */
export const camPoint = (c: Cam, x: number, y: number, z = 0) => isoPoint(stageOf(c), x, y, z);

/** Critically damped 0→1 camera move starting at scene-local frame `at`. */
export const useMove = (at: number, dur = 24) => {
  const frame = useCurrentFrame();
  return spring({ frame: frame - at, fps: FPS, config: { damping: 200 }, durationInFrames: dur });
};

// ---------------------------------------------------------------- streets

type Road = { a: P2; b: P2; w: number; avenue?: boolean };

/** Avenues at 5 and 10 both ways; lanes at 2.5 / 7.5 / 12.5, some broken so blocks vary in size. */
export const ROADS: Road[] = [
  { a: [5, 0], b: [5, 15], w: 0.8, avenue: true },
  { a: [10, 0], b: [10, 15], w: 0.8, avenue: true },
  { a: [0, 5], b: [15, 5], w: 0.8, avenue: true },
  { a: [0, 10], b: [15, 10], w: 0.8, avenue: true },
  { a: [2.5, 0], b: [2.5, 15], w: 0.4 },
  { a: [7.5, 0], b: [7.5, 5], w: 0.4 },
  { a: [7.5, 10], b: [7.5, 15], w: 0.4 },
  { a: [12.5, 0], b: [12.5, 10], w: 0.4 },
  { a: [0, 2.5], b: [15, 2.5], w: 0.4 },
  { a: [0, 7.5], b: [10, 7.5], w: 0.4 },
  { a: [0, 12.5], b: [15, 12.5], w: 0.4 },
];

/** A road piece: the unit a phone's speed is averaged over, a graph node, a coloured segment. */
export type Piece = { a: P2; b: P2; m: P2; w: number; road: number };
const PL = 1.25;
export const PIECES: Piece[] = ROADS.flatMap((r, ri) => {
  const v = r.a[0] === r.b[0];
  const len = v ? r.b[1] - r.a[1] : r.b[0] - r.a[0];
  const n = Math.round(len / PL);
  return Array.from({ length: n }, (_, k) => {
    const s0 = (k * len) / n;
    const s1 = ((k + 1) * len) / n;
    const a: P2 = v ? [r.a[0], r.a[1] + s0] : [r.a[0] + s0, r.a[1]];
    const b: P2 = v ? [r.a[0], r.a[1] + s1] : [r.a[0] + s1, r.a[1]];
    return { a, b, m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as P2, w: r.w, road: ri };
  });
});
const same = (p: P2, q: P2) => Math.abs(p[0] - q[0]) < 1e-6 && Math.abs(p[1] - q[1]) < 1e-6;
/** Graph edges: two pieces are neighbours when they share an end (along a road or across an intersection). */
export const EDGES: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let i = 0; i < PIECES.length; i++)
    for (let j = i + 1; j < PIECES.length; j++) {
      const A = PIECES[i];
      const B = PIECES[j];
      if (same(A.a, B.a) || same(A.a, B.b) || same(A.b, B.a) || same(A.b, B.b)) out.push([i, j]);
    }
  return out;
})();
export const pieceAt = (x: number, y: number) => PIECES.findIndex((p) => Math.abs(p.m[0] - x) < 0.01 && Math.abs(p.m[1] - y) < 0.01);

// ---------------------------------------------------------------- buildings

export type Kind = "house" | "flats" | "tower" | "tree" | "google" | "office";
export type Bldg = { kind: Kind; x: number; y: number; w: number; d: number; h: number; roof?: number; ridge?: "x" | "y"; tone?: number };

type Block = { x0: number; x1: number; y0: number; y1: number; low?: "x" | "y"; park?: boolean; special?: boolean };
const XB: Record<string, [number, number]> = { B0: [0.15, 2.2], B1: [2.8, 4.5], B2: [5.5, 7.2], B3: [7.8, 9.5], B4: [10.5, 12.2], B5: [12.8, 14.85], M23: [5.5, 9.5], M45: [10.5, 14.85] };
const YB: Record<string, [number, number]> = { R0: [0.15, 2.2], R1: [2.8, 4.5], R2: [5.5, 7.2], R3: [7.8, 9.5], R4: [10.5, 12.2], R5: [12.8, 14.85], Y23: [5.5, 9.5] };
const blk = (xb: string, yb: string, extra: Partial<Block> = {}): Block => ({ x0: XB[xb][0], x1: XB[xb][1], y0: YB[yb][0], y1: YB[yb][1], ...extra });

/** City blocks. `low` blocks sit in front of your route: only low houses, set back from that road. */
export const BLOCKS: Block[] = [
  ...["B0", "B1", "B2", "B4"].flatMap((x) => ["R0", "R1"].map((y) => blk(x, y))),
  blk("B3", "R0"),
  blk("B3", "R1", { special: true }), // Google block
  blk("B5", "R0"),
  blk("B5", "R1", { special: true }), // your office
  ...["B0", "B1"].flatMap((x) => ["R2", "R3"].map((y) => blk(x, y))),
  blk("M23", "R2", { park: true }),
  blk("M23", "R3", { low: "x" }),
  blk("B4", "Y23", { low: "y" }),
  blk("B5", "Y23"),
  blk("B0", "R4"),
  blk("B0", "R5", { special: true }), // your home
  blk("B1", "R4"),
  blk("B1", "R5", { low: "y" }),
  blk("B2", "R4", { low: "x" }),
  blk("B2", "R5"),
  blk("B3", "R4"),
  blk("B3", "R5"),
  blk("M45", "R4"),
  blk("M45", "R5"),
];

/** The Google block: a server-rack building with the Maps pin on its roof. */
export const GOOG: Bldg = { kind: "google", x: 7.95, y: 2.95, w: 1.4, d: 1.4, h: 1.25 };
/** Your office (the route's end). */
export const OFFICE: Bldg = { kind: "office", x: 13.15, y: 2.95, w: 1.15, d: 1.1, h: 1.9 };
/** Your home (the route's start). */
export const HOME: Bldg = { kind: "house", x: 0.55, y: 12.95, w: 0.95, d: 0.8, h: 0.42, roof: 0.36, ridge: "y", tone: 0 };

const rnd = (k: string) => random(`his7-${k}`);

export const BUILDINGS: Bldg[] = (() => {
  const out: Bldg[] = [GOOG, OFFICE, HOME, { kind: "house", x: 0.5, y: 14.0, w: 0.7, d: 0.6, h: 0.36, roof: 0.28, ridge: "x", tone: 2 }];
  BLOCKS.forEach((b, bi) => {
    if (b.special) return;
    const nx = Math.max(1, Math.round((b.x1 - b.x0) / 0.95));
    const ny = Math.max(1, Math.round((b.y1 - b.y0) / 0.95));
    const cw = (b.x1 - b.x0) / nx;
    const cd = (b.y1 - b.y0) / ny;
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < ny; j++) {
        const k = `${bi}-${i}-${j}`;
        if (b.low === "x" && i === 0) continue;
        if (b.low === "y" && j === 0) continue;
        if (b.park) {
          // Park: a few trees, scattered
          for (let t = 0; t < 2; t++) {
            const tx = b.x0 + i * cw + 0.15 + rnd(`${k}t${t}x`) * (cw - 0.45);
            const ty = b.y0 + j * cd + 0.15 + rnd(`${k}t${t}y`) * (cd - 0.45);
            if (j === 0 && ty < b.y0 + 0.5) continue;
            out.push({ kind: "tree", x: tx, y: ty, w: 0.3, d: 0.3, h: 0.22 + rnd(`${k}t${t}h`) * 0.12 });
          }
          continue;
        }
        if (rnd(`${k}skip`) < 0.22) continue;
        const r = rnd(`${k}kind`);
        const kind: Kind = b.low ? "house" : r < 0.58 ? "house" : r < 0.86 ? "flats" : "tower";
        const w = cw * (0.55 + rnd(`${k}w`) * 0.25);
        const d = cd * (0.55 + rnd(`${k}d`) * 0.25);
        const x = b.x0 + i * cw + (cw - w) * rnd(`${k}x`);
        const y = b.y0 + j * cd + (cd - d) * rnd(`${k}y`);
        const tone = Math.floor(rnd(`${k}tone`) * 4);
        if (kind === "house") out.push({ kind, x, y, w, d, h: 0.28 + rnd(`${k}h`) * (b.low ? 0.08 : 0.18), roof: 0.18 + rnd(`${k}r`) * 0.16, ridge: rnd(`${k}rg`) < 0.5 ? "x" : "y", tone });
        else if (kind === "flats") out.push({ kind, x, y, w, d, h: 0.75 + rnd(`${k}h`) * 0.5, tone });
        else out.push({ kind, x, y, w: Math.min(w, 0.75), d: Math.min(d, 0.75), h: 1.3 + rnd(`${k}h`) * 0.6, tone });
      }
  });
  return out;
})();

// ---------------------------------------------------------------- your route

const SIDE_X = (b: Bldg): P2 => [b.x + b.w + 0.06, b.y + b.d / 2];
export const HOME_DOOR: P2 = SIDE_X(HOME);
export const OFFICE_DOOR: P2 = [OFFICE.x - 0.06, OFFICE.y + OFFICE.d / 2];

/** Your drive: home → lane → avenue x=5 → avenue y=5 (past the Google block) → lane → office. */
export const ROUTE: P2[] = [HOME_DOOR, [2.5, HOME_DOOR[1]], [2.5, 12.5], [5, 12.5], [5, 5], [12.5, 5], [12.5, OFFICE_DOOR[1]], OFFICE_DOOR];

const legLens = (pts: P2[]) => pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
export const ROUTE_LEN = legLens(ROUTE).reduce((a, b) => a + b, 0);

/** Distance along the route of the nearest route point to `p`. */
export const routeDist = (p: P2, pts: P2[] = ROUTE) => {
  const L = legLens(pts);
  let best = 0;
  let bd = Infinity;
  let acc = 0;
  for (let i = 0; i < L.length; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const t = L[i] ? Math.max(0, Math.min(1, ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / (L[i] * L[i]))) : 0;
    const q: P2 = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (d < bd - 1e-9) (bd = d), (best = acc + t * L[i]);
    acc += L[i];
  }
  return best;
};

/** The point at distance `d` along a path. */
export const at = (pts: P2[], d: number): P2 => {
  const L = legLens(pts);
  let left = Math.max(0, d);
  for (let i = 0; i < L.length; i++) {
    if (left <= L[i] || i === L.length - 1) {
      const k = L[i] ? Math.min(1, left / L[i]) : 0;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
    }
    left -= L[i];
  }
  return pts[0];
};

/** The part of a path between distances d0 and d1. */
export const subPath = (pts: P2[], d0: number, d1: number): P2[] => {
  const L = legLens(pts);
  const out: P2[] = [at(pts, d0)];
  let acc = 0;
  for (let i = 0; i < L.length; i++) {
    acc += L[i];
    if (acc > d0 + 1e-6 && acc < d1 - 1e-6) out.push(pts[i + 1]);
  }
  out.push(at(pts, d1));
  return out;
};

/** Road pieces along your route, in driving order (16 of them). */
export const RPIECES: number[] = (() => {
  const out: number[] = [];
  for (let i = 0; i < ROUTE.length - 1; i++) {
    const a = ROUTE[i];
    const b = ROUTE[i + 1];
    const hits = PIECES.map((p, k) => [p, k] as const).filter(([p]) => {
      const onLine = a[0] === b[0] ? Math.abs(p.m[0] - a[0]) < 1e-6 && (p.a[0] === p.b[0]) : Math.abs(p.m[1] - a[1]) < 1e-6 && (p.a[1] === p.b[1]);
      const lo = a[0] === b[0] ? Math.min(a[1], b[1]) : Math.min(a[0], b[0]);
      const hi = a[0] === b[0] ? Math.max(a[1], b[1]) : Math.max(a[0], b[0]);
      const m = a[0] === b[0] ? p.m[1] : p.m[0];
      return onLine && m > lo - 1e-6 && m < hi + 1e-6;
    });
    hits.sort((m, n) => Math.hypot(m[0].m[0] - a[0], m[0].m[1] - a[1]) - Math.hypot(n[0].m[0] - a[0], n[0].m[1] - a[1]));
    for (const [, k] of hits) if (!out.includes(k)) out.push(k);
  }
  return out;
})();

/** Route-piece range of the jam (on avenue y = 5, in front of the Google block). */
export const JAM = [10, 12] as const;
/** The jam stretch on the floor and its distances along the route. */
export const JAM_D0 = routeDist([6.25, 5]);
export const JAM_D1 = routeDist([10, 5]);
export const JAM_PATH: P2[] = subPath(ROUTE, JAM_D0, JAM_D1);

/** Distance along your route of route piece `i`'s middle. */
export const rpieceD = (i: number) => routeDist(PIECES[RPIECES[i]].m);
/** The middle of the jam stretch. */
export const JAM_MID: P2 = at(ROUTE, (JAM_D0 + JAM_D1) / 2);

/** The handcart's lane (y = 7.5, beside the park) and the pieces on it. */
export const CART_LANE: P2[] = [
  [0.4, 7.5],
  [10, 7.5],
];
export const LANE_PIECES: number[] = PIECES.map((p, k) => [p, k] as const)
  .filter(([p]) => p.a[1] === 7.5 && p.b[1] === 7.5)
  .map(([, k]) => k);

// ---------------------------------------------------------------- colours and small pieces

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
export const mixHex = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  const k = Math.max(0, Math.min(1, t));
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, "0")).join("")}`;
};
/** Live-speed colour: 0 free (green) → 0.5 slow (amber) → 1 jam (red). */
export const tintColor = (t: number) => (t <= 0.5 ? mixHex(C.green, C.accent, t * 2) : mixHex(C.accent, C.red, (t - 0.5) * 2));

const WALLS = ["#FFB547", "#F2A03A", "#FFC774", "#E8923A"];
const ROOFS = ["#A35F24", "#7E4A1E", "#B8702E", "#8C5426"];
const FLATS = ["#F7B95C", "#E9A54A", "#FFCB80", "#E39B42"];
const TOWERS = ["#6E7A96", "#5E6A86", "#7A86A2", "#66728E"];

/** A floating chip (number / label) above a world point. `p` 0→1 springs it in. */
export const Chip: React.FC<{
  x: number;
  y: number;
  z?: number;
  text: string;
  color?: string;
  size?: number;
  p?: number;
  lift?: number;
  dx?: number;
  shake?: number;
  dashed?: boolean;
  opacity?: number;
  fill?: string;
}> = ({ x, y, z = 0, text, color = C.text, size = 30, p = 1, lift = 60, dx = 0, shake = 0, dashed, opacity = 1, fill = "rgba(7,8,12,0.92)" }) => {
  const s = useIsoStage();
  if (p <= 0.001 || opacity <= 0.001) return null;
  const pt = isoPoint(s, x, y, z);
  const w = text.length * size * 0.6 + size * 1.2;
  const h = size * 1.7;
  const sc = 0.6 + 0.4 * p;
  return (
    <g transform={`translate(${pt.x + dx + shake},${pt.y - lift}) scale(${sc})`} opacity={Math.min(1, p * 1.6) * opacity}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.28} fill={fill} stroke={color} strokeWidth={2.5} strokeDasharray={dashed ? "8 6" : undefined} />
      <text textAnchor="middle" dominantBaseline="central" fontFamily={F.mono} fontWeight={700} fontSize={size} letterSpacing={1} fill={color}>
        {text}
      </text>
    </g>
  );
};

// ---------------------------------------------------------------- one building

const Face: React.FC<{ b: Bldg; face: "left" | "right"; top: number; children: React.ReactNode }> = ({ b, face, top, children }) => {
  const s = useIsoStage();
  return <g transform={isoFaceMatrix(s, face, b.x, b.y, b.w, b.d, top)}>{children}</g>;
};

const Building: React.FC<{ b: Bldg; detail: number; glow?: number; rack?: number; opacity?: number }> = ({ b, detail, glow = 0, rack = 0, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const tone = b.tone ?? 0;
  const win = "#FFE9B8";
  const det = detail;
  if (b.kind === "tree") {
    return (
      <g opacity={opacity}>
        <IsoBox x={b.x + b.w * 0.4} y={b.y + b.d * 0.4} w={b.w * 0.2} d={b.d * 0.2} h={b.h * 0.5} color="#5A4630" />
        <IsoBox x={b.x} y={b.y} z={b.h * 0.45} w={b.w} d={b.d} h={b.h * 0.8} color="#2F6B52" />
      </g>
    );
  }
  if (b.kind === "house") {
    const wall = WALLS[tone % 4];
    const roof = ROOFS[tone % 4];
    return (
      <g opacity={opacity}>
        <IsoBox x={b.x} y={b.y} w={b.w} d={b.d} h={b.h} color={wall} glow={glow} />
        <IsoRoof x={b.x - 0.03} y={b.y - 0.03} z={b.h} w={b.w + 0.06} d={b.d + 0.06} h={b.roof ?? 0.3} ridge={b.ridge} color={roof} wall={wall} />
        {det > 0.01 && (
          <g opacity={det}>
            <Face b={b} face="left" top={b.h}>
              <rect x={b.w * 0.22} y={b.h - 0.2} width={0.12} height={0.2} fill={isoShade(wall, -0.75)} />
              <rect x={b.w * 0.55} y={b.h * 0.22} width={0.15} height={0.12} fill={win} />
            </Face>
            <Face b={b} face="right" top={b.h}>
              <rect x={b.d * 0.35} y={b.h * 0.22} width={0.15} height={0.12} fill={win} opacity={0.85} />
            </Face>
          </g>
        )}
      </g>
    );
  }
  if (b.kind === "flats" || b.kind === "tower") {
    const wall = b.kind === "flats" ? FLATS[tone % 4] : TOWERS[tone % 4];
    const winC = b.kind === "flats" ? win : "#BFE3FF";
    return (
      <g opacity={opacity}>
        <IsoBox x={b.x} y={b.y} w={b.w} d={b.d} h={b.h} color={wall} />
        {b.kind === "flats" ? (
          <IsoBox x={b.x + 0.08} y={b.y + 0.08} z={b.h} w={b.w * 0.35} d={b.d * 0.35} h={0.08} color={isoShade(wall, -0.2)} />
        ) : (
          <IsoBox x={b.x + b.w * 0.3} y={b.y + b.d * 0.3} z={b.h} w={b.w * 0.4} d={b.d * 0.4} h={0.12} color={isoShade(wall, -0.25)} />
        )}
        {det > 0.01 && (
          <g opacity={det}>
            {(["left", "right"] as const).map((f) => {
              const len = f === "left" ? b.w : b.d;
              const cols = Math.max(2, Math.floor(len / 0.2));
              const rows = Math.max(2, Math.floor(b.h / (b.kind === "tower" ? 0.16 : 0.24)));
              const cells: React.ReactNode[] = [];
              for (let r = 0; r < rows; r++)
                if (b.kind === "tower") cells.push(<rect key={r} x={len * 0.08} y={(b.h / rows) * (r + 0.35)} width={len * 0.84} height={(b.h / rows) * 0.3} fill={winC} opacity={(r + tone) % 3 === 0 ? 0.3 : 0.65} />);
                else
                  for (let c = 0; c < cols; c++)
                    cells.push(<rect key={`${r}-${c}`} x={(len / cols) * (c + 0.3)} y={(b.h / rows) * (r + 0.3)} width={(len / cols) * 0.4} height={(b.h / rows) * 0.36} fill={winC} opacity={(r * 3 + c * 5 + tone) % 4 === 0 ? 0.35 : 0.9} />);
              return (
                <Face key={f} b={b} face={f} top={b.h}>
                  {cells}
                </Face>
              );
            })}
          </g>
        )}
      </g>
    );
  }
  if (b.kind === "office") {
    const wall = "#7C89A8";
    return (
      <g opacity={opacity}>
        <IsoBox x={b.x} y={b.y} w={b.w} d={b.d} h={b.h} color={wall} glow={glow} />
        <IsoBox x={b.x + 0.15} y={b.y + 0.15} z={b.h} w={b.w * 0.45} d={b.d * 0.4} h={0.14} color={isoShade(wall, -0.3)} />
        {(["left", "right"] as const).map((f) => {
          const len = f === "left" ? b.w : b.d;
          const rows = 9;
          return (
            <Face key={f} b={b} face={f} top={b.h}>
              {Array.from({ length: rows }, (_, r) => (
                <rect key={r} x={len * 0.07} y={(b.h / rows) * (r + 0.3)} width={len * 0.86} height={(b.h / rows) * 0.38} fill="#CFE8FF" opacity={r % 3 === 1 ? 0.35 : 0.7} />
              ))}
            </Face>
          );
        })}
      </g>
    );
  }
  // The Google block: dark cyan server hall, rack faces with blinking LEDs, AC units on the roof
  const wall = isoShade(C.cyan, -0.45);
  const rows = 6;
  return (
    <g opacity={opacity}>
      <IsoBox x={b.x} y={b.y} w={b.w} d={b.d} h={b.h} color={wall} glow={glow} />
      {(["left", "right"] as const).map((f) => {
        const len = f === "left" ? b.w : b.d;
        const bays = 4;
        return (
          <Face key={f} b={b} face={f} top={b.h}>
            {Array.from({ length: bays }, (_, i) => (
              <g key={i}>
                <rect x={(len / bays) * (i + 0.1)} y={b.h * 0.12} width={(len / bays) * 0.8} height={b.h * 0.8} fill={isoShade(wall, -0.55)} />
                {Array.from({ length: rows }, (_, r) => {
                  const on = (Math.floor(frame / 5) + i * 3 + r * 7 + (f === "left" ? 0 : 2)) % 5 === 0;
                  return (
                    <g key={r}>
                      <rect x={(len / bays) * (i + 0.16)} y={b.h * (0.16 + r * 0.125)} width={(len / bays) * 0.68} height={b.h * 0.07} fill={isoShade(wall, -0.25)} />
                      <rect x={(len / bays) * (i + 0.2)} y={b.h * (0.175 + r * 0.125)} width={0.035} height={0.035} fill={C.cyan} opacity={0.35 + 0.65 * (on ? Math.max(0.4, rack) : rack * 0.5)} />
                    </g>
                  );
                })}
              </g>
            ))}
            <rect x={0} y={0.04} width={len} height={0.05} fill={C.cyan} opacity={0.45 + 0.5 * rack} />
          </Face>
        );
      })}
      <IsoBox x={b.x + 0.15} y={b.y + 0.2} z={b.h} w={0.35} d={0.3} h={0.12} color={isoShade(wall, -0.2)} />
      <IsoBox x={b.x + 0.15} y={b.y + 0.7} z={b.h} w={0.35} d={0.3} h={0.12} color={isoShade(wall, -0.2)} />
    </g>
  );
};

// ---------------------------------------------------------------- phones and pings

/** A phone in a moving car: a small amber pulse; short tick marks behind it when it's crawling. */
export type Phone = { x: number; y: number; dir?: P2; slow?: number; off?: boolean; id?: string; idP?: number; opacity?: number; offChip?: number };

const PhoneDot: React.FC<{ ph: Phone }> = ({ ph }) => {
  const s = useIsoStage();
  const size = Math.max(3.5, s.unit * 0.075);
  const p = isoPoint(s, ph.x, ph.y, 0.1);
  const col = ph.off ? "#7A7F8C" : C.accent;
  const op = ph.opacity ?? 1;
  if (op <= 0.001) return null;
  const ticks: React.ReactNode[] = [];
  if (!ph.off && (ph.slow ?? 0) > 0.01 && ph.dir) {
    for (let i = 1; i <= 3; i++) {
      const q = isoPoint(s, ph.x - ph.dir[0] * 0.13 * i, ph.y - ph.dir[1] * 0.13 * i, 0.1);
      ticks.push(<circle key={i} cx={q.x} cy={q.y} r={size * (0.5 - i * 0.1)} fill={col} opacity={(0.6 - i * 0.15) * (ph.slow ?? 0)} />);
    }
  }
  return (
    <g opacity={op}>
      {ticks}
      {!ph.off && <circle cx={p.x} cy={p.y} r={size * 2} fill={col} opacity={0.15} />}
      <circle cx={p.x} cy={p.y} r={size} fill={col} style={ph.off ? undefined : { filter: `drop-shadow(0 0 ${size}px ${col})` }} />
      {!ph.off && <circle cx={p.x} cy={p.y} r={size * 0.45} fill="#FFF6E0" />}
    </g>
  );
};

/** Labels over phones (ID tags, OFF chips): drawn on top of the buildings. */
const PhoneTags: React.FC<{ ph: Phone }> = ({ ph }) => {
  const s = useIsoStage();
  const p = isoPoint(s, ph.x, ph.y, 0.1);
  const out: React.ReactNode[] = [];
  const idP = ph.idP ?? 0;
  if (ph.id && idP > 0.01) {
    const w = 84 * idP;
    out.push(
      <g key="id" transform={`translate(${p.x},${p.y - 34})`} opacity={Math.min(1, idP * 2)}>
        <rect x={-w / 2} y={-15} width={w} height={30} rx={8} fill="rgba(7,8,12,0.9)" stroke={C.accent} strokeWidth={1.5} />
        {idP > 0.6 && (
          <text textAnchor="middle" dominantBaseline="central" fontFamily={F.mono} fontWeight={700} fontSize={18} fill={C.accent} opacity={(idP - 0.6) / 0.4}>
            {ph.id}
          </text>
        )}
      </g>,
    );
  }
  if ((ph.offChip ?? 0) > 0.01) {
    const k = ph.offChip ?? 0;
    out.push(
      <g key="off" transform={`translate(${p.x},${p.y - 34}) scale(${0.7 + 0.3 * Math.min(1, k)})`} opacity={Math.min(1, k * 2)}>
        <rect x={-30} y={-15} width={60} height={30} rx={8} fill="rgba(7,8,12,0.9)" stroke="#7A7F8C" strokeWidth={1.5} />
        <text textAnchor="middle" dominantBaseline="central" fontFamily={F.mono} fontWeight={700} fontSize={18} fill="#9AA0AD">
          OFF
        </text>
      </g>,
    );
  }
  return <>{out}</>;
};

/** A ping: a packet arcing up from a phone to the Google block's roof (wireless, so it goes through the air). */
export type Ping = { from: P2; t: number; color?: string };
const PingArc: React.FC<{ pg: Ping }> = ({ pg }) => {
  const s = useIsoStage();
  if (pg.t <= 0 || pg.t >= 1) return null;
  const a = isoPoint(s, pg.from[0], pg.from[1], 0.12);
  const b = isoPoint(s, GOOG.x + GOOG.w / 2, GOOG.y + GOOG.d / 2, GOOG.h + 0.15);
  const c = { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - 60 - s.unit * 0.4 };
  const q = (t: number) => ({ x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * c.x + t * t * b.x, y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * c.y + t * t * b.y });
  const col = pg.color ?? C.accent;
  const head = q(pg.t);
  const tail: string[] = [];
  for (let i = 0; i <= 8; i++) {
    const tt = Math.max(0, pg.t - 0.22 * (i / 8));
    const pt = q(tt);
    tail.push(`${pt.x.toFixed(1)},${pt.y.toFixed(1)}`);
  }
  const r = Math.max(4, s.unit * 0.06);
  return (
    <g>
      <polyline points={tail.join(" ")} fill="none" stroke={col} strokeWidth={r * 0.8} strokeLinecap="round" opacity={0.45} />
      <circle cx={head.x} cy={head.y} r={r} fill={col} style={{ filter: `drop-shadow(0 0 8px ${col})` }} />
    </g>
  );
};

/** Background traffic: phones moving along a few streets so the city is never still. */
const TRAFFIC: { pts: P2[]; n: number; speed: number; off?: number[] }[] = [
  { pts: [[10, 0], [10, 15]], n: 4, speed: 0.0042 },
  { pts: [[15, 10], [0, 10]], n: 4, speed: 0.0038, off: [2] },
  { pts: [[0, 2.5], [15, 2.5]], n: 3, speed: 0.005 },
  { pts: [[2.5, 0], [2.5, 12]], n: 3, speed: 0.0045, off: [1] },
  { pts: [[12.5, 10], [12.5, 0]], n: 2, speed: 0.005 },
  { pts: [[0, 7.5], [10, 7.5]], n: 2, speed: 0.006 },
  { pts: [[5, 0], [5, 4.6]], n: 2, speed: 0.008 },
  { pts: [[15, 5], [10.8, 5]], n: 2, speed: 0.006 },
];
export const trafficPhones = (frame: number, opacity = 1): Phone[] =>
  TRAFFIC.flatMap((r, ri) => {
    const len = legLens(r.pts).reduce((a, b) => a + b, 0);
    const dir: P2 = [(r.pts[1][0] - r.pts[0][0]) / len, (r.pts[1][1] - r.pts[0][1]) / len];
    return Array.from({ length: r.n }, (_, k) => {
      const t = (k / r.n + frame * r.speed + ri * 0.13) % 1;
      const p = at(r.pts, t * len);
      return { x: p[0], y: p[1], dir, off: r.off?.includes(k), opacity };
    });
  });

/** The 8 phones crawling in the jam (they are what turns the road red). `slow` 0→1 slows them down. */
export const jamPhones = (frame: number, slow = 1, opacity = 1): Phone[] => {
  const len = JAM_D1 - JAM_D0;
  const dir: P2 = [1, 0];
  return Array.from({ length: 8 }, (_, k) => {
    const speed = 0.0012 + (1 - slow) * 0.006;
    const t = (k / 8 + frame * speed + (k % 3) * 0.02) % 1;
    const p = at(JAM_PATH, t * len);
    return { x: p[0], y: p[1] + (k % 2 ? 0.14 : -0.14), dir, slow, opacity };
  });
};

// ---------------------------------------------------------------- the World

/** A road piece's paint: live `tint` (0 green … 1 red) shown at `on`; `unknown` = dashed grey (no live data
 * that far ahead); `ghost` = the dashed "usual for this hour" layer in `ghostTint`; `glow` = a pulsing halo. */
export type SegState = { tint?: number; on?: number; unknown?: number; ghost?: number; ghostTint?: number; glow?: number };

/** The handcart: `d` = distance along `path`, `lit` = how many of its 99 phones are lit (0–99), `pull` 0→1 shows the walker. */
export type CartState = { path: P2[]; d: number; lit?: number; opacity?: number; walker?: number };

export type WorldProps = {
  cam: Cam;
  dim?: number;
  /** Your route: draw-on progress and opacity. */
  route?: { progress?: number; opacity?: number };
  /** Live tint per route piece (index into RPIECES). */
  seg?: (i: number) => SegState;
  /** Live tint for any other road piece (index into PIECES), e.g. the handcart's lane. */
  tint?: (pi: number) => SegState | null;
  /** Dashed amber "gap" line from you to the jam, 0→1 drawn on. */
  gap?: number;
  you?: { ring?: number; label?: number; opacity?: number; ghostT?: number | null };
  office?: { label?: number; glow?: number };
  /** `pin` 0 hides the Maps pin (PB-001 uses the block as a generic app server). */
  goog?: { tag?: number; rack?: number; glow?: number; bounce?: number; pin?: number };
  phones?: Phone[];
  pings?: Ping[];
  cart?: CartState;
  /** Graph mode 0→1: road surfaces fade, pieces become nodes, touching pieces get edges. */
  graph?: number;
  nodeColor?: (i: number) => string | null;
  /** Per-node pop-in 0→1 (index into PIECES) and per-edge draw-on 0→1 (index into EDGES); default 1. */
  nodeIn?: (i: number) => number;
  edgeIn?: (k: number) => number;
  /** Message hops: a packet travelling between two piece midpoints. */
  hops?: { a: number; b: number; t: number; color?: string }[];
  /** Fade buildings (graph view). */
  bldg?: number;
  overlay?: React.ReactNode;
  /** Extra blocks on the floor, depth-sorted with the buildings by (x + y) (PB-001's new servers). */
  actors?: { x: number; y: number; node: React.ReactNode }[];
};

const MASK = "linear-gradient(180deg, transparent 0px, transparent 400px, black 500px, black 1190px, transparent 1290px)";
const ROAD = "#1E2230";
const PLOT = "#10131B";

/**
 * The handcart of 99 phones: a wooden bed on two spoked wheels with a long handle, its top packed with
 * 9 × 11 phone dots (dark until lit, then amber), pulled along +x by a plain, faceless walker figure.
 */
const CART_W = 0.78;
const CART_D = 0.5;
const CART_Z = 0.16;
const CART_H = 0.1;
const WOOD = "#9A6A3A";
const Handcart: React.FC<{ c: CartState; frame: number }> = ({ c, frame }) => {
  const s = useIsoStage();
  const p = at(c.path, c.d);
  const op = c.opacity ?? 1;
  if (op <= 0.01) return null;
  // The cart's footprint, centred on its path point, trailing behind (−x) the walker
  const x = p[0] - CART_W - 0.12;
  const y = p[1] - CART_D / 2;
  const lit = c.lit ?? 0;
  const top = CART_Z + CART_H;
  const r = 0.11;
  const spin = c.d / r; // wheel angle, radians
  const dotR = Math.max(1.4, s.unit * 0.021);
  const dots: React.ReactNode[] = [];
  for (let j = 0; j < 9; j++)
    for (let i = 0; i < 11; i++) {
      const k = j * 11 + i;
      const q = isoPoint(s, x + 0.06 + (i + 0.5) * ((CART_W - 0.12) / 11), y + 0.05 + (j + 0.5) * ((CART_D - 0.1) / 9), top + 0.02);
      const on = Math.max(0, Math.min(1, lit - k));
      const flick = on > 0.99 ? 0.85 + 0.15 * Math.sin(frame * 0.5 + k * 1.7) : 1;
      dots.push(<circle key={k} cx={q.x} cy={q.y} r={dotR} fill={on > 0.01 ? C.accent : "#2A2F3D"} opacity={on > 0.01 ? (0.35 + 0.65 * on) * flick : 0.9} />);
    }
  const handA = isoPoint(s, x + CART_W, p[1], top);
  const handB = isoPoint(s, p[0] - 0.02, p[1], 0.42);
  const wheel = (wy: number) => {
    // The wheel stands in the x–z plane: draw a circle in face units and map it with the face's matrix
    const q = isoPoint(s, x + CART_W / 2, wy, r);
    const u = s.unit;
    return (
      <g transform={`matrix(${COS * u},${SIN * u},0,${u},${q.x},${q.y})`}>
        <circle r={r} fill="#3B2A1A" stroke="#C9A06A" strokeWidth={0.022} />
        {[0, 1, 2].map((k) => {
          const a = spin + (k * Math.PI) / 3;
          return <line key={k} x1={-Math.cos(a) * r} y1={-Math.sin(a) * r} x2={Math.cos(a) * r} y2={Math.sin(a) * r} stroke="#C9A06A" strokeWidth={0.016} />;
        })}
      </g>
    );
  };
  return (
    <g opacity={op}>
      {/* soft shadow */}
      <IsoTile x={x - 0.04} y={y - 0.02} w={CART_W + 0.08} d={CART_D + 0.08} color="#000000" opacity={0.35} strokeOpacity={0} />
      {wheel(y)}
      <IsoBox x={x} y={y} z={CART_Z} w={CART_W} d={CART_D} h={CART_H} color={WOOD} />
      {/* low sides */}
      <IsoBox x={x} y={y} z={top} w={CART_W} d={0.04} h={0.06} color={isoShade(WOOD, -0.1)} />
      <IsoBox x={x} y={y} z={top} w={0.04} d={CART_D} h={0.06} color={isoShade(WOOD, -0.1)} />
      {dots}
      <IsoBox x={x} y={y + CART_D - 0.04} z={top} w={CART_W} d={0.04} h={0.06} color={isoShade(WOOD, -0.1)} />
      <IsoBox x={x + CART_W - 0.04} y={y} z={top} w={0.04} d={CART_D} h={0.06} color={isoShade(WOOD, -0.1)} />
      {wheel(y + CART_D)}
      {/* handle */}
      <line x1={handA.x} y1={handA.y} x2={handB.x} y2={handB.y} stroke="#C9A06A" strokeWidth={Math.max(1.5, s.unit * 0.028)} strokeLinecap="round" />
    </g>
  );
};

/** A plain walker: capsule body, round head, muted grey, no face. Bobs slightly as it walks. */
const Walker: React.FC<{ c: CartState }> = ({ c }) => {
  const s = useIsoStage();
  const op = (c.opacity ?? 1) * (c.walker ?? 1);
  if (op <= 0.01) return null;
  const p = at(c.path, c.d);
  const bob = Math.abs(Math.sin(c.d * 9)) * 0.03;
  const foot = isoPoint(s, p[0] + 0.08, p[1], 0);
  const hip = isoPoint(s, p[0] + 0.08, p[1], 0.36 + bob);
  const neck = isoPoint(s, p[0] + 0.08, p[1], 0.62 + bob);
  const head = isoPoint(s, p[0] + 0.08, p[1], 0.74 + bob);
  const w = s.unit * 0.13;
  return (
    <g opacity={op}>
      <ellipse cx={foot.x} cy={foot.y} rx={w * 0.9} ry={w * 0.45} fill="#000" opacity={0.35} />
      <line x1={foot.x - w * 0.25} y1={foot.y} x2={hip.x} y2={hip.y} stroke="#6E7486" strokeWidth={w * 0.45} strokeLinecap="round" />
      <line x1={foot.x + w * 0.25} y1={foot.y} x2={hip.x} y2={hip.y} stroke="#7E8496" strokeWidth={w * 0.45} strokeLinecap="round" />
      <line x1={hip.x} y1={hip.y} x2={neck.x} y2={neck.y} stroke="#8E94A6" strokeWidth={w} strokeLinecap="round" />
      <circle cx={head.x} cy={head.y} r={w * 0.62} fill="#A4AABB" />
    </g>
  );
};

/** World point of the handcart's middle (for pings and chips). */
export const cartMid = (c: CartState): P2 => {
  const p = at(c.path, c.d);
  return [p[0] - CART_W / 2 - 0.12, p[1]];
};

export const World: React.FC<WorldProps> = ({
  cam,
  dim = 1,
  route = { progress: 1, opacity: 0 },
  seg = (): SegState => ({}),
  gap = 0,
  you = {},
  office = {},
  goog = {},
  phones = [],
  pings = [],
  tint = () => null,
  cart,
  graph = 0,
  nodeColor = () => null,
  nodeIn = () => 1,
  edgeIn = () => 1,
  hops = [],
  bldg = 1,
  overlay,
  actors = [],
}) => {
  const frame = useCurrentFrame();
  const st = stageOf(cam);
  const detail = Math.max(0, Math.min(1, (cam.u - 40) / 25));
  const roadOn = 1 - graph;
  const roadPx = (w: number) => Math.max(3, w * cam.u * 0.62);

  // Depth-sorted items: buildings and phones
  const items: { key: number; node: React.ReactNode }[] = [];
  const bOp = bldg * (1 - 0.75 * graph);
  if (bOp > 0.01)
    BUILDINGS.forEach((b, i) => {
      const isG = b === GOOG;
      const isO = b === OFFICE;
      items.push({
        key: b.x + b.w / 2 + b.y + b.d / 2,
        node: <Building key={`b${i}`} b={b} detail={detail} opacity={isG ? Math.max(bOp, 1 - 0.7 * graph) : bOp} glow={isG ? goog.glow ?? 0 : isO ? office.glow ?? 0 : 0} rack={isG ? goog.rack ?? 0 : 0} />,
      });
    });
  phones.forEach((ph, k) => items.push({ key: ph.x + ph.y + 0.02, node: <PhoneDot key={`ph${k}`} ph={ph} /> }));
  if (cart) {
    const m = cartMid(cart);
    items.push({ key: m[0] + m[1] + 0.05, node: <Handcart key="cart" c={cart} frame={frame} /> });
    const p = at(cart.path, cart.d);
    items.push({ key: p[0] + p[1] + 0.1, node: <Walker key="walker" c={cart} /> });
  }
  actors.forEach((a, k) => items.push({ key: a.x + a.y + 0.001 * k, node: <React.Fragment key={`a${k}`}>{a.node}</React.Fragment> }));
  items.sort((a, b) => a.key - b.key);

  // Paint for one road piece (route piece or any other piece)
  const paint = (key: string, p: Piece, sgs: SegState) => {
    const on = (sgs.on ?? 0) * roadOn;
    const unk = (sgs.unknown ?? 0) * roadOn;
    const gh = (sgs.ghost ?? 0) * roadOn;
    const glow = (sgs.glow ?? 0) * roadOn;
    if (on <= 0.01 && unk <= 0.01 && gh <= 0.01) return null;
    const v = p.a[0] === p.b[0];
    const inset = 0.07;
    const a: P2 = v ? [p.a[0], p.a[1] + inset] : [p.a[0] + inset, p.a[1]];
    const b: P2 = v ? [p.b[0], p.b[1] - inset] : [p.b[0] - inset, p.b[1]];
    const col = tintColor(sgs.tint ?? 0);
    return (
      <g key={key}>
        {on > 0.01 && (
          <g opacity={on * (1 - Math.min(1, unk))}>
            <IsoPath points={[a, b]} color={col} width={roadPx(p.w)} glow={glow} />
          </g>
        )}
        {unk > 0.01 && (
          <g opacity={unk}>
            <IsoPath points={[a, b]} color="#8A8F9C" width={Math.max(2, roadPx(p.w) * 0.25)} dashed />
          </g>
        )}
        {gh > 0.01 && (
          <g opacity={gh}>
            <IsoPath points={[a, b]} z={0.03} color={tintColor(sgs.ghostTint ?? 0)} width={Math.max(3, roadPx(p.w) * 1.25)} dashed />
          </g>
        )}
      </g>
    );
  };

  const youP = at(ROUTE, 0);
  const youOp = you.opacity ?? 1;
  const ghostT = you.ghostT;

  return (
    <IsoStage originX={st.ox} originY={st.oy} unit={st.unit} style={{ maskImage: MASK, WebkitMaskImage: MASK }}>
      <g opacity={dim}>
        {/* Plots and streets */}
        {BLOCKS.map((b, k) => (
          <IsoTile key={`b${k}`} x={b.x0 - 0.05} y={b.y0 - 0.05} w={b.x1 - b.x0 + 0.1} d={b.y1 - b.y0 + 0.1} color={b.park ? "#12201A" : PLOT} opacity={1} strokeOpacity={0} />
        ))}
        <g opacity={0.35 + 0.65 * roadOn}>
          {ROADS.map((r, k) => {
            const v = r.a[0] === r.b[0];
            const x = v ? r.a[0] - r.w / 2 : r.a[0] - r.w / 2;
            const y = v ? r.a[1] - r.w / 2 : r.a[1] - r.w / 2;
            const w = v ? r.w : r.b[0] - r.a[0] + r.w;
            const d = v ? r.b[1] - r.a[1] + r.w : r.w;
            return <IsoTile key={`r${k}`} x={Math.max(0, x)} y={Math.max(0, y)} w={Math.min(15, x + w) - Math.max(0, x)} d={Math.min(15, y + d) - Math.max(0, y)} color={ROAD} opacity={1} strokeOpacity={0} />;
          })}
          {ROADS.filter((r) => r.avenue).map((r, k) => (
            <g key={`c${k}`} opacity={0.45 * roadOn}>
              <IsoPath points={[r.a, r.b]} color="#4A5168" width={Math.max(1.5, cam.u * 0.03)} dashed />
            </g>
          ))}
        </g>
        {/* Live tint on other road pieces (the handcart's lane), then on your route's pieces */}
        {PIECES.map((p, pi) => {
          if (RPIECES.includes(pi)) return null;
          const sgs = tint(pi);
          return sgs ? paint(`tp${pi}`, p, sgs) : null;
        })}
        {RPIECES.map((pi, i) => paint(`sg${i}`, PIECES[pi], seg(i)))}
        {/* Your route line */}
        {(route.opacity ?? 0) > 0.01 && (route.progress ?? 1) > 0.001 && (
          <g opacity={(route.opacity ?? 1) * 0.9 * (1 - 0.65 * Math.min(1, gap * 2))}>
            <IsoPath points={ROUTE} color={C.accent} progress={route.progress ?? 1} width={Math.max(3, cam.u * 0.09)} glow={0.7} />
          </g>
        )}
        {/* The gap between you and the jam */}
        {gap > 0.01 && (
          <g opacity={Math.min(1, gap * 3)}>
            <IsoPath points={subPath(ROUTE, 0, JAM_D0)} progress={gap} z={0.12} color="#FFF1D6" width={Math.max(5, cam.u * 0.17)} dashed glow={0.9} />
          </g>
        )}
        {/* Buildings and phones, back to front */}
        {items.map((it) => it.node)}
        {/* Graph mode, drawn over the ghosted buildings (an x-ray view) so no block hides a dot: edges, hops, nodes */}
        {graph > 0.01 && (
          <g opacity={graph}>
            {EDGES.map(([i, j], k) => {
              const e = edgeIn(k);
              if (e <= 0.01) return null;
              return <IsoPath key={`e${k}`} points={[PIECES[i].m, PIECES[j].m]} progress={Math.min(1, e)} color={C.cyan} width={Math.max(1.5, cam.u * 0.05)} />;
            })}
          </g>
        )}
        {hops.map((h, k) => {
          if (h.t <= 0 || h.t >= 1) return null;
          const A = PIECES[h.a].m;
          const B = PIECES[h.b].m;
          const q = isoPoint(st, A[0] + (B[0] - A[0]) * h.t, A[1] + (B[1] - A[1]) * h.t, 0);
          const col = h.color ?? C.text;
          return <circle key={`hop${k}`} cx={q.x} cy={q.y} r={Math.max(4, cam.u * 0.12)} fill={col} style={{ filter: `drop-shadow(0 0 8px ${col})` }} />;
        })}
        {graph > 0.01 && (
          <g opacity={graph}>
            {PIECES.map((p, i) => {
              const k = nodeIn(i);
              if (k <= 0.01) return null;
              const q = isoPoint(st, p.m[0], p.m[1], 0);
              const col = nodeColor(i) ?? C.cyan;
              const r = Math.max(4, cam.u * 0.15) * (p.w > 0.5 ? 1.15 : 0.9) * k;
              return (
                <g key={`n${i}`}>
                  {col !== C.cyan && <circle cx={q.x} cy={q.y} r={r * 2.2} fill={col} opacity={0.25} />}
                  <circle cx={q.x} cy={q.y} r={r} fill={C.bg} stroke={col} strokeWidth={Math.max(2, r * 0.45)} />
                </g>
              );
            })}
          </g>
        )}
        {/* You: a parked amber pulse at your door */}
        {youOp > 0.01 && (
          <g opacity={youOp}>
            <IsoPulse points={ROUTE} t={0} size={Math.max(7, cam.u * 0.2)} ring={you.ring ?? 1} frame={frame} />
          </g>
        )}
        {ghostT != null && ghostT > 0 && ghostT < 1 && (
          <g opacity={0.75}>
            <IsoPulse points={ROUTE} t={ghostT} size={Math.max(6, cam.u * 0.17)} trail={1} trailLen={2.2} frame={frame} />
          </g>
        )}
        {/* Tags on top */}
        {phones.map((ph, k) => (
          <PhoneTags key={`pt${k}`} ph={ph} />
        ))}
        {pings.map((pg, k) => (
          <PingArc key={`pg${k}`} pg={pg} />
        ))}
        {(you.label ?? 0) > 0.01 && youOp > 0.01 && (
          <IsoLabel x={youP[0]} y={youP[1]} z={0.2} text="YOU" color={C.accent} opacity={(you.label ?? 0) * youOp} lift={Math.max(30, cam.u * 0.9)} size={Math.round(Math.max(22, Math.min(30, cam.u * 0.8)))} />
        )}
        {(office.label ?? 0) > 0.01 && (
          <IsoLabel x={OFFICE.x + OFFICE.w / 2} y={OFFICE.y + OFFICE.d / 2} z={OFFICE.h + 0.2} text="OFFICE" color={C.text} opacity={office.label} lift={Math.max(26, cam.u * 0.6)} size={22} />
        )}
        {(goog.pin ?? 1) > 0.01 && (
          <g opacity={goog.pin ?? 1}>
            <GoogleSign tag={goog.tag ?? 0} bounce={goog.bounce ?? 0} />
          </g>
        )}
        {overlay}
      </g>
    </IsoStage>
  );
};

/** Screen-space anchor above the Maps pin on the Google block (for HTML tags placed beside it). */
export const pinTop = (c: Cam) => {
  const st = stageOf(c);
  const top = isoPoint(st, GOOG.x + GOOG.w / 2 + 0.25, GOOG.y + GOOG.d / 2 - 0.1, GOOG.h);
  return { x: top.x, y: top.y - c.u * 0.25 - Math.max(18, c.u * 0.55) };
};

/** The Maps pin standing on the Google block's roof (it hops on `bounce` 0→1), plus the logo tag that pops over it. */
const GoogleSign: React.FC<{ tag: number; bounce: number }> = ({ tag, bounce }) => {
  const s = useIsoStage();
  const top = isoPoint(s, GOOG.x + GOOG.w / 2 + 0.25, GOOG.y + GOOG.d / 2 - 0.1, GOOG.h);
  const pinH = Math.max(18, s.unit * 0.55);
  const pole = s.unit * 0.25;
  const tagP = Math.min(1, tag);
  const tagS = 0.6 + 0.4 * tagP;
  const hop = Math.sin(Math.max(0, Math.min(1, bounce)) * Math.PI) * pinH * 0.6;
  return (
    <g>
      <line x1={top.x} y1={top.y} x2={top.x} y2={top.y - pole} stroke="#9AA3B5" strokeWidth={Math.max(1.5, s.unit * 0.025)} />
      <g transform={`translate(${top.x - pinH * 0.36},${top.y - pole - pinH - hop})`}>
        <GoogleMapsPin height={pinH} />
      </g>
      {tag > 0.01 && (
        <g transform={`translate(${top.x},${top.y - pole - pinH - 40}) scale(${tagS})`} opacity={Math.min(1, tag * 1.6)}>
          <rect x={-74} y={-62} width={148} height={84} rx={20} fill="rgba(7,8,12,0.94)" stroke={C.cyan} strokeWidth={2.5} style={{ filter: `drop-shadow(0 0 14px ${C.cyan}55)` }} />
          <g transform="translate(-58,-48)">
            <GoogleMapsPin height={56} />
          </g>
          <text x={22} y={-18} textAnchor="middle" dominantBaseline="central" fontFamily={F.mono} fontWeight={700} fontSize={18} letterSpacing={1} fill={C.text}>
            GOOGLE
          </text>
          <text x={22} y={4} textAnchor="middle" dominantBaseline="central" fontFamily={F.mono} fontWeight={700} fontSize={18} letterSpacing={1} fill={C.text}>
            MAPS
          </text>
          <path d="M -8 22 L 0 32 L 8 22 Z" fill={C.cyan} />
        </g>
      )}
    </g>
  );
};
