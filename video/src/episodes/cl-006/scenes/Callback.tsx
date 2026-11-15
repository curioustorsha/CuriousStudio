import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, useWord } from "../../../engine/kit";
import { ANSWER, ANSWER_X, AnswerRow, Bench, BENCH, Chip, ez, Host, mixCam, moodAt, placeAt, placingHands, QuestionCard, sp, Stage, Wall, WordCard, type Cam } from "../../../workshop";
import { LessonHeader, shiver } from "./common";

const START: Cam = { x: 560, y: 870, z: 1.32 };

/** The cracked answer row, drawn at any frame of `tiles` too (it slides off there). */
export const CrackedRow: React.FC<{ crack: number[]; shake?: number[]; dx?: number; opacity?: number }> = ({ crack, shake = [], dx = 0, opacity = 1 }) => (
  <>
    {ANSWER.map((w, i) => (
      <WordCard key={w} text={w} x={ANSWER_X[i] + dx * (1 + i * 0.12)} state="cream" crack={crack[i]} shake={shake[i] ?? 0} opacity={opacity} />
    ))}
  </>
);

/** Lesson 1 recap: Aster writes the answer word by word, then every card cracks: it doesn't read words. */
export const Callback: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const tLast = wf("callback", "last");
  const tWord = wf("callback", "word", 0);
  const tWordEnd = wf("callback", "word", 1, "end");
  const tDoesnt = wf("callback", "doesnt");
  const tWords = wf("callback", "words");
  const step = Math.max(6, Math.round((tWordEnd - tWord) / 3));
  const ats = [0, 1, 2, 3].map((k) => tWord + k * step);
  const placed = ats.map((at) => placeAt(f, at, 6));
  const hands = placingHands(f, ats, ANSWER_X, ANSWER, placed.map((x) => x.p));
  const crackAt = (i: number) => tWords + i * 3;
  const cracks = ANSWER.map((_, i) => ez(f, crackAt(i), crackAt(i) + 8));
  const shakes = ANSWER.map((_, i) => shiver(f, crackAt(i)));
  const done = f >= crackAt(0);
  const chip = sp(f, tLast, { damping: 13, stiffness: 210 }) * (1 - ez(f, tDoesnt - 6, tDoesnt + 2));
  // Lesson 1's push-in, reversed: start close on the row, pull back to the bench as the words go down.
  const cam = mixCam(START, BENCH, ez(f, 0, tWord + 6));
  const m = moodAt(f, [
    [0, "idle"],
    [ats[3] + 6, "gotit"],
    [tDoesnt, "no"],
    [tWords + 10, "unsure"],
  ]);
  return (
    <>
      {ats.map((at, i) => (
        <Sfx key={i} name="pop" at={at - 1} volume={0.3} />
      ))}
      <Sfx name="crack" at={tWords} volume={0.55} />
      <Sfx name="pop" at={tLast} volume={0.2} />
      <Stage cam={cam}>
        <Wall />
        <Host f={f} {...(done ? {} : hands)} {...m} />
        <Bench />
        <QuestionCard />
        {done ? <CrackedRow crack={cracks} shake={shakes} /> : <AnswerRow placed={placed.map((x) => x.p)} amber={placed.map((x) => x.amber)} ghost />}
        <Chip text="LESSON 1" x={560} y={760} p={chip} />
      </Stage>
      <LessonHeader title="Not even words" />
    </>
  );
};
