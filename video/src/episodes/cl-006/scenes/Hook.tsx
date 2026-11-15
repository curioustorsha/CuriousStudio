import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, useWord } from "../../../engine/kit";
import { Bench, ez, Host, LetterRow, moodAt, sp, Stage, Wall, WIDE, WordCard, WS } from "../../../workshop";
import { LessonHeader, shiver, STRAW, STRAW_X } from "./common";

export const HookHeader: React.FC<{ opacity?: number }> = ({ opacity }) => <LessonHeader opacity={opacity} title="Not letter by letter" />;

const ROW_Y = 790;

/** The hook at any frame `f` (also the loop frame the sign-off fades back to: empty bench at f = 0). */
export const HookView: React.FC<{ f: number; header?: boolean; dim?: number }> = ({ f, header = true, dim = 1 }) => {
  const wf = useWord();
  const tStraw = wf("hook", "strawberry");
  const tL1 = wf("hook", "letter", 0);
  const tL2 = wf("hook", "letter", 1);
  const tL2end = wf("hook", "letter", 1, "end");
  const tReads = wf("hook", "read", 1);

  const drop = sp(f, tStraw - 6, { damping: 12, stiffness: 200 });
  // letters lift out of the card, one cell each, then snap back in
  const appear = STRAW.text.split("").map((_, i) => sp(f, tL1 - 8 + i, { damping: 14, stiffness: 230 }));
  const read = f >= tL1 && f < tL2end ? Math.min(9.99, ((f - tL1) / (tL2end - tL1)) * 10) : -1;
  const gather = ez(f, tL2end + 1, tL2end + 9);
  const crack = ez(f, tReads, tReads + 8);
  const shake = shiver(f, tReads);
  const m = moodAt(f, [
    [0, "idle"],
    [tL2, "no"],
    [tReads + 6, "unsure"],
  ]);
  return (
    <>
      <Stage cam={WIDE} dim={dim}>
        <Wall />
        <Host f={f} {...m} />
        <Bench />
        {drop > 0.001 && (
          <WordCard text={STRAW.text} x={STRAW_X} y={WS.benchTop + 2 - (1 - Math.min(1, drop)) * 260} size={STRAW.size} opacity={Math.min(1, drop * 3)} crack={crack} shake={shake} />
        )}
        {f >= tL1 - 8 && gather < 1 && <LetterRow text={STRAW.text} cx={540} y={ROW_Y} boxed appear={appear} read={read} gather={gather} gatherTo={[540, WS.benchTop - 50]} />}
      </Stage>
      {header && <HookHeader />}
    </>
  );
};

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const tStraw = wf("hook", "strawberry");
  const tL1 = wf("hook", "letter", 0);
  const tL2end = wf("hook", "letter", 1, "end");
  const tReads = wf("hook", "read", 1);
  return (
    <>
      <Sfx name="thud" at={tStraw - 2} volume={0.3} />
      <Sfx name="ticker" at={tL1} volume={0.2} dur={tL2end - tL1} />
      <Sfx name="swoosh" at={tL2end} volume={0.28} />
      <Sfx name="crack" at={tReads} volume={0.55} />
      <HookView f={f} />
    </>
  );
};
