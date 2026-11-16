import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Sfx, useTiming } from "../../../engine/kit";
import { pop, Space } from "../../../productui";
import { ClipWindow } from "./ClipWindow";
import { ClipId, clampI, Header, SourceLine, Tag } from "./common";

const ORDER: ClipId[] = ["network", "magnifier", "numbers", "product"];

export type HookCues = { cuts: number[]; tEditing: number; end: number };

/** Hard cuts between four of our renders on "every", "channel", "claude", "code"; "No editing app" tags on. */
export const useHookCues = (): HookCues => {
  const t = useTiming();
  return {
    cuts: [0, t.wf("hook", "channel"), t.wf("hook", "claude"), t.wf("hook", "code")],
    tEditing: t.wf("hook", "editing"),
    end: t.sceneFrames("hook"),
  };
};

/** Which clip shows at hook frame `f`, and from which hook frame it started. */
export const clipAt = (f: number, cues: HookCues) => {
  let i = 0;
  cues.cuts.forEach((c, k) => {
    if (f >= c) i = k;
  });
  return { clip: ORDER[i], from: cues.cuts[i] };
};

export const HookView: React.FC<{ f: number; cues: HookCues; dim?: number; tags?: boolean }> = ({ f, cues, dim = 1, tags = true }) => {
  const { fps } = useVideoConfig();
  const { clip, from } = clipAt(f, cues);
  const local = useCurrentFrame();
  // the intro redraws the hook: shift the clip's start into this scene's frame
  const offset = f - local;
  const zoom = 1 + 0.06 * clampI(f - from, 0, 40);
  return (
    <>
      <Space />
      <div style={{ opacity: dim }}>
        <Header title="Written by Claude, in code" />
        <ClipWindow key={clip} clip={clip} from={from - offset} zoom={zoom} />
        {tags && <Tag text="NO EDITING APP" p={pop(f, cues.tEditing, fps, 14)} top={1180} right={90} />}
        <SourceLine text="OUR VIDEOS · made by Claude with Remotion's skills" />
      </div>
    </>
  );
};

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const cues = useHookCues();
  return (
    <>
      {cues.cuts.map((c, i) => (
        <Sfx key={i} name={i === 0 ? "swoosh" : "click"} at={c} volume={0.3} />
      ))}
      <Sfx name="thud" at={cues.tEditing} volume={0.35} />
      <HookView f={f} cues={cues} />
    </>
  );
};
