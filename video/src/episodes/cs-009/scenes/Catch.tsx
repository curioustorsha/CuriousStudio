import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../../../theme";
import { Sfx, useWord } from "../../../engine/kit";
import { CatchCard, pop, Space, Window } from "../../../productui";
import { clampI, Credit, Header, MCO, McoDim, McoPane, SourceLine } from "./common";

const WIN = { x: 90, y: 770, w: 900, h: 340 };
const TERM = { x: 90, y: 1132, w: 900, h: 112 };
const OFF = "export ARCHIFY_UPDATE_CHECK_DISABLED=1";

const Clock: React.FC<{ turn: number; color: string }> = ({ turn, color }) => (
  <svg width={40} height={40} viewBox="0 0 40 40" style={{ flexShrink: 0 }}>
    <circle cx={20} cy={20} r={16} fill="none" stroke={color} strokeWidth={3.5} />
    <line x1={20} y1={20} x2={20} y2={9} stroke={color} strokeWidth={3.5} strokeLinecap="round" transform={`rotate(${turn * 360} 20 20)`} />
    <line x1={20} y1={20} x2={28} y2={20} stroke={color} strokeWidth={3.5} strokeLinecap="round" />
  </svg>
);

/** "The catch: it maps what you ask about, not your whole codebase. And it checks for updates about once a day, unless you turn that off." */
export const Catch: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const tMaps = wf("catch", "maps");
  const tNot = wf("catch", "not");
  const tWhole = wf("catch", "whole");
  const tChecks = wf("catch", "checks");
  const tOnce = wf("catch", "once");
  const tTurn = wf("catch", "turn");
  const tOff = wf("catch", "off");
  const card = pop(f, 2, fps);
  const line2 = pop(f, tChecks, fps, 16);
  const offP = clampI(f, tOff, tOff + 10);
  const win = pop(f, tMaps - 4, fps);
  const outline = clampI(f, tNot, tWhole + 10);
  const term = pop(f, tTurn - 8, fps);
  const typed = OFF.slice(0, Math.max(0, Math.floor((f - tTurn + 2) * 1.8)));
  const r = MCO.row;
  const per = 2 * (r.w + r.h);
  return (
    <>
      <Sfx name="thud" at={2} volume={0.35} />
      <Sfx name="whoosh" at={tMaps - 4} volume={0.2} />
      <Sfx name="scan" at={tNot} volume={0.18} dur={30} />
      <Sfx name="pop" at={tChecks} volume={0.3} />
      <Sfx name="ticker" at={tOnce} volume={0.14} dur={16} />
      <Sfx name="click" at={tTurn} volume={0.2} />
      <Sfx name="click" at={tTurn + 10} volume={0.2} />
      <Sfx name="thud" at={tOff} volume={0.3} />
      <Space />
      <Header title="The catch" accent={C.accent} />
      <CatchCard
        x={110}
        y={430}
        p={card}
        text={
          <div>
            <div>Maps what you ask, not the whole repo.</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 14, fontSize: 34, color: offP > 0 ? `rgba(245,245,247,${1 - 0.55 * offP})` : C.text, opacity: line2, transform: `translateY(${(1 - line2) * 16}px)` }}>
              <Clock turn={clampI(f, tOnce, tOnce + 30)} color={offP > 0 ? C.muted : C.accent} />
              Checks for updates about once a day.
            </div>
          </div>
        }
      />
      <div style={{ opacity: win, transform: `translateY(${(1 - win) * 50}px)` }}>
        <Window kind="browser" title="mco-runtime.architecture.html" {...WIN}>
          <McoPane pw={WIN.w} ph={WIN.h - 52} cx={720} cy={430} scale={0.66} dim={<McoDim amount={1} />}>
            <svg style={{ position: "absolute", left: r.x - 8, top: r.y - 8, overflow: "visible" }} width={r.w + 16} height={r.h + 16}>
              <rect x={4} y={4} width={r.w + 8} height={r.h + 8} rx={14} fill="none" stroke={C.accent} strokeWidth={5} strokeDasharray="16 12" opacity={outline > 0 ? 1 : 0} style={{ clipPath: `inset(0 ${(1 - outline) * 100}% 0 0)` }} />
            </svg>
          </McoPane>
          <div style={{ position: "absolute", right: 0, bottom: 0, width: 400, height: 46, background: "linear-gradient(90deg, transparent, rgba(5,6,10,0.92) 18%)" }} />
          <Credit top={WIN.h - 52 - 38} />
        </Window>
      </div>
      {term > 0 && (
        <div style={{ opacity: term, transform: `translateY(${(1 - term) * 40}px)` }}>
          <Window kind="terminal" title="turn it off" {...TERM}>
            <div style={{ padding: "8px 28px", fontFamily: F.mono, fontSize: 28, lineHeight: "50px", color: C.text, whiteSpace: "pre" }}>
              <span style={{ color: C.accent }}>&gt; </span>
              {typed}
              <span style={{ opacity: Math.floor(f / 15) % 2 === 0 ? 1 : 0, color: C.accent }}>▍</span>
            </div>
          </Window>
        </div>
      )}
      <SourceLine text="SOURCE · Archify README, check-update.mjs" />
    </>
  );
};
