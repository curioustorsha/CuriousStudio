import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../../../theme";
import { ease, Header, Kicker, Reveal, Sfx, Title, useIn, useWord } from "../../../engine/kit";
import { GATE, HALL, HALL_B, mixCam, pathLen, useMove, World, YOU_PATH, YouPulse, type Cam } from "./world";
import { Anchored, ResultsCard } from "./parts";
import { D_THROUGH } from "./Bots";

export const D_HALL = pathLen(YOU_PATH);
/** Where the results card floats: left of the hall, clear of the seat grid behind it. */
export const CARD_AT = { x: HALL_B.x + 0.4, y: HALL_B.y + HALL_B.d, z: HALL_B.h, dx: -170, dy: -190 };

/** Step two, you search: the trains, the seats left. That's reading: nothing changes. */
export const Reading: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tSearch = wf("reading", "search");
  const tTrains = wf("reading", "trains");
  const tSeats = wf("reading", "seats");
  const tRead = wf("reading", "reading");
  const tNothing = wf("reading", "nothing");

  const glide = useMove(0, 34);
  const cam: Cam = mixCam(GATE, HALL, glide);
  const d = D_THROUGH + (D_HALL - D_THROUGH) * ease(frame, 4, tSearch + 6);
  const pCard = useIn(tTrains - 4, { damping: 13, stiffness: 190 });
  const rows = Math.max(0, (frame - tTrains) / 5);
  const seats = ease(frame, tSeats, tSeats + 8);
  const eye = frame >= tSeats && frame <= tSeats + 26 ? (frame - tSeats) / 26 : null;
  const pRead = useIn(tRead, { damping: 11, stiffness: 220 });
  const outline = ease(frame, tNothing, tNothing + 22);
  const rack = frame >= tSearch ? 0.95 : 0.5;

  return (
    <>
      <Sfx name="whoosh" at={0} volume={0.18} />
      <Sfx name="data" at={tTrains} volume={0.25} />
      <Sfx name="data" at={tTrains + 10} volume={0.2} />
      <Sfx name="scan" at={tSeats} volume={0.2} />
      <Sfx name="pop" at={tRead} volume={0.3} />

      <Header>
        <Reveal at={0}>
          <Kicker text="STEP 2 · SEARCH" color={C.green} />
        </Reveal>
        <Reveal at={4}>
          <Title size={80}>
            Looking changes <span style={{ color: C.green }}>nothing</span>
          </Title>
        </Reveal>
      </Header>

      <World
        cam={cam}
        clock={{ time: "10:00" }}
        hall={{ rack, glow: frame >= tSearch ? 0.4 : 0, wire: 0.3 }}
        gate={{ glow: 1 }}
        res={{ eye, outline }}
        overlay={
          <>
            <YouPulse pts={YOU_PATH} d={d} tag={frame >= tRead ? "READ" : "YOU"} tagColor={frame >= tRead ? C.green : C.accent} tagP={frame >= tRead ? pRead : 1} moving={frame < tSearch + 6} />
            <Anchored {...CARD_AT} p={frame >= tTrains - 4 ? pCard : 0}>
              <ResultsCard rows={rows} seats={seats} />
            </Anchored>
          </>
        }
      />
    </>
  );
};
