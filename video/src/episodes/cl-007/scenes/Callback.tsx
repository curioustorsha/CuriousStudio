import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, useWord } from "../../../engine/kit";
import { Bench, BENCH, BenchLabel, Chip, CutLine, ez, Host, lerp, moodAt, QuestionCard, sp, Stage, tileW, TokenTile, Wall, WS } from "../../../workshop";
import { cloudPos, LessonHeader, Q_TILES, Q_X, T_SIZE } from "./common";

const CARD_W = 300;
const CARD_X = 560 - CARD_W / 2;
const ROW_MID = (Q_X[0] + Q_X[5] + tileW("?", T_SIZE)) / 2;

/** Lesson 2 recap: the question cracks into tiles, then the tiles lift and float: where do they go? */
export const Callback: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const tLast = wf("callback", "last");
  const tTokens = wf("callback", "tokens");
  const tSit = wf("callback", "sit");

  const chip = sp(f, tLast, { damping: 13, stiffness: 210 }) * (1 - ez(f, tTokens + 14, tTokens + 22));
  const cutX = lerp(CARD_X - 10, CARD_X + CARD_W + 10, ez(f, tTokens - 4, tTokens + 8));
  const cutO = f >= tTokens - 4 ? 1 - ez(f, tTokens + 8, tTokens + 14) : 0;
  const cardO = 1 - ez(f, tTokens + 6, tTokens + 10);
  const drops = Q_TILES.map((_, i) => sp(f, tTokens + 7 + i * 2, { damping: 14, stiffness: 210 }));
  const lift = Q_TILES.map((_, i) => sp(f, tSit - 4 + i * 2, { damping: 16, stiffness: 120 }));
  const m = moodAt(f, [
    [0, "idle"],
    [tTokens, "think"],
    [tSit + 4, "unsure"],
  ]);
  return (
    <>
      <Sfx name="pop" at={tLast} volume={0.25} />
      <Sfx name="scan" at={tTokens - 4} volume={0.28} />
      {Q_TILES.map((_, i) => (
        <Sfx key={i} name="click" at={tTokens + 9 + i * 2} volume={0.2} />
      ))}
      <Sfx name="swoosh" at={tSit - 2} volume={0.2} />
      <Stage cam={BENCH}>
        <Wall />
        <Host f={f} {...m} />
        <Bench />
        {cardO > 0 && <QuestionCard x={CARD_X} w={CARD_W} opacity={cardO} />}
        {Q_TILES.map((w, i) => {
          const d = drops[i];
          if (d <= 0.001) return null;
          const [cx, cy] = cloudPos(i, f);
          const fromX = CARD_X + 40 + i * 30;
          const x = lerp(lerp(fromX, Q_X[i], Math.min(1, d)), cx, lift[i]);
          const y = lerp(lerp(WS.benchTop - 40, WS.benchTop + 2, Math.min(1, d)), cy, lift[i]);
          return <TokenTile key={i} text={w} size={T_SIZE} x={x} y={y} opacity={Math.min(1, d * 3)} />;
        })}
        <CutLine x={cutX} y0={WS.benchTop - 140} y1={WS.benchTop + 6} opacity={cutO} />
        <BenchLabel text="EXAMPLE SPLIT" cx={ROW_MID} opacity={ez(f, tTokens + 18, tTokens + 26) * (1 - ez(f, tSit, tSit + 8))} />
        <Chip text="LESSON 2" x={560} y={760} p={chip} />
      </Stage>
      <LessonHeader title="Where do tokens go?" />
    </>
  );
};
