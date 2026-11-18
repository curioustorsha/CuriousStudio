import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Sfx, useWord } from "../../../engine/kit";
import { EndCard } from "../../../engine/cards";
import { ez, HOST_C, lerp } from "../../../workshop";
import { Aster } from "../../../aster/Aster";
import { HookView } from "./Hook";

/** The sign-off end card (as Lessons 1–2): Aster flies up into the logo's C; the last frames fade into the hook so the video loops. */
export const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames: D } = useVideoConfig();
  const wf = useWord();
  const tLike = wf("cta", "like", 1);
  const tShare = wf("cta", "share");
  const tFollow = wf("cta", "follow");
  const tCur = wf("cta", "curiously");
  const loop = ez(f, D - 10, D - 1);
  const LAND = 16;
  const fly = ez(f, 0, LAND);
  const ax = lerp(HOST_C[0], 540, fly);
  const ay = lerp(HOST_C[1], 595, fly) - Math.sin(fly * Math.PI) * 60;
  const as = lerp(380, 175, fly);
  return (
    <>
      <Sfx name="swoosh" at={0} volume={0.25} />
      <Sfx name="pop" at={tLike - 2} volume={0.35} />
      <Sfx name="pop" at={tShare - 2} volume={0.35} />
      <Sfx name="pop" at={tFollow - 2} volume={0.35} />
      <Sfx name="ding" at={tCur} volume={0.35} />
      <div style={{ position: "absolute", inset: 0, opacity: 1 - loop }}>
        <EndCard f={f} tIn={0} tLike={tLike} tShare={tShare} tFollow={tFollow} tCur={tCur} starIn={LAND} />
        {f < LAND && (
          <div style={{ position: "absolute", left: ax - as / 2, top: ay - as / 2 }}>
            <Aster size={as} rot={360 * fly} glow={0.6 * (1 - fly)} />
          </div>
        )}
      </div>
      {loop > 0 && (
        <div style={{ position: "absolute", inset: 0, opacity: loop }}>
          <HookView f={0} />
        </div>
      )}
    </>
  );
};
