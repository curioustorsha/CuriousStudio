import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../../../theme";
import { Sfx, useWord } from "../../../engine/kit";
import { ImagePane, Label, pop, Ring, Space, Window } from "../../../productui";
import { clampI, Credit, DEMO, Header, SourceLine, SPOT } from "./common";

export type Cam = { cx: number; cy: number; scale: number };
export const CAM_TOP: Cam = { cx: 880, cy: 330, scale: 0.6 };
export const CAM_CALENDAR: Cam = { cx: 1190, cy: 470, scale: 0.92 };
export const CAM_BOTTOM: Cam = { cx: 880, cy: 1000, scale: 0.6 };

export const mixCam = (a: Cam, b: Cam, t: number): Cam => ({ cx: a.cx + (b.cx - a.cx) * t, cy: a.cy + (b.cy - a.cy) * t, scale: a.scale + (b.scale - a.scale) * t });
/** Critically damped move that starts on a frame. */
export const move = (f: number, at: number, fps: number) => spring({ frame: f - at, fps, config: { damping: 200, mass: 1, stiffness: 60 } });

/** The browser window holding the maker's before/after card (demo-1), seen through a camera. */
export const DemoWindow: React.FC<{ f: number; cam: Cam; grey: number; glow?: number; children?: React.ReactNode }> = ({ f, cam, grey, glow = 0, children }) => (
  <Window
    kind="browser"
    title="github.com/DietrichGebert/ponytail"
    x={60}
    y={470}
    w={960}
    h={760}
    tilt={Math.sin(f / 55) * 1.8}
    accent={C.accent}
    style={{ boxShadow: `0 40px 90px rgba(0,0,0,0.6), 0 0 0 ${1 + glow}px ${C.accent}${glow ? "88" : "22"}, 0 0 ${60 + 40 * glow}px ${C.accent}${glow ? "44" : "18"}` }}
  >
    <ImagePane {...DEMO} pw={960} ph={708} cx={cam.cx} cy={cam.cy} scale={cam.scale} grey={grey}>
      {children}
    </ImagePane>
  </Window>
);

/** "That's the maker's test. Without the skill, Claude reached for a calendar library." */
export const Before: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const tMaker = wf("before", "maker");
  const tWithout = wf("before", "without");
  const tCal = wf("before", "calendar");
  const cam = mixCam(CAM_TOP, CAM_CALENDAR, move(f, tCal - 4, fps));
  const inP = pop(f, 0, fps);
  return (
    <>
      <Sfx name="whoosh" at={0} volume={0.3} />
      <Sfx name="click" at={tCal + 4} volume={0.35} />
      <Space />
      <Header title="Without Ponytail" />
      <Label text="WITHOUT" color={C.muted} style={{ top: 424, left: 70, opacity: clampI(f, tWithout - 2, tWithout + 6, 0.25, 1) }} />
      <Credit top={426} opacity={clampI(f, tMaker - 4, tMaker + 6)} />
      <div style={{ opacity: inP, transform: `translateY(${(1 - inP) * 60}px)` }}>
        <DemoWindow f={f} cam={cam} grey={0.85}>
          <Ring {...SPOT.calendar} p={clampI(f, tCal + 2, tCal + 16)} />
        </DemoWindow>
      </div>
      <SourceLine text="SOURCE · Ponytail README, before/after (Dietrich Gebert)" />
    </>
  );
};
