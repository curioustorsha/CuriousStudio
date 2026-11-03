import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C } from "../../../theme";
import { clamp, ease, Header, Kicker, Reveal, Sfx, Title, useIn, useWord } from "../../../engine/kit";
import { along, Chip, CITY, CLOSE, mixCam, R0, R1, useMove, World } from "./world";

/** The point on the long road where its labels sit (the long avenue stretch in the middle of the city). */
const LABEL_AT = 0.42;

export const Naive: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tOwn = wf("naive", "own");
  const tWare = wf("naive", "warehouse");
  const tFif = wf("naive", "fifteen");
  const tRide = wf("naive", "ride");
  const tHour = wf("naive", "hour");

  const pStamp = useIn(tOwn, { damping: 12, stiffness: 260 });
  const pull = useMove(tWare - 2, 34);
  const cam = mixCam(CLOSE, CITY, pull);
  const pW = useIn(tWare + 4, { damping: 14, stiffness: 120 });
  const s1 = 1 - ease(frame, tWare, tWare + 16);
  const road = ease(frame, tFif, tFif + 32);
  const p15 = useIn(tFif + 14, { damping: 11, stiffness: 220 });

  // The rider leaves the home view, then crawls out of the warehouse at the same 15 km/h
  const away = 1 - ease(frame, tWare - 4, tWare + 4);
  const back = ease(frame, tRide - 8, tRide);
  const crawl = interpolate(frame, [tRide, tHour + 40], [0.0, 0.07], clamp);
  const onR1 = frame < tWare + 4;

  // Clock above the long road: counts to 60 minutes, then lands as a red 1 HR
  const pClock = useIn(tRide - 4, { damping: 13, stiffness: 200 });
  const mins = Math.round(interpolate(frame, [tRide, tHour], [0, 60], { ...clamp, easing: (x) => x * x }));
  const hit = frame >= tHour;
  const shake = hit ? Math.sin((frame - tHour) * 2.4) * 9 * Math.exp(-(frame - tHour) * 0.12) : 0;
  const [mx, my] = along(R0, LABEL_AT);

  return (
    <>
      <Sfx name="thud" at={tOwn} volume={0.6} />
      <Sfx name="swoosh" at={tWare - 4} volume={0.4} />
      <Sfx name="scan" at={tFif} volume={0.3} dur={34} />
      <Sfx name="ticker" at={tRide} volume={0.25} dur={tHour - tRide} />
      <Sfx name="error" at={tHour} volume={0.45} />

      <Header>
        <Reveal at={0}>
          <Kicker text="THE OLD WAY" color={C.red} />
        </Reveal>
        <Reveal at={6}>
          <Title size={80}>
            15 km at <span style={{ color: C.accent }}>15 km/h</span>
          </Title>
        </Reveal>
      </Header>

      <World
        cam={cam}
        wh={{ rise: frame >= tWare + 4 ? Math.min(1.04, pW) : 0, label: 1 }}
        store={(k) => ({ rise: k === 0 ? s1 : 0 })}
        h0={{ label: 1 }}
        r1={{ progress: 1, opacity: s1 }}
        r0={{ progress: road }}
        rider={
          onR1
            ? {
                points: R1,
                t: 1,
                opacity: away,
                load: 1,
                parked: 1,
                tag: { text: "15 km/h", p: 1 },
                sub: { text: "OWN FIGURE", logo: true, p: frame >= tOwn ? pStamp : 0, color: C.text },
              }
            : { points: R0, t: crawl, opacity: back, moving: crawl > 0 ? 1 : 0, parked: crawl > 0 ? 0 : 1, tag: { text: "15 km/h", p: 1 } }
        }
        overlay={
          <>
            <Chip x={mx} y={my} text="15 km" color={C.red} p={frame >= tFif + 14 ? p15 : 0} lift={34} />
            <Chip x={mx} y={my} text={hit ? "1 HR" : `${mins} MIN`} color={hit ? C.red : C.text} size={hit ? 40 : 32} p={frame >= tRide - 4 ? pClock : 0} lift={112} shake={shake} />
          </>
        }
      />
    </>
  );
};
