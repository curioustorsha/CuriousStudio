import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../../../theme";
import { ease, Header, IsoPath, IsoPulse, Kicker, Reveal, Sfx, Source, Title, useIn, useWord } from "../../../engine/kit";
import { ALT, EtaTag } from "./Eta";
import { Chip, CITY, JAM, JAM_MID, jamPhones, trafficPhones, World } from "./world";

const ALT_MID: [number, number] = [9, 10];
const MAIN_MID = JAM_MID;

/** Routes ranked by ETA; when traffic is forecast to build ahead, the map sends you the lower-traffic way. */
export const Route: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tRanks = wf("route", "ranks");
  const tPred = wf("route", "predicts");
  const tAhead = wf("route", "ahead");
  const tWay = wf("route", "way");

  const spring = { damping: 11, stiffness: 220 };
  const pA = useIn(tRanks + 2, spring);
  const pB = useIn(tRanks + 8, spring);
  const build = ease(frame, tPred, tAhead + 6);
  const swap = ease(frame, tWay - 4, tWay + 14);

  return (
    <>
      <Sfx name="pop" at={tRanks + 2} volume={0.26} />
      <Sfx name="pop" at={tRanks + 8} volume={0.26} />
      <Sfx name="riser" at={tPred} volume={0.16} dur={24} />
      <Sfx name="swoosh" at={tWay - 4} volume={0.3} />
      <Sfx name="ding" at={tWay + 10} volume={0.28} />

      <Header>
        <Reveal at={0}>
          <Kicker text="STEP 4 · ROUTING" color={C.green} />
        </Reveal>
        <Reveal at={4}>
          <Title size={80}>
            Ranked by <span style={{ color: C.green }}>ETA</span>
          </Title>
        </Reveal>
      </Header>

      <World
        cam={CITY}
        route={{ progress: 1, opacity: 0.85 * (1 - 0.7 * swap) }}
        seg={(i) => {
          const near = i >= JAM[0] - 2 && i <= JAM[1] + 2;
          if (!near) return { tint: 0, on: 0.75 * (1 - 0.5 * swap) };
          const inJam = i >= JAM[0] && i <= JAM[1];
          return { tint: inJam ? 1 : 0.6 * build, on: 0.9, glow: build * (1 - swap) };
        }}
        you={{ label: 1 }}
        office={{ glow: 0.5 }}
        phones={[...trafficPhones(frame), ...jamPhones(frame, 1)]}
        overlay={
          <>
            <IsoPath points={ALT} color={swap > 0.5 ? C.green : C.muted} progress={1} dashed={swap < 0.5} width={swap > 0.5 ? 14 : 8} glow={0.6 * swap} z={0.04} />
            {swap > 0.5 && <IsoPulse points={ALT} t={((frame - tWay) % 50) / 50} color={C.green} size={12} trail={1} frame={frame} />}
            <Chip x={MAIN_MID[0]} y={MAIN_MID[1]} text={swap > 0.5 ? "TRAFFIC AHEAD" : "ROUTE A"} color={swap > 0.5 ? C.red : C.text} size={22} p={frame >= tRanks + 2 ? pA : 0} lift={56} />
            <Chip x={ALT_MID[0]} y={ALT_MID[1]} text={swap > 0.5 ? "LESS TRAFFIC" : "ROUTE B"} color={swap > 0.5 ? C.green : C.text} size={22} p={frame >= tRanks + 8 ? pB : 0} lift={56} />
            <EtaTag p={1} frame={frame} />
          </>
        }
      />

      <Source text="Google, 2020" at={tRanks} />
    </>
  );
};
