import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../../../theme";
import { Sfx, useWord } from "../../../engine/kit";
import { CountPill, Label, Ring, Space } from "../../../productui";
import { clampI, Credit, Header, SourceLine, SPOT } from "./common";
import { CAM_BOTTOM, CAM_CALENDAR, DemoWindow, mixCam, move } from "./Before";

/** "With Ponytail, ten lines. It reused the project's input box, and the browser brings the calendar." */
export const After: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const tWith = wf("after", "ponytail");
  const tTen = wf("after", "ten");
  const tInput = wf("after", "input");
  const tBrowser = wf("after", "browser");
  const pan = move(f, tWith - 6, fps);
  const cam = mixCam(CAM_CALENDAR, CAM_BOTTOM, pan);
  const lit = clampI(f, tWith, tWith + 10);
  const fall = clampI(f, tWith, tTen + 4);
  const count = 335 - (335 - 10) * (1 - Math.pow(1 - fall, 3));
  const amber = f >= tTen;
  return (
    <>
      <Sfx name="swoosh" at={tWith - 6} volume={0.3} />
      <Sfx name="ticker" at={tWith} volume={0.15} dur={tTen - tWith + 4} />
      <Sfx name="ding" at={tTen + 2} volume={0.4} />
      <Sfx name="click" at={tInput} volume={0.35} />
      <Sfx name="click" at={tBrowser} volume={0.35} />
      <Space />
      <Header title="With Ponytail" accent={C.accent} />
      <Label text="WITHOUT" color={C.muted} style={{ top: 424, left: 70, opacity: 1 - lit }} />
      <Label text="WITH PONYTAIL" style={{ top: 424, left: 70, opacity: lit }} />
      <Credit top={426} />
      <DemoWindow f={f} cam={cam} grey={0.85 * (1 - lit)} glow={lit}>
        <Ring {...SPOT.input} p={clampI(f, tInput, tInput + 14)} opacity={1 - clampI(f, tBrowser + 6, tBrowser + 16)} />
        <Ring {...SPOT.date} p={clampI(f, tBrowser, tBrowser + 12)} />
        <Ring {...SPOT.arrow} p={clampI(f, tBrowser + 6, tBrowser + 20)} />
      </DemoWindow>
      <CountPill value={count} y={1140} right={80} color={amber ? C.accent : C.red} opacity={clampI(f, tWith - 6, tWith)} />
      <SourceLine text="SOURCE · Ponytail benchmark, median of 5 runs (maker's test)" />
    </>
  );
};
