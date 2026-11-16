import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../../../theme";
import { Sfx, useWord } from "../../../engine/kit";
import { pop, Space, Window } from "../../../productui";
import { clampI, Header, SourceLine, useProof } from "./common";

/** First sentence of each rung, verbatim from SKILL.md ("1. Does it need to exist?"). */
const rungsOf = (ladder: string) =>
  ladder
    .split("\n")
    .filter((l) => /^\d\. /.test(l))
    .map((l) => l.match(/^\d\. .*?[?.](?=\s|$)/)?.[0] ?? l);

/** The "Never cut:" line up to "accessibility," (verbatim), then an ellipsis. */
const neverCutOf = (ladder: string) => {
  const line = ladder.split("\n").find((l) => l.startsWith("Never cut:")) ?? "";
  const i = line.indexOf("accessibility,");
  return i > 0 ? `${line.slice(0, i + "accessibility,".length)} …` : line;
};

/** The real ladder from Ponytail's SKILL.md: rungs stack in on "ladder", each lights on the word that asks it; "Never cut" glows on "Security". */
export const Trick: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const { ladder } = useProof();
  if (!ladder) return null;
  const rungs = rungsOf(ladder);
  const never = neverCutOf(ladder);
  const tLadder = wf("trick", "ladder");
  const tSec = wf("trick", "security");
  // rung index → the word that asks it; rungs 4 and 5 are skipped by the narration
  const cue: Record<number, number> = { 0: wf("trick", "exist"), 1: wf("trick", "already"), 2: wf("trick", "browser"), 5: wf("trick", "minimum") };
  const order = [0, 1, 2, 5];
  const active = order.reduce((a, i) => (f >= cue[i] ? i : a), -1);
  const winIn = pop(f, 0, fps);
  const secOn = clampI(f, tSec - 2, tSec + 8);
  const [before, after] = never.split("security");
  return (
    <>
      <Sfx name="whoosh" at={0} volume={0.25} />
      {order.map((i) => (
        <Sfx key={i} name="click" at={cue[i]} volume={0.3} />
      ))}
      <Sfx name="ding" at={cue[5]} volume={0.35} />
      <Sfx name="thud" at={tSec} volume={0.35} />
      <Space />
      <Header title="A ladder of questions" />
      <div style={{ opacity: winIn, transform: `translateY(${(1 - winIn) * 60}px)` }}>
        <Window title="skills/ponytail/SKILL.md" x={60} y={440} w={960} h={800} tilt={Math.sin(f / 60) * 2}>
          <div style={{ padding: "28px 36px", fontFamily: F.mono, color: C.text }}>
            <div style={{ fontSize: 25, color: C.muted, marginBottom: 16 }}>Take the first option that fully works:</div>
            {rungs.map((r, i) => {
              const inP = pop(f, tLadder + i * 3, fps, 16);
              const on = i === active;
              const skipped = (i === 3 || i === 4) && active === 5;
              const asked = cue[i] !== undefined && f >= cue[i];
              const p = cue[i] !== undefined ? clampI(f, cue[i] - 2, cue[i] + 6) : 0;
              return (
                <div
                  key={i}
                  style={{
                    fontSize: 27,
                    lineHeight: 1.3,
                    padding: "12px 20px",
                    marginBottom: 8,
                    borderRadius: 14,
                    border: `2px solid ${on ? C.accent : "transparent"}`,
                    background: on ? "rgba(255,181,71,0.10)" : "transparent",
                    boxShadow: on ? `0 0 40px ${C.accent}33` : undefined,
                    color: on ? C.text : skipped ? "rgba(245,245,247,0.16)" : asked ? "rgba(245,245,247,0.6)" : "rgba(245,245,247,0.32)",
                    opacity: inP,
                    transform: `translateY(${(1 - inP) * 40}px) translateX(${on ? 10 * p : 0}px)`,
                  }}
                >
                  {r}
                </div>
              );
            })}
            <div
              style={{
                marginTop: 18,
                padding: "16px 20px",
                borderRadius: 14,
                fontSize: 25,
                lineHeight: 1.4,
                border: `2px solid ${secOn ? C.accent : "rgba(255,255,255,0.10)"}`,
                background: `rgba(255,181,71,${0.1 * secOn})`,
                boxShadow: secOn ? `0 0 ${50 * secOn}px ${C.accent}44` : undefined,
                color: secOn ? C.text : "rgba(245,245,247,0.4)",
                opacity: pop(f, tLadder + 20, fps),
              }}
            >
              {before}
              <span style={{ color: secOn ? C.accent : undefined, textDecoration: secOn ? "underline" : undefined, textUnderlineOffset: 6, fontWeight: secOn ? 700 : undefined }}>security</span>
              {after}
            </div>
          </div>
        </Window>
      </div>
      <SourceLine text="SOURCE · Ponytail, skills/ponytail/SKILL.md" />
    </>
  );
};
