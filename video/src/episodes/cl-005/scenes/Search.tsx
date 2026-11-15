import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, Source, useWord } from "../../../engine/kit";
import { ANSWER, ANSWER_X, AnswerRow, Bench, Cabinet, Host, moodAt, ez, lerp, PageCard, placeAt, QuestionCard, sp, Stage, Wall, WIDE, WINDOW, WindowObj } from "../../../workshop";
import { Accent, LessonHeader, placingHands } from "./common";

const LAND = [
  { x: 772, y: 664, rot: -7 },
  { x: 838, y: 676, rot: 6 },
];

/** No answer drawer: the cabinet stays shut. Web search opens the window, but Claude still writes its own cards. */
export const Search: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const tStored = wf("search", "stored");
  const tWeb = wf("search", "web");
  const tWrites = wf("search", "writes");
  const tReply = wf("search", "reply");
  const tItself = wf("search", "itself");

  const open = ez(f, tStored - 2, tStored + 10) * (1 - ez(f, tStored + 24, tStored + 32));
  const strike = ez(f, tStored + 34, tStored + 44);
  const win = ez(f, tWeb - 2, tWeb + 12);
  const ats = [tWrites, tReply, tItself, tItself + 12];
  const placed = ats.map((at) => placeAt(f, at));
  const hands = placingHands(f, ats, ANSWER_X, ANSWER, placed.map((x) => x.p));
  const m = moodAt(f, [
    [0, "idle"],
    [tStored + 30, "unsure"],
    [tWeb, "idle"],
  ]);
  const look = 16 * ez(f, tWrites - 14, tWrites - 6) * (1 - ez(f, tWrites + 4, tWrites + 12));

  return (
    <>
      <Sfx name="swoosh" at={tStored - 2} volume={0.2} />
      <Sfx name="thud" at={tStored + 30} volume={0.5} />
      <Sfx name="swoosh" at={tWeb - 2} volume={0.32} />
      {ats.map((at, i) => (
        <Sfx key={i} name="pop" at={at - 1} volume={0.3} />
      ))}
      <Stage cam={WIDE}>
        <Wall />
        <WindowObj open={win} light={win} />
        <Cabinet open={open} strike={strike} />
        {LAND.map((l, k) => {
          const p = sp(f, tWeb + 6 + k * 5, { damping: 15, stiffness: 150 });
          if (p <= 0.001) return null;
          const sx = WINDOW.x + WINDOW.w / 2 - 60;
          const sy = WINDOW.y + 20;
          return <PageCard key={k} x={lerp(sx, l.x, p)} y={lerp(sy, l.y, p) - Math.sin(p * Math.PI) * 30} rot={l.rot * p} scale={0.5 + 0.5 * p} opacity={Math.min(1, p * 2)} />;
        })}
        <Host f={f} {...hands} look={look} {...m} />
        <Bench />
        <QuestionCard />
        <AnswerRow placed={placed.map((x) => x.p)} amber={placed.map((x) => x.amber)} ghost />
      </Stage>
      <LessonHeader title={<>No answer <Accent>drawer</Accent></>} />
      <Source text="Anthropic, 2025" />
    </>
  );
};
