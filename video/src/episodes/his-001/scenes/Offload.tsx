import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C } from "../../../theme";
import { clamp, ease, Header, IsoPacket, Reveal, Sfx, Source, Title, useIn, useWord } from "../../../engine/kit";
import { LogoKicker } from "../../../logos";
import { CAB_PATHS, CITY, mixCam, useMove, World, type Cam } from "./world";
import { RailwaysTag, StatCard } from "./parts";
import { bookedSeat } from "./Copies";
import { CDN_ON } from "./Cdn";

const ROOF: Cam = { fx: 7.0, fy: 4.9, u: 92, sx: 600, sy: 1010 };

/** 87% of IRCTC's static content is served from the copies: the cube stack on the hall roof empties, the load meter drops. */
export const Offload: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tMost = wf("offload", "most");
  const tCopies = wf("offload", "copies");
  const tRail = wf("offload", "railways");

  const move = useMove(0, 30);
  const cam = mixCam(CITY, ROOF, move);
  const go = ease(frame, tMost, tMost + 40);
  const pCard = useIn(tMost + 4, { damping: 12, stiffness: 200 });
  const pct = Math.round(interpolate(frame, [tMost + 4, tMost + 40], [0, 87], clamp));
  const calm = ease(frame, tCopies, tCopies + 16);
  const meter = 0.92 - 0.6 * calm;
  const pTag = useIn(tRail, { damping: 14, stiffness: 180 });

  // green copies streaming out along the wires to the cabinets
  const stream = CAB_PATHS.flatMap((pts, k) =>
    [0, 1, 2, 3].map((j) => {
      const start = tMost + 6 + j * 7 + k * 3;
      const t = (frame - start) / 30;
      return t > 0 && t < 1 ? <IsoPacket key={`${k}-${j}`} points={pts} t={t} color={C.green} size={Math.max(5, cam.u * 0.08)} /> : null;
    }),
  );

  return (
    <>
      <Sfx name="whoosh" at={tMost} volume={0.25} />
      <Sfx name="ticker" at={tMost + 4} volume={0.16} dur={36} />
      <Sfx name="coin" at={tCopies + 8} volume={0.25} />

      <Header>
        <Reveal at={0}>
          <LogoKicker logo="irctc" text="UNCHANGING PARTS" />
        </Reveal>
        <Reveal at={4}>
          <Title size={84}>
            Served from <span style={{ color: C.green }}>copies</span>
          </Title>
        </Reveal>
      </Header>

      <World
        cam={cam}
        clock={{ time: "10:00" }}
        {...CDN_ON}
        hall={{ rack: 0.95 - 0.8 * calm, meter, cubes: 1, cubeGo: go, glow: 0.3 * calm }}
        res={{ seat: bookedSeat }}
        overlay={<>{stream}</>}
      />

      <StatCard x={700} y={420} p={frame >= tMost + 4 ? pCard : 0} big={`${pct}%`} sub="OF UNCHANGING CONTENT" size={86} />
      <RailwaysTag p={frame >= tRail ? pTag : 0} x={540} y={1192} text="THE RAILWAYS SAYS" />
      <Source text="Ministry of Railways, Jun 2025" at={tMost} />
    </>
  );
};
