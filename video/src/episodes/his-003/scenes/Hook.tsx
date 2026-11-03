import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C } from "../../../theme";
import { clamp, Header, Kicker, Sfx, Source, Title, useIn, useWord } from "../../../engine/kit";
import { Chip, CLOSE, door, H0, Parcel, R1, STORES, World, type Actor } from "./world";

export const HookHeader: React.FC = () => (
  <Header>
    <Kicker text="QUICK COMMERCE" />
    <Title size={74}>
      Fast delivery, <span style={{ color: C.cyan }}>slow rider</span>
    </Title>
  </Header>
);

export const inOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tGro = wf("hook", "groceries");
  const tTen = wf("hook", "ten");
  const tRider = wf("hook", "rider");
  const tFif = wf("hook", "fifteen");

  // Three packed parcels hop out of S1's shutter onto the waiting rider, one after another
  const [sx, sy] = door(STORES[0], -0.05);
  const [rx, ry] = R1[0];
  const parcels: Actor[] = [0, 1, 2].map((i) => {
    const at = tGro + i * 5;
    const k = interpolate(frame, [at, at + 14], [0, 1], clamp);
    const pop = useIn(at, { damping: 11, stiffness: 220 });
    const x = sx + (rx - sx) * k;
    const y = sy + (ry - sy) * k;
    const z = 0.7 * Math.sin(k * Math.PI) + 0.1;
    return { x, y, node: <Parcel x={x} y={y} z={z} scale={Math.min(1, pop) * (1 - 0.5 * k)} opacity={frame >= at && k < 0.95 ? 1 : 0} /> };
  });
  const pLoad = useIn(tGro + 12, { damping: 9, stiffness: 240 });
  const load = frame >= tGro + 12 ? pLoad : 0;

  const ride = inOut(interpolate(frame, [tRider, tRider + 60], [0, 1], clamp));
  const pTag = useIn(tFif, { damping: 8, stiffness: 200 });
  const pTen = useIn(tTen, { damping: 12, stiffness: 200 });

  return (
    <>
      <Sfx name="pop" at={tGro} volume={0.5} />
      <Sfx name="pop" at={tGro + 5} volume={0.5} />
      <Sfx name="pop" at={tGro + 10} volume={0.5} />
      <Sfx name="ticker" at={tTen} volume={0.3} dur={18} />
      <Sfx name="moped" at={tRider - 2} volume={0.35} />
      <Sfx name="thud" at={tFif + 5} volume={0.7} />

      <HookHeader />
      <World
        cam={CLOSE}
        h0={{ label: 1 }}
        actors={parcels}
        rider={{
          points: R1,
          t: ride,
          load,
          moving: ride > 0 && ride < 1 ? 1 : 0,
          parked: ride <= 0 ? 1 : 0,
          tag: { text: "15 km/h", p: frame >= tFif ? pTag : 0 },
        }}
        overlay={<Chip x={H0.x + H0.w / 2} y={H0.y + H0.d / 2} z={H0.h} text="~10 MIN" p={frame >= tTen ? pTen : 0} lift={150} dx={-30} />}
      />

      <Source text="Blinkit (Deepinder Goyal), Jan 2026" at={20} />
    </>
  );
};
