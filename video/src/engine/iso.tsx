import React, { createContext, useContext } from "react";
import { C, F, W } from "../theme";

/**
 * Isometric 2D kit for How It Scales. A world in grid units (x to the right-back, y to the left-back, z up)
 * projected onto the frame at the classic 30° angle. Everything is flat-shaded SVG: one light from the top
 * left, so tops are lightest, left faces mid, right faces darkest.
 *
 *   <IsoStage originY={780} unit={64}>          // origin = screen point of world (0,0,0)
 *     <IsoGrid w={8} d={8} />
 *     <IsoPath points={[[0, 2], [5, 2], [5, 6]]} color={C.cyan} progress={p} />
 *     <IsoBox x={1} y={1} w={2} d={2} h={1.4} color={C.cyan} label="API" />
 *     <IsoPacket points={[[0, 2], [5, 2]]} t={(frame % 40) / 40} />
 *   </IsoStage>
 *
 * Draw back to front: things with a smaller x + y first (painter's order); SVG has no depth buffer.
 * Keep the stage inside the main visual area (y 400–1250) and clear of the right 120 px.
 */

const COS = Math.cos(Math.PI / 6);
const SIN = Math.sin(Math.PI / 6);

export type IsoStageValue = { ox: number; oy: number; unit: number };
type Stage = IsoStageValue;
const StageContext = createContext<Stage>({ ox: W / 2, oy: 800, unit: 64 });
const useStage = () => useContext(StageContext);
/** The current stage (origin + unit), for custom pieces drawn inside an IsoStage. */
export const useIsoStage = useStage;

/** Screen position of a world point. */
export function isoPoint(s: Stage, x: number, y: number, z = 0) {
  return { x: s.ox + (x - y) * COS * s.unit, y: s.oy + (x + y) * SIN * s.unit - z * s.unit };
}

const pts = (s: Stage, list: [number, number, number][]) =>
  list.map(([x, y, z]) => {
    const p = isoPoint(s, x, y, z);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(" ");

/** Lighten (k > 0) or darken (k < 0) a #rrggbb colour. Faces of one block share a hue. */
export function isoShade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(k >= 0 ? c + (255 - c) * k : c * (1 + k)));
  return `#${ch.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** The SVG canvas for an isometric scene. Full frame size so screen coordinates match the layout guide. */
export const IsoStage: React.FC<{ originX?: number; originY?: number; unit?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  originX = W / 2,
  originY = 800,
  unit = 64,
  children,
  style,
}) => (
  <StageContext.Provider value={{ ox: originX, oy: originY, unit }}>
    <svg width={W} height={1920} viewBox={`0 0 ${W} 1920`} style={{ position: "absolute", inset: 0, overflow: "visible", ...style }}>
      {children}
    </svg>
  </StageContext.Provider>
);

/** Floor grid of w × d cells. `reveal` 0→1 draws it in from the back corner. */
export const IsoGrid: React.FC<{ w: number; d: number; x?: number; y?: number; color?: string; reveal?: number }> = ({
  w,
  d,
  x = 0,
  y = 0,
  color = "rgba(255,255,255,0.07)",
  reveal = 1,
}) => {
  const s = useStage();
  const lines: React.ReactNode[] = [];
  for (let i = 0; i <= w; i++) {
    const a = isoPoint(s, x + i, y);
    const b = isoPoint(s, x + i, y + d * reveal);
    lines.push(<line key={`x${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={1.5} />);
  }
  for (let j = 0; j <= d; j++) {
    const a = isoPoint(s, x, y + j);
    const b = isoPoint(s, x + w * reveal, y + j);
    lines.push(<line key={`y${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={1.5} />);
  }
  return <g>{lines}</g>;
};

/** A flat slab on the floor (a zone, a region, a rack footprint). */
export const IsoTile: React.FC<{
  x: number;
  y: number;
  w: number;
  d: number;
  z?: number;
  color: string;
  opacity?: number;
  /** Outline strength (default 0.5); `dashed` for planned / not-yet-built footprints. */
  strokeOpacity?: number;
  dashed?: boolean;
}> = ({ x, y, w, d, z = 0, color, opacity = 0.18, strokeOpacity = 0.5, dashed = false }) => {
  const s = useStage();
  return (
    <polygon
      points={pts(s, [[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z]])}
      fill={color}
      fillOpacity={opacity}
      stroke={color}
      strokeOpacity={strokeOpacity}
      strokeWidth={2}
      strokeDasharray={dashed ? "6 6" : undefined}
    />
  );
};

/**
 * A block: server, database, store, queue, building. `rise` 0→1 grows it from the floor (drive it with a
 * spring cued to a word); `glow` > 0 adds a halo on the top face for "this one is busy".
 */
export const IsoBox: React.FC<{
  x: number;
  y: number;
  z?: number;
  w?: number;
  d?: number;
  h?: number;
  color?: string;
  rise?: number;
  glow?: number;
  label?: string;
  icon?: React.ReactNode;
  /** Fade the whole block (x-ray views, dimmed worlds). */
  opacity?: number;
}> = ({ x, y, z = 0, w = 1, d = 1, h = 1, color = C.cyan, rise = 1, glow = 0, label, icon, opacity = 1 }) => {
  const s = useStage();
  const t = z + h * Math.max(0, rise);
  const top = isoPoint(s, x + w / 2, y + d / 2, t);
  if (rise <= 0.001 || opacity <= 0.001) return null;
  return (
    <g opacity={opacity}>
      {/* left face (along x) */}
      <polygon points={pts(s, [[x, y + d, z], [x + w, y + d, z], [x + w, y + d, t], [x, y + d, t]])} fill={isoShade(color, -0.35)} />
      {/* right face (along y) */}
      <polygon points={pts(s, [[x + w, y, z], [x + w, y + d, z], [x + w, y + d, t], [x + w, y, t]])} fill={isoShade(color, -0.6)} />
      {/* top */}
      <polygon
        points={pts(s, [[x, y, t], [x + w, y, t], [x + w, y + d, t], [x, y + d, t]])}
        fill={isoShade(color, 0.12)}
        stroke={glow > 0 ? isoShade(color, 0.6) : "none"}
        strokeWidth={glow > 0 ? 3 : 0}
        style={glow > 0 ? { filter: `drop-shadow(0 0 ${18 * glow}px ${color})` } : undefined}
      />
      {icon && rise > 0.6 && (
        <foreignObject x={top.x - 36} y={top.y - 36} width={72} height={72} style={{ overflow: "visible" }}>
          <div style={{ width: 72, height: 72, display: "flex", alignItems: "center", justifyContent: "center", transform: "scaleY(0.82)" }}>{icon}</div>
        </foreignObject>
      )}
      {label && rise > 0.6 && <IsoLabel x={x + w / 2} y={y + d / 2} z={t} text={label} />}
    </g>
  );
};

/** A short label floating above a world point, in the series' mono type. */
export const IsoLabel: React.FC<{ x: number; y: number; z?: number; text: string; color?: string; lift?: number; size?: number; opacity?: number }> = ({
  x,
  y,
  z = 0,
  text,
  color = C.text,
  lift = 54,
  size = 26,
  opacity = 1,
}) => {
  const s = useStage();
  const p = isoPoint(s, x, y, z);
  return (
    <text
      x={p.x}
      y={p.y - lift}
      textAnchor="middle"
      fontFamily={F.mono}
      fontWeight={700}
      fontSize={size}
      letterSpacing={1.5}
      fill={color}
      opacity={opacity}
      style={{ paintOrder: "stroke", stroke: C.bg, strokeWidth: 8 }}
    >
      {text}
    </text>
  );
};

/** Floor points [x, y] → total length in grid units, and the point at a fraction t along the path. */
export function isoAlong(points: [number, number][], t: number) {
  const segs = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  const total = segs.reduce((a, b) => a + b, 0);
  let left = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < segs.length; i++) {
    if (left <= segs[i] || i === segs.length - 1) {
      const k = segs[i] ? left / segs[i] : 0;
      return { x: points[i][0] + (points[i + 1][0] - points[i][0]) * k, y: points[i][1] + (points[i + 1][1] - points[i][1]) * k, total };
    }
    left -= segs[i];
  }
  return { x: points[0][0], y: points[0][1], total };
}

/** A route on the floor (a network link, a conveyor, a delivery path). `progress` 0→1 draws it on. */
export const IsoPath: React.FC<{ points: [number, number][]; color?: string; progress?: number; dashed?: boolean; z?: number; width?: number; glow?: number }> = ({
  points,
  color = C.cyan,
  progress = 1,
  dashed = false,
  z = 0,
  width = 5,
  glow = 0,
}) => {
  const s = useStage();
  const end = isoAlong(points, progress);
  const shown: [number, number][] = [];
  let acc = 0;
  shown.push(points[0]);
  for (let i = 1; i < points.length; i++) {
    const seg = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
    if (acc + seg >= end.total * progress) break;
    shown.push(points[i]);
    acc += seg;
  }
  shown.push([end.x, end.y]);
  return (
    <polyline
      points={pts(s, shown.map(([x, y]) => [x, y, z]))}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dashed ? "2 14" : undefined}
      opacity={0.85}
      style={glow > 0 ? { filter: `drop-shadow(0 0 ${10 * glow}px ${color})` } : undefined}
    />
  );
};

/** A flat polygon on the floor (a service area, a plot). Points are floor [x, y]. */
export const IsoPoly: React.FC<{ points: [number, number][]; z?: number; color: string; opacity?: number; strokeOpacity?: number; strokeWidth?: number; dashed?: boolean }> = ({
  points,
  z = 0,
  color,
  opacity = 0.18,
  strokeOpacity = 0.5,
  strokeWidth = 2,
  dashed = false,
}) => {
  const s = useStage();
  if (points.length < 3) return null;
  return (
    <polygon
      points={pts(s, points.map(([x, y]) => [x, y, z]))}
      fill={color}
      fillOpacity={opacity}
      stroke={color}
      strokeOpacity={strokeOpacity}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      strokeDasharray={dashed ? "6 6" : undefined}
    />
  );
};

/**
 * SVG transform for drawing flat artwork (signs, doors, windows) on a block's visible face, in grid units:
 * local (0, 0) is the face's top-left corner as seen, u runs left→right along the face, v runs down.
 * "left" = the face at y + d (runs along x); "right" = the face at x + w (runs along y).
 */
export function isoFaceMatrix(s: Stage, face: "left" | "right", x: number, y: number, w: number, d: number, top: number) {
  const u = s.unit;
  if (face === "left") {
    const p = isoPoint(s, x, y + d, top);
    return `matrix(${COS * u},${SIN * u},0,${u},${p.x},${p.y})`;
  }
  const p = isoPoint(s, x + w, y + d, top);
  return `matrix(${COS * u},${-SIN * u},0,${u},${p.x},${p.y})`;
}

/**
 * A pitched (gable) roof sitting on a w × d footprint at height `z`. `ridge` is the axis the ridge runs
 * along; `h` is the ridge height above the eaves. Back slope first, then front slope, then the gable end.
 */
export const IsoRoof: React.FC<{ x: number; y: number; z: number; w: number; d: number; h: number; ridge?: "x" | "y"; color: string; wall: string }> = ({
  x,
  y,
  z,
  w,
  d,
  h,
  ridge = "x",
  color,
  wall,
}) => {
  const s = useStage();
  const t = z + h;
  if (ridge === "x") {
    const ym = y + d / 2;
    return (
      <g>
        <polygon points={pts(s, [[x, y, z], [x + w, y, z], [x + w, ym, t], [x, ym, t]])} fill={isoShade(color, 0.18)} />
        <polygon points={pts(s, [[x, y + d, z], [x + w, y + d, z], [x + w, ym, t], [x, ym, t]])} fill={isoShade(color, -0.05)} />
        <polygon points={pts(s, [[x + w, y, z], [x + w, y + d, z], [x + w, ym, t]])} fill={isoShade(wall, -0.6)} />
      </g>
    );
  }
  const xm = x + w / 2;
  return (
    <g>
      <polygon points={pts(s, [[x, y, z], [x, y + d, z], [xm, y + d, t], [xm, y, t]])} fill={isoShade(color, 0.18)} />
      <polygon points={pts(s, [[x + w, y, z], [x + w, y + d, z], [xm, y + d, t], [xm, y, t]])} fill={isoShade(color, -0.35)} />
      <polygon points={pts(s, [[x, y + d, z], [x + w, y + d, z], [xm, y + d, t]])} fill={isoShade(wall, -0.35)} />
    </g>
  );
};

/**
 * A neon pulse travelling along a floor route (a rider, a signal). A bright core with a halo, a fading
 * comet trail behind it while it moves (`trail` 0→1), and a slow sonar ring when parked (`ring` 0→1).
 */
export const IsoPulse: React.FC<{
  points: [number, number][];
  t: number;
  color?: string;
  size?: number;
  trail?: number;
  /** Trail length in grid units. */
  trailLen?: number;
  ring?: number;
  frame?: number;
  core?: string;
}> = ({ points, t, color = C.accent, size = 14, trail = 0, trailLen = 1.4, ring = 0, frame = 0, core = "#FFF6E0" }) => {
  const s = useStage();
  const a = isoAlong(points, t);
  const p = isoPoint(s, a.x, a.y, 0.12);
  const segs: React.ReactNode[] = [];
  if (trail > 0.01 && a.total > 0) {
    const n = 14;
    const dt = trailLen / a.total / n;
    let prev = p;
    for (let i = 1; i <= n; i++) {
      const tt = t - i * dt;
      if (tt < 0) break;
      const b = isoAlong(points, tt);
      const q = isoPoint(s, b.x, b.y, 0.12);
      const k = 1 - i / (n + 1);
      segs.push(<line key={i} x1={prev.x} y1={prev.y} x2={q.x} y2={q.y} stroke={color} strokeWidth={size * 1.1 * k + 1} strokeLinecap="round" opacity={0.75 * k * trail} />);
      prev = q;
    }
  }
  const ph = (frame % 36) / 36;
  return (
    <g>
      <g style={{ filter: `drop-shadow(0 0 8px ${color})` }}>{segs}</g>
      {ring > 0.01 && (
        <ellipse cx={p.x} cy={p.y + 0.12 * s.unit} rx={size * (1.2 + 2.2 * ph)} ry={size * (0.6 + 1.1 * ph)} fill="none" stroke={color} strokeWidth={2.5} opacity={ring * (1 - ph) * 0.8} />
      )}
      <circle cx={p.x} cy={p.y} r={size * 2.1} fill={color} opacity={0.16} />
      <circle cx={p.x} cy={p.y} r={size} fill={color} style={{ filter: `drop-shadow(0 0 ${size}px ${color}) drop-shadow(0 0 ${size * 0.4}px ${color})` }} />
      <circle cx={p.x} cy={p.y} r={size * 0.5} fill={core} />
    </g>
  );
};

/** A request, order or packet travelling along a floor route; t 0→1 is its position. */
export const IsoPacket: React.FC<{ points: [number, number][]; t: number; color?: string; size?: number; z?: number }> = ({
  points,
  t,
  color = C.accent,
  size = 11,
  z = 0.15,
}) => {
  const s = useStage();
  const a = isoAlong(points, t);
  const p = isoPoint(s, a.x, a.y, z);
  return (
    <g>
      <ellipse cx={p.x} cy={p.y + z * s.unit} rx={size * 1.2} ry={size * 0.6} fill="rgba(0,0,0,0.35)" />
      <circle cx={p.x} cy={p.y} r={size} fill={color} style={{ filter: `drop-shadow(0 0 10px ${color})` }} />
    </g>
  );
};
