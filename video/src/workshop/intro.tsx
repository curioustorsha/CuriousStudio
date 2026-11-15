import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Sfx, useWord } from "../engine/kit";
import { SeriesCard } from "../engine/cards";
import { Aster } from "../aster/Aster";
import { LogoMark } from "../brand";
import { HOST_C } from "./host";
import { ez, lerp } from "./world";

/**
 * "Welcome to Claude Lab, by Curiously" for every lesson (lifted from Lesson 1's Intro):
 * the workshop dims, Aster leaves its spot and rises, and a C draws around it on "Curiously" so the host becomes the logo.
 * `backdrop(dim)` draws the lesson's workshop behind it; `header` is the previous scene's header, faded out.
 */
export const LessonIntro: React.FC<{ backdrop: (dim: number) => React.ReactNode; header?: (opacity: number) => React.ReactNode; scene?: string }> = ({
  backdrop,
  header,
  scene = "intro",
}) => {
  const f = useCurrentFrame();
  const { durationInFrames: D } = useVideoConfig();
  const wf = useWord();
  const tName = wf(scene, "claude");
  const tCur = wf(scene, "curiously");
  const out = ez(f, D - 10, D - 2);
  const dim = 1 - 0.65 * ez(f, 0, 10) * (1 - out);
  const move = ez(f, tName - 6, tName + 12);
  const size = lerp(380, 240, move);
  const cx = lerp(HOST_C[0], 540, move);
  const cy = lerp(HOST_C[1], 520, move);
  const settle = ez(f, tCur - 6, tCur + 2);
  const rot = f * 0.5 * (1 - settle) + 90 * ez(f, tCur + 4, tCur + 22) * settle;
  const arc = ez(f, tCur - 4, tCur + 10);
  const L = size * 1.43;
  return (
    <>
      <Sfx name="swoosh" at={0} volume={0.35} />
      <Sfx name="ticker" at={tName} volume={0.18} dur={20} />
      <Sfx name="ding" at={tCur + 2} volume={0.3} />
      {backdrop(dim)}
      {header?.(1 - ez(f, 0, 8))}
      <div style={{ position: "absolute", inset: 0, opacity: 1 - out }}>
        {arc > 0 && (
          <div style={{ position: "absolute", left: cx - L / 2, top: cy - L / 2 }}>
            <LogoMark size={L} arc={arc} starDraw={0} />
          </div>
        )}
        <div style={{ position: "absolute", left: cx - size / 2, top: cy - size / 2 }}>
          <Aster size={size} rot={rot} glow={0.5 - 0.3 * arc} />
        </div>
      </div>
      <SeriesCard f={f} name="CLAUDE LAB" tName={tName} tCur={tCur} out={out} top={860} />
    </>
  );
};
