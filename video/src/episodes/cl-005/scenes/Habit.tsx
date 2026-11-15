import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, Source, useWord } from "../../../engine/kit";
import { Bench, BENCH, Host, moodAt, ez, sp, Stage, Toggle, Wall, WordCard, WS } from "../../../workshop";
import { Accent, LessonHeader } from "./common";
import { END_CX, END_X, R2_SIZE, Row1, ROW1_BOTTOM, ROW2, ROW2_X } from "./rhyme";

/** Researchers switch "rabbit" off: it falls away, and "habit" is pinned in its slot. The new line's other words aren't shown. */
export const Habit: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const tSwitched = wf("habit", "switched");
  const tHabit = wf("habit", "habit");

  const toggleIn = sp(f, 2, { damping: 14, stiffness: 200 });
  const on = 1 - ez(f, tSwitched + 2, tSwitched + 8);
  const fall = ez(f, tSwitched + 8, tSwitched + 26);
  const outline = ez(f, tSwitched + 8, tSwitched + 18);
  const m = moodAt(f, [
    [0, "idle"],
    [tSwitched + 4, "unsure"],
    [tHabit, "gotit"],
  ]);
  const pin = sp(f, tHabit - 2, { damping: 11, stiffness: 220 });

  return (
    <>
      <Sfx name="click" at={tSwitched + 2} volume={0.55} />
      <Sfx name="whoosh" at={tSwitched + 9} volume={0.18} />
      <Sfx name="ding" at={tHabit} volume={0.4} />
      <Stage cam={BENCH}>
        <Wall />
        <Host f={f} {...m} />
        <Bench />
        <Row1 bright={1} />
        {/* the planned word's switch, above its slot */}
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: toggleIn }}>
          <line x1={END_CX} x2={END_CX} y1={ROW1_BOTTOM - 102} y2={ROW1_BOTTOM - 72} stroke="rgba(255,255,255,0.25)" strokeWidth={3} strokeDasharray="6 6" />
        </svg>
        <Toggle x={END_CX - 50} y={ROW1_BOTTOM - 128} on={on} label="RABBIT" opacity={toggleIn} />
        {ROW2.slice(0, 6).map((w, i) => (
          <React.Fragment key={w}>
            <WordCard text={w} x={ROW2_X[i]} size={R2_SIZE} state="cream" opacity={1 - outline} />
            <WordCard text={w} x={ROW2_X[i]} size={R2_SIZE} state="outline" opacity={outline} />
          </React.Fragment>
        ))}
        {fall < 1 && (
          <WordCard
            text="rabbit"
            x={END_X + fall * 30}
            y={WS.benchTop + 2 + fall * fall * 320}
            size={R2_SIZE}
            state={f >= tSwitched + 4 ? "grey" : "pinned"}
            rot={fall * 28}
            opacity={1 - ez(f, tSwitched + 18, tSwitched + 26)}
          />
        )}
        {f >= tSwitched + 18 && pin <= 0.01 && <WordCard text="habit" x={END_X} size={R2_SIZE} state="ghost" w={131} />}
        {pin > 0.01 && (
          <WordCard
            text="habit"
            x={END_X}
            w={131}
            size={R2_SIZE}
            state="amber"
            pin
            scale={0.6 + 0.4 * pin}
            opacity={Math.min(1, pin * 2)}
            y={WS.benchTop + 2 - (1 - Math.min(1, pin)) * 50}
          />
        )}
      </Stage>
      <LessonHeader title={<>Rabbit off, <Accent>habit</Accent> on</>} />
      <Source text="Anthropic, 2025" />
    </>
  );
};
