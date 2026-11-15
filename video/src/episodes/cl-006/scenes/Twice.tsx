import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, Source, useWord } from "../../../engine/kit";
import { Bench, BENCH, cardH, cardW, Chip, ez, Host, LetterRow, moodAt, placeAt, placingHands, QuestionCard, sp, Stage, Wall, WordCard, WS } from "../../../workshop";
import { LessonHeader } from "./common";

const TWO_X = 430;
const R_IDX = [2, 7, 8];

/** "It said two": the 2024 answer on the bench, struck; strawberry spelled out with its three r's counted. Any frame `f` (the cover uses its peak). */
export const TwiceView: React.FC<{ f: number; header?: boolean }> = ({ f, header = true }) => {
  const wf = useWord();
  const t2024 = wf("twice", "2024");
  const tSaid = wf("twice", "said");
  const tTwo = wf("twice", "two");
  const tIt = wf("twice", "it");
  const tThree = wf("twice", "three");

  const chip = sp(f, t2024, { damping: 13, stiffness: 210 });
  const two = placeAt(f, tTwo, 10);
  const hands = placingHands(f, [tTwo], [TWO_X], ["two"], [two.p]);
  const grey = f >= tThree;
  const strike = ez(f, tThree, tThree + 8);
  const appear = "strawberry".split("").map((_, i) => sp(f, tIt - 2 + i * 1.5, { damping: 14, stiffness: 230 }));
  const under = "strawberry".split("").map((_, i) => {
    const k = R_IDX.indexOf(i);
    return k < 0 ? 0 : ez(f, tThree + k * 6, tThree + k * 6 + 6);
  });
  const counts = "strawberry".split("").map((_, i) => (R_IDX.includes(i) ? String(R_IDX.indexOf(i) + 1) : ""));
  const m = moodAt(f, [
    [0, "idle"],
    [tTwo + 10, "gotit"],
    [tThree, "unsure"],
  ]);
  const w = cardW("two");
  const h = cardH();
  return (
    <>
      <Stage cam={BENCH}>
        <Wall />
        <Host f={f} {...hands} {...m} />
        <Bench />
        <QuestionCard text="How many r's in strawberry?" w={300} />
        {f >= tSaid - 4 && two.p <= 0.001 && <WordCard text="two" x={TWO_X} state="ghost" opacity={ez(f, tSaid - 4, tSaid + 4)} />}
        {two.p > 0.001 && (
          <WordCard text="two" x={TWO_X} y={WS.benchTop + 2 - (1 - Math.min(1, two.p)) * 90} state={grey ? "grey" : two.amber ? "amber" : "cream"} opacity={Math.min(1, two.p * 2.5)} />
        )}
        {strike > 0 && (
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            <line x1={TWO_X - 10} y1={WS.benchTop - h + 10} x2={TWO_X - 10 + (w + 20) * strike} y2={WS.benchTop - h + 10 + (h - 20) * strike} stroke="#C9CDD4" strokeWidth={8} strokeLinecap="round" />
          </svg>
        )}
        <Chip text="2024" x={200} y={600} p={chip} />
        {f >= tIt - 2 && <LetterRow text="strawberry" cx={540} y={700} size={50} cell={64} gap={6} boxed appear={appear} under={under} counts={counts} />}
      </Stage>
      {header && <LessonHeader title="It said two" />}
    </>
  );
};

export const Twice: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const t2024 = wf("twice", "2024");
  const tTwo = wf("twice", "two");
  const tThree = wf("twice", "three");
  return (
    <>
      <Sfx name="pop" at={t2024} volume={0.3} />
      <Sfx name="pop" at={tTwo - 1} volume={0.32} />
      <Sfx name="error" at={tThree} volume={0.18} />
      {[0, 1, 2].map((k) => (
        <Sfx key={k} name="ding" at={tThree + k * 6} volume={0.16 + k * 0.05} />
      ))}
      <TwiceView f={f} />
      <Source text="TechCrunch, Aug 2024" />
    </>
  );
};
