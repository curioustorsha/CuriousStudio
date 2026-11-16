import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Sfx, useTiming } from "../../../engine/kit";
import { CodePane, Cursor, pop, Space, Window } from "../../../productui";
import { CardWindow, clampI, Header, useCode } from "./common";

export type HookCues = { tCode: number; tVideo: number; tChanging: number; tDigging: number; end: number };

export const useHookCues = (): HookCues => {
  const t = useTiming();
  return {
    tCode: t.wf("hook", "code"),
    tVideo: t.wf("hook", "video"),
    tChanging: t.wf("hook", "changing"),
    tDigging: t.wf("hook", "digging"),
    end: t.sceneFrames("hook"),
  };
};

const SIZE = 18;
const LH = SIZE * 1.55;
const ED = { x: 60, y: 440, w: 700, h: 790 };
const ROWS = Math.floor((ED.h - 52 - 18) / LH);
const PV = { x: 690, y: 640, w: 300 };

/**
 * Plain Claude's real TitleCard.tsx types itself into an editor; on "video" its real card pops up and plays. On
 * "changing" the cursor clicks the card and nothing happens; on "digging" the editor scrolls hunting through all 99 lines.
 */
export const HookView: React.FC<{ f: number; cues: HookCues; dim?: number; header?: boolean }> = ({ f, cues, dim = 1, header = true }) => {
  const { fps } = useVideoConfig();
  // f can run ahead of this scene's own frame (the intro redraws the hook's last moment): shift the live card too
  const offset = f - useCurrentFrame();
  const { before } = useCode();
  if (!before) return null;
  const { tCode, tVideo, tChanging, tDigging, end } = cues;
  const total = before.replace(/\n$/, "").split("\n").length;
  const edIn = spring({ frame: f, fps, config: { damping: 200, stiffness: 120 } });
  const shown = clampI(f, 2, tVideo + 4, 0, 46);
  const typeScroll = Math.max(0, (shown - ROWS + 2) * LH);
  const dig = clampI(f, tDigging, end - 6);
  const digEase = 1 - Math.pow(1 - dig, 2);
  const maxScroll = (total - ROWS + 1) * LH;
  const scroll = typeScroll + (maxScroll - typeScroll) * digEase;
  // the line under the hunting cursor flickers while it digs
  const hunt = dig > 0 && dig < 1 ? Math.floor(scroll / LH) + 6 + (Math.floor(f / 3) % 5) : 0;
  const pv = pop(f, tVideo, fps, 14);
  // cursor: in from the bottom, to the card by "changing", clicks, then back into the code on "digging"
  const toCard = spring({ frame: f - (tChanging - 14), fps, config: { damping: 200, stiffness: 140 } });
  const toCode = spring({ frame: f - tDigging + 4, fps, config: { damping: 200, stiffness: 140 } });
  const cx = 520 + (840 - 520) * toCard + (380 - 840) * toCode;
  const cy = 1180 + (930 - 1180) * toCard + (760 - 930) * toCode;
  const click = clampI(f, tChanging + 2, tChanging + 14);
  return (
    <>
      <Space />
      <div style={{ opacity: dim }}>
        {header && <Header title="Video, written in React" opacity={clampI(f, 0, 8)} />}
        <div style={{ opacity: edIn, transform: `translateY(${(1 - edIn) * 160}px) scale(${0.9 + 0.1 * edIn})` }}>
          <Window title="TitleCard.tsx" {...ED} tilt={6 + Math.sin(f / 40) * 1}>
            <CodePane code={before} shown={dig > 0 ? Infinity : shown} scroll={scroll} size={SIZE} glowLine={hunt ? { line: hunt, p: 1 } : undefined} />
          </Window>
        </div>
        {f >= tVideo - 1 && (
          <div style={{ opacity: pv, transform: `translateY(${(1 - pv) * 60}px) scale(${0.8 + 0.2 * pv})`, transformOrigin: "50% 100%" }}>
            <CardWindow kind="before" {...PV} from={tVideo - offset} loop tilt={-4} />
          </div>
        )}
        {f >= tChanging - 16 && <Cursor x={cx} y={cy} click={click} opacity={clampI(f, tChanging - 16, tChanging - 8)} />}
      </div>
    </>
  );
};

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const cues = useHookCues();
  return (
    <>
      <Sfx name="swoosh" at={0} volume={0.3} />
      <Sfx name="ticker" at={4} volume={0.12} dur={cues.tVideo - 4} />
      <Sfx name="pop" at={cues.tVideo} volume={0.35} />
      <Sfx name="click" at={cues.tChanging + 2} volume={0.35} />
      <Sfx name="data" at={cues.tDigging} volume={0.18} dur={cues.end - cues.tDigging} />
      <HookView f={f} cues={cues} />
    </>
  );
};
