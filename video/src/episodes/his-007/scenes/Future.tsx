import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../../../theme";
import { clamp, ease, Header, Kicker, Reveal, Sfx, Source, Title, useIn, useWord } from "../../../engine/kit";
import { hookSeg } from "./Hook";
import { at, Chip, CITY, JAM_D0, JAM_D1, jamPhones, mixCam, ROUTE, ROUTE_LEN, RPIECES, rpieceD, STREET, trafficPhones, useMove, World } from "./world";

/** Where you'd be at +10, +20 and +50 minutes along your route (illustrative). */
export const D10 = 6.6;
export const D20 = (JAM_D0 + JAM_D1) / 2;
export const D50 = ROUTE_LEN - 0.7;
const CHIPS: [number, string][] = [
  [D10, "+10 MIN"],
  [D20, "+20 MIN"],
  [D50, "+50 MIN"],
];
/** Route pieces under a chip: within 1.6 units of it along the route. */
export const under = (i: number, d: number) => Math.abs(rpieceD(i) - d) < 1.6;

/** Live speed only shows now: a ghost of you drives ahead, and the road at +10/+20/+50 min goes dashed grey. */
export const Future: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames: D } = useVideoConfig();
  const wf = useWord();
  const tTen = wf("future", "ten");
  const tTwenty = wf("future", "twenty");
  const tFifty = wf("future", "fifty");
  const T = [tTen, tTwenty, tFifty];

  const settle = useMove(0, 26);
  const cam = mixCam(STREET, CITY, settle);

  const ghostD = interpolate(frame, [tTen - 16, tTen, tTwenty, tFifty, D], [0, D10, D20, D50, ROUTE_LEN - 0.2], clamp);
  const pops = T.map((t) => useIn(t, { damping: 10, stiffness: 220 }));
  const unk = T.map((t) => ease(frame, t + 2, t + 12));
  const base = hookSeg(frame, 0, 1);

  return (
    <>
      <Sfx name="ticker" at={tTen - 16} volume={0.16} dur={Math.max(1, tFifty - tTen + 30)} />
      {T.map((t, k) => (
        <Sfx key={k} name="pop" at={t} volume={0.35} />
      ))}

      <Header>
        <Reveal at={0}>
          <Kicker text="THE CATCH" color={C.red} />
        </Reveal>
        <Reveal at={4}>
          <Title size={80}>
            Traffic when you <span style={{ color: C.accent }}>arrive</span>
          </Title>
        </Reveal>
      </Header>

      <World
        cam={cam}
        route={{ progress: 1, opacity: 0.85 }}
        seg={(i) => {
          const s = base(i);
          const u = Math.max(...CHIPS.map(([d], k) => (under(i, d) ? unk[k] : 0)));
          return { ...s, on: (s.on ?? 0) * (1 - 0.7 * u), unknown: u };
        }}
        you={{ label: 1, ghostT: frame >= tTen - 16 ? ghostD / ROUTE_LEN : null }}
        phones={[...trafficPhones(frame), ...jamPhones(frame, 1)]}
        overlay={
          <>
            {CHIPS.map(([d, text], k) => {
              const p = at(ROUTE, d);
              return <Chip key={text} x={p[0]} y={p[1]} text={text} color={C.text} size={26} p={frame >= T[k] ? pops[k] : 0} lift={70} />;
            })}
            {CHIPS.map(([d], k) => {
              const p = at(ROUTE, d);
              return <Chip key={`q${k}`} x={p[0]} y={p[1]} text="?" color={C.muted} size={28} p={unk[k]} lift={-46} dashed />;
            })}
          </>
        }
      />

      <Source text="Google; DeepMind, 2020" at={tTen} />
    </>
  );
};

/** Route pieces any chip covers (the ones that come back from grey in the memory scene). */
export const UNKNOWN_PIECES = RPIECES.map((_, i) => i).filter((i) => CHIPS.some(([d]) => under(i, d)));
