import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../theme";
import { ease, Header, Reveal, Sfx, Title } from "../lib";
import { wf } from "../timing";
import { binXY, BH, BW, Shelf, SHELF_H, SHELF_W } from "./Shelf";

const SCALE = 0.78;
const LEFT = (1080 - SHELF_W * SCALE) / 2;
const TOP = 430;

// Pairs of bins to connect, drawn as a "system" network.
const LINKS: [number, number][] = [
  [1, 10], [10, 15], [0, 5], [5, 9], [9, 14], [3, 6], [6, 11], [11, 19], [4, 8], [8, 13], [13, 17], [2, 7], [12, 16], [15, 18], [7, 11], [5, 10], [14, 18],
];

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const tNot = wf("outro", "not");
  const tSystem = wf("outro", "system");

  const net = ease(frame, tSystem - 6, tSystem + 16);
  const swap = ease(frame, tSystem - 4, tSystem + 4);
  const shake = 0.7 * (1 - net);
  const center = (i: number) => {
    const { x, y } = binXY(i);
    return { x: x + BW / 2, y: y + BH / 2 };
  };

  return (
    <>
      <Sfx name="whoosh" at={0} volume={0.35} />
      <Sfx name="data" at={tSystem - 6} volume={0.4} />
      <Sfx name="riser" at={tSystem + 2} volume={0.25} />

      <Header>
        <div style={{ position: "relative", height: 110, width: 1000 }}>
          <div style={{ position: "absolute", inset: 0, opacity: 1 - swap }}>
            <Reveal at={tNot - 6}>
              <Title size={104}>Not chaos.</Title>
            </Reveal>
          </div>
          <div style={{ position: "absolute", inset: 0, opacity: swap, transform: `scale(${0.9 + 0.1 * swap})` }}>
            <Title size={104} color={C.accent}>
              A system.
            </Title>
          </div>
        </div>
      </Header>

      <div style={{ position: "absolute", left: LEFT, top: TOP, transform: `scale(${SCALE})`, transformOrigin: "0 0" }}>
        <Shelf popStart={-100} shake={shake} glow={(i) => (LINKS.some(([a, b]) => a === i || b === i) ? net * 0.35 : 0)} />
        <svg width={SHELF_W} height={SHELF_H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {LINKS.map(([a, b], k) => {
            const p = Math.max(0, Math.min(1, net * 1.6 - k * 0.04));
            const A = center(a);
            const B = center(b);
            return (
              <g key={k} opacity={p}>
                <line x1={A.x} y1={A.y} x2={A.x + (B.x - A.x) * p} y2={A.y + (B.y - A.y) * p} stroke={C.accent} strokeWidth={5} strokeLinecap="round" />
                <circle cx={A.x} cy={A.y} r={10} fill={C.accent} />
                {p >= 1 && <circle cx={B.x} cy={B.y} r={10} fill={C.accent} />}
              </g>
            );
          })}
        </svg>
      </div>
    </>
  );
};
