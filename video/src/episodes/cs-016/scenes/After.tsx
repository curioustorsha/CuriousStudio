import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../../../theme";
import { Sfx, useWord } from "../../../engine/kit";
import { CodePane, Label, pop, Space, Window } from "../../../productui";
import { clampI, Header, SourceLine, useProof } from "./common";

/** With Ponytail: the long answer shrinks to the top, the ten lines type in below; "timer" lights the setTimeout lines. */
export const After: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const { before, after } = useProof();
  if (!before || !after) return null;
  const tWith = wf("after", "ponytail");
  const tTen = wf("after", "ten");
  const tTimer = wf("after", "timer");
  const shrink = pop(f, 0, fps, 22);
  const inP = pop(f, tWith - 6, fps);
  const lines = after.split("\n").length;
  const glow = clampI(f, tTimer, tTimer + 8);
  return (
    <>
      <Sfx name="whoosh" at={tWith - 6} volume={0.3} />
      <Sfx name="ticker" at={tWith} volume={0.15} dur={tTen - tWith} />
      <Sfx name="ding" at={tTen} volume={0.4} />
      <Space />
      <Header title="With Ponytail: 10 lines" opacity={clampI(f, tTen - 2, tTen + 6)} accent={C.accent} />
      <Header title="Same prompt, same model" opacity={1 - clampI(f, tTen - 8, tTen - 2)} />
      <Label text="WITHOUT · 116 LINES" color={C.muted} style={{ top: 420, left: 70 }} />
      <Window title="search.js" x={60} y={460} w={960} h={780 - 470 * shrink} tilt={-3} dim>
        <CodePane code={before} scroll={2600} size={17} />
      </Window>
      <Label text="WITH PONYTAIL · 10 LINES" style={{ top: 802, left: 70, opacity: inP }} />
      <div style={{ opacity: inP, transform: `translateY(${(1 - inP) * 60}px)` }}>
        <Window title="search.js" x={60} y={842} w={960} h={410} tilt={3}>
          <CodePane code={after} shown={clampI(f, tWith, tTen, 0, lines)} size={17} />
          {/* the timer lines (clearTimeout + setTimeout) */}
          <div style={{ position: "absolute", left: 20, right: 20, top: 18 + 4 * 17 * 1.55 - 4, height: 2 * 17 * 1.55 + 8, borderRadius: 10, border: `2px solid ${C.accent}`, boxShadow: `0 0 30px ${C.accent}55`, opacity: glow }} />
        </Window>
      </div>
      <SourceLine text="SOURCE · ponytail repo, examples/debounce.md (maker's test)" />
    </>
  );
};
