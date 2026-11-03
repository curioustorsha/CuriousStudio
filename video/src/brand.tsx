import React from "react";
import { C, F } from "./theme";

// Curiously brand: wordmark "curiously" + yellow asterisk; small mark = asterisk inside a C.

// Bold six-armed asterisk with sharp, square-cut arm ends. `draw` (0→1) grows the arms from the centre.
export const Asterisk: React.FC<{ size: number; color?: string; rotate?: number; draw?: number; stroke?: number }> = ({
  size,
  color = C.accent,
  rotate = 0,
  draw = 1,
  stroke = 0.28,
}) => {
  const r = 50 * draw;
  return (
    <svg width={size} height={size} viewBox="-60 -60 120 120" style={{ transform: `rotate(${rotate}deg)`, overflow: "visible" }}>
      {[0, 60, 120].map((a) => {
        const rad = (a * Math.PI) / 180;
        return (
          <line
            key={a}
            x1={-Math.sin(rad) * r}
            y1={-Math.cos(rad) * r}
            x2={Math.sin(rad) * r}
            y2={Math.cos(rad) * r}
            stroke={color}
            strokeWidth={100 * stroke}
            strokeLinecap="butt"
          />
        );
      })}
    </svg>
  );
};

// The small logo: an open C with the asterisk in its middle. `arc` (0→1) draws the C.
export const LogoMark: React.FC<{ size: number; arc?: number; starRotate?: number; starDraw?: number; cColor?: string }> = ({
  size,
  arc = 1,
  starRotate = 0,
  starDraw = 1,
  cColor = C.text,
}) => {
  const R = 40;
  const circ = 2 * Math.PI * R;
  const open = 0.22; // gap of the C, as a share of the circle
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox="-50 -50 100 100" style={{ position: "absolute", inset: 0 }}>
        <circle
          opacity={arc > 0.01 ? 1 : 0}
          r={R}
          fill="none"
          stroke={cColor}
          strokeWidth={11}
          strokeLinecap="round"
          strokeDasharray={`${circ * (1 - open) * arc} ${circ}`}
          transform={`rotate(${(open / 2) * 360})`}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Asterisk size={size * 0.42} rotate={starRotate} draw={starDraw} />
      </div>
    </div>
  );
};

export const Wordmark: React.FC<{ size: number; color?: string; star?: React.ReactNode }> = ({ size, color = C.text, star }) => (
  <div style={{ display: "inline-flex", alignItems: "flex-start", fontFamily: F.sans, fontWeight: 800, fontSize: size, letterSpacing: -size * 0.03, color, lineHeight: 1 }}>
    curiously
    <span style={{ display: "flex", marginLeft: size * 0.04, marginTop: -size * 0.06 }}>{star ?? <Asterisk size={size * 0.42} />}</span>
  </div>
);
