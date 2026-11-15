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

/** The real list from Ponytail's SKILL.md; each rung lights on the word that asks it. */
export const Trick: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const { ladder } = useProof();
  if (!ladder) return null;
  const rungs = rungsOf(ladder);
  const cues = [wf("trick", "exist"), wf("trick", "already"), wf("trick", "built"), wf("trick", "built") + 10, wf("trick", "built") + 20, wf("trick", "minimum")];
  const active = cues.reduce((a, t, i) => (f >= t ? i : a), -1);
  const winIn = pop(f, 0, fps);
  return (
    <>
      <Sfx name="whoosh" at={0} volume={0.25} />
      {cues.map((t, i) => (
        <Sfx key={i} name="click" at={t} volume={0.3} />
      ))}
      <Sfx name="ding" at={cues[5]} volume={0.35} />
      <Space />
      <Header title="The trick: one short list" />
      <div style={{ opacity: winIn, transform: `translateY(${(1 - winIn) * 60}px)` }}>
        <Window title="skills/ponytail/SKILL.md" x={60} y={440} w={960} h={800} tilt={Math.sin(f / 60) * 2}>
          <div style={{ padding: "34px 40px", fontFamily: F.mono, color: C.text }}>
            <div style={{ fontSize: 26, color: C.muted, marginBottom: 26 }}>Take the first option that fully works:</div>
            {rungs.map((r, i) => {
              const on = i === active;
              const done = i < active;
              const p = clampI(f, cues[i] - 2, cues[i] + 6);
              return (
                <div
                  key={i}
                  style={{
                    fontSize: 29,
                    lineHeight: 1.3,
                    padding: "16px 22px",
                    marginBottom: 12,
                    borderRadius: 14,
                    border: `2px solid ${on ? C.accent : "transparent"}`,
                    background: on ? "rgba(255,181,71,0.10)" : "transparent",
                    boxShadow: on ? `0 0 40px ${C.accent}33` : undefined,
                    color: on ? C.text : done ? "rgba(245,245,247,0.55)" : "rgba(245,245,247,0.28)",
                    transform: `translateX(${on ? 10 * p : 0}px)`,
                  }}
                >
                  {r}
                </div>
              );
            })}
          </div>
        </Window>
      </div>
      <SourceLine text="SOURCE · ponytail repo, skills/ponytail/SKILL.md" />
    </>
  );
};
