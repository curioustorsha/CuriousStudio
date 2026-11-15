import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, useWord } from "../../../engine/kit";
import { ANSWER, ANSWER_X, Bench, BENCH, Host, moodAt, type Mood, ez, mixCam, QuestionCard, Stage, Wall, WordCard, type Cam } from "../../../workshop";
import { LessonHeader } from "./common";

export const CLOSE: Cam = { x: ANSWER_X[3] + 56, y: 880, z: 1.9 };

/** The finished row with the last card, cracked or not. Shared with the next-lesson card. */
export const CrackView: React.FC<{ f: number; push: number; crack: number; shake?: number; dim?: number; m?: { mood: Mood; at: number } }> = ({ f, push, crack, shake = 0, dim = 1, m }) => (
  <Stage cam={mixCam(BENCH, CLOSE, push)} dim={dim}>
    <Wall />
    <Host f={f} {...m} />
    <Bench />
    <QuestionCard />
    {ANSWER.map((w, i) => (
      <WordCard key={w} text={w} x={ANSWER_X[i]} state="cream" crack={i === 3 ? crack : 0} shake={i === 3 ? shake : 0} />
    ))}
  </Stage>
);

/** "But Claude doesn't even read words": push in on the last card, a hairline crack runs through it. */
export const Tease: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const tWords = wf("tease", "words");
  const push = ez(f, 0, wf("tease", "even"));
  const crack = ez(f, tWords, tWords + 8);
  const shake = f >= tWords && f < tWords + 14 ? Math.sin((f - tWords) * 2.4) * 5 * (1 - (f - tWords) / 14) : 0;
  return (
    <>
      <Sfx name="whoosh" at={0} volume={0.2} />
      <Sfx name="crack" at={tWords} volume={0.6} />
      <CrackView f={f} push={push} crack={crack} shake={shake} m={moodAt(f, [[0, "idle"], [tWords, "unsure"]])} />
      <LessonHeader title="Not even words?" />
    </>
  );
};
