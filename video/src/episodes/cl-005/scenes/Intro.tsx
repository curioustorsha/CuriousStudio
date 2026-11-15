import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Sfx, useWord } from "../../../engine/kit";
import { SeriesCard } from "../../../engine/cards";
import { AnswerRow, Bench, ez, HOST_C, lerp, QuestionCard, Stage, Wall, WIDE } from "../../../workshop";
import { Aster } from "../../../aster/Aster";
import { LogoMark } from "../../../brand";
import { HookHeader } from "./Hook";

/**
 * Series card over the dimmed workshop. Aster leaves its spot, rises, and a C draws around it on "Curiously":
 * the host becomes the logo. The row clears as the card leaves.
 */
export const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames: D } = useVideoConfig();
  const wf = useWord();
  const tName = wf("intro", "claude");
  const tCur = wf("intro", "curiously");
  const out = ez(f, D - 10, D - 2);
  const dim = 1 - 0.65 * ez(f, 0, 10) * (1 - out);
  const clear = 1 - ez(f, D - 10, D - 2);
  // Aster rises and shrinks to the logo's star size (LogoMark star radius = 0.175 × its size; Aster's = size / 4)
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
      <Stage cam={WIDE} dim={dim}>
        <Wall />
        <Bench />
        <QuestionCard />
        <AnswerRow placed={[clear, clear, clear, clear]} amber={[0, 0, 0, 0]} ghost />
      </Stage>
      <HookHeader opacity={1 - ez(f, 0, 8)} />
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
