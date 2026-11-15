import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, Source, useWord } from "../../../engine/kit";
import { Bench, BENCH, BenchLabel, Chip, ez, Host, lerp, moodAt, sp, Stage, tileW, TokenTile, Wall, WordCard, WS } from "../../../workshop";
import { LessonHeader, STRAW, STRAW_X } from "./common";

const SIZE = 38;
const ONE_X = 110;
const ONE_CX = ONE_X + tileW("strawberry", SIZE) / 2;
const FEW_XS = [520, 520 + tileW("straw", SIZE) + 12];
const FEW_CX = (FEW_XS[0] + FEW_XS[1] + tileW("berry", SIZE)) / 2;
// letter indices of the r's: strawberry s-t-r-a-w-b-e-r-r-y; straw s-t-r-a-w; berry b-e-r-r-y
const R_ONE = [2, 7, 8];
const R_STRAW = [2];
const R_BERRY = [2, 3];

/** Strawberry as one tile, or as a few: either way the r's are inside a tile, and the faces go blank. */
export const Strawberry: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const tOne = wf("strawberry", "one");
  const tFew = wf("strawberry", "few");
  const tEither = wf("strawberry", "either");
  const tRs = wf("strawberry", "rs");
  const tHide = wf("strawberry", "hide");
  const tInside = wf("strawberry", "inside");

  const slide = sp(f, tOne - 8, { damping: 18, stiffness: 170 });
  const cardO = 1 - ez(f, tOne - 1, tOne + 5);
  const oneP = sp(f, tOne - 1, { damping: 12, stiffness: 220 });
  const fewP = [0, 1].map((k) => sp(f, tFew - 4 + k * 3, { damping: 13, stiffness: 210 }));
  const chipsOut = 1 - ez(f, tEither - 4, tEither + 4);
  const bright = f >= tEither ? Math.sin(ez(f, tEither, tEither + 20) * Math.PI) : 0;
  const blank = ez(f, tInside, tInside + 12);
  const glow = ez(f, tRs - 2, tRs + 4) * (1 - blank);
  const m = moodAt(f, [
    [0, "think"],
    [tHide, "unsure"],
  ]);
  const lab = ez(f, tFew + 6, tFew + 16);
  return (
    <>
      <Sfx name="click" at={tOne - 1} volume={0.3} />
      <Sfx name="click" at={tFew - 2} volume={0.28} />
      <Sfx name="click" at={tFew + 1} volume={0.28} />
      <Sfx name="whoosh" at={tInside} volume={0.2} />
      <Stage cam={BENCH}>
        <Wall />
        <Host f={f} {...m} />
        <Bench />
        {cardO > 0 && <WordCard text={STRAW.text} x={lerp(STRAW_X, ONE_X - 16, slide)} size={STRAW.size} crack={1} opacity={cardO} />}
        {oneP > 0.01 && (
          <TokenTile text="strawberry" x={ONE_X} size={SIZE} scale={0.7 + 0.3 * Math.min(1.1, oneP)} opacity={Math.min(1, oneP * 2)} bright={bright} glowIdx={R_ONE} glow={glow} blank={blank} />
        )}
        {["straw", "berry"].map((w, k) => {
          const p = fewP[k];
          if (p <= 0.01) return null;
          return (
            <TokenTile
              key={w}
              text={w}
              x={FEW_XS[k]}
              y={WS.benchTop + 2 - (1 - Math.min(1, p)) * 160}
              size={SIZE}
              opacity={Math.min(1, p * 3)}
              bright={bright}
              glowIdx={k ? R_BERRY : R_STRAW}
              glow={glow}
              blank={blank}
            />
          );
        })}
        <Chip text="ONE TOKEN" x={ONE_CX} y={820} p={oneP} opacity={chipsOut} size={24} />
        <Chip text="OR A FEW" x={FEW_CX} y={820} p={fewP[1]} opacity={chipsOut} size={24} />
        <BenchLabel text="EXAMPLE SPLITS · NOT CLAUDE'S REAL ONE" cx={470} opacity={lab} />
      </Stage>
      <LessonHeader title="Where are the r's?" />
      <Source text="TechCrunch, 2024" />
    </>
  );
};
