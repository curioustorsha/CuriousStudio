import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C } from "../../../theme";
import { clamp, ease, Header, IsoLabel, IsoTile, Reveal, Sfx, Source, Title, useIn, useWord } from "../../../engine/kit";
import { LogoKicker } from "../../../logos";
import { along, Chip, CLOSE, door, H0, mixCam, Parcel, R1, STORES, useMove, World, type Actor, type P2 } from "./world";
import { AREA_END, SERVED } from "./Area";
import { inOut } from "./Hook";

/** Floor timeline just in front of your neighbourhood: 0.4 cells per minute, 0 → 10.5 min. */
const TL = { x: 1.5, y: 15.25, d: 0.32, perMin: 0.4 };
const PICK = 2.5;
const RIDE = 8;

export const Timeline: React.FC<{ track: number; pick: number; ride: number; opacity?: number }> = ({ track, pick, ride, opacity = 1 }) => {
  const total = (PICK + RIDE) * TL.perMin;
  const ticks: [number, string][] = [
    [0, "0"],
    [PICK, "2.5"],
    [PICK + RIDE, "10.5"],
  ];
  return (
    <g opacity={opacity}>
      {track > 0.001 && <IsoTile x={TL.x} y={TL.y} w={total * track} d={TL.d} color={C.muted} opacity={0.12} strokeOpacity={0.4} />}
      {pick > 0.001 && <IsoTile x={TL.x} y={TL.y} w={PICK * TL.perMin * pick} d={TL.d} color={C.green} opacity={0.85} strokeOpacity={1} />}
      {ride > 0.001 && <IsoTile x={TL.x + PICK * TL.perMin} y={TL.y} w={RIDE * TL.perMin * ride} d={TL.d} color={C.accent} opacity={0.85} strokeOpacity={1} />}
      {ticks.map(([m, t], i) => (
        <IsoLabel key={i} x={TL.x + m * TL.perMin} y={TL.y + TL.d + 0.1} text={t} size={22} color={C.muted} lift={-30} opacity={ease(track, (i / 3) * 0.9, (i / 3) * 0.9 + 0.1)} />
      ))}
    </g>
  );
};

export const Clock: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tClock = wf("clock", "clock");
  const tPicked = wf("clock", "picked");
  const tTwo = wf("clock", "two");
  const tMin = wf("clock", "minutes");
  const tEight = wf("clock", "eight");
  const tRoad = wf("clock", "road");

  const cam = mixCam(AREA_END, CLOSE, useMove(0, 30));

  // The rider heads back to the store while the camera settles, then rides out on "eight"
  const back = interpolate(frame, [0, 28], [1, 0], { ...clamp, easing: (x) => x * (2 - x) });
  const out = inOut(interpolate(frame, [tEight - 4, tRoad + 2], [0, 1], clamp));
  const rideT = frame < tEight ? back : out;
  const moving = (frame < 28 && back > 0) || (out > 0 && out < 1) ? 1 : 0;

  // Your order travels from your home to S1 along the same streets
  const orderPts: P2[] = [...R1].reverse();
  const orderT = interpolate(frame, [tClock + 4, tClock + 30], [0, 1], clamp);

  // Picking: S1 glows, three parcels drop onto the waiting rider at its door
  const glow = ease(frame, tPicked, tPicked + 10) * (1 - ease(frame, tEight, tEight + 14));
  const [sx, sy] = door(STORES[0], -0.05);
  const [rx, ry] = R1[0];
  const parcels: Actor[] = [0, 1, 2].map((i) => {
    const t0 = tPicked + 4 + i * 6;
    const k = interpolate(frame, [t0, t0 + 12], [0, 1], clamp);
    const pop = useIn(t0, { damping: 11, stiffness: 220 });
    const x = sx + (rx - sx) * k;
    const y = sy + (ry - sy) * k;
    return { x, y, node: <Parcel x={x} y={y} z={0.6 * Math.sin(k * Math.PI) + 0.1} scale={Math.min(1, pop) * (1 - 0.5 * k)} opacity={frame >= t0 && k < 0.95 ? 1 : 0} /> };
  });
  const pLoad = useIn(tPicked + 16, { damping: 9, stiffness: 240 });
  const load = frame >= tPicked + 16 ? pLoad : 0;

  const track = ease(frame, tClock, tClock + 22);
  const pick = interpolate(frame, [tPicked, tMin + 6], [0, 1], clamp);
  const ride = interpolate(frame, [tEight - 4, tRoad + 2], [0, 1], clamp);
  const p25 = useIn(tTwo, { damping: 11, stiffness: 220 });
  const p8 = useIn(tEight + 2, { damping: 11, stiffness: 220 });
  const arrive = tRoad + 2;
  const pTotal = useIn(arrive, { damping: 11, stiffness: 200 });
  const pulse = Math.sin(ease(frame, arrive, arrive + 16) * Math.PI);
  const s1 = STORES[0];

  return (
    <>
      <Sfx name="scan" at={tClock} volume={0.3} dur={24} />
      <Sfx name="pop" at={tPicked + 4} volume={0.45} />
      <Sfx name="pop" at={tPicked + 10} volume={0.45} />
      <Sfx name="pop" at={tPicked + 16} volume={0.45} />
      <Sfx name="ding" at={tTwo} volume={0.4} />
      <Sfx name="moped" at={tEight - 2} volume={0.3} />
      <Sfx name="ticker" at={tEight} volume={0.22} dur={arrive - tEight} />
      <Sfx name="ding" at={arrive} volume={0.45} />

      <Header>
        <Reveal at={0}>
          <LogoKicker text="CLOCK" />
        </Reveal>
        <Reveal at={tClock}>
          <Title size={80}>
            Where the <span style={{ color: C.accent }}>minutes</span> go
          </Title>
        </Reveal>
      </Header>

      <World
        cam={cam}
        terr={(k) => (SERVED.includes(k) ? 1 : 0)}
        homeLit={(k) => (SERVED.includes(k) ? 1 : 0)}
        store={(k) => ({ rise: k <= 4 ? 1 : 0, glow: k === 0 ? glow : 0 })}
        h0={{ pulse, label: 1 }}
        floor={<Timeline track={track} pick={pick} ride={ride} />}
        links={[{ points: orderPts, progress: ease(frame, tClock, tClock + 10), t: orderT > 0 && orderT < 1 ? orderT : null, opacity: 1 - ease(frame, tClock + 30, tClock + 40), size: 11 }]}
        actors={parcels}
        rider={{ points: R1, t: rideT, load, moving, parked: moving ? 0 : 1, tag: { text: "15 km/h", p: 1 } }}
        overlay={
          <>
            <Chip x={s1.x + s1.w / 2} y={s1.y + s1.d / 2} z={s1.h} text="2.5 MIN PICK + PACK" color={C.green} size={25} p={frame >= tTwo ? p25 : 0} lift={150} dx={-60} />
            <Chip x={along(R1, 0.55)[0]} y={along(R1, 0.55)[1]} text="~8 MIN RIDE" color={C.accent} size={28} p={frame >= tEight + 2 ? p8 : 0} lift={-58} dx={60} />
            <Chip x={H0.x + H0.w / 2} y={H0.y + H0.d / 2} z={H0.h} text="≈ 10.5 MIN" color={C.text} size={34} p={frame >= arrive ? pTotal : 0} lift={170} dx={-20} />
          </>
        }
      />

      <Source text="Blinkit (Deepinder Goyal), Jan 2026" at={tPicked} />
    </>
  );
};
