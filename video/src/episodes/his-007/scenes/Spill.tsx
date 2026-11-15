import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../../../theme";
import { ease, Header, IsoLabel, Kicker, Reveal, Sfx, Source, Title, useWord } from "../../../engine/kit";
import { EDGES, GRAPH, JUNCTION, mixCam, PIECES, pieceAt, useMove, World } from "./world";

/** The side lane (x = 7.5, from the far end in to the junction) and the avenue (y = 5), in spreading order. */
const SIDE = [0.625, 1.875, 3.125, 4.375].map((y) => pieceAt(7.5, y));
const RINGS = [
  [pieceAt(6.875, 5), pieceAt(8.125, 5)],
  [pieceAt(5.625, 5), pieceAt(9.375, 5)],
  [pieceAt(4.375, 5), pieceAt(10.625, 5)],
];
const JUNCTION_PT: [number, number] = [7.5, 4.2];
/** Edges near the junction that carry white message packets while "pass messages" is said. */
const NEAR = EDGES.map((e, k) => [e, k] as const).filter(([[i, j]]) => {
  const d = (p: [number, number]) => Math.hypot(p[0] - JUNCTION_PT[0], p[1] - JUNCTION_PT[1]);
  return d(PIECES[i].m as [number, number]) < 4.2 && d(PIECES[j].m as [number, number]) < 4.2;
});

/** Message passing: white packets hop between neighbours; then a side-street jam spills onto the avenue, one hop at a time. */
export const Spill: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tPass = wf("spill", "pass");
  const tJam = wf("spill", "jam");
  const tSpills = wf("spill", "spills");
  const tBigger = wf("spill", "bigger");

  const push = useMove(0, 34);
  const cam = mixCam(GRAPH, JUNCTION, push);

  // White packets on a loop between neighbours, from "pass" until the jam starts
  const white = NEAR.map(([[i, j]], n) => {
    const start = tPass + (n % 7) * 4;
    if (frame < start || frame > tJam + 6) return { a: i, b: j, t: -1 };
    const local = ((frame - start + n * 5) % 26) / 18;
    return n % 2 ? { a: i, b: j, t: local, color: C.text } : { a: j, b: i, t: local, color: C.text };
  });

  // Side street goes red, far end first, starting on "jam"
  const sideAt = SIDE.map((_, k) => tJam + k * 5);
  // Then red hops: junction → ring 0 → ring 1 → ring 2
  const HOP = 10;
  const ringAt = RINGS.map((_, r) => tSpills + r * (HOP + 4));
  const red: { a: number; b: number; t: number; color: string }[] = [];
  RINGS.forEach((ring, r) => {
    const from = r === 0 ? [SIDE[3], SIDE[3]] : RINGS[r - 1];
    ring.forEach((to, s) => red.push({ a: from[s], b: to, t: (frame - ringAt[r]) / HOP, color: C.red }));
  });

  const nodeColor = (i: number) => {
    const sk = SIDE.indexOf(i);
    if (sk >= 0) return frame >= sideAt[sk] ? C.red : null;
    for (let r = 0; r < RINGS.length; r++)
      if (RINGS[r].includes(i)) {
        if (frame >= ringAt[r] + HOP) return C.red;
        if (frame >= ringAt[r]) return C.accent;
        return null;
      }
    return null;
  };

  const pSide = ease(frame, tJam + 6, tJam + 16);
  const pBig = ease(frame, tBigger, tBigger + 10);

  return (
    <>
      {[0, 1, 2, 3, 4].map((k) => (
        <Sfx key={k} name="click" at={tPass + k * 7} volume={0.14} />
      ))}
      <Sfx name="riser" at={Math.max(0, tSpills - 22)} volume={0.16} dur={26} />
      {RINGS.map((_, r) => (
        <Sfx key={`r${r}`} name="click" at={ringAt[r] + HOP} volume={0.2} />
      ))}
      <Sfx name="thud" at={ringAt[2] + HOP} volume={0.28} />

      <Header>
        <Reveal at={0}>
          <Kicker text="HOW IT LEARNS" color={C.cyan} />
        </Reveal>
        <Reveal at={4}>
          <Title size={80}>
            Jams spread to <span style={{ color: C.red }}>neighbours</span>
          </Title>
        </Reveal>
      </Header>

      <World
        cam={cam}
        graph={1}
        route={{ progress: 1, opacity: 0 }}
        you={{ opacity: 0 }}
        nodeColor={nodeColor}
        hops={[...white, ...red]}
        overlay={
          <>
            {pSide > 0.01 && <IsoLabel x={7.2} y={0.6} z={0} text="SIDE STREET" color={C.red} opacity={pSide} lift={50} size={28} />}
            {pBig > 0.01 && <IsoLabel x={6.25} y={5.5} z={0} text="BIG ROAD" color={C.text} opacity={pBig} lift={-60} size={28} />}
          </>
        }
      />

      <Source text="DeepMind, 2020" at={tPass} />
    </>
  );
};
