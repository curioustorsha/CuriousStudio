import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, Source, useWord } from "../../../engine/kit";
import { Bench, BENCH, Host, HOST_C, moodAt, ez, Lens, sp, Stage, Wall, WordCard, WS } from "../../../workshop";
import { Accent, LessonHeader } from "./common";
import { END_X, R2_SIZE, Row1, ROW2, ROW2_X } from "./rhyme";

/** It plans: a lens looks inside Claude, and "rabbit" is pinned at the end of line 2 before the line is written. */
export const Rabbit: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const tPlans = wf("rabbit", "plans");
  const tAnth = wf("rabbit", "anthropic");
  const tLooked = wf("rabbit", "looked");
  const tWriting = wf("rabbit", "writing");
  const tRabbit = wf("rabbit", "rabbit");
  const tBefore = wf("rabbit", "before");
  const fills = ROW2.slice(0, 6).map((_, i) => tBefore + 2 + i * 4);

  const slots = ez(f, tPlans - 4, tPlans + 8);
  const anth = sp(f, tAnth - 2, { damping: 16, stiffness: 150 });
  const lens = sp(f, tLooked - 2, { damping: 14, stiffness: 140 }) * (1 - ez(f, tBefore - 2, tBefore + 8));
  const dot = 0.35 * ez(f, tWriting, tWriting + 10) + 0.65 * ez(f, tRabbit - 6, tRabbit + 2);
  const bright = ez(f, tWriting, tWriting + 10);
  const m = moodAt(f, [
    [0, "idle"],
    [tLooked, "think"],
    [tRabbit, "gotit"],
  ]);
  const pin = sp(f, tRabbit - 2, { damping: 11, stiffness: 220 });

  return (
    <>
      <Sfx name="whoosh" at={tPlans - 4} volume={0.18} />
      <Sfx name="scan" at={tLooked - 2} volume={0.25} />
      <Sfx name="ding" at={tRabbit} volume={0.4} />
      {fills.map((at, i) => (
        <Sfx key={i} name="pop" at={at} volume={0.18} />
      ))}
      <Stage cam={BENCH}>
        <Wall />
        <Host f={f} {...m} />
        <Lens c={HOST_C} p={lens} dot={dot} />
        <Bench />
        <Row1 bright={bright} />
        {ROW2.map((w, i) => {
          if (i === 6) {
            return pin > 0.01 ? (
              <WordCard key={w} text={w} x={END_X} size={R2_SIZE} state="pinned" scale={0.6 + 0.4 * pin} opacity={Math.min(1, pin * 2)} y={WS.benchTop + 2 - (1 - Math.min(1, pin)) * 50} />
            ) : (
              <WordCard key={w} text={w} x={END_X} size={R2_SIZE} state="ghost" opacity={slots} />
            );
          }
          const p = sp(f, fills[i], { damping: 14, stiffness: 230 });
          return p > 0.01 ? (
            <WordCard key={w} text={w} x={ROW2_X[i]} size={R2_SIZE} state="cream" opacity={Math.min(1, p * 2)} y={WS.benchTop + 2 - (1 - Math.min(1, p)) * 50} />
          ) : (
            <WordCard key={w} text={w} x={ROW2_X[i]} size={R2_SIZE} state="ghost" opacity={slots} />
          );
        })}
      </Stage>
      <LessonHeader anthropic={anth} title={<>It plans the <Accent>rhyme</Accent></>} />
      <Source text="Anthropic, 2025 · Claude 3.5 Haiku" />
    </>
  );
};
