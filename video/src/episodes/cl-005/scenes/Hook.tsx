import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, useWord } from "../../../engine/kit";
import { ANSWER, ANSWER_X, AnswerRow, Bench, Host, moodAt, ez, placeAt, QuestionCard, SearchBox, Stage, Wall, WIDE } from "../../../workshop";
import { Accent, LessonHeader, placingHands } from "./common";

export const HookHeader: React.FC<{ opacity?: number }> = ({ opacity }) => (
  <LessonHeader opacity={opacity} title={<>Not a <Accent>search engine</Accent></>} />
);

/** The hook at any frame `f` (also the loop frame the sign-off fades back to). */
export const HookView: React.FC<{ f: number }> = ({ f }) => {
  const wf = useWord();
  const tSearch = wf("hook", "search");
  const tEngineEnd = wf("hook", "engine", 0, "end");
  const ats = [wf("hook", "guessing"), wf("hook", "next"), wf("hook", "over", 0), wf("hook", "over", 1)];
  const placed = ats.map((at) => placeAt(f, at));
  const blink = f >= tSearch && f < tSearch + 12 ? Math.sin(((f - tSearch) / 12) * Math.PI * 2) ** 2 : 0;
  const fold = ez(f, tEngineEnd - 4, tEngineEnd + 14);
  const hands = placingHands(f, ats, ANSWER_X, ANSWER, placed.map((x) => x.p));
  const m = moodAt(f, [
    [0, "idle"],
    [wf("hook", "engine", 0, "end") + 2, "no"],
    [ats[3] + 8, "gotit"],
  ]);
  return (
    <>
      <Stage cam={WIDE}>
        <Wall />
        <Host f={f} {...hands} {...m} />
        <Bench />
        <QuestionCard />
        <AnswerRow placed={placed.map((x) => x.p)} amber={placed.map((x) => x.amber)} ghost />
        {fold < 1 && <SearchBox blink={blink} fold={fold} />}
      </Stage>
      <HookHeader />
    </>
  );
};

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const ats = [wf("hook", "guessing"), wf("hook", "next"), wf("hook", "over", 0), wf("hook", "over", 1)];
  return (
    <>
      <Sfx name="swoosh" at={wf("hook", "engine", 0, "end") - 4} volume={0.35} />
      {ats.map((at, i) => (
        <Sfx key={i} name="pop" at={at - 1} volume={0.32} />
      ))}
      <HookView f={f} />
    </>
  );
};
