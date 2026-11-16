import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "../../../theme";
import { LogoMark, Wordmark } from "../../../brand";
import { IsoBox, isoFaceMatrix, IsoPath, isoPoint, IsoPulse, isoShade, IsoStage, Sfx, useIsoStage, useWord } from "../../../engine/kit";
import { Space, Window } from "../../../productui";
import { ez, lerp, sp } from "../../../workshop";
import { CENTRE } from "./Hook";
import { Star } from "./common";

const PHONE = { x: 330, y: 450, w: 420, h: 740 };
const BODY_H = PHONE.h - 52;

/** Rack lines on a server block's two visible faces. */
const Rack: React.FC<{ x: number; y: number; w: number; d: number; h: number; f: number; seed: number }> = ({ x, y, w, d, h, f, seed }) => {
  const s = useIsoStage();
  const wall = isoShade(C.cyan, -0.45);
  return (
    <>
      <IsoBox x={x} y={y} w={w} d={d} h={h} color={wall} />
      {(["left", "right"] as const).map((face) => {
        const len = face === "left" ? w : d;
        const rows = Math.floor(h / 0.22);
        return (
          <g key={face} transform={isoFaceMatrix(s, face, x, y, w, d, h)}>
            {Array.from({ length: rows }, (_, r) => {
              const on = (Math.floor(f / 4) + r * 3 + seed + (face === "left" ? 0 : 2)) % 4 === 0;
              return (
                <g key={r}>
                  <rect x={len * 0.1} y={0.1 + r * 0.22} width={len * 0.8} height={0.12} fill={isoShade(wall, -0.3)} />
                  <rect x={len * 0.14} y={0.13 + r * 0.22} width={0.05} height={0.05} fill={C.cyan} opacity={on ? 1 : 0.35} />
                </g>
              );
            })}
          </g>
        );
      })}
    </>
  );
};

/** A database: an isometric cylinder (stacked discs) at world point (cx, cy). */
const Db: React.FC<{ cx: number; cy: number; r: number; h: number }> = ({ cx, cy, r, h }) => {
  const s = useIsoStage();
  const base = isoPoint(s, cx, cy, 0);
  const rx = r * s.unit * 1.22;
  const ry = rx * 0.5;
  const H = h * s.unit;
  const side = isoShade(C.cyan, -0.5);
  return (
    <g>
      <path d={`M ${base.x - rx} ${base.y - H} L ${base.x - rx} ${base.y} A ${rx} ${ry} 0 0 0 ${base.x + rx} ${base.y} L ${base.x + rx} ${base.y - H} Z`} fill={side} />
      {[0.33, 0.66].map((k) => (
        <path key={k} d={`M ${base.x - rx} ${base.y - H * k} A ${rx} ${ry} 0 0 0 ${base.x + rx} ${base.y - H * k}`} fill="none" stroke={isoShade(C.cyan, -0.25)} strokeWidth={3} />
      ))}
      <ellipse cx={base.x} cy={base.y - H} rx={rx} ry={ry} fill={isoShade(C.cyan, -0.1)} />
    </g>
  );
};

/** The plain app screen: three rows and a button. Slides aside on "behind". */
const AppScreen: React.FC<{ peel: number }> = ({ peel }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: "linear-gradient(180deg, #1A1D27, #12141B)",
      transform: `translateX(${-peel * 105}%) perspective(900px) rotateY(${peel * 28}deg)`,
      transformOrigin: "0 50%",
      boxShadow: peel > 0.01 ? "30px 0 60px rgba(0,0,0,0.6)" : undefined,
      padding: "34px 30px",
      display: "flex",
      flexDirection: "column",
      gap: 22,
    }}
  >
    <div style={{ height: 30, width: 190, borderRadius: 10, background: "rgba(255,255,255,0.16)" }} />
    {[0, 1, 2].map((i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, padding: 18, borderRadius: 20, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ width: 62, height: 62, borderRadius: 16, background: ["rgba(255,181,71,0.5)", "rgba(79,209,255,0.45)", "rgba(61,220,151,0.45)"][i] }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ height: 16, width: `${80 - i * 12}%`, borderRadius: 8, background: "rgba(255,255,255,0.28)" }} />
          <div style={{ height: 12, width: `${55 + i * 8}%`, borderRadius: 6, background: "rgba(255,255,255,0.12)" }} />
        </div>
      </div>
    ))}
    <div style={{ marginTop: "auto", height: 78, borderRadius: 20, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.sans, fontWeight: 900, fontSize: 32, color: "#1A1206" }}>Continue</div>
  </div>
);

/** What's behind the screen: a server rack, a cache box and a database, wired up, requests running up into the app. */
const Stack: React.FC<{ f: number; on: number }> = ({ f, on }) => {
  const OX = 205;
  const OY = 360;
  const U = 62;
  const wires: [number, number][][] = [
    [[1.9, 2.6], [1.9, 1.3], [0.55, 1.3], [0.55, 0.9]],
    [[3.0, 0.65], [1.6, 0.65], [1.6, 1.3]],
  ];
  const up = isoPoint({ ox: OX, oy: OY, unit: U }, 0.55, 0.45, 1.9);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: on }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(420px 500px at 50% 60%, rgba(79,209,255,0.10), transparent 70%)" }} />
      <IsoStage originX={OX} originY={OY} unit={U}>
        {wires.map((w, i) => (
          <g key={i} opacity={0.75}>
            <IsoPath points={w} color={C.cyan} width={4} progress={ez(f, 0, 14)} glow={0.5} />
          </g>
        ))}
        <Rack x={0} y={0} w={1.1} d={0.9} h={1.9} f={f} seed={1} />
        <Rack x={3.0} y={0.2} w={0.8} d={0.9} h={1.1} f={f} seed={3} />
        <Db cx={1.9} cy={2.8} r={0.5} h={0.8} />
        {[0, 1, 2].map((k) => (
          <IsoPulse key={k} points={wires[k % 2]} t={((f / 40 + k / 3) % 1)} size={7} trail={1} trailLen={1.2} frame={f} />
        ))}
        {/* uplink: requests run from the rack's top up into the app */}
        <line x1={up.x} y1={up.y} x2={up.x} y2={-20} stroke={C.cyan} strokeWidth={4} strokeDasharray="10 8" opacity={0.6} />
        {[0, 1, 2, 3].map((k) => {
          const t = (f / 26 + k / 4) % 1;
          const y = up.y + (-20 - up.y) * t;
          return <circle key={k} cx={up.x} cy={y} r={9} fill={C.accent} style={{ filter: `drop-shadow(0 0 8px ${C.accent})` }} />;
        })}
      </IsoStage>
    </div>
  );
};

export const What: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const tCur = wf("what", "curiously");
  const tWe = wf("what", "we");
  const tBehind = wf("what", "behind");
  const tEvery = wf("what", "every");
  const tAbout = wf("what", "about");

  // Logo forms around the asterisk, then shrinks up into the header
  const arc = ez(f, tCur - 2, tCur + 16);
  const word = ez(f, tCur + 4, tCur + 16);
  const up = ez(f, tWe - 8, tWe + 14);
  const groupTop = 655;
  const scale = lerp(1, 0.34, up);
  const dy = lerp(0, 172 - groupTop, up);
  const title = ez(f, tWe + 4, tWe + 16);

  const phone = sp(f, tWe + 4, { damping: 16, stiffness: 150 });
  const peel = ez(f, tBehind - 2, tBehind + 16);
  const tilt = Math.sin((f - tEvery) / 14) * 9 * ez(f, tEvery - 4, tEvery + 10);
  const chip = sp(f, tAbout - 4, { damping: 12, stiffness: 200 });
  const sweep = ez(f, tAbout, tAbout + 36);
  const R = 17;
  const circ = 2 * Math.PI * R;

  return (
    <>
      <Sfx name="impact" at={tCur} volume={0.3} />
      <Sfx name="pop" at={tWe + 4} volume={0.3} />
      <Sfx name="swoosh" at={tBehind - 2} volume={0.4} />
      <Sfx name="ticker" at={tAbout} volume={0.25} dur={30} />
      <Space />

      {/* the asterisk arriving from the hook, until the logo's own star takes over */}
      <Star f={f} at={() => CENTRE} size={120} rotate={120 + f * 3} opacity={f < tCur - 2 ? 1 : 0} glow={0.8} />

      {/* phone */}
      {phone > 0.001 && (
        <div style={{ opacity: Math.min(1, phone * 1.4), transform: `translateY(${(1 - phone) * 120}px)` }}>
          <Window kind="browser" title="your app" x={PHONE.x} y={PHONE.y} w={PHONE.w} h={PHONE.h} tilt={tilt} style={{ borderRadius: 40 }}>
            <div style={{ position: "absolute", inset: 0, height: BODY_H }}>
              <Stack f={f} on={ez(f, tBehind - 4, tBehind + 6)} />
              <AppScreen peel={peel} />
            </div>
          </Window>
        </div>
      )}

      {/* stopwatch chip */}
      {chip > 0.001 && (
        <div style={{ position: "absolute", top: 1206, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: Math.min(1, chip * 1.5), transform: `scale(${0.7 + 0.3 * Math.min(1, chip)})` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 22px 8px 12px", borderRadius: 999, background: "rgba(7,8,12,0.94)", border: `2px solid ${C.accent}` }}>
            <svg width={40} height={40} viewBox="-20 -20 40 40">
              <circle r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={4} />
              <circle r={R} fill="none" stroke={C.accent} strokeWidth={4} strokeLinecap="round" strokeDasharray={`${circ * sweep} ${circ}`} transform="rotate(-90)" />
            </svg>
            <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 28, letterSpacing: 2, color: C.accent }}>~1 MIN</span>
          </div>
        </div>
      )}

      {/* logo → header */}
      {f >= tCur - 2 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: groupTop, display: "flex", flexDirection: "column", alignItems: "center", gap: 30, transform: `translateY(${dy}px) scale(${scale})`, transformOrigin: "50% 0" }}>
          <LogoMark size={290} arc={arc} starRotate={120 + f * 3} />
          <div style={{ opacity: word * (1 - up), transform: `translateY(${(1 - word) * 20}px)` }}>
            <Wordmark size={110} />
          </div>
        </div>
      )}
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, textAlign: "center", fontFamily: F.sans, fontWeight: 900, fontSize: 70, letterSpacing: -2.4, color: C.text, opacity: title, transform: `translateY(${(1 - title) * 20}px)` }}>
        Behind the <span style={{ color: C.accent }}>screen</span>
      </div>
    </>
  );
};
