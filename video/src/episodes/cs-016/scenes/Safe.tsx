import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../../../theme";
import { Sfx, useWord } from "../../../engine/kit";
import { pop, Space, Window } from "../../../productui";
import { clampI, Header, SourceLine, useProof } from "./common";

/** The "Never cut" line from SKILL.md, verbatim; the three phrases the narration names light up on their words. */
export const Safe: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const { ladder } = useProof();
  if (!ladder) return null;
  const line = ladder.split("\n").find((l) => l.startsWith("Never cut")) ?? "";
  const marks: [string, number][] = [
    ["validation at trust boundaries", wf("safe", "validation")],
    ["error handling that prevents data loss", wf("safe", "error")],
    ["security", wf("safe", "security")],
  ];
  // split the line into plain text and the marked phrases, in order
  const parts: { text: string; at?: number }[] = [];
  let rest = line;
  for (const [phrase, at] of marks) {
    const i = rest.indexOf(phrase);
    if (i < 0) continue;
    parts.push({ text: rest.slice(0, i) }, { text: phrase, at });
    rest = rest.slice(i + phrase.length);
  }
  parts.push({ text: rest });
  const winIn = pop(f, 0, fps);
  return (
    <>
      {marks.map(([, at], i) => (
        <Sfx key={i} name="pop" at={at} volume={0.3} />
      ))}
      <Space />
      <Header title="What it never cuts" />
      <div style={{ opacity: winIn, transform: `scale(${0.95 + 0.05 * winIn})` }}>
        <Window title="skills/ponytail/SKILL.md" x={60} y={520} w={960} h={560}>
          <div style={{ padding: "50px 48px", fontFamily: F.mono, fontSize: 40, lineHeight: 1.45, color: "rgba(245,245,247,0.6)" }}>
            {parts.map((p, i) =>
              p.at === undefined ? (
                <span key={i}>{p.text}</span>
              ) : (
                <span
                  key={i}
                  style={{
                    color: f >= p.at ? C.text : "rgba(245,245,247,0.6)",
                    background: `rgba(61,220,151,${0.22 * clampI(f, p.at, p.at + 6)})`,
                    borderRadius: 8,
                    padding: "0 4px",
                    boxShadow: f >= p.at ? `inset 0 -3px 0 ${C.green}` : undefined,
                  }}
                >
                  {p.text}
                </span>
              ),
            )}
          </div>
        </Window>
      </div>
      <SourceLine text="SOURCE · ponytail repo, skills/ponytail/SKILL.md" />
    </>
  );
};
