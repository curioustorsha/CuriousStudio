import React from "react";
import { spring, useCurrentFrame } from "remotion";
import { C, F, FPS } from "../../../theme";
import { IsoBox, isoFaceMatrix, IsoLabel, IsoPacket, IsoPath, isoPoint, IsoPoly, IsoPulse, IsoRoof, isoShade, IsoStage, IsoTile, useIsoStage, type IsoStageValue } from "../../../engine/kit";
import { BLINKIT_YELLOW, BlinkitBand } from "../../../logos";

/**
 * The one isometric city for HIS-003. 15 × 15 floor grid, illustrative scale.
 * A real street grid (avenues + lanes) that every route follows; blocks hold houses, flats, Blinkit dark
 * stores and one big warehouse, each drawn as its own kind of building. Each store serves an uneven
 * territory (a weighted Voronoi cell). Every scene draws this same world and changes only the camera and
 * per-building state. Colour roles: cyan = the system (warehouse, stores), amber = homes, orders and the
 * rider (a neon pulse), green = served territory / packed order, red = the slow long route only.
 */

export type P2 = [number, number];

// ---------------------------------------------------------------- camera

/** A camera: world focus (fx, fy) shown at screen point (sx, sy), `u` px per grid unit. */
export type Cam = { fx: number; fy: number; u: number; sx: number; sy: number };

/** Your neighbourhood: S1, your home and the short road between them (hook, clock, end of outro). */
export const CLOSE: Cam = { fx: 2.6, fy: 12.3, u: 112, sx: 520, sy: 820 };
/** S1–S5 and their territories (stores, area). */
export const DISTRICT: Cam = { fx: 6.0, fy: 9.6, u: 46, sx: 520, sy: 800 };
/** The whole city (naive, scale, outro). */
export const CITY: Cam = { fx: 7.5, fy: 7.5, u: 33, sx: 530, sy: 800 };

export const mixCam = (a: Cam, b: Cam, p: number): Cam => ({
  fx: a.fx + (b.fx - a.fx) * p,
  fy: a.fy + (b.fy - a.fy) * p,
  sx: a.sx + (b.sx - a.sx) * p,
  sy: a.sy + (b.sy - a.sy) * p,
  u: a.u * Math.pow(b.u / a.u, p),
});

const COS = Math.cos(Math.PI / 6);
const SIN = Math.sin(Math.PI / 6);
export const stageOf = (c: Cam): IsoStageValue => ({
  ox: c.sx - (c.fx - c.fy) * COS * c.u,
  oy: c.sy - (c.fx + c.fy) * SIN * c.u,
  unit: c.u,
});

/** Critically damped 0→1 camera move starting at scene-local frame `at`. */
export const useMove = (at: number, dur = 24) => {
  const frame = useCurrentFrame();
  return spring({ frame: frame - at, fps: FPS, config: { damping: 200 }, durationInFrames: dur });
};

// ---------------------------------------------------------------- streets

type Road = { a: P2; b: P2; w: number; avenue?: boolean };

/** Avenues at 5 and 10 both ways; lanes at 2.5 / 7.5 / 12.5, some of them broken so blocks vary in size. */
export const ROADS: Road[] = [
  { a: [5, 0], b: [5, 15], w: 0.8, avenue: true },
  { a: [10, 0], b: [10, 15], w: 0.8, avenue: true },
  { a: [0, 5], b: [15, 5], w: 0.8, avenue: true },
  { a: [0, 10], b: [15, 10], w: 0.8, avenue: true },
  { a: [2.5, 0], b: [2.5, 15], w: 0.4 },
  { a: [7.5, 0], b: [7.5, 5], w: 0.4 },
  { a: [7.5, 10], b: [7.5, 15], w: 0.4 },
  { a: [12.5, 5], b: [12.5, 15], w: 0.4 },
  { a: [0, 2.5], b: [15, 2.5], w: 0.4 },
  { a: [0, 7.5], b: [10, 7.5], w: 0.4 },
  { a: [0, 12.5], b: [15, 12.5], w: 0.4 },
];

type Range = [number, number];
const XB: Record<string, Range> = { B0: [0.15, 2.2], B1: [2.8, 4.5], B2: [5.5, 7.2], B3: [7.8, 9.5], B4: [10.5, 12.2], B5: [12.8, 14.85], M23: [5.5, 9.5], M45: [10.5, 14.85] };
const YB: Record<string, Range> = { R0: [0.15, 2.2], R1: [2.8, 4.5], R2: [5.5, 7.2], R3: [7.8, 9.5], R4: [10.5, 12.2], R5: [12.8, 14.85], Y23: [5.5, 9.5] };

/** City blocks (plots between the streets). */
export const BLOCKS: [string, string][] = [
  ...["B0", "B1", "B2", "B3", "M45"].flatMap((x) => ["R0", "R1"].map((y) => [x, y] as [string, string])),
  ...["B0", "B1", "M23"].flatMap((x) => ["R2", "R3"].map((y) => [x, y] as [string, string])),
  ["B4", "Y23"],
  ["B5", "Y23"],
  ...["B0", "B1", "B2", "B3", "B4", "B5"].flatMap((x) => ["R4", "R5"].map((y) => [x, y] as [string, string])),
];

const onRoad = (r: Road, p: P2, eps = 1e-6) => {
  const [x0, x1] = [Math.min(r.a[0], r.b[0]), Math.max(r.a[0], r.b[0])];
  const [y0, y1] = [Math.min(r.a[1], r.b[1]), Math.max(r.a[1], r.b[1])];
  return p[0] >= x0 - eps && p[0] <= x1 + eps && p[1] >= y0 - eps && p[1] <= y1 + eps && (Math.abs(x0 - x1) < eps ? Math.abs(p[0] - x0) < eps : Math.abs(p[1] - y0) < eps);
};

/** The nearest point on any street centreline. */
const snap = (p: P2): P2 => {
  let best: P2 = p;
  let bd = Infinity;
  for (const r of ROADS) {
    const q: P2 = [Math.max(Math.min(r.a[0], r.b[0]), Math.min(Math.max(r.a[0], r.b[0]), p[0])), Math.max(Math.min(r.a[1], r.b[1]), Math.min(Math.max(r.a[1], r.b[1]), p[1]))];
    const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (d < bd) {
      bd = d;
      best = q;
    }
  }
  return best;
};

const BASE_NODES: P2[] = (() => {
  const out: P2[] = [];
  const add = (p: P2) => {
    if (!out.some((q) => Math.abs(q[0] - p[0]) < 1e-6 && Math.abs(q[1] - p[1]) < 1e-6)) out.push(p);
  };
  for (const r of ROADS) {
    add(r.a);
    add(r.b);
    for (const s of ROADS) {
      const v = r.a[0] === r.b[0];
      const h2 = s.a[1] === s.b[1];
      if (v && h2) {
        const p: P2 = [r.a[0], s.a[1]];
        if (onRoad(r, p) && onRoad(s, p)) add(p);
      }
    }
  }
  return out;
})();

/** Shortest street path between two points already on streets. */
const streetPath = (a: P2, b: P2): P2[] => {
  const nodes = [...BASE_NODES, a, b];
  const ia = nodes.length - 2;
  const ib = nodes.length - 1;
  const adj: [number, number][][] = nodes.map(() => []);
  for (const r of ROADS) {
    const on = nodes.map((p, i) => [p, i] as const).filter(([p]) => onRoad(r, p));
    const axis = r.a[0] === r.b[0] ? 1 : 0;
    on.sort((m, n) => m[0][axis] - n[0][axis]);
    for (let k = 1; k < on.length; k++) {
      const d = Math.abs(on[k][0][axis] - on[k - 1][0][axis]);
      adj[on[k][1]].push([on[k - 1][1], d]);
      adj[on[k - 1][1]].push([on[k][1], d]);
    }
  }
  const dist = nodes.map(() => Infinity);
  const prev = nodes.map(() => -1);
  const done = nodes.map(() => false);
  dist[ia] = 0;
  for (;;) {
    let u = -1;
    for (let i = 0; i < nodes.length; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || u === ib) break;
    done[u] = true;
    for (const [v, d] of adj[u]) if (dist[u] + d < dist[v]) (dist[v] = dist[u] + d), (prev[v] = u);
  }
  const path: P2[] = [];
  for (let v = ib; v >= 0; v = prev[v]) path.unshift(nodes[v]);
  return path;
};

const simplify = (pts: P2[]): P2[] => {
  const out: P2[] = [];
  for (const p of pts) {
    const last = out[out.length - 1];
    if (last && Math.abs(last[0] - p[0]) < 1e-6 && Math.abs(last[1] - p[1]) < 1e-6) continue;
    if (out.length >= 2) {
      const a = out[out.length - 2];
      const b = out[out.length - 1];
      const cross = (b[0] - a[0]) * (p[1] - b[1]) - (b[1] - a[1]) * (p[0] - b[0]);
      if (Math.abs(cross) < 1e-6) out.pop();
    }
    out.push(p);
  }
  return out;
};

/** A drivable route from one door to another along the streets, optionally through street points `via`. */
export const route = (from: P2, to: P2, via: P2[] = []): P2[] => {
  const stops = [snap(from), ...via, snap(to)];
  const legs = stops.slice(1).flatMap((s, i) => streetPath(stops[i], s));
  return simplify([from, ...legs, to]);
};

export const routeLength = (pts: P2[]) => pts.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);

// ---------------------------------------------------------------- buildings

export type Kind = "house" | "flats" | "store" | "warehouse";
export type Bldg = { kind: Kind; x: number; y: number; w: number; d: number; h: number; roof?: number; ridge?: "x" | "y"; tone?: number; side?: "+x" | "+y" | "-x" | "-y" };

const place = (xb: string, yb: string, fx: number, fy: number, w: number, d: number): { x: number; y: number; w: number; d: number } => {
  const [x0, x1] = XB[xb];
  const [y0, y1] = YB[yb];
  return { x: x0 + fx * (x1 - x0 - w), y: y0 + fy * (y1 - y0 - d), w, d };
};

const store = (xb: string, yb: string, fx: number, fy: number, w = 1.0, d = 0.9, h = 0.62, side?: Bldg["side"]): Bldg => ({ kind: "store", ...place(xb, yb, fx, fy, w, d), h, side });

/** S1–S5 first (the storyboard's named stores), then S6–S18. */
export const STORES: Bldg[] = [
  store("B1", "R4", 0.5, 0.3, 1.3, 1.1, 0.78, "+y"), // S1, your store
  store("M23", "R2", 0.15, 0.4, 1.1, 1.0, 0.66), // S2
  store("B2", "R4", 0.25, 0.6),
  store("B4", "Y23", 0.4, 0.3, 1.0, 1.0),
  store("B0", "R2", 0.6, 0.5),
  // S6–S18
  store("B1", "R0", 0.5, 0.3),
  store("B2", "R1", 0.3, 0.6),
  store("B3", "R0", 0.7, 0.2),
  store("M45", "R1", 0.7, 0.5, 1.1, 0.9),
  store("B0", "R3", 0.3, 0.8),
  store("M23", "R3", 0.85, 0.5),
  store("B5", "Y23", 0.5, 0.7, 1.0, 1.0),
  store("B3", "R5", 0.3, 0.5),
  store("B4", "R4", 0.2, 0.3),
  store("B5", "R5", 0.7, 0.6),
  store("B1", "R2", 0.6, 0.2),
  store("B3", "R1", 0.8, 0.7),
  store("B0", "R1", 0.2, 0.4),
];

export const WH: Bldg = { kind: "warehouse", ...place("M45", "R0", 0.5, 0.45, 3.3, 1.35), h: 0.95, roof: 0.42, ridge: "x", side: "+y" };
export const H0: Bldg = { kind: "house", ...place("B0", "R5", 0.55, 0.4, 0.85, 0.8), h: 0.5, roof: 0.38, ridge: "y", tone: 0, side: "+x" };

type Lot = [string, string, number, number, number, number, "h" | "f", number?, ("x" | "y")?];
const LOTS: Lot[] = [
  ["B0", "R0", 0.1, 0.15, 0.7, 0.6, "h", 0.42, "x"],
  ["B0", "R0", 0.85, 0.8, 0.7, 0.7, "f", 1.0],
  ["B1", "R0", 0.1, 0.95, 0.6, 0.5, "h", 0.4, "y"],
  ["B2", "R0", 0.15, 0.2, 0.7, 0.6, "h", 0.45, "x"],
  ["B2", "R0", 0.8, 0.85, 0.6, 0.7, "h", 0.4, "y"],
  ["B3", "R0", 0.05, 0.9, 0.6, 0.6, "h", 0.4, "x"],
  ["B0", "R1", 0.95, 0.3, 0.6, 0.6, "h", 0.45, "y"],
  ["B1", "R1", 0.2, 0.3, 0.7, 0.7, "f", 1.1],
  ["B1", "R1", 0.9, 0.9, 0.55, 0.55, "h", 0.38, "x"],
  ["B2", "R1", 1, 0.1, 0.4, 0.5, "h", 0.5, "y"],
  ["B3", "R1", 0, 0, 0.6, 0.55, "h", 0.4, "x"],
  ["M45", "R1", 0.05, 0.3, 0.7, 0.6, "h", 0.42, "y"],
  ["M45", "R1", 0.35, 0.5, 0.7, 0.7, "f", 0.9],
  ["M45", "R1", 1, 0.6, 0.6, 0.6, "h", 0.4, "x"],
  ["B0", "R2", 0, 0, 0.55, 0.5, "h", 0.38, "x"],
  ["B1", "R2", 0.1, 1, 0.6, 0.5, "h", 0.4, "x"],
  ["M23", "R2", 0.6, 0.2, 0.8, 0.8, "f", 1.2],
  ["M23", "R2", 1, 0.8, 0.65, 0.6, "h", 0.42, "y"],
  ["B0", "R3", 0.9, 0.05, 0.6, 0.55, "h", 0.4, "y"],
  ["B1", "R3", 0.1, 0.15, 0.65, 0.6, "h", 0.45, "y"],
  ["B1", "R3", 0.85, 0.8, 0.6, 0.6, "f", 1.0],
  ["M23", "R3", 0.05, 0.2, 0.7, 0.6, "h", 0.42, "x"],
  ["M23", "R3", 0.4, 0.8, 0.6, 0.55, "h", 0.4, "y"],
  ["B4", "Y23", 0.2, 0, 0.6, 0.6, "h", 0.42, "x"],
  ["B4", "Y23", 0.5, 1, 0.7, 0.7, "f", 1.1],
  ["B5", "Y23", 0.1, 0.1, 0.6, 0.6, "h", 0.42, "y"],
  ["B5", "Y23", 0.9, 0.2, 0.55, 0.55, "h", 0.38, "x"],
  ["B5", "Y23", 0.1, 1, 0.6, 0.5, "h", 0.4, "x"],
  ["B0", "R4", 0.1, 0.1, 0.65, 0.6, "h", 0.45, "x"],
  ["B0", "R4", 0.9, 0.7, 0.6, 0.6, "h", 0.4, "y"],
  ["B0", "R4", 0.1, 1, 0.5, 0.45, "h", 0.36, "x"],
  ["B0", "R5", 0, 0, 0.5, 0.45, "h", 0.35, "x"],
  ["B0", "R5", 0.05, 1, 0.55, 0.5, "h", 0.38, "y"],
  // (B1, R5) sits in front of the S1 → home road in the CLOSE view: keep it low and to the side
  ["B1", "R5", 1, 1, 0.5, 0.45, "h", 0.34, "x"],
  ["B2", "R4", 1, 0, 0.45, 0.55, "h", 0.4, "y"],
  ["B3", "R4", 0.1, 0.2, 0.7, 0.6, "h", 0.45, "x"],
  ["B3", "R4", 0.9, 0.9, 0.6, 0.6, "f", 1.2],
  ["B2", "R5", 0.1, 0.1, 0.6, 0.55, "h", 0.4, "y"],
  ["B2", "R5", 0.9, 0.8, 0.6, 0.6, "h", 0.45, "x"],
  ["B3", "R5", 1, 0, 0.5, 0.45, "h", 0.36, "y"],
  ["B4", "R4", 1, 1, 0.5, 0.45, "h", 0.36, "x"],
  ["B5", "R4", 0.1, 0.15, 0.65, 0.6, "h", 0.42, "x"],
  ["B5", "R4", 0.85, 0.85, 0.65, 0.65, "f", 1.3],
  ["B4", "R5", 0.1, 0.1, 0.6, 0.55, "h", 0.42, "x"],
  ["B4", "R5", 0.8, 0.9, 0.6, 0.6, "h", 0.4, "y"],
  ["B5", "R5", 0, 0, 0.6, 0.55, "h", 0.4, "y"],
];

/** Every other home: gabled houses of different sizes, roof directions and colours, and a few blocks of flats. */
export const HOMES: Bldg[] = LOTS.map(([xb, yb, fx, fy, w, d, k, h = 0.4, ridge = "x"], i) =>
  k === "f"
    ? { kind: "flats", ...place(xb, yb, fx, fy, w, d), h, tone: i % 3 }
    : { kind: "house", ...place(xb, yb, fx, fy, w, d), h: h * 0.85, roof: 0.22 + ((i * 7) % 5) * 0.04, ridge, tone: (i * 5) % 4 },
);

const SIDES = { "+y": (b: Bldg): P2 => [b.x + b.w / 2, b.y + b.d], "+x": (b: Bldg): P2 => [b.x + b.w, b.y + b.d / 2], "-y": (b: Bldg): P2 => [b.x + b.w / 2, b.y], "-x": (b: Bldg): P2 => [b.x, b.y + b.d / 2] };
const OUT = { "+y": [0, 1], "+x": [1, 0], "-y": [0, -1], "-x": [-1, 0] } as const;

/** The door: the middle of the side that faces the nearest street, just outside the wall. */
export const door = (b: Bldg, out = 0.06): P2 => {
  const side =
    b.side ??
    (Object.keys(SIDES) as (keyof typeof SIDES)[]).reduce((best, s) => {
      const p = SIDES[s](b);
      const q = snap(p);
      const pb = SIDES[best](b);
      const qb = snap(pb);
      return Math.hypot(q[0] - p[0], q[1] - p[1]) < Math.hypot(qb[0] - pb[0], qb[1] - pb[1]) ? s : best;
    }, "+y" as keyof typeof SIDES);
  const p = SIDES[side](b);
  return [p[0] + OUT[side][0] * out, p[1] + OUT[side][1] * out];
};

/** R1, the short ride S1 → your home, along the lanes. */
export const R1: P2[] = route(door(STORES[0]), door(H0));
/** R0, the long way: warehouse → your home, across the city on the avenues. */
export const R0: P2[] = route(door(WH), door(H0), [[10, 2.5], [10, 5], [5, 5], [5, 10], [2.5, 10]]);

// ---------------------------------------------------------------- territories

/** Reach weights: bigger = the store's territory pushes further. Uneven on purpose. */
const REACH = [2.6, 1.4, 0.6, 2.4, 1.2, 0.4, 1.8, 0.8, 2.2, 1.0, 1.6, 0.6, 1.4, 0.4, 2.0, 0.8, 1.2, 0.6];
const centre = (b: Bldg): P2 => [b.x + b.w / 2, b.y + b.d / 2];

const clip = (poly: P2[], a: P2, c: number): P2[] => {
  const out: P2[] = [];
  const f = (p: P2) => p[0] * a[0] + p[1] * a[1] - c;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const fp = f(p);
    const fq = f(q);
    if (fp <= 0) out.push(p);
    if (fp * fq < 0) {
      const t = fp / (fp - fq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  return out;
};

/** Each store's service territory: a weighted Voronoi (power) cell, inset so neighbours show a seam. */
export const TERRITORY: P2[][] = STORES.map((b, i) => {
  const si = centre(b);
  const m = 0.1;
  let poly: P2[] = [[m, m], [15 - m, m], [15 - m, 15 - m], [m, 15 - m]];
  STORES.forEach((o, j) => {
    if (j === i) return;
    const sj = centre(o);
    const a: P2 = [sj[0] - si[0], sj[1] - si[1]];
    const c = (sj[0] ** 2 + sj[1] ** 2 - si[0] ** 2 - si[1] ** 2 - REACH[j] + REACH[i]) / 2 - m * Math.hypot(a[0], a[1]);
    poly = clip(poly, a, c);
  });
  return poly;
});

/** Which store serves a point. */
export const servedBy = (p: P2) => {
  let best = 0;
  let bd = Infinity;
  STORES.forEach((b, k) => {
    const c = centre(b);
    const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 - REACH[k];
    if (d < bd) (bd = d), (best = k);
  });
  return best;
};

/** Homes per store (indices into HOMES). */
export const STORE_HOMES: number[][] = STORES.map((_, k) => HOMES.map((h, i) => (servedBy(centre(h)) === k ? i : -1)).filter((i) => i >= 0));

/** Empty plots for planned stores (3,500+): free spots inside blocks, clear of every building. */
export const PLANNED: P2[] = (() => {
  const all = [...STORES, ...HOMES, WH, H0];
  const free: P2[] = [];
  for (const [xb, yb] of BLOCKS) {
    const [x0, x1] = XB[xb];
    const [y0, y1] = YB[yb];
    for (let x = x0; x + 0.6 <= x1 + 1e-6; x += 0.35)
      for (let y = y0; y + 0.6 <= y1 + 1e-6; y += 0.35) {
        const hit = all.some((b) => x < b.x + b.w + 0.1 && x + 0.6 > b.x - 0.1 && y < b.y + b.d + 0.1 && y + 0.6 > b.y - 0.1);
        const near = free.some((p) => Math.hypot(p[0] - x, p[1] - y) < 2.4);
        if (!hit && !near) free.push([x, y]);
      }
  }
  return free;
})();

// ---------------------------------------------------------------- colours and small pieces

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
export const mixHex = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  const k = Math.max(0, Math.min(1, t));
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, "0")).join("")}`;
};

const WALLS = ["#FFB547", "#F2A03A", "#FFC774", "#E8923A"];
const ROOFS = ["#A35F24", "#7E4A1E", "#B8702E", "#8C5426"];
const FLATS = ["#F7B95C", "#E9A54A", "#FFCB80"];
const dimOf = (c: string) => isoShade(c, -0.6);

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
}> = ({ x, y, z = 0, text, color = C.text, size = 30, p = 1, lift = 60, dx = 0, shake = 0, dashed, opacity = 1 }) => {
  const s = useIsoStage();
  if (p <= 0.001 || opacity <= 0.001) return null;
  const pt = isoPoint(s, x, y, z);
  const w = text.length * size * 0.6 + size * 1.2;
  const h = size * 1.7;
  const sc = 0.6 + 0.4 * p;
  return (
    <g transform={`translate(${pt.x + dx + shake},${pt.y - lift}) scale(${sc})`} opacity={Math.min(1, p * 1.6) * opacity}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.28} fill="rgba(7,8,12,0.92)" stroke={color} strokeWidth={2.5} strokeDasharray={dashed ? "8 6" : undefined} />
      <text textAnchor="middle" dominantBaseline="central" fontFamily={F.mono} fontWeight={700} fontSize={size} letterSpacing={1} fill={color}>
        {text}
      </text>
    </g>
  );
};

/** A packed order: a small green parcel at a world point (groceries going onto the rider). */
export const Parcel: React.FC<{ x: number; y: number; z?: number; scale?: number; opacity?: number }> = ({ x, y, z = 0, scale = 1, opacity = 1 }) => {
  if (scale <= 0.001 || opacity <= 0.001) return null;
  const k = 0.22 * scale;
  return <IsoBox x={x - k / 2} y={y - k / 2} z={z} w={k} d={k} h={k * 0.8} color={C.green} opacity={opacity} />;
};

export type Tag = { text: string; color?: string; p: number; shake?: number; dy?: number; scale?: number; logo?: boolean };

/** The rider's tags: the speed tag on top, an optional second line (with the Blinkit logo) under it. */
const RiderTags: React.FC<{ points: P2[]; t: number; tag?: Tag; sub?: Tag; opacity?: number }> = ({ points, t, tag, sub, opacity = 1 }) => {
  const s = useIsoStage();
  if (opacity <= 0.001) return null;
  const a = isoAlongP(points, t);
  const pt = isoPoint(s, a[0], a[1], 0.12);
  const tagSize = 30;
  const subH = sub ? Math.min(1, sub.p) * 50 : 0;
  const tagLift = 62 + subH;
  return (
    <g opacity={opacity}>
      {sub && sub.p > 0.001 && (
        <g transform={`translate(${pt.x},${pt.y - 50 + (sub.dy ?? 0)}) scale(${1 + 0.35 * Math.max(0, 1 - sub.p)})`} opacity={Math.min(1, sub.p * 1.5)}>
          <rect x={-128} y={-21} width={256} height={42} rx={10} fill="rgba(7,8,12,0.94)" stroke={sub.color ?? C.muted} strokeWidth={2} />
          {sub.logo ? (
            <>
              <g transform={`translate(-118,-15) scale(${96 / 3500})`}>
                <BlinkitBand rx={260} />
              </g>
              <text x={50} textAnchor="middle" dominantBaseline="central" fontFamily={F.mono} fontWeight={700} fontSize={19} letterSpacing={2} fill={sub.color ?? C.muted}>
                {sub.text}
              </text>
            </>
          ) : (
            <text textAnchor="middle" dominantBaseline="central" fontFamily={F.mono} fontWeight={700} fontSize={19} letterSpacing={2} fill={sub.color ?? C.muted}>
              {sub.text}
            </text>
          )}
        </g>
      )}
      {tag && tag.p > 0.001 && (
        <g
          transform={`translate(${pt.x + (tag.shake ?? 0)},${pt.y - tagLift * (tag.scale ?? 1) + (1 - Math.min(1, tag.p)) * -70 + (tag.dy ?? 0)}) scale(${tag.scale ?? 1})`}
          opacity={Math.min(1, tag.p * 2)}
        >
          <rect
            x={-(tag.text.length * tagSize * 0.6 + 34) / 2}
            y={-28}
            width={tag.text.length * tagSize * 0.6 + 34}
            height={56}
            rx={14}
            fill="rgba(7,8,12,0.94)"
            stroke={tag.color ?? C.accent}
            strokeWidth={3}
            style={{ filter: `drop-shadow(0 0 14px ${(tag.color ?? C.accent)}55)` }}
          />
          <text textAnchor="middle" dominantBaseline="central" fontFamily={F.display} fontWeight={700} fontSize={tagSize + 4} fill={tag.color ?? C.accent}>
            {tag.text}
          </text>
          <path d={`M -9 28 L 0 40 L 9 28 Z`} fill={tag.color ?? C.accent} />
        </g>
      )}
    </g>
  );
};

const isoAlongP = (points: P2[], t: number): P2 => {
  const segs = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  const total = segs.reduce((a, b) => a + b, 0);
  let left = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < segs.length; i++) {
    if (left <= segs[i] || i === segs.length - 1) {
      const k = segs[i] ? Math.min(1, left / segs[i]) : 0;
      return [points[i][0] + (points[i + 1][0] - points[i][0]) * k, points[i][1] + (points[i + 1][1] - points[i][1]) * k];
    }
    left -= segs[i];
  }
  return points[0];
};
export const along = isoAlongP;

/** The rider: a neon amber pulse on the streets (trail while moving, sonar ring while parked). */
export type Rider = { points: P2[]; t: number; tag?: Tag; sub?: Tag; load?: number; opacity?: number; moving?: number; parked?: number };

// ---------------------------------------------------------------- one building

type BState = { rise?: number; drop?: number; lit?: number; glow?: number; opacity?: number; dark?: number; xray?: number };

const Face: React.FC<{ b: Bldg; face: "left" | "right"; top: number; children: React.ReactNode }> = ({ b, face, top, children }) => {
  const s = useIsoStage();
  return <g transform={isoFaceMatrix(s, face, b.x, b.y, b.w, b.d, top)}>{children}</g>;
};

const Building: React.FC<{ b: Bldg; st: BState; detail: number }> = ({ b, st, detail }) => {
  const s = useIsoStage();
  const { rise = 1, drop = 0, lit = 1, glow = 0, opacity = 1, dark = 0, xray = 0 } = st;
  if (rise <= 0.001 || opacity <= 0.001) return null;
  const h = b.h * Math.min(1.05, rise);
  const lift = drop * 4 * s.unit;
  const det = detail > 0.01 && rise > 0.9 ? detail : 0;
  const shadow = drop > 0.001 ? <IsoTile x={b.x - 0.05} y={b.y - 0.05} w={b.w + 0.1} d={b.d + 0.1} color="#000000" opacity={0.5 * (1 - Math.min(1, drop))} strokeOpacity={0} /> : null;

  if (b.kind === "house" || b.kind === "flats") {
    const tone = b.tone ?? 0;
    const wallLit = b.kind === "flats" ? FLATS[tone % 3] : WALLS[tone % 4];
    const wall = mixHex(dimOf(wallLit), wallLit, lit);
    const roof = mixHex(dimOf(ROOFS[tone % 4]), ROOFS[tone % 4], lit);
    const win = mixHex("#2A2418", "#FFE9B8", lit);
    const roofH = (b.roof ?? 0.3) * Math.min(1, rise);
    return (
      <g opacity={opacity}>
        <IsoBox x={b.x} y={b.y} w={b.w} d={b.d} h={h} color={wall} glow={glow} />
        {b.kind === "house" ? (
          <IsoRoof x={b.x - 0.03} y={b.y - 0.03} z={h} w={b.w + 0.06} d={b.d + 0.06} h={roofH} ridge={b.ridge} color={roof} wall={wall} />
        ) : (
          <IsoBox x={b.x + 0.08} y={b.y + 0.08} z={h} w={b.w * 0.35} d={b.d * 0.35} h={0.1} color={isoShade(wall, -0.2)} />
        )}
        {det > 0 && (
          <g opacity={det}>
            {b.kind === "house" ? (
              <>
                <Face b={b} face="left" top={h}>
                  <rect x={b.w * 0.22} y={h - 0.22} width={0.13} height={0.22} fill={isoShade(wall, -0.75)} />
                  <rect x={b.w * 0.55} y={h * 0.25} width={0.16} height={0.13} fill={win} />
                </Face>
                <Face b={b} face="right" top={h}>
                  <rect x={b.d * 0.35} y={h * 0.25} width={0.16} height={0.13} fill={win} opacity={0.85} />
                </Face>
              </>
            ) : (
              <>
                {(["left", "right"] as const).map((f) => {
                  const len = f === "left" ? b.w : b.d;
                  const cols = Math.max(2, Math.floor(len / 0.2));
                  const rows = Math.max(2, Math.floor(h / 0.24));
                  const cells: React.ReactNode[] = [];
                  for (let r = 0; r < rows; r++)
                    for (let c = 0; c < cols; c++)
                      cells.push(<rect key={`${r}-${c}`} x={(len / cols) * (c + 0.3)} y={(h / rows) * (r + 0.3)} width={(len / cols) * 0.4} height={(h / rows) * 0.36} fill={win} opacity={(r * 3 + c * 5 + tone) % 4 === 0 ? 0.35 : 0.9} />);
                  return (
                    <Face key={f} b={b} face={f} top={h}>
                      {cells}
                    </Face>
                  );
                })}
              </>
            )}
          </g>
        )}
      </g>
    );
  }

  if (b.kind === "warehouse") {
    const wall = isoShade(C.cyan, -0.38);
    const roof = isoShade(C.cyan, -0.15);
    const roofH = (b.roof ?? 0.4) * Math.min(1, rise);
    return (
      <g opacity={opacity}>
        <IsoBox x={b.x} y={b.y} w={b.w} d={b.d} h={h} color={wall} />
        <IsoRoof x={b.x - 0.04} y={b.y - 0.04} z={h} w={b.w + 0.08} d={b.d + 0.08} h={roofH} ridge="x" color={roof} wall={wall} />
        {rise > 0.9 && (
          <Face b={b} face="left" top={h}>
            {[0, 1, 2, 3].map((i) => (
              <g key={i}>
                <rect x={0.3 + i * 0.78} y={h - 0.5} width={0.5} height={0.5} fill={isoShade(wall, -0.65)} />
                {[1, 2, 3].map((l) => (
                  <line key={l} x1={0.3 + i * 0.78} x2={0.8 + i * 0.78} y1={h - 0.5 + l * 0.12} y2={h - 0.5 + l * 0.12} stroke={isoShade(wall, -0.3)} strokeWidth={0.025} />
                ))}
              </g>
            ))}
            <rect x={0} y={0.08} width={b.w} height={0.06} fill={C.cyan} opacity={0.5} />
          </Face>
        )}
      </g>
    );
  }

  // Dark store: a flat-roofed shop with a Blinkit sign over a roller shutter. Goes "dark" (darker, no
  // glow) and can go x-ray to show its racks.
  const wall = mixHex(C.cyan, isoShade(C.cyan, -0.35), dark);
  const signW = b.d * 0.84;
  return (
    <g>
      {shadow}
      <g transform={`translate(0,${-lift})`}>
        <g opacity={opacity * (1 - 0.7 * xray)}>
          <IsoBox x={b.x} y={b.y} w={b.w} d={b.d} h={h} color={wall} glow={glow} />
          <IsoBox x={b.x + 0.12} y={b.y + 0.1} z={h} w={0.3} d={0.25} h={0.12} color={isoShade(wall, -0.25)} />
          {rise > 0.9 && (
            <>
              {/* Shutter on the street side (where the rider waits), the Blinkit sign on the other wall so tags never cover it */}
              <Face b={b} face="left" top={h}>
                <rect x={b.w * 0.25} y={h * 0.35} width={b.w * 0.5} height={h * 0.65} fill={isoShade(wall, -0.7)} />
                {[1, 2, 3, 4, 5].map((l) => (
                  <line key={l} x1={b.w * 0.25} x2={b.w * 0.75} y1={h * 0.35 + (l * h * 0.65) / 6} y2={h * 0.35 + (l * h * 0.65) / 6} stroke={isoShade(wall, -0.45)} strokeWidth={0.02} />
                ))}
                <rect x={b.w * 0.25} y={h * 0.12} width={b.w * 0.5} height={h * 0.12} fill={BLINKIT_YELLOW} opacity={0.85} />
              </Face>
              <Face b={b} face="right" top={h}>
                <g transform={`translate(${(b.d - signW) / 2},${h * 0.12}) scale(${signW / 3500})`}>
                  <BlinkitBand rx={140} />
                </g>
              </Face>
            </>
          )}
        </g>
      </g>
    </g>
  );
};

/**
 * A new store being built, cued to frame `at`: its plot outline shows first, then the building drops onto
 * it with a bounce, a ring spreads on landing and its territory grows out from it.
 */
export const dropIn = (frame: number, at: number, terrDelay = 6): Required<Pick<StoreState, "rise" | "drop" | "ring" | "plot">> & { terr: number } => {
  const sp = frame < at ? 0 : spring({ frame: frame - at, fps: FPS, config: { damping: 13, stiffness: 190 } });
  const plot = frame < at - 8 ? 0 : Math.min(1, (frame - at + 8) / 6) * (1 - Math.max(0, Math.min(1, (frame - at - 10) / 8)));
  const ring = frame < at + 6 ? 0 : Math.min(1, (frame - at - 6) / 18);
  const tg = frame < at + terrDelay ? 0 : Math.min(1, (frame - at - terrDelay) / 22);
  return { rise: frame >= at ? 1 : 0, drop: Math.max(0, 1 - sp), ring, plot, terr: tg };
};

// ---------------------------------------------------------------- the World

/** A floor link: a street route, optionally with a packet travelling on it. */
export type Link = { points: P2[]; progress?: number; t?: number | null; color?: string; dashed?: boolean; opacity?: number; size?: number; glow?: number; width?: number };
/** Anything that moves on the floor, depth-sorted with the buildings. */
export type Actor = { x: number; y: number; node: React.ReactNode };
/** Per-store state. `drop` > 0 lifts it above its plot (it lands as drop → 0); `ring` 0→1 is the landing ring. */
export type StoreState = { rise?: number; drop?: number; glow?: number; ring?: number; plot?: number; opacity?: number };

export type WorldProps = {
  cam: Cam;
  /** Whole-world opacity (outro dimming). */
  dim?: number;
  /** Territory fill per store 0→1 (it grows out from the store). */
  terr?: (k: number) => number;
  /** Homes lit per serving store: (store, home index) → 0..1. */
  homeLit?: (store: number, home: number) => number;
  h0?: { rise?: number; lit?: number; pulse?: number; label?: number };
  wh?: { rise: number; label?: number };
  store?: (k: number) => StoreState;
  /** S1 going "dark": darker walls, x-ray with racks, its label. */
  s1?: { dark?: number; xray?: number; label?: number };
  r0?: { progress: number; opacity?: number; dashed?: boolean };
  r1?: { progress: number; opacity?: number };
  planned?: number;
  links?: Link[];
  floor?: React.ReactNode;
  actors?: Actor[];
  rider?: Rider;
  overlay?: React.ReactNode;
};

const MASK = "linear-gradient(180deg, transparent 0px, transparent 400px, black 500px, black 1190px, transparent 1290px)";
const ROAD = "#1E2230";
const PLOT = "#10131B";

const RiderPulse: React.FC<{ r: Rider }> = ({ r }) => {
  const frame = useCurrentFrame();
  const s = useIsoStage();
  const size = Math.max(8, s.unit * 0.13);
  const a = isoAlongP(r.points, r.t);
  const p = isoPoint(s, a[0], a[1], 0.12);
  return (
    <g opacity={r.opacity ?? 1}>
      <IsoPulse points={r.points} t={r.t} size={size} trail={r.moving ?? 0} trailLen={Math.max(0.8, 90 / s.unit)} ring={r.parked ?? 0} frame={frame} />
      {(r.load ?? 0) > 0.001 && <circle cx={p.x} cy={p.y} r={size * 1.55 * Math.min(1.15, r.load ?? 0)} fill="none" stroke={C.green} strokeWidth={3} style={{ filter: `drop-shadow(0 0 6px ${C.green})` }} />}
    </g>
  );
};

export const World: React.FC<WorldProps> = ({
  cam,
  dim = 1,
  terr = () => 0,
  homeLit = () => 0,
  h0 = {},
  wh = { rise: 0 },
  store = (k: number): StoreState => ({ rise: k === 0 ? 1 : 0 }),
  s1 = {},
  r0 = { progress: 0 },
  r1 = { progress: 1 },
  planned = 0,
  links = [],
  floor,
  actors = [],
  rider,
  overlay,
}) => {
  const st = stageOf(cam);
  const detail = Math.max(0, Math.min(1, (cam.u - 40) / 25));
  const items: { key: number; node: React.ReactNode }[] = [];
  const depth = (b: Bldg) => b.x + b.w / 2 + b.y + b.d / 2;
  const lane = Math.max(1.5, cam.u * 0.035);

  // Homes, lit by the store that serves them
  STORES.forEach((_, k) =>
    STORE_HOMES[k].forEach((i, n) => {
      const b = HOMES[i];
      items.push({ key: depth(b), node: <Building key={`h${i}`} b={b} st={{ lit: homeLit(k, n) }} detail={detail} /> });
    }),
  );
  // Your home
  items.push({
    key: depth(H0),
    node: (
      <g key="h0">
        <Building b={H0} st={{ rise: h0.rise ?? 1, lit: h0.lit ?? 1, glow: h0.pulse ?? 0 }} detail={detail} />
      </g>
    ),
  });
  // Warehouse
  if (wh.rise > 0) items.push({ key: depth(WH), node: <Building key="wh" b={WH} st={{ rise: wh.rise }} detail={detail} /> });
  // Stores
  STORES.forEach((b, k) => {
    const { rise = 0, drop = 0, glow = 0, opacity = 1 } = store(k);
    if (rise <= 0.001) return;
    const dark = k === 0 ? s1.dark ?? 0 : 0;
    const xray = k === 0 ? s1.xray ?? 0 : 0;
    const racks: React.ReactNode[] = [];
    if (xray > 0.01)
      for (const rx of [b.x + 0.15, b.x + b.w * 0.55])
        for (const ry of [b.y + 0.12, b.y + 0.45, b.y + 0.78])
          racks.push(<IsoBox key={`r${rx}${ry}`} x={rx} y={ry} w={b.w * 0.32} d={0.2} h={0.42 * Math.min(1, xray * 1.5)} color={C.cyan} opacity={Math.min(1, xray * 2)} />);
    items.push({
      key: depth(b),
      node: (
        <g key={`s${k}`}>
          {racks}
          <Building b={b} st={{ rise, drop, glow, dark, xray, opacity }} detail={detail} />
        </g>
      ),
    });
  });
  // Packets on links
  links.forEach((l, k) => {
    if (l.t == null || (l.opacity ?? 1) <= 0.01) return;
    const a = isoAlongP(l.points, l.t);
    items.push({
      key: a[0] + a[1],
      node: (
        <g key={`lp${k}`} opacity={l.opacity ?? 1}>
          <IsoPacket points={l.points} t={l.t} color={l.color ?? C.accent} size={l.size ?? Math.max(5, cam.u * 0.08)} />
        </g>
      ),
    });
  });
  if (rider && (rider.opacity ?? 1) > 0.001) {
    const a = isoAlongP(rider.points, rider.t);
    items.push({ key: a[0] + a[1] + 0.01, node: <RiderPulse key="rider" r={rider} /> });
  }
  actors.forEach((a, k) => items.push({ key: a.x + a.y + 0.001 * k, node: <React.Fragment key={`a${k}`}>{a.node}</React.Fragment> }));
  items.sort((a, b) => a.key - b.key);

  // Landing rings and empty plots for stores being built
  const rings = STORES.map((b, k) => {
    const { ring = 0, plot = 0 } = store(k);
    const c = centre(b);
    return (
      <g key={`ring${k}`}>
        {plot > 0.01 && <IsoTile x={b.x - 0.08} y={b.y - 0.08} w={b.w + 0.16} d={b.d + 0.16} color={C.cyan} opacity={0.12 * plot} strokeOpacity={0.9 * plot} dashed />}
        {ring > 0.01 && ring < 0.99 && (
          <IsoTile x={c[0] - b.w * (0.6 + ring)} y={c[1] - b.d * (0.6 + ring)} w={b.w * (1.2 + 2 * ring)} d={b.d * (1.2 + 2 * ring)} color={C.cyan} opacity={0} strokeOpacity={0.9 * (1 - ring)} />
        )}
      </g>
    );
  });

  return (
    <IsoStage originX={st.ox} originY={st.oy} unit={st.unit} style={{ maskImage: MASK, WebkitMaskImage: MASK }}>
      <g opacity={dim}>
        {/* Plots and streets */}
        {BLOCKS.map(([xb, yb], k) => {
          const [x0, x1] = XB[xb];
          const [y0, y1] = YB[yb];
          return <IsoTile key={`b${k}`} x={x0 - 0.05} y={y0 - 0.05} w={x1 - x0 + 0.1} d={y1 - y0 + 0.1} color={PLOT} opacity={1} strokeOpacity={0} />;
        })}
        {ROADS.map((r, k) => {
          const v = r.a[0] === r.b[0];
          const x = v ? r.a[0] - r.w / 2 : Math.min(r.a[0], r.b[0]) - r.w / 2;
          const y = v ? Math.min(r.a[1], r.b[1]) - r.w / 2 : r.a[1] - r.w / 2;
          const w = v ? r.w : Math.abs(r.b[0] - r.a[0]) + r.w;
          const d = v ? Math.abs(r.b[1] - r.a[1]) + r.w : r.w;
          return <IsoTile key={`r${k}`} x={Math.max(0, x)} y={Math.max(0, y)} w={Math.min(15, x + w) - Math.max(0, x)} d={Math.min(15, y + d) - Math.max(0, y)} color={ROAD} opacity={1} strokeOpacity={0} />;
        })}
        {ROADS.filter((r) => r.avenue).map((r, k) => (
          <g key={`c${k}`} opacity={0.5}>
            <IsoPath points={[r.a, r.b]} color="#4A5168" width={lane} dashed />
          </g>
        ))}
        {/* Store territories */}
        {TERRITORY.map((poly, k) => {
          const g = Math.max(0, Math.min(1, terr(k)));
          if (g <= 0.001) return null;
          const c = centre(STORES[k]);
          const e = 1 - Math.pow(1 - g, 3);
          const pts = poly.map(([x, y]) => [c[0] + (x - c[0]) * e, c[1] + (y - c[1]) * e] as P2);
          return <IsoPoly key={`t${k}`} points={pts} color={C.green} opacity={0.16 * Math.min(1, g * 1.5)} strokeOpacity={0.75 * Math.min(1, g * 1.5)} strokeWidth={2.5} />;
        })}
        {planned > 0.001 && PLANNED.map(([x, y], k) => <IsoTile key={`p${k}`} x={x} y={y} w={0.6} d={0.6} color={C.cyan} opacity={0.08 * planned} strokeOpacity={0.8 * planned} dashed />)}
        {rings}
        {floor}
        {r0.progress > 0.001 && (r0.opacity ?? 1) > 0.01 && (
          <g opacity={r0.opacity ?? 1}>
            <IsoPath points={R0} color={C.red} progress={r0.progress} dashed={r0.dashed} width={Math.max(4, cam.u * 0.09)} glow={0.8} />
          </g>
        )}
        {r1.progress > 0.001 && (r1.opacity ?? 1) > 0.01 && (
          <g opacity={(r1.opacity ?? 1) * 0.85}>
            <IsoPath points={R1} color={C.accent} progress={r1.progress} width={Math.max(4, cam.u * 0.07)} glow={0.8} />
          </g>
        )}
        {links.map((l, k) =>
          (l.progress ?? 1) > 0.001 && (l.opacity ?? 1) > 0.01 ? (
            <g key={`l${k}`} opacity={(l.opacity ?? 1) * 0.6}>
              <IsoPath points={l.points} color={l.color ?? C.accent} progress={l.progress ?? 1} dashed={l.dashed ?? true} width={l.width ?? 4} glow={l.glow ?? 0} />
            </g>
          ) : null,
        )}
        {items.map((it) => it.node)}
        {/* Labels and tags, always on top */}
        {(h0.label ?? 0) > 0.001 && (
          <IsoLabel x={H0.x + H0.w / 2} y={H0.y + H0.d / 2} z={H0.h + (H0.roof ?? 0)} text="YOUR HOME" color={C.accent} opacity={h0.label} lift={Math.max(30, cam.u * 0.42)} size={Math.round(Math.max(20, Math.min(26, cam.u * 0.24)))} />
        )}
        {(wh.label ?? 0) > 0.001 && wh.rise > 0.6 && <IsoLabel x={WH.x + WH.w / 2} y={WH.y + WH.d / 2} z={WH.h * wh.rise + 0.4} text="WAREHOUSE" color={C.cyan} opacity={wh.label} lift={34} size={22} />}
        {(s1.label ?? 0) > 0.001 && (
          <IsoLabel x={STORES[0].x + STORES[0].w / 2} y={STORES[0].y + STORES[0].d / 2} z={STORES[0].h} text="DARK STORE" color={C.cyan} opacity={s1.label} lift={Math.max(40, cam.u * 0.75)} size={28} />
        )}
        {rider && <RiderTags points={rider.points} t={rider.t} tag={rider.tag} sub={rider.sub} opacity={rider.opacity} />}
        {overlay}
      </g>
    </IsoStage>
  );
};
