import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../../../theme";
import { Sfx, useWord } from "../../../engine/kit";
import { ImagePane, pop, Space, Window } from "../../../productui";
import { clampI, Credit, Header, move, PROOF, SourceLine } from "./common";

/** The ten native types, as SKILL.md and the README list them (F3). */
const TYPES = ["Architecture", "Workflow", "Sequence", "Data Flow", "Lifecycle", "ERD", "Class", "Tree", "Timeline", "Waterfall"];
const LIFE = TYPES.indexOf("Lifecycle");
const CHIP = { w: 420, h: 78, gapX: 40, gapY: 18, x: 90, y: 450 };
const chipPos = (i: number) => ({ x: CHIP.x + (i % 2) * (CHIP.w + CHIP.gapX), y: CHIP.y + Math.floor(i / 2) * (CHIP.h + CHIP.gapY) });

const WIN = { x: 90, y: 440, w: 900, h: 640 };
/** docs/assets/life/job-search.lifecycle.webp (2762×1448): the top row Saved → … → Offer sits at y ≈ 180. */
const JOB = { src: `${PROOF}/job-search.lifecycle.webp`, natW: 2762, natH: 1448 };

/** "And it's not just for code. It knows ten diagram types, and it'll even map out a job search." */
export const Beyond: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const tKnows = wf("beyond", "knows");
  const tTen = wf("beyond", "ten");
  const tMap = wf("beyond", "map");
  const tJob = wf("beyond", "job");
  const end = wf("beyond", "search", 0, "end");
  // chips arrive with the cut (no empty frame on "not just for code"); the counter lands on 10 on "ten"
  const start = 2;
  const count = Math.round(clampI(f, tKnows - 6, tTen + 4, 0, 10));
  const fold = move(f, tMap - 6, fps, 140);
  const win = pop(f, tMap + 2, fps);
  const pan = clampI(f, tMap + 4, end, 0, 1);
  const panE = pan * pan * (3 - 2 * pan);
  return (
    <>
      {TYPES.map((_, i) => (
        <Sfx key={i} name="pop" at={start + i * 2} volume={0.12} dur={20} />
      ))}
      <Sfx name="ding" at={tTen} volume={0.3} />
      <Sfx name="whoosh" at={tMap + 2} volume={0.25} />
      <Sfx name="pop" at={tJob} volume={0.2} />
      <Space />
      <Header title="Not just code" />
      {win < 1 &&
        TYPES.map((name, i) => {
          const p = pop(f, start + i * 2, fps, 14);
          const isLife = i === LIFE;
          const pos = chipPos(i);
          const gone = isLife ? 0 : fold;
          const x = isLife ? pos.x + (WIN.x + WIN.w / 2 - CHIP.w / 2 - pos.x) * fold : pos.x;
          const y = isLife ? pos.y + (WIN.y + 200 - pos.y) * fold : pos.y;
          return (
            <div
              key={name}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: CHIP.w,
                height: CHIP.h,
                borderRadius: 18,
                border: `2px solid ${isLife && fold > 0 ? C.accent : "rgba(255,181,71,0.55)"}`,
                background: isLife && fold > 0 ? "rgba(255,181,71,0.16)" : "rgba(255,181,71,0.05)",
                boxShadow: isLife && fold > 0 ? `0 0 ${40 * fold}px ${C.accent}66` : undefined,
                display: "flex",
                alignItems: "center",
                paddingLeft: 28,
                gap: 18,
                fontFamily: F.mono,
                fontWeight: 700,
                fontSize: 32,
                color: C.text,
                opacity: p * (1 - gone) * (1 - win),
                transform: `scale(${(0.6 + 0.4 * p) * (1 - 0.3 * gone)})`,
              }}
            >
              <span style={{ color: C.accent, fontSize: 22, width: 34 }}>{String(i + 1).padStart(2, "0")}</span>
              {name}
            </div>
          );
        })}
      {win < 1 && (
        <div style={{ position: "absolute", left: 90, right: 90, top: 960, display: "flex", alignItems: "baseline", justifyContent: "center", gap: 22, opacity: clampI(f, tKnows - 8, tKnows - 2) * (1 - fold) }}>
          <span style={{ fontFamily: F.sans, fontWeight: 900, fontSize: 150, color: C.accent, letterSpacing: -4, transform: `scale(${1 + 0.12 * Math.sin(clampI(f, tTen, tTen + 10) * Math.PI)})`, display: "inline-block" }}>{count}</span>
          <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 54, color: C.text }}>diagram types</span>
        </div>
      )}
      {win > 0 && (
        <div style={{ opacity: win, transform: `scale(${0.4 + 0.6 * win})`, transformOrigin: `${WIN.x + WIN.w / 2}px ${WIN.y + 240}px` }}>
          <Window kind="browser" title="job-search.lifecycle.html" {...WIN}>
            <ImagePane {...JOB} pw={WIN.w} ph={WIN.h - 52} cx={720 + (2140 - 720) * panE} cy={400} scale={0.74} label="Maker's life example: docs/assets/life/job-search.lifecycle.webp" />
          </Window>
          <Credit top={WIN.y + WIN.h + 16} />
        </div>
      )}
      <SourceLine text="SOURCE · Archify SKILL.md, docs/cases/life" />
    </>
  );
};
