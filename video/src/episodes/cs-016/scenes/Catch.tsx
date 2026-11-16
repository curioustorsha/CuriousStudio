import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../../../theme";
import { Sfx, useWord } from "../../../engine/kit";
import { CatchCard, CodePane, CountPill, Label, pop, Space, Window } from "../../../productui";
import { clampI, Header, SourceLine, useBooking, useProof } from "./common";

/** Who it's for, the catch, and our own small test: plain Claude 10 lines, with Ponytail 9 (no winner). */
export const Catch: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const { ladder } = useProof();
  const { before, after } = useBooking();
  if (!ladder || !before || !after) return null;
  const tReview = wf("catch", "reviewing");
  const tCatch = wf("catch", "catch");
  const tMakers = wf("catch", "maker");
  const tOur = wf("catch", "our");
  const tLean = wf("catch", "lean");
  // the SKILL.md window from the trick: a review line scans down it, then it slides away on "catch"
  const away = clampI(f, tCatch - 8, tCatch + 6);
  const scan = clampI(f, tReview, tCatch - 6);
  const card = pop(f, tCatch, fps);
  const greyNums = clampI(f, tMakers, tMakers + 8);
  const pair = pop(f, tOur - 4, fps);
  const counted = clampI(f, tOur + 4, tLean);
  const lines = (s: string) => s.replace(/\n$/, "").split("\n").length;
  const num = `rgba(245,245,247,${1 - 0.6 * greyNums})`;
  return (
    <>
      <Sfx name="scan" at={tReview} volume={0.2} dur={tCatch - tReview} />
      <Sfx name="pop" at={tCatch} volume={0.35} />
      <Sfx name="whoosh" at={tOur - 4} volume={0.25} />
      <Sfx name="click" at={tLean} volume={0.3} />
      <Sfx name="click" at={tLean + 3} volume={0.3} />
      <Space />
      <Header title="The catch" accent={C.accent} />
      {away < 1 && (
        <div style={{ opacity: 1 - away, transform: `translateY(${-away * 200}px) scale(${1 - 0.1 * away})` }}>
          <Window title="skills/ponytail/SKILL.md" x={60} y={440} w={960} h={800} dim>
            <div style={{ padding: "28px 36px", fontFamily: F.mono, fontSize: 25, lineHeight: 1.5, color: "rgba(245,245,247,0.4)", whiteSpace: "pre-wrap" }}>{ladder}</div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 40 + scan * 620, height: 4, background: C.accent, boxShadow: `0 0 30px ${C.accent}`, opacity: scan > 0 && scan < 1 ? 1 : 0 }} />
          </Window>
        </div>
      )}
      <CatchCard
        x={110}
        y={440}
        p={card}
        text={
          <>
            Coding only. The <span style={{ color: num }}>335 → 10</span> is the maker&apos;s test.
          </>
        }
      />
      <div style={{ opacity: pair, transform: `translateY(${(1 - pair) * 60}px)` }}>
        <Label text="OUR TEST · BOOKING FORM" style={{ top: 712, left: 70, fontSize: 20 }} />
        <Label text="WITHOUT" color={C.muted} style={{ top: 752, left: 70, fontSize: 20 }} />
        <Label text="WITH PONYTAIL" color={C.muted} style={{ top: 752, left: 560, fontSize: 20 }} />
        <Window title="app.js" x={60} y={790} w={470} h={370}>
          <CodePane code={before} size={13} />
        </Window>
        <Window title="app.js" x={550} y={790} w={470} h={370}>
          <CodePane code={after} size={13} />
        </Window>
        <CountPill value={counted * lines(before)} color={C.text} x={300} y={1086} />
        <CountPill value={counted * lines(after)} color={C.text} x={790} y={1086} />
      </div>
      <SourceLine text="SOURCE · Curiously test, 14 Nov 2026" opacity={pair} />
    </>
  );
};
