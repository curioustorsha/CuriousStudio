import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "../../../theme";
import { Sfx, useTiming, useWord } from "../../../engine/kit";
import { CountPill, ImagePane, Space, Window } from "../../../productui";
import { clampI, Credit, DEMO, Header, SourceLine, SPOT } from "./common";

// The maker's exact benchmark prompt (tmpl-fe-datepicker).
const PROMPT = "Add a date picker to the frontend";
const PW = 960;
const SCALE = 2.2;
const PH = SPOT.wall.h * SCALE;

export type HookCues = { tType: number; tWrote: number; tThree: number; tLines: number };

/** Hook cue frames from the timing (the intro and the loop reuse the hook's picture). */
export const useHookCues = (): HookCues => {
  const t = useTiming();
  return { tType: t.wf("hook", "picker", 0, "end"), tWrote: t.wf("hook", "wrote"), tThree: t.wf("hook", "three"), tLines: t.wf("hook", "lines") };
};

/** The prompt typing itself, then the maker's NO SKILL code wall streaming past while the counter runs to 335. */
export const HookView: React.FC<{ f: number; cues: HookCues; dim?: number; header?: boolean }> = ({ f, cues, dim = 1, header = true }) => {
  const { tType, tWrote, tThree, tLines } = cues;
  const wallIn = clampI(f, tWrote - 4, tWrote + 6);
  // the camera streams across the wall from left to right
  const half = PW / SCALE / 2;
  const cx = interpolateWall(f, tWrote, tLines + 20, SPOT.wall.x + half, SPOT.wall.x + SPOT.wall.w - half);
  const count = clampI(f, tThree, tLines, 0, 335);
  const land = clampI(f, tLines, tLines + 6);
  const shake = f >= tLines && f < tLines + 10 ? Math.sin((f - tLines) * 2.6) * (10 - (f - tLines)) * 0.8 : 0;
  return (
    <>
      <Space />
      <div style={{ opacity: dim }}>
        {header && <Header title="One date picker" />}
        <Window title="DatePicker.tsx" x={60} y={460} w={960} h={660} tilt={Math.sin(f / 50) * 2}>
          <div style={{ padding: "40px 40px 0", fontFamily: F.mono, fontSize: 36, lineHeight: 1.4, color: C.text, height: 150 }}>
            <span style={{ color: C.accent }}>&gt; </span>
            {PROMPT.slice(0, Math.floor(clampI(f, 4, tType, 0, PROMPT.length)))}
            <span style={{ color: C.accent, opacity: f < tWrote && Math.floor(f / 12) % 2 ? 0 : 1 }}>▍</span>
          </div>
          <div style={{ position: "absolute", left: 0, top: 170, width: PW, height: PH, opacity: wallIn }}>
            <ImagePane {...DEMO} label={`${DEMO.label} (NO SKILL code)`} pw={PW} ph={PH} cx={cx} cy={SPOT.wall.y + SPOT.wall.h / 2} scale={SCALE} />
          </div>
          <div style={{ position: "absolute", left: 40, right: 40, top: 170 + PH + 24, fontFamily: F.mono, fontSize: 22, letterSpacing: 2, color: C.muted, opacity: wallIn }}>NO SKILL · CLAUDE CODE, OPUS 5.5</div>
        </Window>
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${shake}px)` }}>
          <CountPill value={count} y={1050} right={90} opacity={clampI(f, tThree - 4, tThree + 4)} scale={1 + 0.15 * (1 - land) * (f >= tLines ? 1 : 0)} />
        </div>
        {header && <Credit top={1140} opacity={wallIn} />}
        {header && <SourceLine text="SOURCE · Ponytail benchmark, 7 Oct 2026 (maker's test)" opacity={clampI(f, tLines - 10, tLines)} />}
      </div>
    </>
  );
};

const interpolateWall = (f: number, a: number, b: number, from: number, to: number) => {
  const t = clampI(f, a, b);
  return from + (to - from) * (1 - Math.pow(1 - t, 2));
};

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const cues = useHookCues();
  return (
    <>
      <Sfx name="ticker" at={cues.tThree} volume={0.2} dur={wf("hook", "lines") - cues.tThree} />
      <Sfx name="impact" at={cues.tLines - 1} volume={0.35} />
      <HookView f={f} cues={cues} />
    </>
  );
};
