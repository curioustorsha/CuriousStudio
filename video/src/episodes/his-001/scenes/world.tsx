import React from "react";
import { Img, random, spring, useCurrentFrame } from "remotion";
import { C, F, FPS } from "../../../theme";
import { IsoBox, isoFaceMatrix, IsoLabel, IsoPath, isoPoint, IsoPoly, IsoPulse, IsoRoof, isoShade, IsoStage, IsoTile, useIsoStage, type IsoStageValue } from "../../../engine/kit";
import { INDIAN_RAILWAYS_LOGO_URL, IRCTC_BLUE } from "../../../logos";

/**
 * The one isometric railway district for HIS-001 (IRCTC at Tatkal time). 14 × 14 floor, illustrative layout.
 * One booking walks through it in three steps: the GATE (getting in), IRCTC's HALL (searching = reading) and the
 * RESERVATION SYSTEM's seat grid (booking = writing). Around them: three neighbourhoods of homes (YOUR HOME
 * bottom-left), the STATION with its clock tower on the rail track along the back edge, the AGENT's shop, and the
 * plots where edge cabinets (copies near you) and the new, bigger reservation system land.
 * Every route follows the wiring grid (avenues at x 5.5 / 9.4 and y 4 / 6 / 9.8, lanes between), never diagonals.
 * Colour roles: cyan = the system, amber = people / requests / your booking, green = served / copies, red = bots and
 * the limit line only.
 */

export type P2 = [number, number];

// ---------------------------------------------------------------- camera

/** A camera: world focus (fx, fy) shown at screen point (sx, sy), `u` px per grid unit. */
export type Cam = { fx: number; fy: number; u: number; sx: number; sy: number };

/** The whole district (hook, intro, record, follow, cdn, outro, cta). */
export const CITY: Cam = { fx: 7, fy: 7.2, u: 42, sx: 528, sy: 850 };
/** Close on the gatehouse and the queue in front of it (bots, gate). */
export const GATE: Cam = { fx: 7.6, fy: 7.9, u: 118, sx: 540, sy: 840 };
/** The hall with its wire back to the seat grid (reading, copies, offload). */
export const HALL: Cam = { fx: 7.4, fy: 4.4, u: 86, sx: 540, sy: 900 };
/** Close on the seat grid (writing, limit). */
export const SEATS: Cam = { fx: 7.45, fy: 2.4, u: 128, sx: 540, sy: 960 };
/** Pulled back: seat grid with the station, the agent's shop and the new plot (onesystem). */
export const SEATS_WIDE: Cam = { fx: 7.4, fy: 4.6, u: 62, sx: 560, sy: 900 };
/** Old and new reservation systems side by side on the track (upgrade). */
export const UPGRADE: Cam = { fx: 10.0, fy: 2.6, u: 72, sx: 470, sy: 900 };

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

/** A drop-in with a small bounce: 0 → overshoot → 1 (for blocks and cabinets landing). */
export const dropIn = (frame: number, at: number) => (frame < at ? 0 : spring({ frame: frame - at, fps: FPS, config: { damping: 9, stiffness: 160, mass: 0.8 } }));

// ---------------------------------------------------------------- paths

const legLens = (pts: P2[]) => pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
export const pathLen = (pts: P2[]) => legLens(pts).reduce((a, b) => a + b, 0);
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

// ---------------------------------------------------------------- layout

export type Box = { x: number; y: number; w: number; d: number; h: number };

export const TRACK_Y = 0.55;
export const STATION: Box = { x: 0.9, y: 1.4, w: 2.2, d: 1.1, h: 0.6 };
export const CLOCK: Box = { x: 0.35, y: 1.65, w: 0.5, d: 0.5, h: 1.55 };
export const HALL_B: Box = { x: 5.9, y: 4.35, w: 3.2, d: 1.3, h: 0.8 };
export const SHOP: Box = { x: 9.85, y: 7.65, w: 1.0, d: 0.85, h: 0.5 };
export const HOME_B: Box = { x: 0.85, y: 12.55, w: 0.95, d: 0.8, h: 0.42 };

/** A reservation system: database cylinders under a raised platform holding the berth grid. */
export type Res = { x: number; y: number; w: number; d: number; cols: number; rows: number; cyl: number; pz: number };
export const RES: Res = { x: 6.0, y: 1.2, w: 2.9, d: 2.4, cols: 8, rows: 6, cyl: 3, pz: 0.95 };
export const NEW_RES: Res = { x: 10.0, y: 1.05, w: 3.8, d: 2.75, cols: 10, rows: 7, cyl: 4, pz: 1.15 };

/** Centre (and height) of berth `i` on a reservation grid. Index runs along x, then y. */
export const berth = (r: Res, i: number) => {
  const col = i % r.cols;
  const row = Math.floor(i / r.cols);
  const cw = (r.w - 0.3) / r.cols;
  const rd = (r.d - 0.3) / r.rows;
  return { x: r.x + 0.15 + cw * (col + 0.5), y: r.y + 0.15 + rd * (row + 0.5), z: r.pz + 0.09, cw, rd, col, row };
};
/** Your berth (front-middle of the old grid) and the one next to it. */
export const MY_BERTH = 35;
export const NEXT_BERTH = 36;

/** Seats already taken before you arrive (deterministic pattern). */
export const TAKEN: boolean[] = Array.from({ length: 48 }, (_, i) => i !== MY_BERTH && i !== NEXT_BERTH && random(`his1-seat-${i}`) < 0.42);

/** Edge cabinets: one per neighbourhood (bottom-left, bottom-right, left-middle), in landing order. */
export const CABS: P2[] = [
  [3.05, 10.3],
  [12.45, 6.45],
  [3.05, 6.45],
];
export const CAB_W = 0.42;

/** Neighbourhood zones (uneven), same order as CABS. */
export const ZONES: P2[][] = [
  [[0.2, 10.05], [5.25, 10.05], [5.3, 11.4], [9.15, 11.7], [9.1, 13.85], [0.2, 13.85]],
  [[9.65, 6.25], [13.85, 6.25], [13.85, 12.4], [11.9, 13.85], [9.65, 13.85], [9.65, 11.2]],
  [[0.2, 6.25], [5.25, 6.25], [5.25, 8.6], [4.4, 9.55], [0.2, 9.55]],
];

// Wiring grid: cable trays the routes follow.
type Lane = { a: P2; b: P2; w: number };
export const LANES: Lane[] = [
  { a: [5.5, 0.9], b: [5.5, 14], w: 0.42 },
  { a: [9.4, 0.9], b: [9.4, 14], w: 0.42 },
  { a: [0, 4.0], b: [14, 4.0], w: 0.42 },
  { a: [0, 6.0], b: [14, 6.0], w: 0.36 },
  { a: [0, 9.8], b: [14, 9.8], w: 0.42 },
  { a: [2.2, 4.0], b: [2.2, 14], w: 0.24 },
  { a: [7.5, 5.65], b: [7.5, 14], w: 0.24 },
  { a: [12.0, 6.0], b: [12.0, 14], w: 0.24 },
  { a: [0, 12.0], b: [5.5, 12.0], w: 0.24 },
  { a: [9.4, 12.0], b: [14, 12.0], w: 0.24 },
];

/** The plaza in front of the gate where the queue forms. */
const PLAZA: Box = { x: 6.55, y: 7.65, w: 1.9, d: 2.0, h: 0 };
/** Gate: two booths with three turnstile lanes between them; the agents' lane on the right. */
export const GATE_LANES = [7.07, 7.5, 7.93];
export const GATE_Y = 7.6;
export const AGENT_X = 8.98;

// ---------------------------------------------------------------- routes

export const HOME_DOOR: P2 = [HOME_B.x + HOME_B.w + 0.08, HOME_B.y + HOME_B.d / 2];
/** Your request: home → lane → avenue → up the gate lane → through the gate → the hall's door. */
export const YOU_PATH: P2[] = [HOME_DOOR, [2.2, HOME_DOOR[1]], [2.2, 9.8], [7.5, 9.8], [7.5, 5.72]];
export const YOU_GATE_D = pathLen(YOU_PATH.slice(0, 4)) + (9.8 - 7.9);
/** The wire from the hall to the seat grid (web and app bookings). */
export const HALL_WIRE: P2[] = [[7.5, 4.35], [7.5, 3.62]];
/** The station counter's conduit into the reservation system. */
export const STATION_WIRE: P2[] = [[2.2, STATION.y + STATION.d], [2.2, 4.0], [5.5, 4.0], [5.5, 2.4], [6.0, 2.4]];
/** The agent's shop conduit into the reservation system. */
export const AGENT_WIRE: P2[] = [[SHOP.x - 0.05, SHOP.y + SHOP.d / 2], [9.4, SHOP.y + SHOP.d / 2], [9.4, 2.4], [8.9, 2.4]];
/** Agents walking from the shop to their own lane at the gate. */
export const AGENT_PATH: P2[] = [[SHOP.x - 0.05, SHOP.y + SHOP.d / 2], [9.4, SHOP.y + SHOP.d / 2], [9.4, 8.6], [AGENT_X, 8.6], [AGENT_X, GATE_Y + 0.15]];

/** Copies leaving the hall for each edge cabinet, along the wiring. */
export const CAB_PATHS: P2[][] = [
  [[7.5, 5.72], [7.5, 6.0], [5.5, 6.0], [5.5, 9.8], [3.26, 9.8], [3.26, 10.3]],
  [[7.5, 5.72], [7.5, 6.0], [12.66, 6.0], [12.66, 6.45]],
  [[7.5, 5.72], [7.5, 6.0], [3.26, 6.0], [3.26, 6.45]],
];
/** Short green routes from each cabinet to nearby homes (the first one ends at your door). */
export const SERVE_PATHS: P2[][][] = [
  [
    [[3.26, 10.72], [3.26, 12.0], [2.2, 12.0], [2.2, HOME_DOOR[1]], HOME_DOOR],
    [[3.26, 10.72], [3.26, 12.0], [4.6, 12.0]],
    [[3.0, 10.3], [3.0, 9.8], [0.6, 9.8]],
  ],
  [
    [[12.66, 6.87], [12.66, 7.2], [12.0, 7.2], [12.0, 9.0]],
    [[12.66, 6.87], [12.66, 7.2], [13.6, 7.2]],
    [[12.45, 6.66], [12.0, 6.66], [12.0, 6.0], [10.2, 6.0]],
  ],
  [
    [[3.26, 6.87], [3.26, 7.6], [2.2, 7.6], [2.2, 9.0]],
    [[3.05, 6.66], [2.2, 6.66], [2.2, 8.2]],
    [[3.26, 6.87], [3.26, 8.6], [4.6, 8.6]],
  ],
];

/** Feeder routes from the neighbourhoods to the three gate lanes (the crowd at ten). */
export const FEED: P2[][] = [
  [[2.2, 7.0], [2.2, 9.8], [7.07, 9.8], [7.07, 7.75]],
  [[2.2, 13.6], [2.2, 9.8], [7.5, 9.8], [7.5, 7.75]],
  [[13.9, 9.8], [7.93, 9.8], [7.93, 7.75]],
  [[7.5, 13.8], [7.5, 7.75]],
  [[12.0, 13.6], [12.0, 9.8], [7.93, 9.8], [7.93, 7.75]],
  [[0.2, 12.0], [2.2, 12.0], [2.2, 9.8], [7.07, 9.8], [7.07, 7.75]],
  [[5.5, 13.8], [5.5, 9.8], [7.5, 9.8], [7.5, 7.75]],
  [[12.0, 6.2], [12.0, 9.8], [7.93, 9.8], [7.93, 7.75]],
  [[0.2, 9.8], [7.07, 9.8], [7.07, 7.75]],
  [[9.4, 13.8], [9.4, 9.8], [7.93, 9.8], [7.93, 7.75]],
];
/** Through the gate and on to the hall's door. */
export const passOf = (lane: number): P2[] => [[lane, 7.75], [lane, 6.35], [7.5, 6.35], [7.5, 5.72]];

// ---------------------------------------------------------------- the crowd

export type Pulse = { pts: P2[]; t: number; color?: string; size?: number; trail?: number; ring?: number; opacity?: number };
export type BotS = { x: number; y: number; flash?: number; opacity?: number };

/**
 * The crowd heading for the gate from scene frame `t0`. `queue`: they bunch up in front of the closed gate in
 * lines; otherwise they flow through the gate to the hall on a loop. `n` pulses, `every` frames between launches.
 */
export const crowd = (frame: number, t0: number, opts: { queue?: boolean; n?: number; speed?: number; every?: number; opacity?: number } = {}): Pulse[] => {
  const { queue = false, n = 26, speed = 0.13, every = 2.2, opacity = 1 } = opts;
  const out: Pulse[] = [];
  const slots: Record<number, number> = {};
  for (let k = 0; k < n; k++) {
    const feed = FEED[k % FEED.length];
    const lane = feed[feed.length - 1][0];
    const launch = t0 + k * every;
    if (frame < launch) continue;
    const age = frame - launch;
    if (queue) {
      const slot = (slots[lane] = (slots[lane] ?? -1) + 1);
      const len = pathLen(feed);
      const dmax = len - slot * 0.32;
      const d = Math.min(age * speed, dmax);
      out.push({ pts: feed, t: d / len, trail: d < dmax ? 1 : 0, ring: d >= dmax ? 0.35 : 0, size: 0, opacity });
    } else {
      const full: P2[] = [...feed.slice(0, -1), ...passOf(lane)];
      const len = pathLen(full);
      const d = (age * speed) % (len + 3);
      if (d > len) continue;
      out.push({ pts: full, t: d / len, trail: 1, size: 0, opacity: opacity * Math.min(1, (len - d) / 0.6) });
    }
  }
  return out;
};

/**
 * Bots on the feeder routes: they run at the gate, hit the barrier and bounce back with a red flash.
 * Every `slipEvery`-th bot slips through (most are blocked, not all). `blockAt` = frame the barrier starts blocking.
 */
export const bots = (frame: number, t0: number, blockAt: number, opts: { n?: number; slipEvery?: number; speed?: number } = {}): BotS[] => {
  const { n = 10, slipEvery = 5, speed = 0.12 } = opts;
  const out: BotS[] = [];
  for (let k = 0; k < n; k++) {
    const feed = FEED[(k * 3 + 1) % FEED.length];
    const lane = feed[feed.length - 1][0];
    const launch = t0 + k * 5;
    if (frame < launch) continue;
    const len = pathLen(feed);
    const short: P2[] = feed.slice(-2);
    const sLen = pathLen(short);
    // start part-way, so they arrive fast
    const d0 = len - sLen - 1.2;
    const d = d0 + (frame - launch) * speed;
    const reach = launch + (len - d0) / speed;
    const slips = k % slipEvery === slipEvery - 1;
    if (d < len) {
      const p = at(feed, d);
      out.push({ x: p[0] + 0.04, y: p[1] });
    } else if (reach < blockAt || slips) {
      const pass = passOf(lane);
      const dd = (frame - reach) * speed;
      if (dd > pathLen(pass)) continue;
      const p = at(pass, dd);
      out.push({ x: p[0] + 0.04, y: p[1], opacity: Math.min(1, (pathLen(pass) - dd) / 0.5) });
    } else {
      const back = frame - reach;
      const k2 = Math.min(1, back / 16);
      const p = at(feed, len - 1.3 * (1 - Math.pow(1 - k2, 2)));
      out.push({ x: p[0] + 0.04, y: p[1], flash: Math.max(0, 1 - back / 10), opacity: 1 - Math.max(0, (back - 14) / 10) });
    }
  }
  return out.filter((b) => (b.opacity ?? 1) > 0.01);
};

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
const FLATS = ["#F7B95C", "#E9A54A", "#FFCB80", "#E39B42"];
export const SYS = isoShade(C.cyan, -0.45);
const SEAT_FREE = "#2E8FB0";
const SEAT_TAKEN = "#3A4154";

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
  opacity?: number;
  fill?: string;
}> = ({ x, y, z = 0, text, color = C.text, size = 30, p = 1, lift = 60, dx = 0, opacity = 1, fill = "rgba(7,8,12,0.92)" }) => {
  const s = useIsoStage();
  if (p <= 0.001 || opacity <= 0.001) return null;
  const pt = isoPoint(s, x, y, z);
  const w = text.length * size * 0.6 + size * 1.2;
  const h = size * 1.7;
  const sc = 0.6 + 0.4 * p;
  return (
    <g transform={`translate(${pt.x + dx},${pt.y - lift}) scale(${sc})`} opacity={Math.min(1, p * 1.6) * opacity}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.28} fill={fill} stroke={color} strokeWidth={2.5} />
      <text textAnchor="middle" dominantBaseline="central" fontFamily={F.mono} fontWeight={700} fontSize={size} letterSpacing={1} fill={color}>
        {text}
      </text>
    </g>
  );
};

const Face: React.FC<{ b: Box; face: "left" | "right"; top: number; children: React.ReactNode }> = ({ b, face, top, children }) => {
  const s = useIsoStage();
  return <g transform={isoFaceMatrix(s, face, b.x, b.y, b.w, b.d, top)}>{children}</g>;
};

/** A vertical cylinder (database drum) on the floor at (cx, cy). */
const Cylinder: React.FC<{ cx: number; cy: number; r: number; z0: number; h: number; color: string; lit?: number }> = ({ cx, cy, r, z0, h, color, lit = 0 }) => {
  const s = useIsoStage();
  const rx = Math.SQRT2 * r * COS * s.unit;
  const ry = Math.SQRT2 * r * SIN * s.unit;
  const b = isoPoint(s, cx, cy, z0);
  const t = isoPoint(s, cx, cy, z0 + h);
  const body = isoShade(color, -0.4);
  const bands = [0.33, 0.66];
  return (
    <g>
      <path d={`M ${b.x - rx} ${b.y} A ${rx} ${ry} 0 0 0 ${b.x + rx} ${b.y} L ${t.x + rx} ${t.y} L ${t.x - rx} ${t.y} Z`} fill={body} />
      <path d={`M ${b.x} ${b.y + ry} A ${rx} ${ry} 0 0 0 ${b.x + rx} ${b.y} L ${t.x + rx} ${t.y} A ${rx} ${ry} 0 0 1 ${t.x} ${t.y + ry} Z`} fill={isoShade(color, -0.6)} />
      {bands.map((k) => {
        const m = isoPoint(s, cx, cy, z0 + h * k);
        return <path key={k} d={`M ${m.x - rx} ${m.y} A ${rx} ${ry} 0 0 0 ${m.x + rx} ${m.y}`} fill="none" stroke={mixHex(isoShade(color, -0.15), C.cyan, lit)} strokeWidth={Math.max(1.2, s.unit * 0.025)} opacity={0.5 + 0.5 * lit} style={lit > 0.3 ? { filter: `drop-shadow(0 0 6px ${C.cyan})` } : undefined} />;
      })}
      <ellipse cx={t.x} cy={t.y} rx={rx} ry={ry} fill={isoShade(color, 0.1)} />
    </g>
  );
};

// ---------------------------------------------------------------- generated homes

type Home = { kind: "house" | "flats" | "tree"; x: number; y: number; w: number; d: number; h: number; roof?: number; ridge?: "x" | "y"; tone: number };
type Lot = { x0: number; x1: number; y0: number; y1: number; flats?: number; trees?: boolean };
const LOTS: Lot[] = [
  { x0: 0.3, x1: 2.0, y0: 6.3, y1: 9.55 },
  { x0: 2.45, x1: 5.25, y0: 6.3, y1: 9.55, flats: 0.3 },
  { x0: 0.3, x1: 2.0, y0: 10.1, y1: 11.8 },
  { x0: 2.45, x1: 5.25, y0: 10.1, y1: 11.8 },
  { x0: 0.3, x1: 2.0, y0: 12.25, y1: 13.85 },
  { x0: 2.45, x1: 5.25, y0: 12.25, y1: 13.85 },
  { x0: 5.8, x1: 7.25, y0: 10.1, y1: 13.85 },
  { x0: 7.75, x1: 9.15, y0: 10.1, y1: 13.85 },
  { x0: 9.7, x1: 11.75, y0: 6.3, y1: 9.55 },
  { x0: 12.25, x1: 13.85, y0: 6.3, y1: 9.55 },
  { x0: 9.7, x1: 11.75, y0: 10.1, y1: 11.75 },
  { x0: 12.25, x1: 13.85, y0: 10.1, y1: 11.75 },
  { x0: 9.7, x1: 13.85, y0: 12.25, y1: 13.85 },
  { x0: 0.3, x1: 5.25, y0: 4.3, y1: 5.75, flats: 0.6 },
  { x0: 9.7, x1: 11.6, y0: 4.3, y1: 5.75, flats: 0.6 },
  { x0: 3.4, x1: 5.25, y0: 1.2, y1: 3.7, trees: true },
];
const KEEP_OUT: Box[] = [
  ...CABS.map(([x, y]) => ({ x: x - 0.25, y: y - 0.25, w: CAB_W + 0.5, d: CAB_W + 0.5, h: 0 })),
  { x: HOME_B.x - 0.1, y: HOME_B.y - 0.1, w: HOME_B.w + 0.2, d: HOME_B.d + 0.2, h: 0 },
  { x: SHOP.x - 0.15, y: SHOP.y - 0.15, w: SHOP.w + 0.3, d: SHOP.d + 0.3, h: 0 },
  { x: AGENT_X - 0.3, y: 7.4, w: 0.6, d: 1.5, h: 0 },
];
const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.d && a.y + a.d > b.y;
const rnd = (k: string) => random(`his1-${k}`);

export const HOMES: Home[] = (() => {
  const out: Home[] = [{ kind: "house", ...HOME_B, roof: 0.36, ridge: "y", tone: 0 }];
  LOTS.forEach((b, bi) => {
    const nx = Math.max(1, Math.round((b.x1 - b.x0) / 0.95));
    const ny = Math.max(1, Math.round((b.y1 - b.y0) / 0.95));
    const cw = (b.x1 - b.x0) / nx;
    const cd = (b.y1 - b.y0) / ny;
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < ny; j++) {
        const k = `${bi}-${i}-${j}`;
        if (b.trees) {
          const tx = b.x0 + i * cw + 0.1 + rnd(`${k}tx`) * (cw - 0.4);
          const ty = b.y0 + j * cd + 0.1 + rnd(`${k}ty`) * (cd - 0.4);
          out.push({ kind: "tree", x: tx, y: ty, w: 0.3, d: 0.3, h: 0.22 + rnd(`${k}th`) * 0.12, tone: 0 });
          continue;
        }
        if (rnd(`${k}skip`) < 0.18) continue;
        const flats = rnd(`${k}kind`) < (b.flats ?? 0.22);
        const w = cw * (0.55 + rnd(`${k}w`) * 0.25);
        const d = cd * (0.55 + rnd(`${k}d`) * 0.25);
        const x = b.x0 + i * cw + (cw - w) * rnd(`${k}x`);
        const y = b.y0 + j * cd + (cd - d) * rnd(`${k}y`);
        const tone = Math.floor(rnd(`${k}tone`) * 4);
        const h = flats ? 0.7 + rnd(`${k}h`) * 0.45 : 0.26 + rnd(`${k}h`) * 0.16;
        const box = { x, y, w, d, h };
        if (KEEP_OUT.some((o) => overlaps(box, o))) continue;
        if (flats) out.push({ kind: "flats", ...box, tone });
        else out.push({ kind: "house", ...box, roof: 0.18 + rnd(`${k}r`) * 0.16, ridge: rnd(`${k}rg`) < 0.5 ? "x" : "y", tone });
      }
  });
  return out;
})();

const HomeBlock: React.FC<{ b: Home; detail: number; glow?: number }> = ({ b, detail, glow = 0 }) => {
  const win = "#FFE9B8";
  if (b.kind === "tree")
    return (
      <g>
        <IsoBox x={b.x + b.w * 0.4} y={b.y + b.d * 0.4} w={b.w * 0.2} d={b.d * 0.2} h={b.h * 0.5} color="#5A4630" />
        <IsoBox x={b.x} y={b.y} z={b.h * 0.45} w={b.w} d={b.d} h={b.h * 0.8} color="#2F6B52" />
      </g>
    );
  if (b.kind === "house") {
    const wall = WALLS[b.tone % 4];
    const roof = ROOFS[b.tone % 4];
    return (
      <g>
        <IsoBox x={b.x} y={b.y} w={b.w} d={b.d} h={b.h} color={wall} glow={glow} />
        <IsoRoof x={b.x - 0.03} y={b.y - 0.03} z={b.h} w={b.w + 0.06} d={b.d + 0.06} h={b.roof ?? 0.3} ridge={b.ridge} color={roof} wall={wall} />
        {detail > 0.01 && (
          <g opacity={detail}>
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
  const wall = FLATS[b.tone % 4];
  return (
    <g>
      <IsoBox x={b.x} y={b.y} w={b.w} d={b.d} h={b.h} color={wall} />
      <IsoBox x={b.x + 0.08} y={b.y + 0.08} z={b.h} w={b.w * 0.35} d={b.d * 0.35} h={0.08} color={isoShade(wall, -0.2)} />
      {detail > 0.01 && (
        <g opacity={detail}>
          {(["left", "right"] as const).map((f) => {
            const len = f === "left" ? b.w : b.d;
            const cols = Math.max(2, Math.floor(len / 0.2));
            const rows = Math.max(2, Math.floor(b.h / 0.24));
            const cells: React.ReactNode[] = [];
            for (let r = 0; r < rows; r++)
              for (let c = 0; c < cols; c++)
                cells.push(<rect key={`${r}-${c}`} x={(len / cols) * (c + 0.3)} y={(b.h / rows) * (r + 0.3)} width={(len / cols) * 0.4} height={(b.h / rows) * 0.36} fill={win} opacity={(r * 3 + c * 5 + b.tone) % 4 === 0 ? 0.35 : 0.9} />);
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
};

// ---------------------------------------------------------------- the station and its clock

const StationBlock: React.FC<{ detail: number; time: string; ring: number; glow: number }> = ({ detail, time, ring, glow }) => {
  const s = useIsoStage();
  const b = STATION;
  const wall = "#C9B79A";
  const frame = useCurrentFrame();
  const face = isoPoint(s, CLOCK.x + CLOCK.w * 0.5, CLOCK.y + CLOCK.d, CLOCK.h - 0.32);
  return (
    <g>
      {/* platform and canopy toward the track */}
      <IsoBox x={b.x} y={0.85} w={b.w} d={b.y - 0.85} h={0.1} color="#5B6070" />
      {[0, 1, 2, 3].map((k) => (
        <IsoBox key={k} x={b.x + 0.1 + k * ((b.w - 0.25) / 3)} y={0.95} w={0.05} d={0.05} h={0.55} color="#8A8F9C" />
      ))}
      <IsoBox x={b.x} y={0.85} z={0.55} w={b.w} d={b.y - 0.85 + 0.1} h={0.06} color="#7A4E2A" />
      {/* the building */}
      <IsoBox x={b.x} y={b.y} w={b.w} d={b.d} h={b.h} color={wall} glow={glow} />
      <IsoRoof x={b.x - 0.04} y={b.y - 0.04} z={b.h} w={b.w + 0.08} d={b.d + 0.08} h={0.35} ridge="x" color="#8C3B2E" wall={wall} />
      {detail > 0.01 && (
        <Face b={b} face="left" top={b.h}>
          {[0.15, 0.55, 1.3, 1.7].map((u) => (
            <rect key={u} x={u} y={0.16} width={0.22} height={0.26} fill="#FFE9B8" opacity={0.85} rx={0.04} />
          ))}
          {/* the counter window */}
          <rect x={0.92} y={0.12} width={0.32} height={0.3} fill={glow > 0.05 ? C.cyan : "#FFD98A"} opacity={0.95} />
          <rect x={0.88} y={0.42} width={0.4} height={0.05} fill={isoShade(wall, -0.5)} />
        </Face>
      )}
      {/* clock tower */}
      <IsoBox x={CLOCK.x} y={CLOCK.y} w={CLOCK.w} d={CLOCK.d} h={CLOCK.h} color="#B8A27F" />
      <IsoRoof x={CLOCK.x - 0.04} y={CLOCK.y - 0.04} z={CLOCK.h} w={CLOCK.w + 0.08} d={CLOCK.d + 0.08} h={0.3} ridge="y" color="#8C3B2E" wall="#B8A27F" />
      <Face b={CLOCK} face="left" top={CLOCK.h}>
        <rect x={0.04} y={0.12} width={CLOCK.w - 0.08} height={0.32} rx={0.04} fill="#0B0D14" stroke={C.accent} strokeWidth={0.02} />
        <text x={CLOCK.w / 2} y={0.29} textAnchor="middle" dominantBaseline="central" fontFamily={F.mono} fontWeight={700} fontSize={0.125} fill={time === "10:00" ? C.accent : C.text}>
          {time}
        </text>
      </Face>
      {ring > 0.01 && ring < 1 && <ellipse cx={face.x} cy={face.y} rx={s.unit * (0.3 + 0.9 * ring)} ry={s.unit * (0.3 + 0.9 * ring) * 0.8} fill="none" stroke={C.accent} strokeWidth={3} opacity={(1 - ring) * 0.9} />}
      {/* a slow blink on the clock so the frame is never still */}
      <circle cx={face.x} cy={face.y - s.unit * 0.22} r={Math.max(1.5, s.unit * 0.025)} fill={C.accent} opacity={0.4 + 0.4 * Math.sin(frame * 0.2)} />
    </g>
  );
};

// ---------------------------------------------------------------- IRCTC's hall

const HallBlock: React.FC<{ glow: number; rack: number; meter: number | null; cubes: number; cubeGo: number }> = ({ glow, rack, meter, cubes, cubeGo }) => {
  const s = useIsoStage();
  const frame = useCurrentFrame();
  const b = HALL_B;
  const wall = SYS;
  const rows = 5;
  // LED speed: busy blinks fast, calm blinks slow
  const speed = rack > 0.6 ? 3 : rack > 0.3 ? 5 : 9;
  const cubeNodes: React.ReactNode[] = [];
  if (cubes > 0.01) {
    for (let k = 0; k < 100; k++) {
      const i = k % 10;
      const j = Math.floor(k / 10);
      // the first 87 leave in waves
      const leaves = k < 87;
      const go = leaves ? Math.max(0, Math.min(1, cubeGo * 1.6 - (k / 87) * 0.6)) : 0;
      if (go >= 1) continue;
      const cx = b.x + 0.95 + i * 0.13;
      const cy = b.y + 0.2 + j * 0.09;
      cubeNodes.push(<IsoBox key={k} x={cx} y={cy - go * 1.2} z={b.h + go * 1.6} w={0.09} d={0.07} h={0.07} color={leaves ? C.green : "#6E7A96"} opacity={cubes * (1 - go)} />);
    }
  }
  return (
    <g>
      <IsoBox x={b.x} y={b.y} w={b.w} d={b.d} h={b.h} color={wall} glow={glow} />
      {(["left", "right"] as const).map((f) => {
        const len = f === "left" ? b.w : b.d;
        const bays = f === "left" ? 9 : 4;
        return (
          <Face key={f} b={b} face={f} top={b.h}>
            {Array.from({ length: bays }, (_, i) => (
              <g key={i}>
                <rect x={(len / bays) * (i + 0.1)} y={b.h * 0.14} width={(len / bays) * 0.8} height={b.h * 0.78} fill={isoShade(wall, -0.55)} />
                {Array.from({ length: rows }, (_, r) => {
                  const on = (Math.floor(frame / speed) + i * 3 + r * 7 + (f === "left" ? 0 : 2)) % 5 === 0;
                  return (
                    <g key={r}>
                      <rect x={(len / bays) * (i + 0.16)} y={b.h * (0.18 + r * 0.145)} width={(len / bays) * 0.68} height={b.h * 0.08} fill={isoShade(wall, -0.25)} />
                      <rect x={(len / bays) * (i + 0.2)} y={b.h * (0.195 + r * 0.145)} width={0.035} height={0.035} fill={C.cyan} opacity={0.3 + 0.7 * (on ? Math.max(0.4, rack) : rack * 0.4)} />
                    </g>
                  );
                })}
              </g>
            ))}
            <rect x={0} y={0.04} width={len} height={0.05} fill={C.cyan} opacity={0.45 + 0.5 * glow} />
          </Face>
        );
      })}
      {/* roof units */}
      <IsoBox x={b.x + 0.2} y={b.y + 0.25} z={b.h} w={0.4} d={0.35} h={0.12} color={isoShade(wall, -0.2)} />
      <IsoBox x={b.x + 0.2} y={b.y + 0.75} z={b.h} w={0.4} d={0.35} h={0.12} color={isoShade(wall, -0.2)} />
      {cubeNodes}
      {meter != null && (
        <Face b={b} face="right" top={b.h}>
          <rect x={0.25} y={0.12} width={0.8} height={0.14} rx={0.03} fill="#0B0D14" stroke={C.text} strokeWidth={0.012} />
          <rect x={0.27} y={0.14} width={0.76 * meter} height={0.1} rx={0.02} fill={mixHex(C.green, C.accent, Math.min(1, Math.max(0, (meter - 0.35) / 0.4)))} />
        </Face>
      )}
      {/* unused stage var keeps hooks order stable */}
      {s.unit < 0 && null}
    </g>
  );
};

/** IRCTC's sign standing on the hall roof (IRCTC has no free logo: its name in a white plate). */
const IrctcSign: React.FC<{ glow: number }> = ({ glow }) => {
  const s = useIsoStage();
  const b = HALL_B;
  const p = isoPoint(s, b.x + b.w * 0.5, b.y + b.d * 0.55, b.h);
  const h = Math.max(16, s.unit * 0.36);
  const w = h * 2.9;
  const pole = s.unit * 0.18;
  return (
    <g>
      <line x1={p.x - w * 0.3} y1={p.y} x2={p.x - w * 0.3} y2={p.y - pole} stroke="#9AA3B5" strokeWidth={Math.max(1.5, s.unit * 0.03)} />
      <line x1={p.x + w * 0.3} y1={p.y} x2={p.x + w * 0.3} y2={p.y - pole} stroke="#9AA3B5" strokeWidth={Math.max(1.5, s.unit * 0.03)} />
      <g transform={`translate(${p.x},${p.y - pole - h / 2})`} style={glow > 0.05 ? { filter: `drop-shadow(0 0 ${14 * glow}px ${C.cyan})` } : undefined}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.22} fill="#FFFFFF" stroke={glow > 0.05 ? C.cyan : "none"} strokeWidth={2} />
        <text textAnchor="middle" dominantBaseline="central" fontFamily={F.sans} fontWeight={900} fontSize={h * 0.62} letterSpacing={h * 0.02} fill={IRCTC_BLUE}>
          IRCTC
        </text>
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- the gate

export type GateState = { glow?: number; arch?: number; scan?: number | null; agentLane?: number; agentBar?: number; label?: number };

const GateBlock: React.FC<{ g: GateState; detail: number }> = ({ g, detail }) => {
  const s = useIsoStage();
  const booth = "#6E7A96";
  const y0 = GATE_Y - 0.55;
  const glow = g.glow ?? 0;
  const barZ = 0.32;
  const bar = mixHex("#D8DCE6", C.cyan, glow);
  const agentLane = g.agentLane ?? 0;
  const agentBar = g.agentBar ?? 0;
  const arch = g.arch ?? 0;
  return (
    <g>
      <IsoTile x={6.75} y={y0} w={1.5} d={0.55} color="#2A3042" opacity={1} strokeOpacity={0} />
      <IsoBox x={6.2} y={y0} w={0.6} d={0.6} h={0.5} color={booth} />
      <IsoBox x={6.15} y={y0 - 0.05} z={0.5} w={0.7} d={0.7} h={0.06} color={isoShade(booth, -0.3)} />
      {[7.28, 7.72].map((x) => (
        <IsoBox key={x} x={x - 0.03} y={y0 + 0.1} w={0.06} d={0.4} h={0.28} color="#9AA3B5" />
      ))}
      {/* boom barrier across the three lanes */}
      <g style={glow > 0.05 ? { filter: `drop-shadow(0 0 ${8 * glow}px ${C.cyan})` } : undefined}>
        <IsoPath points={[[6.8, GATE_Y + 0.05], [8.2, GATE_Y + 0.05]]} z={barZ} color={bar} width={Math.max(2, s.unit * 0.05)} />
      </g>
      <IsoBox x={8.2} y={y0} w={0.6} d={0.6} h={0.5} color={booth} />
      <IsoBox x={8.15} y={y0 - 0.05} z={0.5} w={0.7} d={0.7} h={0.06} color={isoShade(booth, -0.3)} />
      {detail > 0.01 && (
        <Face b={{ x: 8.2, y: y0, w: 0.6, d: 0.6, h: 0.5 }} face="left" top={0.5}>
          <rect x={0.12} y={0.12} width={0.36} height={0.16} fill="#BFE3FF" opacity={0.7} />
        </Face>
      )}
      {/* the agents' lane and its own barrier */}
      {agentLane > 0.01 && (
        <g opacity={agentLane}>
          <IsoTile x={AGENT_X - 0.2} y={y0} w={0.4} d={2.1} color={C.accent} opacity={0.08} strokeOpacity={0.4} dashed />
          <IsoBox x={AGENT_X + 0.22} y={y0 + 0.15} w={0.08} d={0.08} h={0.34} color="#9AA3B5" />
          {(() => {
            const pivot: P2 = [AGENT_X + 0.24, GATE_Y + 0.05];
            const up = 1 - agentBar;
            // the boom swings up around its pivot: drawn as a line from pivot, its far end rising
            const a = isoPoint(s, pivot[0], pivot[1], barZ);
            const far = isoPoint(s, AGENT_X - 0.24, GATE_Y + 0.05, barZ + up * 0.5);
            const fx = a.x + (far.x - a.x) * (1 - up * 0.35);
            return <line x1={a.x} y1={a.y} x2={fx} y2={far.y} stroke={agentBar > 0.5 ? C.red : "#D8DCE6"} strokeWidth={Math.max(2, s.unit * 0.05)} strokeLinecap="round" />;
          })()}
        </g>
      )}
      {/* scanner arch over the lanes */}
      {arch > 0.01 && (
        <g opacity={Math.min(1, arch)}>
          <IsoBox x={6.82} y={GATE_Y - 0.2} w={0.06} d={0.06} h={0.85 * arch} color={SYS} />
          <IsoBox x={8.12} y={GATE_Y - 0.2} w={0.06} d={0.06} h={0.85 * arch} color={SYS} />
          {arch > 0.9 && <IsoPath points={[[6.85, GATE_Y - 0.17], [8.15, GATE_Y - 0.17]]} z={0.85} color={C.cyan} width={Math.max(2, s.unit * 0.05)} />}
          {g.scan != null && g.scan > 0 && g.scan < 1 && (
            <g>
              {(() => {
                const yy = GATE_Y + 0.9 - g.scan * 1.1;
                const pts = [isoPoint(s, 6.85, yy, 0.85), isoPoint(s, 8.15, yy, 0.85), isoPoint(s, 8.15, yy, 0.02), isoPoint(s, 6.85, yy, 0.02)];
                return <polygon points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill={C.cyan} opacity={0.22} stroke={C.cyan} strokeWidth={2} strokeOpacity={0.7} />;
              })()}
            </g>
          )}
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------- the reservation system

export type SeatState = { color?: string; lift?: number; lock?: number; opacity?: number; ring?: number };

const ResBlock: React.FC<{
  r: Res;
  seat?: (i: number) => SeatState | null;
  cylLit?: (k: number) => number;
  warm?: number;
  glow?: number;
  eye?: number | null;
  outline?: number;
  ghost?: { lift: number; crack: number; opacity: number } | null;
  drop?: number;
  plot?: number;
  opacity?: number;
  logo?: number;
}> = ({ r, seat = () => null, cylLit = () => 0, warm = 0, glow = 0, eye = null, outline = 0, ghost = null, drop = 1, plot = 0, opacity = 1, logo = 0 }) => {
  const s = useIsoStage();
  const frame = useCurrentFrame();
  if (drop <= 0.001 && plot <= 0.001) return null;
  const dz = (1 - drop) * 3; // falls from above
  const edge = mixHex(C.cyan, C.accent, warm);
  const n = r.cols * r.rows;
  const cylR = Math.min(0.34, (r.w - 0.3) / r.cyl / 2 - 0.02);
  return (
    <g opacity={opacity}>
      {plot > 0.01 && drop < 0.99 && <IsoTile x={r.x} y={r.y} w={r.w} d={r.d} color={C.text} opacity={0.04} strokeOpacity={0.5 * plot} dashed />}
      {drop > 0.001 && (
        <g opacity={Math.min(1, drop * 3)}>
          <IsoBox x={r.x} y={r.y} z={dz} w={r.w} d={r.d} h={0.06} color="#2A3042" />
          {Array.from({ length: r.cyl }, (_, k) => {
            const cx = r.x + 0.15 + cylR + 0.02 + k * ((r.w - 0.3 - 2 * cylR - 0.04) / Math.max(1, r.cyl - 1));
            return <Cylinder key={k} cx={cx} cy={r.y + r.d / 2} r={cylR} z0={0.06 + dz} h={r.pz - 0.1} color={SYS} lit={cylLit(k)} />;
          })}
          {/* platform */}
          <IsoBox x={r.x} y={r.y} z={r.pz - 0.04 + dz} w={r.w} d={r.d} h={0.09} color={mixHex(SYS, isoShade(C.accent, -0.4), warm)} glow={glow} />
          <IsoPoly
            points={[[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.d], [r.x, r.y + r.d]]}
            z={r.pz + 0.05 + dz}
            color={edge}
            opacity={0}
            strokeOpacity={0.55 + 0.4 * warm}
            strokeWidth={Math.max(1.5, s.unit * 0.025)}
          />
          {/* berths */}
          {Array.from({ length: n }, (_, i) => {
            const b = berth(r, i);
            const st = seat(i);
            const taken = r === RES ? TAKEN[i] : (i * 7) % 10 < 3;
            const col = st?.color ?? (taken ? SEAT_TAKEN : SEAT_FREE);
            const lift = st?.lift ?? 0;
            const op = st?.opacity ?? 1;
            if (op <= 0.01) return null;
            const ins = 0.035;
            return (
              <g key={i} opacity={op}>
                <IsoBox x={b.x - b.cw / 2 + ins} y={b.y - b.rd / 2 + ins} z={r.pz + 0.05 + dz + lift} w={b.cw - 2 * ins} d={b.rd - 2 * ins} h={0.04 + lift * 0.4} color={col} glow={st?.ring ?? 0} />
                {(st?.lock ?? 0) > 0.01 && (
                  <IsoPath points={[[b.x - b.cw * 0.35, b.y], [b.x + b.cw * 0.35, b.y]]} z={r.pz + 0.11 + dz + lift * 1.4} color="#FFF6E0" width={Math.max(2, s.unit * 0.04 * (st?.lock ?? 0))} />
                )}
              </g>
            );
          })}
          {/* eye-scan band sweeping across the grid: looks, changes nothing */}
          {eye != null && eye > 0 && eye < 1 && (
            <IsoPoly
              points={[
                [r.x + r.w * eye - 0.18, r.y],
                [r.x + r.w * eye + 0.18, r.y],
                [r.x + r.w * eye + 0.18, r.y + r.d],
                [r.x + r.w * eye - 0.18, r.y + r.d],
              ]}
              z={r.pz + 0.12 + dz}
              color={C.green}
              opacity={0.28}
              strokeOpacity={0.8}
            />
          )}
          {outline > 0.01 && (
            <g style={{ filter: `drop-shadow(0 0 8px ${C.cyan})` }}>
              <IsoPath points={[[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.d], [r.x, r.y + r.d], [r.x, r.y]]} z={r.pz + 0.1} progress={outline} color={C.cyan} width={Math.max(2, s.unit * 0.04)} />
            </g>
          )}
          {ghost && ghost.opacity > 0.01 && (
            <g opacity={ghost.opacity}>
              {(() => {
                const z = r.pz + 0.1 + ghost.lift;
                const sh = ghost.crack > 0 && ghost.crack < 1 ? Math.sin(frame * 2.1) * 4 * (1 - ghost.crack) : 0;
                const half = ghost.crack * 0.25;
                return (
                  <g transform={`translate(${sh},0)`}>
                    <IsoPoly points={[[r.x - half, r.y - half], [r.x + r.w / 2 - half, r.y - half], [r.x + r.w / 2 - half, r.y + r.d - half], [r.x - half, r.y + r.d - half]]} z={z} color={C.text} opacity={0.05} strokeOpacity={0.8} dashed />
                    <IsoPoly points={[[r.x + r.w / 2 + half, r.y + half], [r.x + r.w + half, r.y + half], [r.x + r.w + half, r.y + r.d + half], [r.x + r.w / 2 + half, r.y + r.d + half]]} z={z - ghost.crack * 0.3} color={C.text} opacity={0.05} strokeOpacity={0.8} dashed />
                    {ghost.crack > 0.02 && <IsoPath points={[[r.x + r.w / 2, r.y], [r.x + r.w * 0.45, r.y + r.d * 0.3], [r.x + r.w * 0.55, r.y + r.d * 0.6], [r.x + r.w / 2, r.y + r.d]]} z={z} color={C.red} width={3} />}
                  </g>
                );
              })()}
            </g>
          )}
          {logo > 0.01 && <RailPole r={r} p={logo} dz={dz} />}
        </g>
      )}
    </g>
  );
};

/** The Indian Railways logo on a pole at the reservation system's back corner. */
const RailPole: React.FC<{ r: Res; p: number; dz: number }> = ({ r, p, dz }) => {
  const s = useIsoStage();
  const base = isoPoint(s, r.x + 0.12, r.y + 0.12, r.pz + 0.05 + dz);
  const pole = s.unit * 0.55 * Math.min(1, p);
  const size = Math.max(22, s.unit * 0.5) * Math.min(1, p);
  return (
    <g opacity={Math.min(1, p * 1.5)}>
      <line x1={base.x} y1={base.y} x2={base.x} y2={base.y - pole} stroke="#9AA3B5" strokeWidth={Math.max(1.5, s.unit * 0.03)} />
      <foreignObject x={base.x - size / 2} y={base.y - pole - size} width={size} height={size} style={{ overflow: "visible" }}>
        <div style={{ width: size, height: size, borderRadius: 999, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          <Img src={INDIAN_RAILWAYS_LOGO_URL} style={{ width: size * 0.9, height: size * 0.9, borderRadius: 999, display: "block" }} />
        </div>
      </foreignObject>
    </g>
  );
};

// ---------------------------------------------------------------- the agent's shop, cabinets, bots, trains

const ShopBlock: React.FC<{ glow: number; detail: number }> = ({ glow, detail }) => {
  const b = SHOP;
  const wall = "#8E7CC3";
  return (
    <g>
      <IsoBox x={b.x} y={b.y} w={b.w} d={b.d} h={b.h} color={wall} glow={glow} />
      <IsoBox x={b.x - 0.04} y={b.y - 0.04} z={b.h} w={b.w + 0.08} d={b.d + 0.08} h={0.05} color={isoShade(wall, -0.35)} />
      {detail > 0.01 && (
        <Face b={b} face="left" top={b.h}>
          <rect x={0.1} y={0.12} width={b.w - 0.2} height={0.34} fill={isoShade(wall, -0.55)} />
          {[0, 1, 2, 3, 4].map((k) => (
            <rect key={k} x={0.1} y={0.15 + k * 0.065} width={b.w - 0.2} height={0.02} fill={isoShade(wall, -0.2)} />
          ))}
          <rect x={0.1} y={0.03} width={b.w - 0.2} height={0.07} fill={C.accent} opacity={0.9} />
        </Face>
      )}
    </g>
  );
};

const Cabinet: React.FC<{ x: number; y: number; drop: number; glow: number }> = ({ x, y, drop, glow }) => {
  if (drop <= 0.001) return null;
  const dz = (1 - drop) * 2.2;
  const h = 0.55;
  return (
    <g opacity={Math.min(1, drop * 3)}>
      <IsoBox x={x} y={y} z={dz} w={CAB_W} d={CAB_W} h={h} color="#2C7FA3" glow={glow} />
      <IsoBox x={x} y={y} z={dz + h} w={CAB_W} d={CAB_W} h={0.05} color={C.green} glow={glow * 0.8} />
    </g>
  );
};

const BotBlock: React.FC<{ b: BotS }> = ({ b }) => {
  const s = useIsoStage();
  const op = b.opacity ?? 1;
  const sz = 0.2;
  const top = isoPoint(s, b.x, b.y, sz + 0.02);
  const tip = isoPoint(s, b.x, b.y, sz + 0.2);
  const fl = b.flash ?? 0;
  return (
    <g opacity={op}>
      <IsoBox x={b.x - sz / 2} y={b.y - sz / 2} w={sz} d={sz} h={sz} color={C.red} />
      <line x1={top.x} y1={top.y} x2={tip.x} y2={tip.y} stroke="#FFB3B3" strokeWidth={Math.max(1.2, s.unit * 0.02)} />
      <circle cx={tip.x} cy={tip.y} r={Math.max(1.5, s.unit * 0.03)} fill={C.red} />
      {fl > 0.01 && <circle cx={top.x} cy={top.y} r={s.unit * (0.2 + 0.4 * (1 - fl))} fill="none" stroke={C.red} strokeWidth={3} opacity={fl} />}
    </g>
  );
};

/** A short carriage on the track; `x` is its front. */
export type Car = { x: number; tag?: string; opacity?: number };
const CarBlock: React.FC<{ c: Car }> = ({ c }) => {
  const L = 0.95;
  const op = c.opacity ?? 1;
  const body = "#2C7FA3";
  return (
    <g opacity={op}>
      <IsoBox x={c.x - L} y={TRACK_Y - 0.2} z={0.06} w={L} d={0.4} h={0.32} color={body} />
      <IsoBox x={c.x - L + 0.03} y={TRACK_Y - 0.18} z={0.38} w={L - 0.06} d={0.36} h={0.05} color={isoShade(body, 0.3)} />
      <Face b={{ x: c.x - L, y: TRACK_Y - 0.2, w: L, d: 0.4, h: 0.38 }} face="left" top={0.38}>
        {[0.1, 0.32, 0.54, 0.76].map((u) => (
          <rect key={u} x={u} y={0.08} width={0.14} height={0.1} fill="#BFE3FF" opacity={0.85} />
        ))}
      </Face>
    </g>
  );
};

// ---------------------------------------------------------------- the World

export type WorldProps = {
  cam: Cam;
  dim?: number;
  /** Fade everything except these (follow): 0 = all normal, 1 = background dimmed to 35%. */
  focus?: number;
  clock?: { time?: string; ring?: number };
  station?: { label?: number; glow?: number; wire?: number };
  shop?: { label?: number; glow?: number; wire?: number };
  gate?: GateState;
  hall?: { glow?: number; rack?: number; label?: number; meter?: number | null; cubes?: number; cubeGo?: number; wire?: number };
  res?: {
    seat?: (i: number) => SeatState | null;
    cylLit?: (k: number) => number;
    warm?: number;
    glow?: number;
    eye?: number | null;
    outline?: number;
    ghost?: { lift: number; crack: number; opacity: number } | null;
    label?: number;
    logo?: number;
    opacity?: number;
  };
  newRes?: { drop?: number; plot?: number; seat?: (i: number) => SeatState | null; glow?: number };
  cabs?: (k: number) => { drop?: number; glow?: number; plot?: number };
  zones?: (k: number) => number;
  /** Green serve routes from cabinet k, path j: draw-on 0→1. */
  serve?: (k: number, j: number) => number;
  pulses?: Pulse[];
  bots?: BotS[];
  cars?: Car[];
  /** Extra paths drawn on the floor before travellers (routes, conduits). */
  paths?: { pts: P2[]; color: string; progress?: number; dashed?: boolean; width?: number; glow?: number; z?: number; opacity?: number }[];
  /** Extra depth-sorted blocks (bars etc.): key = x + y. */
  blocks?: { key: number; node: React.ReactNode }[];
  you?: { label?: number; opacity?: number };
  overlay?: React.ReactNode;
};

const MASK = "linear-gradient(180deg, transparent 0px, transparent 390px, black 480px, black 1200px, transparent 1290px)";
const FLOOR = "#10131B";
const TRAY = "#1C2130";

export const World: React.FC<WorldProps> = ({
  cam,
  dim = 1,
  focus = 0,
  clock = {},
  station = {},
  shop = {},
  gate = {},
  hall = {},
  res = {},
  newRes = {},
  cabs = (): { drop?: number; glow?: number; plot?: number } => ({}),
  zones = () => 0,
  serve = () => 0,
  pulses = [],
  bots: botList = [],
  cars = [],
  paths = [],
  blocks = [],
  you = {},
  overlay,
}) => {
  const frame = useCurrentFrame();
  const st = stageOf(cam);
  const detail = Math.max(0, Math.min(1, (cam.u - 40) / 25));
  const bgOp = 1 - 0.65 * focus;

  const items: { key: number; node: React.ReactNode }[] = [];
  HOMES.forEach((h, i) => {
    const isHome = i === 0;
    items.push({
      key: h.x + h.w / 2 + h.y + h.d / 2,
      node: (
        <g key={`h${i}`} opacity={isHome ? 1 : bgOp}>
          <HomeBlock b={h} detail={detail} glow={isHome ? 0.3 * (you.label ?? 0) : 0} />
        </g>
      ),
    });
  });
  items.push({ key: STATION.x + STATION.w / 2 + STATION.y, node: <g key="st" opacity={bgOp}><StationBlock detail={detail} time={clock.time ?? "9:59"} ring={clock.ring ?? 0} glow={station.glow ?? 0} /></g> });
  items.push({ key: HALL_B.x + HALL_B.w / 2 + HALL_B.y + HALL_B.d / 2, node: <g key="hall" opacity={1 - 0.4 * focus}><HallBlock glow={hall.glow ?? 0} rack={hall.rack ?? 0.4} meter={hall.meter ?? null} cubes={hall.cubes ?? 0} cubeGo={hall.cubeGo ?? 0} /></g> });
  items.push({ key: 7.5 + GATE_Y, node: <g key="gate" opacity={1 - 0.4 * focus}><GateBlock g={gate} detail={detail} /></g> });
  items.push({ key: RES.x + RES.w / 2 + RES.y + RES.d / 2, node: <g key="res" opacity={1 - 0.4 * focus}><ResBlock r={RES} {...res} opacity={res.opacity ?? 1} /></g> });
  items.push({ key: NEW_RES.x + NEW_RES.w / 2 + NEW_RES.y + NEW_RES.d / 2, node: <ResBlock key="nres" r={NEW_RES} drop={newRes.drop ?? 0} plot={newRes.plot ?? 0} seat={newRes.seat} glow={newRes.glow ?? 0} cylLit={() => 0.6} /> });
  items.push({ key: SHOP.x + SHOP.w / 2 + SHOP.y + SHOP.d / 2, node: <g key="shop" opacity={bgOp}><ShopBlock glow={shop.glow ?? 0} detail={detail} /></g> });
  CABS.forEach(([x, y], k) => {
    const c = cabs(k);
    items.push({ key: x + y + CAB_W, node: <Cabinet key={`cab${k}`} x={x} y={y} drop={c.drop ?? 0} glow={c.glow ?? 0} /> });
  });
  botList.forEach((b, k) => items.push({ key: b.x + b.y + 0.05, node: <BotBlock key={`bot${k}`} b={b} /> }));
  cars.forEach((c, k) => items.push({ key: c.x - 0.5 + TRACK_Y, node: <CarBlock key={`car${k}`} c={c} /> }));
  blocks.forEach((b) => items.push(b));
  items.sort((a, b) => a.key - b.key);

  const youD = YOU_PATH[0];

  return (
    <IsoStage originX={st.ox} originY={st.oy} unit={st.unit} style={{ maskImage: MASK, WebkitMaskImage: MASK }}>
      <g opacity={dim}>
        {/* floor */}
        <IsoTile x={0} y={0} w={14} d={14} color={FLOOR} opacity={1} strokeOpacity={0} />
        <g opacity={bgOp}>
          {ZONES.map((z, k) => {
            const t = zones(k);
            return t > 0.01 ? <IsoPoly key={`z${k}`} points={z} color={C.green} opacity={0.1 * t} strokeOpacity={0.45 * t} dashed /> : null;
          })}
          {LANES.map((l, k) => {
            const v = l.a[0] === l.b[0];
            return (
              <IsoTile
                key={`l${k}`}
                x={v ? l.a[0] - l.w / 2 : l.a[0]}
                y={v ? l.a[1] : l.a[1] - l.w / 2}
                w={v ? l.w : l.b[0] - l.a[0]}
                d={v ? l.b[1] - l.a[1] : l.w}
                color={TRAY}
                opacity={1}
                strokeOpacity={0}
              />
            );
          })}
          {LANES.filter((l) => l.w > 0.4).map((l, k) => (
            <g key={`c${k}`} opacity={0.4}>
              <IsoPath points={[l.a, l.b]} color="#3A4258" width={Math.max(1.2, cam.u * 0.025)} dashed />
            </g>
          ))}
        </g>
        <IsoTile x={PLAZA.x} y={PLAZA.y} w={PLAZA.w} d={PLAZA.d} color="#1A1F2C" opacity={1} strokeOpacity={0} />
        {/* rail track along the back edge */}
        <g opacity={bgOp}>
          <IsoTile x={0} y={TRACK_Y - 0.3} w={14} d={0.6} color="#191C24" opacity={1} strokeOpacity={0} />
          {Array.from({ length: 47 }, (_, k) => (
            <IsoTile key={`sl${k}`} x={k * 0.3} y={TRACK_Y - 0.24} w={0.08} d={0.48} color="#4A3A2A" opacity={1} strokeOpacity={0} />
          ))}
          <IsoPath points={[[0, TRACK_Y - 0.13], [14, TRACK_Y - 0.13]]} color="#9AA3B5" width={Math.max(1.2, cam.u * 0.03)} />
          <IsoPath points={[[0, TRACK_Y + 0.13], [14, TRACK_Y + 0.13]]} color="#9AA3B5" width={Math.max(1.2, cam.u * 0.03)} />
        </g>
        {/* the hall's wire to the seat grid (always there, glows when used) */}
        <IsoPath points={HALL_WIRE} color={C.cyan} width={Math.max(3, cam.u * 0.08)} glow={hall.wire ?? 0} />
        {(station.wire ?? 0) > 0.001 && <IsoPath points={STATION_WIRE} color={C.cyan} progress={station.wire} width={Math.max(3, cam.u * 0.07)} glow={0.6} />}
        {(shop.wire ?? 0) > 0.001 && <IsoPath points={AGENT_WIRE} color={C.cyan} progress={shop.wire} width={Math.max(3, cam.u * 0.07)} glow={0.6} />}
        {paths.map((p, k) => (
          <g key={`p${k}`} opacity={p.opacity ?? 1}>
            <IsoPath points={p.pts} color={p.color} progress={p.progress ?? 1} dashed={p.dashed} width={p.width ?? Math.max(3, cam.u * 0.07)} glow={p.glow ?? 0} z={p.z ?? 0} />
          </g>
        ))}
        {CABS.map(([x, y], k) =>
          SERVE_PATHS[k].map((pts, j) => {
            const v = serve(k, j);
            return v > 0.001 ? <IsoPath key={`sv${k}${j}`} points={pts} color={C.green} progress={Math.min(1, v)} width={Math.max(3, cam.u * 0.07)} glow={0.6} /> : null;
          }),
        )}
        {CABS.map(([x, y], k) => {
          const pl = cabs(k).plot ?? 0;
          return pl > 0.01 && (cabs(k).drop ?? 0) < 0.99 ? <IsoTile key={`cp${k}`} x={x - 0.08} y={y - 0.08} w={CAB_W + 0.16} d={CAB_W + 0.16} color={C.text} opacity={0.04} strokeOpacity={0.6 * pl} dashed /> : null;
        })}
        {/* blocks, back to front */}
        {items.map((it) => it.node)}
        {/* travellers on top */}
        {pulses.map((p, k) => (
          <g key={`pu${k}`} opacity={p.opacity ?? 1}>
            <IsoPulse points={p.pts} t={p.t} color={p.color ?? C.accent} size={p.size || Math.max(4, cam.u * 0.09)} trail={p.trail ?? 0} trailLen={0.9} ring={p.ring ?? 0} frame={frame} />
          </g>
        ))}
        {/* signs and labels */}
        <IrctcSign glow={hall.glow ?? 0} />
        {(hall.label ?? 0) > 0.01 && <IsoLabel x={HALL_B.x + HALL_B.w * 0.5} y={HALL_B.y + HALL_B.d} z={0} text="IRCTC'S HALL" opacity={hall.label} lift={-cam.u * 0.55} size={Math.round(Math.max(20, Math.min(28, cam.u * 0.3)))} />}
        {(gate.label ?? 0) > 0.01 && <IsoLabel x={7.5} y={GATE_Y} z={0.9} text="GATE" color={C.text} opacity={gate.label} lift={Math.max(28, cam.u * 0.35)} size={Math.round(Math.max(22, Math.min(30, cam.u * 0.28)))} />}
        {(res.label ?? 0) > 0.01 && <IsoLabel x={RES.x + RES.w * 0.6} y={RES.y} z={RES.pz} text="RESERVATION SYSTEM" color={C.cyan} opacity={res.label} lift={Math.max(26, cam.u * 0.5)} size={Math.round(Math.max(20, Math.min(28, cam.u * 0.4)))} />}
        {(station.label ?? 0) > 0.01 && <IsoLabel x={STATION.x + STATION.w / 2} y={STATION.y + STATION.d} z={STATION.h + 0.35} text="STATION" opacity={station.label} lift={Math.max(30, cam.u * 0.45)} size={Math.round(Math.max(20, Math.min(28, cam.u * 0.4)))} />}
        {(shop.label ?? 0) > 0.01 && <IsoLabel x={SHOP.x + SHOP.w / 2} y={SHOP.y + SHOP.d / 2} z={SHOP.h} text="AGENT" color={C.text} opacity={shop.label} lift={Math.max(30, cam.u * 0.4)} size={Math.round(Math.max(20, Math.min(28, cam.u * 0.4)))} />}
        {(you.label ?? 0) > 0.01 && <IsoLabel x={youD[0]} y={youD[1]} z={0.2} text="YOU" color={C.accent} opacity={(you.label ?? 0) * (you.opacity ?? 1)} lift={Math.max(30, cam.u * 0.9)} size={Math.round(Math.max(22, Math.min(30, cam.u * 0.8)))} />}
        {overlay}
      </g>
    </IsoStage>
  );
};

/** Your pulse: a brighter amber pulse at distance `d` along a path, with a small tag riding above it. */
export const YouPulse: React.FC<{ pts: P2[]; d: number; tag?: string; tagColor?: string; tagP?: number; moving?: boolean; z?: number }> = ({ pts, d, tag, tagColor = C.accent, tagP = 1, moving = false }) => {
  const s = useIsoStage();
  const frame = useCurrentFrame();
  const len = pathLen(pts);
  const t = Math.max(0, Math.min(1, d / len));
  const p = at(pts, d);
  const q = isoPoint(s, p[0], p[1], 0.12);
  const size = Math.max(7, s.unit * 0.15);
  const tw = tag ? tag.length * 15 + 24 : 0;
  return (
    <g>
      <IsoPulse points={pts} t={t} size={size} trail={moving ? 1 : 0} trailLen={1.4} ring={moving ? 0 : 1} frame={frame} />
      {tag && tagP > 0.01 && (
        <g transform={`translate(${q.x},${q.y - size * 2.6 - 16}) scale(${0.6 + 0.4 * Math.min(1, tagP)})`} opacity={Math.min(1, tagP * 1.6)}>
          <rect x={-tw / 2} y={-17} width={tw} height={34} rx={9} fill="rgba(7,8,12,0.92)" stroke={tagColor} strokeWidth={2} />
          <text textAnchor="middle" dominantBaseline="central" fontFamily={F.mono} fontWeight={700} fontSize={22} letterSpacing={1} fill={tagColor}>
            {tag}
          </text>
        </g>
      )}
    </g>
  );
};

/** A landing ring spreading on the floor around (x, y): `t` 0→1. */
export const LandRing: React.FC<{ x: number; y: number; t: number; r?: number; color?: string }> = ({ x, y, t, r = 1, color = C.cyan }) => {
  const s = useIsoStage();
  if (t <= 0 || t >= 1) return null;
  const p = isoPoint(s, x, y, 0);
  const rr = r * (0.5 + 1.2 * t) * s.unit;
  return <ellipse cx={p.x} cy={p.y} rx={rr * Math.SQRT2 * COS} ry={rr * Math.SQRT2 * SIN} fill="none" stroke={color} strokeWidth={3} opacity={(1 - t) * 0.9} />;
};

/** A raised glow on a berth (your pulse sitting on the seat grid). */
export const BerthPulse: React.FC<{ r?: Res; i: number; p?: number; color?: string }> = ({ r = RES, i, p = 1, color = C.accent }) => {
  const s = useIsoStage();
  const frame = useCurrentFrame();
  if (p <= 0.01) return null;
  const b = berth(r, i);
  const q = isoPoint(s, b.x, b.y, b.z + 0.08);
  const size = Math.max(6, s.unit * 0.1);
  const ph = (frame % 36) / 36;
  return (
    <g opacity={Math.min(1, p)}>
      <ellipse cx={q.x} cy={q.y + 4} rx={size * (1.2 + 2 * ph)} ry={size * (0.6 + 1 * ph)} fill="none" stroke={color} strokeWidth={2.5} opacity={(1 - ph) * 0.8} />
      <circle cx={q.x} cy={q.y} r={size * 2} fill={color} opacity={0.16} />
      <circle cx={q.x} cy={q.y} r={size} fill={color} style={{ filter: `drop-shadow(0 0 ${size}px ${color})` }} />
      <circle cx={q.x} cy={q.y} r={size * 0.5} fill="#FFF6E0" />
    </g>
  );
};
