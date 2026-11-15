import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, Source, useWord } from "../../../engine/kit";
import {
  ANSWER,
  ANSWER_X,
  AnswerRow,
  Bench as BenchObj,
  BENCH,
  CandidateFan,
  Host, moodAt,
  CLAUDE_REST,
  ez,
  lerp,
  lerpP,
  LoopArrow,
  QuestionCard,
  ReadSweep,
  sp,
  Stage,
  Wall,
  WordCard,
  WS,
  type P2,
} from "../../../workshop";
import { LessonHeader } from "./common";

const FAN_C: P2 = [640, 800];
const HANDS_UP = { left: [575, 818] as P2, right: [705, 818] as P2 };

/** Read → guess → add → repeat, at any frame `f` (the cover uses its peak). */
export const BenchView: React.FC<{ f: number; header?: boolean }> = ({ f, header = true }) => {
  const wf = useWord();
  const tReads = wf("bench", "reads");
  const tFarEnd = wf("bench", "far", 0, "end");
  const tPicks = wf("bench", "picks");
  const tAdds = wf("bench", "adds");
  const tGoes = wf("bench", "goes");
  const tAgain = wf("bench", "again");

  const ask = sp(f, 0, { damping: 16, stiffness: 140 });
  // the winner leaves the fan and drops into slot 3
  const pick = sp(f, tAdds - 4, { damping: 15, stiffness: 190 });
  const picked = f >= tAdds - 4;
  const fanOut = ez(f, tAdds + 2, tAdds + 10);
  const raise1 = ez(f, tPicks - 6, tPicks + 2) * (1 - ez(f, tAdds - 2, tAdds + 8));
  const raise2 = ez(f, tAgain - 2, tAgain + 6);
  const raise = Math.max(raise1, raise2);
  const hands = { left: lerpP(CLAUDE_REST.left, HANDS_UP.left, raise), right: lerpP(CLAUDE_REST.right, HANDS_UP.right, raise) };

  const from: P2 = [FAN_C[0] - 85, FAN_C[1] - 20];
  const to: P2 = [ANSWER_X[2], WS.benchTop + 2];
  const flyX = lerp(from[0], to[0], pick);
  const flyY = lerp(from[1], to[1], pick) - Math.sin(pick * Math.PI) * 40;
  const fresh = f < tAdds + 18;
  const m = moodAt(f, [
    [0, "idle"],
    [tReads, "think"],
    [tAdds, "gotit"],
    [tGoes, "think"],
    [tAgain + 4, "gotit"],
  ]);
  const loop = ez(f, tGoes - 2, tGoes + 14) * (1 - ez(f, tAgain + 4, tAgain + 12));

  return (
    <>
      <Stage cam={BENCH}>
        <Wall />
        <Host f={f} {...hands} {...m} />
        <BenchObj />
        <QuestionCard x={lerp(-300, 100, ask)} glow={ez(f, tReads, tReads + 6) * (1 - ez(f, tFarEnd - 6, tFarEnd))} />
        <AnswerRow placed={[1, 1, 0, 0]} amber={[0, 0, 0, 0]} ghost />
        {picked && <WordCard text="scatters" x={pick > 0.98 ? to[0] : flyX} y={flyY} size={36} state={fresh ? "amber" : "cream"} w={pick > 0.98 ? undefined : lerp(170, 200, pick)} />}
        <ReadSweep f={f} from={tReads} to={tFarEnd} />
        <ReadSweep f={f} from={tGoes} to={tGoes + 14} />
        <LoopArrow p={loop} cx={760} cy={740} r={56} opacity={loop > 0 ? 1 - ez(f, tAgain + 4, tAgain + 12) : 0} />
        {f < tAdds + 12 && <CandidateFan f={f} at={tPicks} words={["scatters", "is", "looks"]} odds={[0.86, 0.42, 0.27]} pick={pick} out={fanOut} center={FAN_C} />}
        {f >= tAgain && <CandidateFan f={f} at={tAgain + 2} words={["most", "the", "and"]} odds={[0.8, 0.38, 0.24]} center={FAN_C} />}
      </Stage>
      {header && <LessonHeader title="Read, guess, add, repeat" />}
    </>
  );
};

export const Bench: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const tReads = wf("bench", "reads");
  const tPicks = wf("bench", "picks");
  const tAdds = wf("bench", "adds");
  const tGoes = wf("bench", "goes");
  const tAgain = wf("bench", "again");
  return (
    <>
      <Sfx name="swoosh" at={0} volume={0.25} />
      <Sfx name="scan" at={tReads} volume={0.3} />
      <Sfx name="ticker" at={tPicks + 6} volume={0.2} dur={18} />
      <Sfx name="pop" at={tAdds + 2} volume={0.35} />
      <Sfx name="whoosh" at={tGoes - 2} volume={0.22} />
      <Sfx name="pop" at={tAgain + 2} volume={0.22} />
      <BenchView f={f} />
      <Source text="Anthropic, 2025" />
    </>
  );
};
