import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, Source, useWord } from "../../../engine/kit";
import {
  Bench,
  BENCH,
  BenchLabel,
  Chip,
  CLAUDE_REST,
  CutLine,
  ez,
  Host,
  lerp,
  moodAt,
  pointHands,
  QuestionCard,
  sp,
  Stage,
  tileH,
  tileW,
  tileXs,
  TokenTile,
  Wall,
  WordCard,
  WS,
  type P2,
} from "../../../workshop";
import { CrackedRow } from "./Callback";
import { LessonHeader } from "./common";

const SIZE = 30;
const GAP = 10;
export const Q_TILES = ["Why", "is", "the", "sky", "blue", "?"];
export const Q_X = tileXs(Q_TILES, 150, GAP, SIZE);
const qCx = (i: number) => Q_X[i] + tileW(Q_TILES[i], SIZE) / 2;
const Q_MID = (Q_X[0] + Q_X[5] + tileW("?", SIZE)) / 2;
const SC_X = 690;
const SC_TILES = ["scat", "ters"];
const SC_XS = [682, 682 + tileW("scat", SIZE) + GAP];
const SC_MID = (SC_XS[0] + SC_XS[1] + tileW("ters", SIZE)) / 2;
const CHIP_Y = WS.benchTop - tileH(SIZE) - 96;

/** The question cut into tiles, at rest (used by later scenes). */
export const QuestionTiles: React.FC<{ opacity?: number; blank?: number }> = ({ opacity = 1, blank = 0 }) => (
  <>
    {Q_TILES.map((w, i) => (
      <TokenTile key={i} text={w} x={Q_X[i]} size={SIZE} opacity={opacity} blank={blank} />
    ))}
  </>
);

/** Text is cut into tokens: the question card drops into tiles; then a word, part of a word, one character. */
export const Tiles: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const tCut = wf("tiles", "cut");
  const tTokens = wf("tiles", "token", 0);
  const tWord = wf("tiles", "word", 0);
  const tPart = wf("tiles", "part");
  const tWord2 = wf("tiles", "word", 1);
  const tOne = wf("tiles", "one");
  const tChar = wf("tiles", "character");

  const rowOff = ez(f, 0, 16);
  const cutX = lerp(100, 314, ez(f, tCut - 2, tCut + 10));
  const cutO = f >= tCut - 2 ? 1 - ez(f, tCut + 10, tCut + 16) : 0;
  const cardO = 1 - ez(f, tCut + 8, tCut + 12);
  const drops = Q_TILES.map((_, i) => sp(f, tCut + 9 + i * 2, { damping: 14, stiffness: 210 }));
  const from: P2 = [207, WS.benchTop - 40];

  const pTok = sp(f, tTokens - 2, { damping: 13, stiffness: 210 }) * (1 - ez(f, tWord - 8, tWord - 2));
  const pWord = sp(f, tWord - 4, { damping: 13, stiffness: 210 }) * (1 - ez(f, tPart, tPart + 6));
  const pIn = sp(f, tPart - 10, { damping: 16, stiffness: 160 });
  const split = sp(f, tWord2 - 3, { damping: 14, stiffness: 200 });
  const pPart = split * (1 - ez(f, tOne - 4, tOne + 2));
  const pChar = sp(f, tOne - 3, { damping: 13, stiffness: 210 }) * (1 - ez(f, tChar + 22, tChar + 30));
  const liftOf = (i: number) => (i === 3 ? 46 * pWord : i === 5 ? 46 * pChar : 0);

  // which thing Aster points at
  const target: P2 | null =
    f >= tOne - 8 ? [qCx(5), CHIP_Y + 30] : f >= tPart - 8 ? [SC_MID, CHIP_Y + 30] : f >= tWord - 8 ? [qCx(3), CHIP_Y + 30] : f >= tTokens - 8 ? [Q_MID, CHIP_Y] : null;
  const pw = target ? ez(f, tTokens - 8, tTokens - 2) * (1 - ez(f, tChar + 14, tChar + 24)) : 0;
  const hands = target ? pointHands(target, pw) : CLAUDE_REST;
  const m = moodAt(f, [
    [0, "idle"],
    [tCut, "think"],
    [tTokens, "idle"],
    [tChar + 10, "gotit"],
  ]);
  const scSplit = SC_TILES.map((w, i) => lerp(SC_X + (i ? tileW("scat", SIZE) : 0), SC_XS[i], split));

  return (
    <>
      <Sfx name="whoosh" at={0} volume={0.2} />
      <Sfx name="scan" at={tCut - 2} volume={0.3} />
      {Q_TILES.map((_, i) => (
        <Sfx key={i} name="click" at={tCut + 11 + i * 2} volume={0.22} />
      ))}
      <Sfx name="pop" at={tTokens - 2} volume={0.3} />
      <Sfx name="pop" at={tWord - 4} volume={0.3} />
      <Sfx name="swoosh" at={tPart - 10} volume={0.22} />
      <Sfx name="crack" at={tWord2 - 3} volume={0.3} />
      <Sfx name="pop" at={tWord2 - 1} volume={0.25} />
      <Sfx name="pop" at={tOne - 3} volume={0.3} />
      <Stage cam={BENCH}>
        <Wall />
        <Host f={f} {...hands} {...m} />
        <Bench />
        {rowOff < 1 && <CrackedRow crack={[1, 1, 1, 1]} dx={rowOff * 800} opacity={1 - ez(f, 6, 16)} />}
        {cardO > 0 && <QuestionCard opacity={cardO} />}
        {Q_TILES.map((w, i) => {
          const d = drops[i];
          if (d <= 0.001) return null;
          return (
            <TokenTile
              key={i}
              text={w}
              size={SIZE}
              x={lerp(from[0] - tileW(w, SIZE) / 2, Q_X[i], Math.min(1, d))}
              y={lerp(from[1], WS.benchTop + 2, Math.min(1, d))}
              lift={liftOf(i)}
              opacity={Math.min(1, d * 3)}
            />
          );
        })}
        <CutLine x={cutX} y0={WS.benchTop - 140} y1={WS.benchTop + 6} opacity={cutO} />
        {/* scatters slides in from the right, then splits into two tiles */}
        {pIn > 0.01 && split < 0.05 && <WordCard text="scatters" x={lerp(1150, SC_X, pIn)} state="cream" />}
        {split >= 0.05 &&
          SC_TILES.map((w, i) => <TokenTile key={w} text={w} size={SIZE} x={scSplit[i]} lift={14 * pPart} opacity={Math.min(1, split * 4)} />)}
        <BenchLabel text="EXAMPLE SPLIT" cx={Q_MID} opacity={ez(f, tCut + 20, tCut + 30)} />
        <BenchLabel text="EXAMPLE SPLIT" cx={SC_MID} opacity={ez(f, tWord2 + 4, tWord2 + 14)} />
        <Chip text="TOKENS" x={Q_MID} y={CHIP_Y} p={pTok} color="#FFB547" />
        <Chip text="WORD" x={qCx(3)} y={CHIP_Y - 10} p={pWord} />
        <Chip text="PART OF A WORD" x={SC_MID} y={CHIP_Y - 10} p={pPart} />
        <Chip text="ONE CHARACTER" x={qCx(5)} y={CHIP_Y - 10} p={pChar} />
      </Stage>
      <LessonHeader title="Cut into tokens" />
      <Source text="Claude Docs glossary, 2026" />
    </>
  );
};
