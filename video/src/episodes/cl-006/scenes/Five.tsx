import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, Source, useWord } from "../../../engine/kit";
import { C, F } from "../../../theme";
import { Bench, BENCH, BenchLabel, Chip, CoinStack, ez, Host, moodAt, sp, Stage, Wall } from "../../../workshop";
import { Accent, LessonHeader } from "./common";
import { COIN_CX, IN_CX, OUT_CX, TraysAtRest } from "./Price";

const IN_COIN_X = 400;

/** On Sonnet 5.5, output tokens cost 5× input: price tags on the trays, 5 coins for OUT, 1 for IN. */
export const Five: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const tSonnet = wf("five", "sonnet");
  const tWrites = wf("five", "writes");
  const tTimes = wf("five", "five", 2);
  const tReads = wf("five", "reads");

  const perOut = 1 - ez(f, 0, 8);
  const model = sp(f, tSonnet - 2, { damping: 13, stiffness: 210 });
  const outTag = sp(f, tWrites - 2, { damping: 13, stiffness: 210 });
  const outCoins = [1, ...[0, 1, 2, 3].map((k) => sp(f, tWrites + 4 + k * 5, { damping: 12, stiffness: 220 }))];
  const stamp = sp(f, tTimes - 2, { damping: 10, stiffness: 260 });
  const inTag = sp(f, tReads - 4, { damping: 13, stiffness: 210 });
  const inCoin = sp(f, tReads - 2, { damping: 12, stiffness: 220 });
  const note = ez(f, tWrites + 20, tWrites + 30);
  const m = moodAt(f, [
    [0, "idle"],
    [tTimes, "gotit"],
  ]);
  return (
    <>
      <Sfx name="pop" at={tSonnet - 2} volume={0.28} />
      <Sfx name="pop" at={tWrites - 2} volume={0.28} />
      {[0, 1, 2, 3].map((k) => (
        <Sfx key={k} name="coin" at={tWrites + 6 + k * 5} volume={0.3} />
      ))}
      <Sfx name="impact" at={tTimes - 1} volume={0.25} />
      <Sfx name="pop" at={tReads - 4} volume={0.25} />
      <Sfx name="coin" at={tReads} volume={0.35} />
      <Stage cam={BENCH}>
        <Wall />
        <Host f={f} {...m} />
        <Bench />
        <TraysAtRest />
        <CoinStack cx={COIN_CX} drops={outCoins} />
        <CoinStack cx={IN_COIN_X} drops={[inCoin]} />
        <Chip text="PER 1M TOKENS" x={780} y={840} p={1} size={24} opacity={perOut} />
        <Chip text="CLAUDE SONNET 5.5" x={470} y={600} p={model} />
        <Chip text="OUT · $10 / MTok" x={OUT_CX - 30} y={850} p={outTag} size={24} />
        <Chip text="IN · $2 / MTok" x={IN_CX + 40} y={850} p={inTag} size={24} />
        {stamp > 0.01 && (
          <div
            style={{
              position: "absolute",
              left: 330,
              top: 730,
              transform: `translate(-50%, -50%) scale(${1.6 - 0.6 * Math.min(1.1, stamp)})`,
              opacity: Math.min(1, stamp * 2),
              fontFamily: F.sans,
              fontWeight: 900,
              fontSize: 150,
              letterSpacing: -4,
              color: C.accent,
              lineHeight: 1,
            }}
          >
            5×
          </div>
        )}
        <BenchLabel text="base rates, per million tokens" cx={470} opacity={note} />
      </Stage>
      <LessonHeader title={<>Writing costs <Accent>5×</Accent></>} />
      <Source text="Claude Docs, Pricing, Nov 2026" />
    </>
  );
};
