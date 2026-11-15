import React from "react";
import { Bench, LessonIntro, Stage, Wall, WIDE, WordCard } from "../../../workshop";
import { HookHeader } from "./Hook";
import { STRAW, STRAW_X } from "./common";

/** Series card over the dimmed workshop; the cracked strawberry card stays on the bench. Aster becomes the logo. */
export const Intro: React.FC = () => (
  <LessonIntro
    backdrop={(dim) => (
      <Stage cam={WIDE} dim={dim}>
        <Wall />
        <Bench />
        <WordCard text={STRAW.text} x={STRAW_X} size={STRAW.size} crack={1} />
      </Stage>
    )}
    header={(o) => <HookHeader opacity={o} />}
  />
);
