import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../../../theme";
import { ease, Header, Kicker, Reveal, Sfx, Title, useIn, useWord } from "../../../engine/kit";
import { Chip, MY_BERTH, NEXT_BERTH, RES, SEATS, World, mixCam, useMove, type Cam, type SeatState } from "./world";
import { Anchored, ResultsCard } from "./parts";
import { CARD_AT } from "./Reading";
import { mySeat, otherSeat } from "./Writing";

const COPIES: Cam = { fx: 7.1, fy: 3.7, u: 76, sx: 560, sy: 900 };

export const bookedSeat = (i: number): SeatState | null => (i === MY_BERTH ? mySeat(0.02) : i === NEXT_BERTH ? otherSeat : null);

/** The big idea: reading can be copied (the results card clones into four), writing can't (the grid's ghost cracks). */
export const Copies: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tRead = wf("copies", "reading");
  const tCopied = wf("copies", "copied");
  const tWrite = wf("copies", "writing");

  const glide = useMove(0, 26);
  const cam = mixCam(SEATS, COPIES, glide);
  const pCard = useIn(0, { damping: 14, stiffness: 180 });
  const fan = [0, 1, 2, 3].map((k) => ease(frame, tCopied - 4 + k * 3, tCopied + 10 + k * 3));
  const lift = ease(frame, tWrite, tWrite + 10);
  const crack = ease(frame, tWrite + 12, tWrite + 22);
  const ghostOp = (frame >= tWrite ? 0.9 : 0) * (1 - ease(frame, tWrite + 26, tWrite + 38));
  const pOne = useIn(tWrite + 20, { damping: 11, stiffness: 220 });
  // the four copies settle into a 2 × 2 grid around where the original card sat
  const offs: [number, number][] = [
    [-15, -78],
    [190, -78],
    [-15, 78],
    [190, 78],
  ];

  return (
    <>
      <Sfx name="whoosh" at={0} volume={0.15} />
      {fan.map((_, k) => (
        <Sfx key={k} name="pop" at={tCopied - 4 + k * 3} volume={0.22} />
      ))}
      <Sfx name="crack" at={tWrite + 12} volume={0.4} />
      <Sfx name="thud" at={tWrite + 20} volume={0.2} />

      <Header>
        <Reveal at={0}>
          <Kicker text="THE BIG IDEA" color={C.cyan} />
        </Reveal>
        <Reveal at={4}>
          <Title size={80}>
            Copy <span style={{ color: C.green }}>reads</span>, not <span style={{ color: C.accent }}>writes</span>
          </Title>
        </Reveal>
      </Header>

      <World
        cam={cam}
        clock={{ time: "10:00" }}
        hall={{ rack: 0.6, wire: 0.4 }}
        res={{ seat: bookedSeat, ghost: { lift: 0.9 * lift, crack, opacity: ghostOp } }}
        overlay={
          <>
            {/* the clones fan out behind the original, in green */}
            {[3, 2, 1, 0].map((k) =>
              fan[k] > 0.01 ? (
                <Anchored key={k} {...CARD_AT} dx={CARD_AT.dx + offs[k][0] * fan[k] + 10} dy={CARD_AT.dy + 40 + offs[k][1] * fan[k]} p={fan[k]} scale={0.62}>
                  <ResultsCard rows={3} seats={1} tint={C.green} />
                </Anchored>
              ) : null,
            )}
            <Anchored {...CARD_AT} dx={CARD_AT.dx + 10} dy={CARD_AT.dy + 40} p={pCard * (1 - fan[0])} scale={0.62}>
              <ResultsCard rows={3} seats={1} tint={frame >= tRead ? C.green : C.cyan} />
            </Anchored>
            <Chip x={RES.x + RES.w / 2} y={RES.y + RES.d / 2} z={RES.pz} text="ONE ONLY" size={28} color={C.accent} p={frame >= tWrite + 20 ? pOne : 0} lift={60} />
          </>
        }
      />
    </>
  );
};
