import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, useWord } from "../../../engine/kit";
import { ANSWER, ANSWER_X, AnswerRow, Bench, Host, moodAt, ez, placeAt, QuestionCard, Stage, Wall, WIDE } from "../../../workshop";
import { Accent, LessonHeader, placingHands } from "./common";

/** Back to the hook's framing: the row clears and Claude writes it fresh, one card per word of "one guess at a time". */
export const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const tWritten = wf("outro", "written");
  const ats = [wf("outro", "one"), wf("outro", "guess"), wf("outro", "at"), wf("outro", "time")];
  const clear = ez(f, tWritten, tWritten + 10);
  const placed = ats.map((at) => placeAt(f, at, 8));
  const m = moodAt(f, [
    [0, "idle"],
    [ats[3] + 6, "gotit"],
  ]);
  const hands = placingHands(f, ats, ANSWER_X, ANSWER, placed.map((x) => x.p));
  return (
    <>
      <Sfx name="whoosh" at={tWritten} volume={0.22} />
      {ats.map((at, i) => (
        <Sfx key={i} name="pop" at={at - 1} volume={0.3} />
      ))}
      <Stage cam={WIDE}>
        <Wall />
        <Host f={f} {...hands} {...m} />
        <Bench />
        <QuestionCard />
        {clear < 1 && <AnswerRow placed={[1, 1, 1, 1].map(() => 1 - clear)} amber={[0, 0, 0, 0]} />}
        <AnswerRow placed={placed.map((x) => x.p)} amber={placed.map((x) => x.amber)} ghost={clear >= 1} />
      </Stage>
      <LessonHeader title={<>Written <Accent>fresh</Accent>, word by word</>} />
    </>
  );
};
