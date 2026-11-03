import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F } from "../../../theme";
import { rnd } from "../../../engine/kit";
import { Product } from "../../../products";

// One top-down city carries the whole episode. Everything lives in world units (a road every 120),
// and each scene points a camera at it. Pins and gauges are drawn in screen space on top.

export type Pt = { x: number; y: number };
export type Cam = { cx: number; cy: number; zoom: number; sx?: number; sy?: number };

const SX = 540;
const SY = 655;
export const BLOCK = 120;

export const toScreen = (c: Cam, p: Pt): Pt => ({
  x: (c.sx ?? SX) + (p.x - c.cx) * c.zoom,
  y: (c.sy ?? SY) + (p.y - c.cy) * c.zoom,
});

/** Camera move: zoom eases geometrically so pull-backs feel even. */
export const mixCam = (a: Cam, b: Cam, t: number): Cam => {
  const l = (u: number, v: number) => u + (v - u) * t;
  return {
    cx: l(a.cx, b.cx),
    cy: l(a.cy, b.cy),
    zoom: a.zoom * Math.pow(b.zoom / a.zoom, t),
    sx: l(a.sx ?? SX, b.sx ?? SX),
    sy: l(a.sy ?? SY, b.sy ?? SY),
  };
};

// ---- The city -------------------------------------------------------------

export const STORE0: Pt = { x: -180, y: -60 };
export const HOME0: Pt = { x: 180, y: 180 };
/** The short ride: store to home along the roads. */
export const ROUTE0: Pt[] = [STORE0, { x: -120, y: -60 }, { x: -120, y: 120 }, { x: 180, y: 120 }, HOME0];
/** Where the moped actually rides: from just outside the store to just above the home. */
export const RIDE0: Pt[] = ROUTE0.slice(1, 4);
export const WAREHOUSE: Pt = { x: -2100, y: -1740 };
/** The long ride from a warehouse at the edge of the city. */
export const ROUTE_FAR: Pt[] = [
  WAREHOUSE,
  { x: -2040, y: -1740 },
  { x: -2040, y: -840 },
  { x: -1080, y: -840 },
  { x: -1080, y: -360 },
  { x: -480, y: -360 },
  { x: -480, y: 120 },
  { x: 180, y: 120 },
  HOME0,
];
export const STORES: Pt[] = [STORE0, { x: -1020, y: -780 }, { x: 660, y: -780 }, { x: -1020, y: 540 }, { x: 660, y: 540 }];
export const RING_R = 480;

export const HOOK_CAM: Cam = { cx: 0, cy: 60, zoom: 1.6, sy: 655 };
export const NAIVE_CAM: Cam = { cx: -960, cy: -780, zoom: 0.33, sy: 790 };
export const DISTRICT_CAM: Cam = { cx: -120, cy: 0, zoom: 0.4, sy: 790 };
export const FAR_CAM: Cam = { cx: 0, cy: 0, zoom: 0.1, sy: 840 };

/** The whole network for the far shots: a jittered grid of stores, nearest to the centre first. */
export const NETWORK: (Pt & { d: number })[] = (() => {
  const out: (Pt & { d: number })[] = [];
  for (let i = -7; i <= 7; i++)
    for (let j = -6; j <= 6; j++) {
      const x = i * 760 + (rnd(`nx${i}:${j}`) - 0.5) * 300;
      const y = j * 700 + (rnd(`ny${i}:${j}`) - 0.5) * 300;
      out.push({ x, y, d: Math.hypot(x, y) });
    }
  return out.sort((a, b) => a.d - b.d);
})();
/** Planned stores filling the gaps (about a quarter more, like 2,751 → 3,500). */
export const PLANNED: (Pt & { d: number })[] = (() => {
  const out: (Pt & { d: number })[] = [];
  for (let i = -7; i < 7; i++)
    for (let j = -6; j < 6; j++) {
      if (rnd(`pl${i}:${j}`) > 0.3) continue;
      const x = (i + 0.5) * 760;
      const y = (j + 0.5) * 700;
      out.push({ x, y, d: Math.hypot(x, y) });
    }
  return out.sort((a, b) => a.d - b.d);
})();

const nearStoreOrHome = (p: Pt) => [...STORES, HOME0].some((s) => Math.abs(s.x - p.x) < 10 && Math.abs(s.y - p.y) < 10);

export const HOUSES: Pt[] = (() => {
  const out: Pt[] = [];
  for (let i = -15; i <= 14; i++)
    for (let j = -15; j <= 14; j++) {
      const p = { x: i * BLOCK + 60, y: j * BLOCK + 60 };
      if (rnd(`h${i}:${j}`) < 0.38 || nearStoreOrHome(p)) continue;
      out.push(p);
    }
  return out;
})();

const ROADS = (() => {
  let minor = "";
  let major = "";
  const E = 5600;
  for (let k = -46; k <= 46; k++) {
    const v = k * BLOCK;
    const seg = `M${-E} ${v}H${E}M${v} ${-E}V${E}`;
    if (k % 4 === 0) major += seg;
    else minor += seg;
  }
  return { minor, major };
})();

const housePath = (p: Pt, s = 38) =>
  `M${p.x - s / 2} ${p.y + s / 2}V${p.y - s * 0.08}L${p.x} ${p.y - s / 2}L${p.x + s / 2} ${p.y - s * 0.08}V${p.y + s / 2}Z`;

// ---- Geometry helpers -----------------------------------------------------

/** Position `p` (0–1) of the way along a polyline, plus the part already travelled. */
export const along = (pts: Pt[], p: number) => {
  const lens = pts.slice(1).map((b, i) => Math.hypot(b.x - pts[i].x, b.y - pts[i].y));
  const total = lens.reduce((a, b) => a + b, 0);
  let left = Math.max(0, Math.min(1, p)) * total;
  const done: Pt[] = [pts[0]];
  for (let i = 0; i < lens.length; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (left <= lens[i] || i === lens.length - 1) {
      const f = lens[i] === 0 ? 0 : Math.min(1, left / lens[i]);
      const pos = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
      done.push(pos);
      return { pos, done, dir: Math.sign(b.x - a.x) || 1 };
    }
    left -= lens[i];
    done.push(b);
  }
  return { pos: pts[pts.length - 1], done, dir: 1 };
};

const pts = (p: Pt[]) => p.map((q) => `${q.x},${q.y}`).join(" ");

// ---- World layer (SVG, world units) ---------------------------------------

export const CityMap: React.FC<{
  cam: Cam;
  /** 0–1 visibility of the houses (they fade out on far zooms). */
  houses?: number;
  /** 0–1 amber tint per house (homes served by a store). */
  lit?: (p: Pt) => number;
  dim?: number;
  children?: React.ReactNode;
}> = ({ cam, houses = 1, lit, dim = 0, children }) => {
  const sx = cam.sx ?? SX;
  const sy = cam.sy ?? SY;
  const mask = "linear-gradient(180deg, transparent 370px, black 450px, black 1200px, transparent 1262px)";
  return (
    <AbsoluteFill style={{ maskImage: mask, WebkitMaskImage: mask, opacity: 1 - 0.7 * dim, filter: dim ? `blur(${dim * 6}px)` : undefined }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${sx} ${sy}) scale(${cam.zoom}) translate(${-cam.cx} ${-cam.cy})`}>
          <path d={ROADS.minor} stroke="rgba(255,255,255,0.055)" strokeWidth={22} fill="none" />
          <path d={ROADS.major} stroke="rgba(255,255,255,0.09)" strokeWidth={34} fill="none" />
          {houses > 0.01 && (
            <g opacity={houses}>
              {HOUSES.map((h, i) => {
                const l = lit ? lit(h) : 0;
                return (
                  <path
                    key={i}
                    d={housePath(h)}
                    fill={l > 0.01 ? `rgba(255,181,71,${0.12 + 0.5 * l})` : "rgba(169,180,200,0.13)"}
                    stroke={l > 0.01 ? `rgba(255,181,71,${0.3 + 0.5 * l})` : "rgba(169,180,200,0.22)"}
                    strokeWidth={3}
                  />
                );
              })}
            </g>
          )}
          {children}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** A drawn road/route in world units (constant on-screen width). */
export const Route: React.FC<{ path: Pt[]; p?: number; color: string; width?: number; glow?: number; opacity?: number; dashed?: boolean }> = ({
  path,
  p = 1,
  color,
  width = 8,
  glow = 0.5,
  opacity = 1,
  dashed,
}) => {
  if (p <= 0.001 || opacity <= 0.001) return null;
  const d = pts(along(path, p).done);
  return (
    <g opacity={opacity}>
      <polyline points={d} fill="none" stroke={color} strokeOpacity={0.18 * glow} strokeWidth={width * 3.2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <polyline
        points={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dashed ? `${width * 2} ${width * 1.6}` : undefined}
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
};

/** A store's patch: a soft amber circle that grows out from the store. */
export const Ring: React.FC<{ at: Pt; p: number; r?: number; hi?: number; dashed?: boolean; opacity?: number }> = ({ at, p, r = RING_R, hi = 0, dashed, opacity = 1 }) =>
  p <= 0.001 ? null : (
    <circle
      cx={at.x}
      cy={at.y}
      r={r * p}
      fill={`rgba(255,181,71,${(dashed ? 0.03 : 0.07 + 0.08 * hi) * Math.min(1, p)})`}
      stroke={`rgba(255,181,71,${(dashed ? 0.35 : 0.45 + 0.5 * hi) * Math.min(1, p)})`}
      strokeWidth={2.5 + 2 * hi}
      strokeDasharray={dashed ? "6 6" : undefined}
      vectorEffect="non-scaling-stroke"
      opacity={opacity}
    />
  );

// ---- Screen layer (HTML on top of the map) ---------------------------------

/** Centres its children on a world point. */
export const At: React.FC<{ cam: Cam; p: Pt; dx?: number; dy?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ cam, p, dx = 0, dy = 0, style, children }) => {
  const s = toScreen(cam, p);
  return (
    <div style={{ position: "absolute", left: s.x + dx, top: s.y + dy, transform: "translate(-50%, -50%)", ...style }}>
      {children}
    </div>
  );
};

/** Amber store badge. `dark` dims it to show a "dark store"; `glow` brightens it. */
export const StorePin: React.FC<{ size: number; glow?: number; dark?: number; p?: number }> = ({ size, glow = 0.4, dark = 0, p = 1 }) => {
  const g = glow * (1 - dark * 0.8);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: dark > 0 ? `rgba(${17 - 10 * dark},${19 - 10 * dark},${26 - 12 * dark},0.96)` : C.panel2,
        border: `${Math.max(2, size * 0.04)}px solid rgba(255,181,71,${0.55 + 0.45 * g})`,
        boxShadow: `0 0 ${size * 0.6 * g}px rgba(255,181,71,${0.7 * g}), 0 ${size * 0.12}px ${size * 0.3}px rgba(0,0,0,0.6)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: Math.min(1, p),
        transform: `translateY(${(1 - p) * -size * 0.8}px) scale(${0.5 + 0.5 * p})`,
      }}
    >
      <Product p="store" size={size * 0.62} color={dark > 0.5 ? "#B07A2A" : C.accent} style={{ filter: "none" }} />
    </div>
  );
};

export const HomePin: React.FC<{ size: number; p?: number; glow?: number }> = ({ size, p = 1, glow = 0 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      background: C.panel2,
      border: `${Math.max(2, size * 0.035)}px solid rgba(245,245,247,${0.35 + 0.4 * glow})`,
      boxShadow: `0 0 ${size * 0.5 * glow}px rgba(245,245,247,0.4), 0 ${size * 0.1}px ${size * 0.3}px rgba(0,0,0,0.6)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: Math.min(1, p),
      transform: `scale(${0.6 + 0.4 * p})`,
    }}
  >
    <Product p="house" size={size * 0.6} color={C.text} style={{ filter: "none" }} />
  </div>
);

/** The moped. `items` are grocery icons in the bag (each with its own 0–1 pop). */
export const Moped: React.FC<{ size: number; dir?: number; bag?: boolean; items?: [string, number][]; bob?: number }> = ({ size, dir = 1, bag = true, items = [], bob = 0 }) => (
  <div style={{ position: "relative", width: size, height: size, transform: `translateY(${bob}px)` }}>
    {bag && (
      <div style={{ position: "absolute", left: "50%", bottom: size * 0.62, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 2, height: size * 0.36, alignItems: "flex-end", marginBottom: -size * 0.12 }}>
          {items.map(([p, k], i) => (
            <span key={i} style={{ opacity: Math.min(1, k), transform: `translateY(${(1 - k) * -size * 0.5}px) scale(${0.4 + 0.6 * Math.min(1.2, k)})` }}>
              <Product p={p} size={size * 0.4} />
            </span>
          ))}
        </div>
        <Product p="bag" size={size * 0.5} />
      </div>
    )}
    <div style={{ transform: `scaleX(${dir})`, display: "flex" }}>
      <Product p="moped" size={size} color={C.cyan} />
    </div>
  </div>
);

/** Mono time readout chip. */
export const Chip: React.FC<{ text: string; color?: string; size?: number; style?: React.CSSProperties }> = ({ text, color = C.text, size = 40, style }) => (
  <div
    style={{
      fontFamily: F.mono,
      fontWeight: 700,
      fontSize: size,
      letterSpacing: 1,
      color,
      padding: `${size * 0.22}px ${size * 0.45}px`,
      borderRadius: size * 0.35,
      background: "rgba(13,16,23,0.92)",
      border: `2px solid ${color}55`,
      boxShadow: `0 0 30px ${color}33, 0 10px 30px rgba(0,0,0,0.6)`,
      whiteSpace: "nowrap",
      fontVariantNumeric: "tabular-nums",
      ...style,
    }}
  >
    {text}
  </div>
);

// ---- Speedometer ----------------------------------------------------------

const MAXV = 60;
const ang = (v: number) => -120 + (240 * Math.max(0, Math.min(MAXV, v))) / MAXV;
const polar = (cx: number, cy: number, r: number, a: number) => ({ x: cx + r * Math.sin((a * Math.PI) / 180), y: cy - r * Math.cos((a * Math.PI) / 180) });
const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const s = polar(cx, cy, r, a0);
  const e = polar(cx, cy, r, a1);
  return `M${s.x} ${s.y}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${e.x} ${e.y}`;
};

/** Speedometer whose needle never gets past 15 km/h. `wall` shows the block at 15; `push` lights it. */
export const Gauge: React.FC<{ value: number; size: number; wall?: number; push?: number; shown?: number }> = ({ value, size, wall = 0, push = 0, shown }) => {
  const c = size / 2;
  const r = size * 0.33;
  const sw = size * 0.05;
  const n = polar(c, c, r * 0.8, ang(value));
  const wa = ang(15);
  const w0 = polar(c, c, r - sw * 1.1, wa);
  const w1 = polar(c, c, r + sw * 1.1, wa);
  const display = Math.round(shown ?? value);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <circle cx={c} cy={c} r={size * 0.49} fill="rgba(13,16,23,0.94)" stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
        <path d={arc(c, c, r, -120, 120)} stroke="rgba(255,255,255,0.07)" strokeWidth={sw} fill="none" strokeLinecap="round" />
        {value > 0.2 && <path d={arc(c, c, r, -120, ang(value))} stroke={C.cyan} strokeWidth={sw} fill="none" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 ${size * 0.03}px ${C.cyan})` }} />}
        {Array.from({ length: 7 }).map((_, i) => {
          const a = ang(i * 10);
          const p0 = polar(c, c, r + sw * 0.9, a);
          const p1 = polar(c, c, r + sw * 1.4, a);
          const pl = polar(c, c, r + sw * 2.3, a);
          return (
            <g key={i}>
              <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke="rgba(255,255,255,0.35)" strokeWidth={Math.max(1.5, size * 0.007)} />
              <text x={pl.x} y={pl.y} fill="rgba(245,245,247,0.55)" fontFamily={F.mono} fontWeight={700} fontSize={size * 0.05} textAnchor="middle" dominantBaseline="central">
                {i * 10}
              </text>
            </g>
          );
        })}
        {wall > 0.01 && (
          <line
            x1={w0.x}
            y1={w0.y}
            x2={w1.x}
            y2={w1.y}
            stroke={push > 0.05 ? C.red : C.accent}
            strokeOpacity={wall}
            strokeWidth={sw * 0.5}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 ${size * (0.02 + 0.05 * push)}px ${push > 0.05 ? C.red : C.accent})` }}
          />
        )}
        <line x1={c} y1={c} x2={n.x} y2={n.y} stroke={C.text} strokeWidth={size * 0.018} strokeLinecap="round" />
        <circle cx={c} cy={c} r={size * 0.035} fill={C.text} />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: c + size * 0.1, textAlign: "center", lineHeight: 1 }}>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: size * 0.2, color: C.text, letterSpacing: -size * 0.004, fontVariantNumeric: "tabular-nums" }}>{display}</div>
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: size * 0.055, color: C.cyan, letterSpacing: 2, marginTop: size * 0.01 }}>KM/H</div>
      </div>
    </div>
  );
};

/** Gauge placement shared by hook and outro so the loop lines up. */
export const GAUGE_HOOK = { x: 540, y: 1075, size: 330 };
