import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../../../theme";
import { Sfx } from "../../../engine/kit";
import { Space } from "../../../productui";
import { ClipWindow } from "./ClipWindow";
import { ClipId, clampI, CLIPS, Header, SourceLine } from "./common";

/** One of our renders, big, with a slow push-in; hard cut in. */
const montage = (clip: ClipId, title: string, accent?: boolean, skip = 0): React.FC =>
  function MontageScene() {
    const f = useCurrentFrame();
    const { durationInFrames: D } = useVideoConfig();
    return (
      <>
        <Sfx name="click" at={0} volume={0.3} />
        <Space />
        <Header title={title} accent={accent ? C.accent : undefined} />
        <ClipWindow clip={clip} skip={skip} zoom={1 + 0.07 * clampI(f, 0, D)} />
        <SourceLine text={`OUR VIDEO · ${CLIPS[clip].label} · made with Remotion's skills`} />
      </>
    );
  };

// "With them, Claude builds a whole city, street by street."
export const City = montage("city", "A whole city");
// "A little workshop that acts out an idea."
export const Workshop = montage("workshop", "A workshop that acts");
// "Numbers that count up on the right word."
// skip 50 frames so the counter runs through the whole line, not just its last half second
export const Numbers = montage("numbers", "Numbers on the word", false, 50);
// "And code windows, like the ones in this video."
export const Product = montage("product", "Code windows", true);
