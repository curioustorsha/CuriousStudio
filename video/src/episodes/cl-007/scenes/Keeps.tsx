import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, Source, useWord } from "../../../engine/kit";
import { Bench, BENCH, Chip, Desk, ez, Host, moodAt, Pile, PILE, pileTop, Stage, SwipeArc, Wall } from "../../../workshop";
import { slabHands } from "./Pile";
import { landed, LessonHeader, N_PILE, slabLand } from "./common";

/** Landing frames of Q4 and A4 (scene-local). */
export const keepsAts = (wf: (id: string, w: string, n?: number, e?: "start" | "end") => number) => [wf("keeps", "write"), wf("keeps", "with")];

/** Claude doesn't wipe the desk: a swipe stops short and is struck; Q4 lands; a read-light runs up the whole pile; A4. */
export const Keeps: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const tWipe = wf("keeps", "wipe");
  const tBetween = wf("keeps", "between");
  const tWhole = wf("keeps", "whole");
  const tComes = wf("keeps", "comes");
  const ats = keepsAts(wf);

  const swipe = ez(f, tWipe - 2, tWipe + 12);
  const strike = ez(f, tBetween, tBetween + 8);
  const swipeO = 1 - ez(f, tBetween + 18, tBetween + 28);
  const lands = [...landed(N_PILE), ...ats.map((a) => slabLand(f, a))];
  // read-light: up the pile from the report to Q4
  const s = ez(f, tWhole - 2, tComes - 2) * (N_PILE + 1.5) - 0.5;
  const all = ez(f, tComes - 2, tComes + 4) * (1 - ez(f, ats[1] - 2, ats[1] + 10));
  const bright = lands.map((_, i) => Math.max(f >= tWhole - 2 && f < tComes + 2 ? Math.max(0, 1 - Math.abs(s - i) / 1.6) : 0, i <= N_PILE ? all * 0.7 : 0));
  const chip = ez(f, tComes - 2, tComes + 6);
  const tagAt = f >= ats[1] - 4 ? N_PILE + 1 : f >= ats[0] - 4 ? N_PILE : -1;
  const tagP = tagAt === N_PILE ? ez(f, ats[0] - 4, ats[0] + 2) : tagAt > 0 ? ez(f, ats[1] - 4, ats[1] + 2) : 0;
  const hands = slabHands(f, ats, N_PILE);
  const m = moodAt(f, [
    [0, "idle"],
    [tBetween + 2, "no"],
    [tWhole - 4, "think"],
    [ats[1] - 12, "idle"],
    [ats[1] + 6, "gotit"],
  ]);
  return (
    <>
      <Sfx name="whoosh" at={tWipe - 2} volume={0.22} />
      <Sfx name="error" at={tBetween} volume={0.1} />
      <Sfx name="click" at={ats[0] - 2} volume={0.28} />
      <Sfx name="scan" at={tWhole - 2} volume={0.22} />
      <Sfx name="pop" at={ats[1] - 2} volume={0.3} />
      <Stage cam={BENCH}>
        <Wall />
        <Host f={f} {...hands} {...m} />
        <Bench />
        <Desk />
        <Pile lands={lands} bright={bright} tagAt={tagAt} tagP={tagP} />
        <SwipeArc p={swipe} strike={strike} opacity={swipeO} x0={900} x1={PILE.x + PILE.w + 70} y={880} />
        <Chip text="WHOLE CHAT, EVERY TURN" x={PILE.x + PILE.w / 2 + 40} y={pileTop(N_PILE + 2) - 46} p={chip} color="#FFB547" size={22} />
      </Stage>
      <LessonHeader title="Not wiped between turns" size={72} />
      <Source text="Claude Docs, Context windows, 2026" />
    </>
  );
};
