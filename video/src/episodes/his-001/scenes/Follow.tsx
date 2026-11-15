import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../../../theme";
import { ease, Header, Kicker, Reveal, Sfx, Title, useIn, useWord } from "../../../engine/kit";
import { berth, Chip, CITY, GATE_Y, HALL_B, MY_BERTH, RES, World, YOU_PATH, YouPulse, type P2 } from "./world";

/** Your booking's whole journey: home → gate → hall → wire → seat grid. */
export const JOURNEY: P2[] = [...YOU_PATH, [7.5, 4.35], [7.5, 3.62], [7.5, 2.9]];

/** "Let's follow one booking, from tap to ticket": everything dims except your home; the route draws on. */
export const Follow: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tOne = wf("follow", "one");
  const tTap = wf("follow", "tap");
  const tTicket = wf("follow", "ticket");

  const focus = ease(frame, 0, 12);
  const pYou = useIn(tOne - 2, { damping: 12, stiffness: 200 });
  const route = ease(frame, tTap, tTicket);
  const steps = [0.25, 0.55, 0.85].map((k) => (route >= k ? Math.min(1, (frame - (tTap + (tTicket - tTap) * k)) / 8) : 0));
  const pTicket = useIn(tTicket, { damping: 10, stiffness: 220 });
  const b = berth(RES, MY_BERTH);

  return (
    <>
      <Sfx name="click" at={tTap} volume={0.4} />
      <Sfx name="swoosh" at={tTap} volume={0.2} />
      {[0.25, 0.55, 0.85].map((k, i) => (
        <Sfx key={i} name="pop" at={Math.round(tTap + (tTicket - tTap) * k)} volume={0.28} />
      ))}
      <Sfx name="ding" at={tTicket} volume={0.3} />

      <Header>
        <Reveal at={0}>
          <Kicker text="FOLLOW ONE BOOKING" />
        </Reveal>
        <Reveal at={4}>
          <Title size={84}>
            <span style={{ color: C.accent }}>Three</span> steps
          </Title>
        </Reveal>
      </Header>

      <World
        cam={CITY}
        focus={focus}
        clock={{ time: "10:00" }}
        hall={{ rack: 0.5 }}
        you={{ label: frame >= tOne - 2 ? pYou : 0 }}
        paths={[{ pts: JOURNEY, color: C.accent, progress: route, dashed: true, width: 7, glow: 0.6, z: 0.05 }]}
        overlay={
          <>
            {frame >= tOne - 2 && <YouPulse pts={YOU_PATH} d={0} />}
            <Chip x={7.5} y={GATE_Y + 0.6} text="1 GET IN" size={24} color={C.accent} p={steps[0]} lift={34} />
            <Chip x={HALL_B.x + HALL_B.w / 2} y={HALL_B.y + HALL_B.d} z={HALL_B.h} text="2 SEARCH" size={24} color={C.accent} p={steps[1]} lift={50} dx={-120} />
            <Chip x={b.x} y={b.y} z={b.z} text="3 BOOK" size={24} color={C.accent} p={steps[2]} lift={60} dx={-110} />
            <Chip x={b.x} y={b.y} z={b.z} text="TICKET" size={26} color={C.green} p={frame >= tTicket ? pTicket : 0} lift={120} dx={20} />
          </>
        }
      />
    </>
  );
};
