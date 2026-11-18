import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "../../../theme";
import { ease, Header, Kicker, Reveal, Sfx, Source, Title, useIn, useWord } from "../../../engine/kit";
import { hookSeg } from "./Hook";
import { D10, D20, D50, UNKNOWN_PIECES } from "./Future";
import { at, Chip, CITY, JAM, jamPhones, ROUTE, RPIECES, trafficPhones, World } from "./world";

/** The usual colour for this hour per route piece: the jam stretch is usually amber at this time, the rest green. */
const usual = (i: number) => (i >= JAM[0] && i <= JAM[1] ? 0.5 : i === JAM[0] - 1 || i === JAM[1] + 1 ? 0.3 : 0);

/** One row of Google's freeway example: a time of day and its usual speed. */
const SpeedCard: React.FC<{ when: string; speed: string; color: string; x: number; p: number }> = ({ when, speed, color, x, p }) => (
  <div
    style={{
      position: "absolute",
      top: 420,
      left: x,
      width: 430,
      transform: `translateX(-50%) scale(${0.6 + 0.4 * Math.min(1, p)})`,
      opacity: Math.min(1, p * 1.6),
      padding: "16px 20px",
      borderRadius: 22,
      background: "rgba(7,8,12,0.94)",
      border: `3px solid ${color}`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 4,
    }}
  >
    <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 26, letterSpacing: 3, color: C.muted }}>{when}</div>
    <div style={{ fontFamily: F.sans, fontWeight: 900, fontSize: 64, lineHeight: 1, color }}>{speed}</div>
  </div>
);

/** History: a dashed "usual for this hour" layer draws over the route, then Google's own freeway example. */
export const Memory: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tRem = wf("memory", "remembers");
  const tCal = wf("memory", "california");
  const tSixty = wf("memory", "sixty");
  const tFifteen = wf("memory", "fifteen");

  const base = hookSeg(frame, 0, 1);
  const known = ease(frame, tFifteen + 10, tFifteen + 26);
  const n = RPIECES.length;

  const pFree = useIn(tCal, { damping: 13, stiffness: 200 });
  const pAm = useIn(tSixty - 2, { damping: 11, stiffness: 220 });
  const pPm = useIn(tFifteen - 2, { damping: 11, stiffness: 220 });

  return (
    <>
      <Sfx name="swoosh" at={tRem} volume={0.3} />
      <Sfx name="pop" at={tSixty - 2} volume={0.3} />
      <Sfx name="thud" at={tFifteen - 2} volume={0.28} />

      <Header>
        <Reveal at={0}>
          <Kicker text="STEP 2 · HISTORY" />
        </Reveal>
        <Reveal at={4}>
          <Title size={80}>
            How the road <span style={{ color: C.muted }}>usually</span> flows
          </Title>
        </Reveal>
      </Header>

      <World
        cam={CITY}
        dim={1 - 0.3 * ease(frame, tCal, tCal + 10)}
        route={{ progress: 1, opacity: 0.85 }}
        seg={(i) => {
          const s = base(i);
          const unk = UNKNOWN_PIECES.includes(i) ? 1 - known : 0;
          const draw = ease(frame, tRem + 2 + (i / n) * 20, tRem + 8 + (i / n) * 20);
          return { tint: s.tint, on: (s.on ?? 0) * (1 - 0.7 * unk), unknown: unk, ghost: draw, ghostTint: usual(i) };
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

      {/* Google's example: a Northern California freeway, 6–7am vs late afternoon */}
      <div
        style={{
          position: "absolute",
          top: 360,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: F.mono,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: 4,
          color: C.text,
          opacity: frame >= tCal ? Math.min(1, pFree * 1.6) : 0,
        }}
      >
        A CALIFORNIA FREEWAY
      </div>
      <SpeedCard when="6–7 AM" speed="65 mph" color={C.green} x={300} p={frame >= tSixty - 2 ? pAm : 0} />
      <SpeedCard when="LATE AFTERNOON" speed="15–20 mph" color={C.red} x={780} p={frame >= tFifteen - 2 ? pPm : 0} />

      <Source text="Google, 2020" at={tRem} />
    </>
  );
};
