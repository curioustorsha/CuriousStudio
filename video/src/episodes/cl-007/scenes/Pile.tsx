import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, Source, useWord } from "../../../engine/kit";
import { Bench, BENCH, Chip, CLAUDE_REST, Desk, ez, FileDoc, Host, lerp, moodAt, Pile as SlabPile, PILE, PILE_KINDS, pileTop, pointHands, ReplyCard, Stage, Wall, WS, QuestionCard } from "../../../workshop";
import { OBJ } from "./Hook";
import { OnitRest } from "./Onit";
import { LessonHeader, slabLand } from "./common";

/** Landing frames of the pile's 9 slabs (scene-local). */
export const pileAts = (wf: (id: string, w: string, n?: number, e?: "start" | "end") => number) => {
  const tReport = wf("pile", "report", 0);
  const tEvery = wf("pile", "every");
  const tTop = wf("pile", "top", 0, "end");
  const step = Math.max(6, (tTop - tEvery) / 5.5);
  return [tReport + 6, tReport + 9, tReport + 12, ...[0, 1, 2, 3, 4, 5].map((k) => Math.round(tEvery + 2 + k * step))];
};

/** Aster points at each of its own (cream) slabs as it lands. */
export const slabHands = (f: number, ats: number[], from = 0) => {
  const kinds = PILE_KINDS(from + ats.length);
  for (let k = ats.length - 1; k >= 0; k--) {
    const i = from + k;
    if (kinds[i] !== "claude") continue;
    const at = ats[k];
    if (f >= at - 12 && f <= at + 8) return pointHands([PILE.x + PILE.w - 30, pileTop(i + 1) - 10], ez(f, at - 12, at - 6) * (1 - ez(f, at + 2, at + 8)));
  }
  return { ...CLAUDE_REST };
};

/** Share a report and ask three questions: the report lands first, then every question and answer piles on top. */
export const Pile: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const tReport = wf("pile", "report", 0);
  const tThree = wf("pile", "three");
  const tFirst = wf("pile", "first");
  const ats = pileAts(wf);
  const lands = ats.map((a) => slabLand(f, a));
  const clear = ez(f, 0, 12);
  // the document slides to the pile spot and flattens into the bundle
  const go = ez(f, tReport - 4, tReport + 8);
  const fileO = 1 - ez(f, tReport + 6, tReport + 12);
  const flash = ez(f, tFirst - 2, tFirst + 4) * (1 - ez(f, tFirst + 10, tFirst + 20));
  const bright = lands.map((_, i) => (i < 3 ? flash : 0));
  const x3 = ez(f, tThree - 2, tThree + 6) * (1 - ez(f, ats[3] - 10, ats[3] - 4));
  const first = ez(f, tFirst - 2, tFirst + 6) * (1 - ez(f, ats[3] - 6, ats[3]));
  // tag beside the newest Q/A slab
  let tagAt = -1;
  let tagP = 0;
  for (let k = ats.length - 1; k >= 3; k--) {
    if (f >= ats[k] - 4) {
      tagAt = k;
      tagP = ez(f, ats[k] - 4, ats[k] + 2);
      break;
    }
  }
  const hands = slabHands(f, ats);
  const m = moodAt(f, [
    [0, "idle"],
    [ats[8] + 8, "gotit"],
  ]);
  return (
    <>
      <Sfx name="thud" at={tReport + 6} volume={0.3} />
      <Sfx name="pop" at={tThree} volume={0.22} />
      {ats.slice(3).map((a, k) => (
        <Sfx key={k} name={k % 2 ? "pop" : "click"} at={a - 2} volume={0.25} />
      ))}
      <Stage cam={BENCH}>
        <Wall />
        <Host f={f} {...hands} {...m} />
        <Bench />
        <Desk />
        {clear < 1 && (
          <>
            <QuestionCard x={OBJ.q - clear * 420} opacity={1 - clear} text="Sum up this report" />
            <ReplyCard x={OBJ.reply} opacity={1 - clear} scale={1 - 0.2 * clear} />
            <OnitRest out={clear} />
          </>
        )}
        {fileO > 0 && (
          <FileDoc x={lerp(OBJ.file, PILE.x + 70, go)} y={WS.benchTop + 2} opacity={fileO} scale={1 - 0.35 * go} />
        )}
        <SlabPile lands={lands} bright={bright} tagAt={tagAt} tagP={tagP} />
        <Chip text="3 QUESTIONS" x={PILE.x + PILE.w / 2} y={850} p={x3} color="#FFB547" size={22} />
        <Chip text="1st" x={PILE.x + PILE.w + 50} y={pileTop(2) + 6} p={first} size={22} />
      </Stage>
      <LessonHeader title="It piles up" />
      <Source text="Claude Docs, Context windows, 2026" />
    </>
  );
};
