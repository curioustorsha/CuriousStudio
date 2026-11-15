import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "../../../theme";
import { ease, Header, Kicker, Reveal, Sfx, Source, Title, useIn, useWord } from "../../../engine/kit";
import { hookSeg } from "./Hook";
import { D10, D20, D50, UNKNOWN_PIECES } from "./Future";
import { at, Chip, CITY, JAM, jamPhones, ROUTE, RPIECES, trafficPhones, World } from "./world";

/** The usual colour for this hour per route piece: the jam stretch is usually amber at this time, the rest green. */
const usual = (i: number) => (i >= JAM[0] && i <= JAM[1] ? 0.5 : i === JAM[0] - 1 || i === JAM[1] + 1 ? 0.3 : 0);

const Pill: React.FC<{ text: string; color: string; dashed?: boolean; x: number; p: number; opacity?: number; big?: boolean }> = ({ text, color, dashed, x, p, opacity = 1, big }) => (
  <div
    style={{
      position: "absolute",
      top: big ? 432 : 440,
      left: x,
      transform: `translateX(-50%) scale(${0.6 + 0.4 * Math.min(1, p)})`,
      opacity: Math.min(1, p * 1.6) * opacity,
      padding: big ? "14px 34px" : "12px 28px",
      borderRadius: 18,
      background: "rgba(7,8,12,0.94)",
      border: `3px ${dashed ? "dashed" : "solid"} ${color}`,
      fontFamily: F.mono,
      fontWeight: 700,
      fontSize: big ? 38 : 32,
      letterSpacing: 3,
      color,
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
);

/** History + live: a dashed "usual" layer draws over the route, live colour shows under it, and they merge into one forecast. */
export const Memory: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tRem = wf("memory", "remembers");
  const tMix = wf("memory", "mixes");
  const tLive = wf("memory", "live");

  const base = hookSeg(frame, 0, 1);
  const known = ease(frame, tLive + 4, tLive + 18);
  const ghostOut = ease(frame, tLive + 10, tLive + 24);
  const n = RPIECES.length;

  const pUsual = useIn(tRem + 4, { damping: 12, stiffness: 200 });
  const pLive = useIn(tMix, { damping: 12, stiffness: 200 });
  const merge = ease(frame, tLive, tLive + 14);
  const pFore = useIn(tLive + 10, { damping: 10, stiffness: 220 });

  return (
    <>
      <Sfx name="swoosh" at={tRem} volume={0.3} />
      <Sfx name="pop" at={tMix} volume={0.3} />
      <Sfx name="coin" at={tLive + 10} volume={0.35} />

      <Header>
        <Reveal at={0}>
          <Kicker text="STEP 2" />
        </Reveal>
        <Reveal at={4}>
          <Title size={80}>
            <span style={{ color: C.muted }}>Usual</span> + <span style={{ color: C.accent }}>live</span>
          </Title>
        </Reveal>
      </Header>

      <World
        cam={CITY}
        route={{ progress: 1, opacity: 0.85 }}
        seg={(i) => {
          const s = base(i);
          const unk = UNKNOWN_PIECES.includes(i) ? 1 - known : 0;
          const draw = ease(frame, tRem + 2 + (i / n) * 20, tRem + 8 + (i / n) * 20);
          // the forecast: the jam stays red, the stretches either side settle amber
          const fore = i === JAM[0] - 1 || i === JAM[1] + 1 ? 0.45 : s.tint ?? 0;
          return { tint: (s.tint ?? 0) + (fore - (s.tint ?? 0)) * known, on: (s.on ?? 0) * (1 - 0.7 * unk), unknown: unk, ghost: draw * (1 - ghostOut), ghostTint: usual(i) };
        }}
        you={{ label: 1 }}
        phones={[...trafficPhones(frame), ...jamPhones(frame, 1)]}
        overlay={
          <>
            {[D10, D20, D50].map((d, k) => {
              const p = at(ROUTE, d);
              return <Chip key={k} x={p[0]} y={p[1]} text="?" color={C.muted} size={28} p={1 - known} lift={-46} dashed />;
            })}
          </>
        }
      />

      <Pill text="USUAL" color={C.muted} dashed x={290 + 250 * merge} p={frame >= tRem + 4 ? pUsual : 0} opacity={1 - merge} />
      <Pill text="LIVE" color={C.accent} x={790 - 250 * merge} p={frame >= tMix ? pLive : 0} opacity={1 - merge} />
      <Pill text="FORECAST" color={C.text} x={540} p={frame >= tLive + 10 ? pFore : 0} big />

      <Source text="Google, 2020" at={tRem} />
    </>
  );
};
