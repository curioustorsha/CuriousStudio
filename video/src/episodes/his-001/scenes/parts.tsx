import React from "react";
import { C, F } from "../../../theme";
import { isoPoint, useIsoStage } from "../../../engine/kit";
import { IndianRailwaysLogo, IRCTC_BLUE } from "../../../logos";

/** A screen-space panel anchored above a world point, drawn inside the IsoStage. `p` springs it in. */
export const Anchored: React.FC<{ x: number; y: number; z?: number; dx?: number; dy?: number; p?: number; scale?: number; children: React.ReactNode }> = ({ x, y, z = 0, dx = 0, dy = 0, p = 1, scale = 1, children }) => {
  const s = useIsoStage();
  if (p <= 0.001) return null;
  const pt = isoPoint(s, x, y, z);
  const sc = (0.6 + 0.4 * Math.min(1, p)) * scale;
  return (
    <g transform={`translate(${pt.x + dx},${pt.y + dy}) scale(${sc})`} opacity={Math.min(1, p * 1.6)}>
      {children}
    </g>
  );
};

/**
 * The search results card: three train rows sliding in (`rows` 0→3), a SEATS LEFT line (`seats` 0→1), local
 * coordinates centred on (0, 0). `tint` swaps the frame colour (green for copies).
 */
export const ResultsCard: React.FC<{ rows: number; seats?: number; tint?: string; seatsText?: string; w?: number }> = ({ rows, seats = 0, tint = C.cyan, seatsText = "SEATS LEFT  3", w = 300 }) => {
  const h = 210;
  return (
    <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={18} fill="rgba(11,13,20,0.95)" stroke={tint} strokeWidth={3} />
      <rect x={-w / 2} y={-h / 2} width={w} height={36} rx={18} fill={tint} opacity={0.18} />
      <text x={-w / 2 + 18} y={-h / 2 + 19} dominantBaseline="central" fontFamily={F.mono} fontWeight={700} fontSize={17} letterSpacing={2} fill={tint}>
        TRAINS · 10:00
      </text>
      {[0, 1, 2].map((k) => {
        const p = Math.max(0, Math.min(1, rows - k));
        if (p <= 0.01) return null;
        const y = -h / 2 + 52 + k * 40;
        return (
          <g key={k} transform={`translate(${(1 - p) * 40},0)`} opacity={p}>
            <rect x={-w / 2 + 16} y={y} width={44} height={26} rx={6} fill={tint} opacity={0.7} />
            <rect x={-w / 2 + 70} y={y + 4} width={w * 0.42} height={8} rx={4} fill={C.text} opacity={0.75} />
            <rect x={-w / 2 + 70} y={y + 16} width={w * 0.28} height={6} rx={3} fill={C.muted} opacity={0.7} />
            <rect x={w / 2 - 58} y={y + 4} width={42} height={18} rx={5} fill="none" stroke={C.muted} strokeWidth={2} />
          </g>
        );
      })}
      {seats > 0.01 && (
        <text x={0} y={h / 2 - 20} textAnchor="middle" dominantBaseline="central" fontFamily={F.mono} fontWeight={700} fontSize={22} letterSpacing={2} fill={C.text} opacity={Math.min(1, seats)}>
          {seatsText}
        </text>
      )}
    </g>
  );
};

/**
 * The booking page: the IRCTC logo bar, two buttons and the frame (the unchanging parts) around a live seats
 * slot. `split` 0→1 lifts the unchanging parts off the page (cyan); `gone` 0→1 fades them as they leave.
 */
export const PageCard: React.FC<{ split: number; gone?: number; pulse?: number }> = ({ split, gone = 0, pulse = 0 }) => {
  const w = 260;
  const h = 330;
  const lift = split * 34;
  const keep = 1 - gone;
  const glow = pulse > 0 ? { filter: `drop-shadow(0 0 ${12 * pulse}px ${C.cyan})` } : undefined;
  return (
    <g>
      {/* the live slot stays on the page */}
      <rect x={-w / 2 + 22} y={-30} width={w - 44} height={92} rx={12} fill="rgba(11,13,20,0.95)" stroke={C.accent} strokeWidth={2.5} strokeDasharray={split > 0.05 ? "8 7" : undefined} />
      <text x={0} y={16} textAnchor="middle" dominantBaseline="central" fontFamily={F.mono} fontWeight={700} fontSize={19} letterSpacing={2} fill={C.accent}>
        SEATS LEFT
      </text>
      <g opacity={keep}>
        {/* frame */}
        <rect x={-w / 2 - lift * 0.4} y={-h / 2 - lift * 0.4} width={w + lift * 0.8} height={h + lift * 0.8} rx={20} fill="none" stroke={split > 0.05 ? C.cyan : C.text} strokeWidth={3} opacity={0.9} />
        {/* logo bar */}
        <g transform={`translate(0,${-lift})`} style={glow}>
          <rect x={-w / 2 + 22} y={-h / 2 + 20} width={112} height={44} rx={22} fill="#FFFFFF" stroke={split > 0.05 ? C.cyan : "none"} strokeWidth={3} />
          <text x={-w / 2 + 78} y={-h / 2 + 43} textAnchor="middle" dominantBaseline="central" fontFamily={F.sans} fontWeight={900} fontSize={25} fill={IRCTC_BLUE}>
            IRCTC
          </text>
        </g>
        {/* buttons */}
        <g transform={`translate(0,${lift})`} style={glow}>
          <rect x={-w / 2 + 22} y={h / 2 - 82} width={98} height={50} rx={12} fill={split > 0.05 ? "#2C7FA3" : "#3A4154"} stroke={C.cyan} strokeWidth={split > 0.05 ? 2.5 : 0} />
          <text x={-w / 2 + 71} y={h / 2 - 57} textAnchor="middle" dominantBaseline="central" fontFamily={F.mono} fontWeight={700} fontSize={17} fill={C.text}>
            SEARCH
          </text>
          <rect x={w / 2 - 120} y={h / 2 - 82} width={98} height={50} rx={12} fill={split > 0.05 ? "#2C7FA3" : C.accent} stroke={C.cyan} strokeWidth={split > 0.05 ? 2.5 : 0} />
          <text x={w / 2 - 71} y={h / 2 - 57} textAnchor="middle" dominantBaseline="central" fontFamily={F.mono} fontWeight={700} fontSize={17} fill={split > 0.05 ? C.text : "#1A1206"}>
            BOOK
          </text>
        </g>
      </g>
    </g>
  );
};

/** An HTML tag: the Indian Railways roundel + "INDIAN RAILWAYS", for Railways-sourced numbers. */
export const RailwaysTag: React.FC<{ p: number; x: number; y: number; text?: string }> = ({ p, x, y, text = "INDIAN RAILWAYS" }) => {
  if (p <= 0.01) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, 0) translateY(${(1 - Math.min(1, p)) * 18}px)`,
        opacity: Math.min(1, p * 1.5),
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "7px 18px 7px 8px",
        borderRadius: 999,
        background: "rgba(7,8,12,0.92)",
        border: `1px solid ${C.stroke}`,
        fontFamily: F.mono,
        fontWeight: 700,
        fontSize: 20,
        letterSpacing: 2,
        color: C.text,
        whiteSpace: "nowrap",
      }}
    >
      <IndianRailwaysLogo size={34} />
      {text}
    </div>
  );
};

/** A big HTML number card (stat), centred at screen x, top y. */
export const StatCard: React.FC<{ x: number; y: number; p: number; big: string; sub?: string; subP?: number; color?: string; size?: number }> = ({ x, y, p, big, sub, subP = 1, color = C.green, size = 120 }) => {
  if (p <= 0.01) return null;
  const k = Math.min(1, p);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, 0) scale(${1.3 - 0.3 * k})`,
        opacity: Math.min(1, p * 1.6),
        padding: "18px 38px 16px",
        borderRadius: 28,
        background: "rgba(7,8,12,0.92)",
        border: `3px solid ${color}`,
        boxShadow: `0 0 50px ${color}44`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ fontFamily: F.sans, fontWeight: 900, fontSize: size, lineHeight: 0.95, letterSpacing: -size * 0.04, color }}>{big}</div>
      {sub && (
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 26, letterSpacing: 4, color: C.text, opacity: Math.min(1, subP * 1.5), marginTop: 8, whiteSpace: "nowrap" }}>{sub}</div>
      )}
    </div>
  );
};
