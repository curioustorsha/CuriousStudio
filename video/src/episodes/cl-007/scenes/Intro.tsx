import React from "react";
import { Bench, Desk, LessonIntro, Stage, Wall, WIDE } from "../../../workshop";
import { DeskObjects, HookHeader } from "./Hook";

/** Series card over the dimmed workshop; the desk and its three objects stay. Aster becomes the logo. */
export const Intro: React.FC = () => (
  <LessonIntro
    backdrop={(dim) => (
      <Stage cam={WIDE} dim={dim}>
        <Wall />
        <Bench />
        <Desk />
        <DeskObjects p={[1, 1, 1]} />
      </Stage>
    )}
    header={(o) => <HookHeader opacity={o} />}
  />
);
