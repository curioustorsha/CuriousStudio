import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../../../theme";
import { Sfx, useTiming } from "../../../engine/kit";
import { Cursor, pop, Ring, Space, Window } from "../../../productui";
import { clampI, Credit, Header, MCO, McoPane, move, SourceLine } from "./common";

const PROMPT = "how does mco run a command?";
const TERM = { x: 90, y: 420, w: 900, h: 110 };
const WIN = { x: 90, y: 560, w: 900, h: 640 };
const PW = WIN.w;
const PH = WIN.h - 52;

export type HookCues = { tWorks: number; tClick: number; tMap: number; tLinks: number; tExact: number; tLines: number; tCode: number };

export const useHookCues = (): HookCues => {
  const t = useTiming();
  return {
    tWorks: t.wf("hook", "works"),
    tClick: t.wf("hook", "clickable"),
    tMap: t.wf("hook", "map"),
    tLinks: t.wf("hook", "links"),
    tExact: t.wf("hook", "exact"),
    tLines: t.wf("hook", "lines"),
    tCode: t.wf("hook", "code"),
  };
};

/** The hook's picture at hook frame `f` (the intro keeps drawing it, dimmed). */
export const HookView: React.FC<{ f: number; cues: HookCues; dim?: number }> = ({ f, cues, dim = 1 }) => {
  const { fps } = useVideoConfig();
  const typed = PROMPT.slice(0, Math.max(0, Math.floor((f - 2) * 0.62)));
  const cursorOn = Math.floor(f / 15) % 2 === 0;
  const win = pop(f, cues.tClick - 4, fps);
  // map camera: whole diagram → Command Router
  const push = move(f, cues.tMap, fps);
  const scale = 0.64 + (1.0 - 0.64) * push;
  const cx = 720 + (MCO.routerMap.x - 720) * push;
  const cy = 446 + (MCO.routerMap.y - 446) * push;
  const focus = clampI(f, cues.tLinks + 2, cues.tLinks + 12);
  // then into the passport's verified source, in focused-view units
  const toSrc = move(f, cues.tExact - 4, fps, 70);
  const v = MCO.verified;
  const ring = clampI(f, cues.tLines, cues.tLines + 16);
  // cursor sits on Command Router (screen coords) and clicks on "links"
  const rx = WIN.x + PW / 2 + (MCO.routerMap.x - cx) * scale;
  const ry = WIN.y + 52 + PH / 2 + (MCO.routerMap.y - cy) * scale;
  const arrive = move(f, cues.tMap + 2, fps, 120);
  const curX = 820 + (rx - 820) * arrive;
  const curY = 1160 + (ry + 6 - 1160) * arrive;
  const curOp = clampI(f, cues.tMap, cues.tMap + 6) * (1 - clampI(f, cues.tExact - 4, cues.tExact + 4));
  return (
    <>
      <Space />
      <div style={{ opacity: dim }}>
        <Header title="A map you can click" />
        <Window kind="terminal" title="claude" {...TERM}>
          <div style={{ padding: "8px 30px", fontFamily: F.mono, fontSize: 32, lineHeight: "50px", color: C.text, whiteSpace: "pre" }}>
            <span style={{ color: C.accent }}>&gt; </span>
            {typed}
            <span style={{ opacity: cursorOn ? 1 : 0, color: C.accent }}>▍</span>
          </div>
        </Window>
        <div style={{ opacity: win, transform: `perspective(1600px) translateZ(${(1 - win) * -500}px) rotateX(${(1 - win) * 14}deg)` }}>
          <Window kind="browser" title="mco-runtime.architecture.html" {...WIN} tilt={Math.sin(f / 50) * 1.2}>
            <McoPane
              pw={PW}
              ph={PH}
              cx={cx}
              cy={cy}
              scale={scale}
              focus={focus}
              srcCam={{ cx: v.x + v.w / 2, cy: v.y + v.h / 2 + 4, scale: 3.2, mix: toSrc }}
              srcChildren={ring > 0 ? <Ring x={v.x} y={v.y} w={v.w} h={v.h} p={ring} stroke={1.4} /> : null}
            />
          </Window>
          <Credit top={WIN.y + WIN.h + 14} />
        </div>
        {curOp > 0 && <Cursor x={curX} y={curY} click={clampI(f, cues.tLinks - 2, cues.tLinks + 12)} opacity={curOp} />}
        <SourceLine text="SOURCE · Archify README · tt-a1i's case page for mco-org/mco" opacity={win} />
      </div>
    </>
  );
};

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const cues = useHookCues();
  const ticks = Array.from({ length: 8 }, (_, i) => 4 + i * 6).filter((t) => t < cues.tWorks + 10);
  return (
    <>
      {ticks.map((t) => (
        <Sfx key={t} name="click" at={t} volume={0.12} />
      ))}
      <Sfx name="whoosh" at={cues.tClick - 4} volume={0.3} />
      <Sfx name="click" at={cues.tLinks} volume={0.4} />
      <Sfx name="ding" at={cues.tCode} volume={0.3} />
      <HookView f={f} cues={cues} />
    </>
  );
};
