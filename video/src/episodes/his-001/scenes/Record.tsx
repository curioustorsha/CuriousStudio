import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C } from "../../../theme";
import { clamp, ease, Header, isoPoint, Reveal, Sfx, Source, Title, useIn, useIsoStage, useWord } from "../../../engine/kit";
import { LogoKicker } from "../../../logos";
import { berth, Chip, CITY, CLOCK, crowd, mixCam, RES, useMove, World, type Cam } from "./world";

const REC: Cam = { fx: 7.2, fy: 4.4, u: 54, sx: 540, sy: 860 };

/** A sweep-hand ring around the counter chip: completes once over `p` 0→1. */
const Sweep: React.FC<{ p: number }> = ({ p }) => {
  const s = useIsoStage();
  if (p <= 0.001) return null;
  const c = isoPoint(s, RES.x + RES.w / 2, RES.y + RES.d / 2, RES.pz + 0.1);
  const cy = c.y - 150;
  const r = 128;
  const a = -Math.PI / 2 + Math.min(1, p) * Math.PI * 2;
  const large = p > 0.5 ? 1 : 0;
  return (
    <g opacity={p >= 1 ? 0.5 : 1}>
      <circle cx={c.x} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
      {p < 0.999 ? (
        <path d={`M ${c.x} ${cy - r} A ${r} ${r} 0 ${large} 1 ${c.x + Math.cos(a) * r} ${cy + Math.sin(a) * r}`} fill="none" stroke={C.accent} strokeWidth={6} strokeLinecap="round" />
      ) : (
        <circle cx={c.x} cy={cy} r={r} fill="none" stroke={C.accent} strokeWidth={6} />
      )}
    </g>
  );
};

/** The record minute: 31,814 tickets in one minute on 22 May 2025, berths flashing in waves. */
export const Record: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tMay = wf("record", "may");
  const tRec = wf("record", "record");
  const tThirty = wf("record", "thirty");
  const tMin = wf("record", "minute");

  const move = useMove(0, 60);
  const cam = mixCam(CITY, REC, move);

  const pDate = useIn(tMay, { damping: 12, stiffness: 200 });
  const pCount = useIn(tRec, { damping: 12, stiffness: 200 });
  const land = frame >= tThirty + 6;
  const n = Math.round(interpolate(frame, [tRec, tThirty + 6], [0, 31814], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 2) }));
  const pMin = useIn(tMin, { damping: 12, stiffness: 200 });
  const sweep = ease(frame, tMin, tMin + 26);
  const burst = land ? Math.min(1, (frame - tThirty - 6) / 16) : 0;

  // Berths flash amber in waves (each wave = a batch of bookings), from "record" on
  const seat = (i: number) => {
    if (frame < tRec) return null;
    const b = berth(RES, i);
    const ph = ((frame - tRec) / 3 - (b.col + b.row) * 0.9) % 12;
    const k = ph >= 0 && ph < 3 ? 1 - ph / 3 : 0;
    return k > 0.02 ? { color: C.accent, lift: 0.06 * k, opacity: 0.6 + 0.4 * k } : null;
  };
  const text = `${n.toLocaleString("en-US")}${pMin > 0.05 && frame >= tMin ? " / MIN" : ""}`;

  return (
    <>
      <Sfx name="ticker" at={tRec} volume={0.25} dur={Math.max(1, tThirty + 6 - tRec)} />
      <Sfx name="pop" at={tMay} volume={0.3} />
      <Sfx name="impact" at={tThirty + 6} volume={0.3} />
      <Sfx name="ding" at={tMin + 24} volume={0.25} />

      <Header>
        <Reveal at={0}>
          <LogoKicker logo="irctc" text="RECORD" />
        </Reveal>
        <Reveal at={4}>
          <Title size={84}>
            One <span style={{ color: C.accent }}>record</span> minute
          </Title>
        </Reveal>
      </Header>

      <World
        cam={cam}
        clock={{ time: "10:00" }}
        hall={{ rack: 0.9, glow: 0.3, wire: 0.8 }}
        res={{ seat, glow: 0.4 * burst }}
        pulses={crowd(frame + 260, 0, { n: 30, every: 2, speed: 0.14 })}
        overlay={
          <>
            <Chip x={CLOCK.x + CLOCK.w / 2} y={CLOCK.y + CLOCK.d / 2} z={CLOCK.h + 0.3} text="22 MAY 2025 · 10:01" size={24} color={C.text} p={frame >= tMay ? pDate : 0} lift={40} />
            <Sweep p={sweep} />
            <Chip x={RES.x + RES.w / 2} y={RES.y + RES.d / 2} z={RES.pz + 0.1} text={text} size={44} color={C.accent} p={frame >= tRec ? pCount : 0} lift={150} />
            {burst > 0 && burst < 1 && (
              <Chip x={RES.x + RES.w / 2} y={RES.y + RES.d / 2} z={RES.pz + 0.1} text={text} size={44} color={C.accent} fill="rgba(0,0,0,0)" p={1} lift={150} opacity={(1 - burst) * 0.5} dx={0} />
            )}
          </>
        }
      />

      <Source text="Ministry of Railways, Jun 2025" at={tRec} />
    </>
  );
};
