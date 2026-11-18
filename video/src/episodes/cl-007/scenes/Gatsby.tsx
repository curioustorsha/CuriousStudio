import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, Source, useWord } from "../../../engine/kit";
import { Bench, BENCH, BenchLabel, Book, Chip, Desk, ez, Host, moodAt, Pile, sp, Stage, Wall } from "../../../workshop";
import { landed, LessonHeader, N_KEEPS } from "./common";

const BOOK_X = 690;
const HIT = 6;

/** 2023: all of The Great Gatsby on an early Claude's desk, one line changed, found in 22 seconds. */
export const Gatsby: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const t2023 = wf("gatsby", "2023");
  const tAnthropic = wf("gatsby", "anthropic");
  const tGatsby = wf("gatsby", "gatsby");
  const tChanged = wf("gatsby", "changed", 0);
  const tLine = wf("gatsby", "line");
  const tFound = wf("gatsby", "found");
  const tTwenty = wf("gatsby", "twenty");
  const tSeconds = wf("gatsby", "seconds");

  const pileDim = ez(f, 0, 14);
  const date = sp(f, t2023, { damping: 13, stiffness: 210 });
  const anth = ez(f, tAnthropic - 4, tAnthropic + 10);
  const drop = sp(f, tGatsby - 6, { damping: 12, stiffness: 200 });
  const label = ez(f, tGatsby + 6, tGatsby + 16);
  const open = ez(f, tChanged - 2, tChanged + 14);
  const hitP = ez(f, tLine - 2, tLine + 6);
  const readEnd = tTwenty - 4;
  const read = f >= tFound - 2 && f < readEnd + 4 ? Math.min(HIT, ez(f, tFound - 2, readEnd) * HIT) : -1;
  const lens = sp(f, readEnd, { damping: 11, stiffness: 240 });
  const timerP = sp(f, tTwenty - 4, { damping: 13, stiffness: 210 });
  const n = Math.round(22 * ez(f, tTwenty - 2, tSeconds + 4));
  const done = f >= tSeconds + 4;
  const m = moodAt(f, [
    [0, "idle"],
    [tFound - 4, "think"],
    [readEnd + 2, "gotit"],
  ]);
  return (
    <>
      <Sfx name="pop" at={t2023} volume={0.25} />
      <Sfx name="thud" at={tGatsby + 2} volume={0.35} />
      <Sfx name="swoosh" at={tChanged - 2} volume={0.22} />
      <Sfx name="scan" at={tFound - 2} volume={0.18} />
      <Sfx name="ding" at={readEnd + 2} volume={0.3} />
      <Sfx name="ticker" at={tTwenty - 2} volume={0.18} dur={tSeconds + 6 - tTwenty} />
      <Stage cam={BENCH}>
        <Wall />
        <Host f={f} {...m} />
        <Bench />
        <Desk />
        <Pile lands={landed(N_KEEPS)} opacity={1 - 0.7 * pileDim} dx={-20 * pileDim} />
        {drop > 0.001 && <Book cx={BOOK_X} drop={drop} open={open} hit={HIT} hitP={hitP} read={read} lens={lens} />}
        <BenchLabel text="CLAUDE INSTANT · 72K TOKENS" cx={BOOK_X} opacity={label} />
        <Chip text="2023" x={300} y={590} p={date} />
        <Chip text={`${n} s`} x={330} y={756} p={timerP} color={done ? "#FFB547" : undefined} size={34} />
      </Stage>
      <LessonHeader title="One changed line" anthropic={anth} />
      <Source text="Anthropic, May 2023" />
    </>
  );
};
