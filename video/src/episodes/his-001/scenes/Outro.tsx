import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../../../theme";
import { ease, Header, Reveal, Sfx, Title, useIn, useWord } from "../../../engine/kit";
import { LogoKicker } from "../../../logos";
import { berth, BerthPulse, bots, Chip, CITY, crowd, MY_BERTH, RES, UPGRADE, mixCam, useMove, World, YouPulse } from "./world";
import { mySeat, BOOK_PATH } from "./Writing";
import { CDN_ON } from "./Cdn";

/** The answer: at ten, most bots are kept out, copies carry what never changes, and IRCTC's servers keep their strength for your booking. */
export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tTen = wf("outro", "ten");
  const tBots = wf("outro", "bots");
  const tCopies = wf("outro", "copies");
  const tIrctc = wf("outro", "irctc");
  const tOne = wf("outro", "one");
  const tBooking = wf("outro", "booking");

  const back = useMove(0, 34);
  const cam = mixCam(UPGRADE, CITY, back);
  const ring = frame >= tTen ? Math.min(1, (frame - tTen) / 22) : 0;
  const glowCab = frame >= tCopies ? 0.5 + 0.3 * Math.sin((frame - tCopies) * 0.3) : 0;
  const serve = ease(frame, tCopies, tCopies + 16);
  const hallGlow = ease(frame, tIrctc, tIrctc + 12) * 0.7;
  const focus = ease(frame, tOne, tOne + 10);
  const run = ease(frame, tOne + 4, tBooking);
  const lock = frame >= tBooking;
  const pChip = useIn(tBooking + 2, { damping: 11, stiffness: 220 });
  const b = berth(RES, MY_BERTH);

  return (
    <>
      <Sfx name="whoosh" at={0} volume={0.2} />
      <Sfx name="ding" at={tTen} volume={0.25} />
      <Sfx name="error" at={tBots + 10} volume={0.14} />
      <Sfx name="data" at={tCopies} volume={0.22} />
      <Sfx name="thud" at={tBooking} volume={0.35} />
      <Sfx name="ding" at={tBooking + 4} volume={0.3} />

      <Header>
        <Reveal at={0}>
          <LogoKicker logo="irctc" text="10:00" />
        </Reveal>
        <Reveal at={4}>
          <Title size={80}>
            Strength for <span style={{ color: C.accent }}>your booking</span>
          </Title>
        </Reveal>
      </Header>

      <World
        cam={cam}
        focus={focus}
        clock={{ time: "10:00", ring }}
        {...CDN_ON}
        cabs={() => ({ drop: 1, glow: glowCab * (1 - focus) })}
        serve={() => serve * (1 - focus)}
        gate={{ glow: frame >= tBots ? 1 : 0.3 }}
        hall={{ glow: hallGlow, rack: frame >= tIrctc ? 0.2 : 0.6, wire: focus }}
        res={{ seat: (i) => (i === MY_BERTH && lock ? mySeat(0.04, 0.6) : null), glow: 0.3 * focus }}
        pulses={crowd(frame + 500, 0, { n: 26, every: 2.4, speed: 0.13, opacity: 1 - 0.8 * focus })}
        bots={frame >= tBots - 10 ? bots(frame, tBots - 30, tBots - 30, { n: 12, slipEvery: 99, speed: 0.09 }).map((x) => ({ ...x, opacity: (x.opacity ?? 1) * (1 - focus) })) : []}
        overlay={
          <>
            {frame >= tOne && !lock && <YouPulse pts={BOOK_PATH} d={run * 2.1} moving />}
            {lock && <BerthPulse i={MY_BERTH} />}
            <Chip x={b.x} y={b.y} z={b.z} text="YOUR BOOKING" size={28} color={C.accent} p={lock ? pChip : 0} lift={70} />
          </>
        }
      />
    </>
  );
};
