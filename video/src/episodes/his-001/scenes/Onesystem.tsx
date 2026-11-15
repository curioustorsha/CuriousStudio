import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../../../theme";
import { ease, Header, Reveal, Sfx, Source, Title, useIn, useWord } from "../../../engine/kit";
import { LogoKicker } from "../../../logos";
import { AGENT_WIRE, BerthPulse, Chip, HALL_B, MY_BERTH, pathLen, SEATS, SEATS_WIDE, STATION_WIRE, mixCam, useMove, World, type Pulse } from "./world";
import { bookedSeat } from "./Copies";
import { CDN_ON } from "./Cdn";

/** A pulse riding a conduit into the reservation system after the conduit has drawn on, on a loop. */
const ride = (pts: Pulse["pts"], frame: number, start: number): Pulse[] => {
  if (frame < start) return [];
  const len = pathLen(pts);
  const per = Math.round(len / 0.14) + 14;
  const t = ((frame - start) % per) / (per - 14);
  return t < 1 ? [{ pts, t, trail: 1 }] : [];
};

/** Your booking goes to the Railways' one connected reservation system, which station counters and agents use too. */
export const Onesystem: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tOne = wf("onesystem", "one");
  const tStation = wf("onesystem", "station");
  const tAgents = wf("onesystem", "agents");

  const back = useMove(0, 40);
  const cam = mixCam(SEATS, SEATS_WIDE, back);
  const cylLit = (k: number) => ease(frame, tOne + k * 5, tOne + k * 5 + 10);
  const pLabel = ease(frame, tOne + 6, tOne + 18);
  const logo = useIn(tOne + 10, { damping: 10, stiffness: 200 });
  const sWire = ease(frame, tStation - 2, tStation + 18);
  const aWire = ease(frame, tAgents - 2, tAgents + 16);
  const sLabel = ease(frame, tStation, tStation + 10);
  const aLabel = ease(frame, tAgents, tAgents + 10);
  const pWeb = useIn(tAgents + 18, { damping: 12, stiffness: 200 });

  return (
    <>
      <Sfx name="whoosh" at={0} volume={0.18} />
      <Sfx name="ding" at={tOne + 8} volume={0.25} />
      <Sfx name="data" at={tStation + 18} volume={0.25} />
      <Sfx name="data" at={tAgents + 16} volume={0.25} />
      <Sfx name="pop" at={tAgents + 18} volume={0.22} />

      <Header>
        <Reveal at={0}>
          <LogoKicker logo="indianrailways" text="INDIAN RAILWAYS" />
        </Reveal>
        <Reveal at={4}>
          <Title size={80}>
            One system, <span style={{ color: C.cyan }}>every counter</span>
          </Title>
        </Reveal>
      </Header>

      <World
        cam={cam}
        clock={{ time: "10:00" }}
        {...CDN_ON}
        hall={{ rack: 0.5, wire: frame >= tAgents + 18 ? 1 : 0.4 }}
        res={{ seat: bookedSeat, cylLit, label: pLabel, logo: frame >= tOne + 10 ? logo : 0 }}
        station={{ wire: sWire, label: sLabel, glow: 0.6 * sLabel }}
        shop={{ wire: aWire, label: aLabel, glow: 0.5 * aLabel }}
        pulses={[...ride(STATION_WIRE, frame, tStation + 18), ...ride(AGENT_WIRE, frame, tAgents + 16)]}
        overlay={
          <>
            <BerthPulse i={MY_BERTH} />
            <Chip x={7.5} y={HALL_B.y - 0.1} z={0} text="WEB + APP" size={22} color={C.cyan} p={frame >= tAgents + 18 ? pWeb : 0} lift={18} dx={80} />
          </>
        }
      />

      <Source text="CRIS, Ministry of Railways" at={tOne} />
    </>
  );
};
