import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../../../theme";
import { ease, Header, IsoBox, IsoLabel, Reveal, Sfx, Source, Title, useIn, useWord } from "../../../engine/kit";
import { LogoKicker } from "../../../logos";
import { berth, Chip, dropIn, LandRing, mixCam, NEW_RES, RES, UPGRADE, useMove, World, type Car, type SeatState } from "./world";
import { LIMIT } from "./Limit";
import { bookedSeat } from "./Copies";
import { CDN_ON } from "./Cdn";

/** The READ and WRITE bars beside the new system, honest to scale: 40 lakh vs 1.5 lakh a minute. */
const READ_H = 2.6;
const WRITE_H = (READ_H * 1.5) / 40;
const BAR = { y: 4.45, d: 0.42, rx: 12.15, wx: 12.8, w: 0.42 };

/** Trains move to a new system built for 40 lakh enquiries and 1.5 lakh bookings a minute. */
export const Upgrade: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tTrains = wf("upgrade", "trains");
  const tNew = wf("upgrade", "new");
  const tForty = wf("upgrade", "forty");
  const tOne = wf("upgrade", "one");
  const tFar = wf("upgrade", "far");

  const move = useMove(0, 30);
  const cam = mixCam(LIMIT, UPGRADE, move);
  const plot = ease(frame, 4, 14);
  const drop = dropIn(frame, tNew);

  // Carriages in pairs, with gaps (phased): old system (x ≈ 7.5) → new system (x ≈ 12.5)
  const pairs = [0, 1, 2];
  const cars: Car[] = pairs.flatMap((k) => {
    const start = tTrains + 6 + k * 34;
    const t = ease(frame, start, start + 46);
    if (frame < start - 4) return [];
    const x = 8.6 + t * 5.0;
    const op = Math.min(1, (frame - start + 4) / 6) * (t >= 1 ? Math.max(0, 1 - (frame - start - 46) / 12) : 1);
    return [{ x, opacity: op }, { x: x - 1.02, opacity: op }];
  });
  const moved = pairs.map((k) => ease(frame, tTrains + 6 + k * 34, tTrains + 6 + k * 34 + 46));
  const movedAll = moved.reduce((a, b) => a + b, 0) / 3;

  // the old grid thins as trains leave; the new one fills as they arrive
  const oldSeat = (i: number): SeatState | null => {
    const base = bookedSeat(i);
    const b = berth(RES, i);
    const gone = movedAll * 3 > (b.col % 3) + (b.row % 2) * 0.5 + 0.2;
    return gone ? { ...(base ?? {}), opacity: 0.3 } : base;
  };
  const newSeat = (i: number): SeatState | null => {
    const b = berth(NEW_RES, i);
    return movedAll * 3 > b.col * 0.3 + 0.1 ? null : { color: "#1F4A5E" };
  };

  const read = ease(frame, tForty - 2, tForty + 20);
  const write = ease(frame, tOne - 2, tOne + 12);
  const pRead = useIn(tForty + 6, { damping: 12, stiffness: 200 });
  const pWrite = useIn(tOne + 6, { damping: 12, stiffness: 200 });
  const far = frame >= tFar ? 0.5 + 0.5 * Math.sin((frame - tFar) * 0.35) : 0;

  const bars = [
    {
      key: BAR.rx + BAR.y + 0.4,
      node: <IsoBox key="read" x={BAR.rx} y={BAR.y} w={BAR.w} d={BAR.d} h={READ_H} rise={read} color={C.green} glow={far} />,
    },
    {
      key: BAR.wx + BAR.y + 0.4,
      node: <IsoBox key="write" x={BAR.wx} y={BAR.y} w={BAR.w} d={BAR.d} h={WRITE_H} rise={write} color={C.accent} />,
    },
  ];

  return (
    <>
      <Sfx name="whoosh" at={0} volume={0.15} />
      <Sfx name="train" at={tTrains + 6} volume={0.35} dur={110} />
      <Sfx name="thud" at={tNew + 4} volume={0.35} />
      <Sfx name="pop" at={tNew + 10} volume={0.25} />
      <Sfx name="riser" at={tForty - 6} volume={0.2} />
      <Sfx name="pop" at={tOne + 6} volume={0.25} />

      <Header>
        <Reveal at={0}>
          <LogoKicker logo="indianrailways" text="WHAT'S NEXT" />
        </Reveal>
        <Reveal at={4}>
          <Title size={84}>
            A <span style={{ color: C.cyan }}>bigger</span> system
          </Title>
        </Reveal>
      </Header>

      <World
        cam={cam}
        clock={{ time: "10:00" }}
        {...CDN_ON}
        res={{ seat: oldSeat, cylLit: () => 0.6 }}
        newRes={{ drop, plot, seat: newSeat, glow: 0.3 * movedAll }}
        cars={cars}
        blocks={bars}
        overlay={
          <>
            <LandRing x={NEW_RES.x + NEW_RES.w / 2} y={NEW_RES.y + NEW_RES.d / 2} t={(frame - tNew - 8) / 18} r={2} />
            <Chip x={BAR.rx + BAR.w / 2} y={BAR.y + BAR.d / 2} z={READ_H} text="40 LAKH / MIN" size={26} color={C.green} p={frame >= tForty + 6 ? pRead : 0} lift={40} dx={-150} />
            <Chip x={BAR.wx + BAR.w / 2} y={BAR.y + BAR.d / 2} z={WRITE_H} text="1.5 LAKH / MIN" size={26} color={C.accent} p={frame >= tOne + 6 ? pWrite : 0} lift={52} dx={70} />
            {read > 0.5 && <IsoLabel x={BAR.rx + BAR.w / 2} y={BAR.y + BAR.d} z={0} text="READ" color={C.green} lift={-34} size={24} opacity={read} />}
            {write > 0.5 && <IsoLabel x={BAR.wx + BAR.w / 2} y={BAR.y + BAR.d} z={0} text="WRITE" color={C.accent} lift={-66} size={24} opacity={write} />}
          </>
        }
      />

      <Source text="PIB, Aug 2026" at={tNew} />
    </>
  );
};
