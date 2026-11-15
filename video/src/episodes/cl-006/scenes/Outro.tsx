import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, useWord } from "../../../engine/kit";
import { Bench, BenchLabel, ez, Host, LetterRow, moodAt, type Mood, sp, Stage, tileH, tileW, TokenTile, Wall, WIDE, WordCard, WS } from "../../../workshop";
import { Accent, LessonHeader, STRAW, STRAW_X } from "./common";

const BIG = 44;
const SPLIT = ["straw", "berry"];
const SPLIT_X0 = 540 - (tileW("straw", BIG) + tileW("berry", BIG) + 12) / 2;
const SPLIT_XS = [SPLIT_X0, SPLIT_X0 + tileW("straw", BIG) + 12];

// the rain: every tile from this lesson, packed left to right in two layers
const SMALL = 26;
const POOL = ["Why", "is", "the", "sky", "blue", "?", "Blue", "light", "scat", "ters", "most", "How", "many", "r", "'s", "in", "Hello", ",", "Claude", "straw", "berry"];
type Rain = { text: string; x: number; y: number };
const pack = (x0: number, x1: number, y: number, start: number): Rain[] => {
  const out: Rain[] = [];
  let x = x0;
  let k = start;
  for (;;) {
    const t = POOL[k % POOL.length];
    const w = tileW(t, SMALL);
    if (x + w > x1) break;
    out.push({ text: t, x, y });
    x += w + 6;
    k++;
  }
  return out;
};
const H1 = WS.benchTop + 2;
const H2 = H1 - tileH(SMALL) - 2;
const RAIN: Rain[] = [
  ...pack(100, SPLIT_X0 - 6, H1, 0),
  ...pack(SPLIT_XS[1] + tileW("berry", BIG) + 6, 985, H1, 6),
  ...pack(108, SPLIT_X0 - 10, H2, 11),
  ...pack(SPLIT_X0 + 4, SPLIT_XS[1] + tileW("berry", BIG) - 4, H1 - tileH(BIG) - 2, 3),
  ...pack(SPLIT_XS[1] + tileW("berry", BIG) + 14, 980, H2, 15),
].sort((a, b) => a.x - b.x || b.y - a.y);
const TEETER = { text: "ters", x: 870, y: H2 - tileH(SMALL) - 2 };

/** The outro at any frame `f` (the next-lesson card holds its last frame, dimmed). */
export const OutroView: React.FC<{ f: number; header?: boolean; dim?: number; m?: { mood: Mood; at: number } }> = ({ f, header = true, dim = 1, m }) => {
  const wf = useWord();
  const tTiles = wf("outro", "tiles");
  const tNot = wf("outro", "not");
  const tLetters = wf("outro", "letters");
  const tAll = wf("outro", "all");
  const tFit = wf("outro", "fit");

  const split = sp(f, tTiles - 2, { damping: 14, stiffness: 200 });
  const flash = ez(f, tNot - 2, tNot + 4) * (1 - ez(f, tLetters + 12, tLetters + 22));
  const span = Math.max(20, tFit - tAll);
  const landAt = (i: number) => tAll + (i / RAIN.length) * span;
  const teeter = sp(f, tFit + 4, { damping: 12, stiffness: 180 });
  const rock = f >= tFit + 10 ? Math.sin((f - tFit - 10) * 0.32) * 9 : 0;
  const mood =
    m ??
    moodAt(f, [
      [0, "idle"],
      [tTiles, "gotit"],
      [tFit, "unsure"],
    ]);
  return (
    <>
      <Stage cam={WIDE} dim={dim}>
        <Wall />
        <Host f={f} {...mood} />
        <Bench />
        {split < 0.05 && <WordCard text={STRAW.text} x={STRAW_X} size={STRAW.size} crack={1} />}
        {split >= 0.05 &&
          SPLIT.map((w, k) => <TokenTile key={w} text={w} x={SPLIT_XS[k] + (1 - Math.min(1, split)) * (k ? -14 : 14)} size={BIG} opacity={Math.min(1, split * 3)} />)}
        <BenchLabel text="EXAMPLE SPLIT" cx={540} opacity={ez(f, tTiles + 4, tTiles + 14)} />
        {RAIN.map((r, i) => {
          const p = sp(f, landAt(i) - 8, { damping: 14, stiffness: 210 });
          if (p <= 0.001) return null;
          return <TokenTile key={i} text={r.text} x={r.x} y={r.y - (1 - Math.min(1, p)) * 520} size={SMALL} opacity={Math.min(1, p * 4)} />;
        })}
        {teeter > 0.001 && (
          <TokenTile text={TEETER.text} x={TEETER.x} y={TEETER.y - (1 - Math.min(1, teeter)) * 520} size={SMALL} rot={rock} opacity={Math.min(1, teeter * 4)} />
        )}
        {flash > 0 && <LetterRow text="strawberry" cx={540} y={720} boxed opacity={flash} />}
      </Stage>
      {header && <LessonHeader title={<>Tiles, not <Accent>letters</Accent></>} />}
    </>
  );
};

export const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const tTiles = wf("outro", "tiles");
  const tAll = wf("outro", "all");
  const tFit = wf("outro", "fit");
  const span = Math.max(20, tFit - tAll);
  return (
    <>
      <Sfx name="click" at={tTiles - 2} volume={0.3} />
      <Sfx name="click" at={tTiles + 1} volume={0.3} />
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <Sfx key={k} name="pop" at={tAll + Math.round((k * span) / 6)} volume={0.12} />
      ))}
      <Sfx name="thud" at={tFit + 8} volume={0.3} />
      <OutroView f={f} />
    </>
  );
};
