import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, Source, useWord } from "../../../engine/kit";
import {
  Bench,
  BENCH,
  Chip,
  CLAUDE_REST,
  CoinStack,
  ez,
  Host,
  HOST_C,
  lerp,
  lerpP,
  mixCam,
  moodAt,
  pointHands,
  sp,
  Stage,
  TerminalPanel,
  TokenTile,
  traySlot,
  Tray,
  Wall,
  WALL,
  WS,
  type P2,
} from "../../../workshop";
import { LessonHeader } from "./common";

export const IN_CX = 230;
export const OUT_CX = 680;
export const COIN_CX = 850;
const N = 14;
const TW = 38;
const rowX = (i: number) => 140 + i * (TW + 6);
const MINI = 0.72;
/** left x of a row-size tile that, scaled to MINI from its bottom centre, sits in tray slot i */
const slotLeft = (cx: number, i: number): P2 => {
  const [sx, sy] = traySlot(cx, i);
  return [sx + 14 - TW / 2, sy];
};

const LINES = ["count_tokens", '  model   claude-opus-5-5', '  system  "You are a scientist"', '  user    "Hello, Claude"'];
const CHARS = LINES.reduce((a, l) => a + l.length, 0);

/** The trays at rest (end of price, all of five): 14 tiles in IN, `out` tiles in OUT. */
export const TraysAtRest: React.FC<{ out?: number }> = ({ out = 3 }) => (
  <>
    <Tray cx={IN_CX} label="IN">
      {Array.from({ length: N }).map((_, i) => {
        const [x, y] = slotLeft(IN_CX, i);
        return <TokenTile key={i} text="" x={x} y={y} size={20} w={TW} scale={MINI} />;
      })}
    </Tray>
    <Tray cx={OUT_CX} label="OUT">
      {Array.from({ length: out }).map((_, i) => {
        const [x, y] = slotLeft(OUT_CX, i);
        return <TokenTile key={i} text="" x={x} y={y} size={20} w={TW} scale={MINI} />;
      })}
    </Tray>
  </>
);

/** Tokens measure length and price: the docs' token-count example on the wall, 14 tiles, a coin, then IN and OUT trays. */
export const Price: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const tLength = wf("price", "length");
  const tPrice = wf("price", "price");
  const tPer = wf("price", "per");
  const tSend = wf("price", "send");
  const tWrites = wf("price", "writes");

  const slideUp = sp(f, 0, { damping: 16, stiffness: 150 });
  const typed = (f - 3) * 3.8;
  const resultP = ez(f, tLength - 2, tLength + 4);
  const shrink = ez(f, tPer - 4, tPer + 10);
  const cam = mixCam(WALL, BENCH, ez(f, tPer - 4, tPer + 18));
  const tickAt = (i: number) => tLength + 2 + i * 2;
  const shown = Array.from({ length: N }).filter((_, i) => f >= tickAt(i)).length;
  const counter = sp(f, tLength + 2, { damping: 14, stiffness: 200 }) * (1 - ez(f, tPer - 8, tPer - 2));
  const coin = sp(f, tPrice - 4, { damping: 13, stiffness: 200 });
  const perChip = sp(f, tPer + 4, { damping: 13, stiffness: 210 });
  const inTray = sp(f, tSend - 8, { damping: 16, stiffness: 170 });
  const outTray = sp(f, tWrites - 12, { damping: 16, stiffness: 170 });
  const liftUp = ez(f, tSend - 12, tSend - 4);
  const outAts = [tWrites - 2, tWrites + 6, tWrites + 14];

  // Aster points at each OUT tile as it lands
  let hands = { ...CLAUDE_REST };
  for (let k = outAts.length - 1; k >= 0; k--) {
    const at = outAts[k];
    if (f >= at - 10 && f <= at + 8) {
      const [x, y] = slotLeft(OUT_CX, k);
      hands = pointHands([x + TW / 2, y - 20], ez(f, at - 10, at - 4) * (1 - ez(f, at + 2, at + 8)));
      break;
    }
  }
  const m = moodAt(f, [
    [0, "idle"],
    [tLength, "think"],
    [tPrice, "idle"],
    [outAts[2] + 6, "gotit"],
  ]);

  return (
    <>
      <Sfx name="data" at={2} volume={0.16} dur={tLength} />
      <Sfx name="ticker" at={tickAt(0)} volume={0.2} dur={N * 2 + 4} />
      <Sfx name="coin" at={tPrice - 1} volume={0.45} />
      <Sfx name="pop" at={tPer + 4} volume={0.25} />
      <Sfx name="swoosh" at={tSend - 8} volume={0.25} />
      <Sfx name="swoosh" at={tWrites - 12} volume={0.25} />
      {outAts.map((at, k) => (
        <Sfx key={k} name="click" at={at} volume={0.28} />
      ))}
      <Stage cam={cam}>
        <Wall />
        <Host f={f} {...hands} {...m} />
        <Bench />
        {shrink < 1 && (
          <TerminalPanel
            x={170}
            y={440 + (1 - slideUp) * 120}
            w={640}
            lines={LINES}
            typed={Math.min(CHARS, typed)}
            result={'→ { "input_tokens": 14 }'}
            resultP={resultP}
            label="Claude Docs example · Opus 5.5 · estimate"
            scale={1 - 0.85 * shrink}
            opacity={Math.min(1, slideUp * 2) * (1 - shrink)}
          />
        )}
        <Tray cx={IN_CX} label="IN" dx={(1 - inTray) * -420} opacity={Math.min(1, inTray * 2)}>
          {Array.from({ length: N }).map((_, i) => {
            if (f < tickAt(i)) return null;
            const pop = sp(f, tickAt(i), { damping: 12, stiffness: 240 });
            const go = sp(f, tSend + i * 0.7, { damping: 16, stiffness: 170 });
            const [sx, sy] = slotLeft(IN_CX, i);
            const x = lerp(rowX(i), sx, go);
            const y = lerp(WS.benchTop + 2, sy, go) - liftUp * 70 * (1 - go);
            return <TokenTile key={i} text="" x={x} y={y} size={20} w={TW} scale={lerp(0.6 + 0.4 * Math.min(1, pop), MINI, go)} opacity={Math.min(1, pop * 3)} />;
          })}
        </Tray>
        <Tray cx={OUT_CX} label="OUT" dx={(1 - outTray) * 420} opacity={Math.min(1, outTray * 2)}>
          {outAts.map((at, k) => {
            const p = sp(f, at - 8, { damping: 15, stiffness: 190 });
            if (p <= 0.001) return null;
            const [sx, sy] = slotLeft(OUT_CX, k);
            const [x, y] = lerpP([HOST_C[0] - TW / 2, HOST_C[1] + 20], [sx, sy], Math.min(1, p));
            return <TokenTile key={k} text="" x={x} y={y - Math.sin(Math.min(1, p) * Math.PI) * 40} size={20} w={TW} scale={MINI} opacity={Math.min(1, p * 3)} />;
          })}
        </Tray>
        <CoinStack cx={COIN_CX} drops={[coin]} />
        <Chip text={`${shown} TOKENS`} x={415} y={870} p={counter} color="#FFB547" />
        <Chip text="PER 1M TOKENS" x={780} y={840} p={perChip} size={24} />
      </Stage>
      <LessonHeader title="Counted in tokens" />
      <Source text="Claude Docs, Token counting & Pricing, 2026" />
    </>
  );
};
