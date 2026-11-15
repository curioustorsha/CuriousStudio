import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "../../../theme";
import { Sfx, useWord } from "../../../engine/kit";
import { CodePane, Space, Window } from "../../../productui";
import { clampI, Header, SourceLine, typedScroll, useProof } from "./common";

const LH = 17 * 1.55;
// The maker's exact benchmark prompt (examples/debounce.md).
const PROMPT = "Add debounce to a search input in vanilla JavaScript. It currently fires an API call on every keystroke.";

/** The long answer typing itself, at any frame `f` (the intro and the loop reuse it). */
export const HookView: React.FC<{ f: number; tStart: number; tEnd: number; dim?: number; header?: boolean }> = ({ f, tStart, tEnd, dim = 1, header = true }) => {
  const { before } = useProof();
  if (!before) return null;
  const total = before.split("\n").length;
  const shown = clampI(f, tStart, tEnd, 0, total);
  const count = Math.round(clampI(f, tStart, tEnd, 0, 116));
  return (
    <>
      <Space />
      <div style={{ opacity: dim }}>
        {header && <Header title="Debounce one search box" />}
        <Window title="search.js" x={60} y={440} w={960} h={800} tilt={Math.sin(f / 50) * 2}>
          {f < tStart ? (
            <div style={{ padding: "36px 40px", fontFamily: F.mono, fontSize: 32, lineHeight: 1.45, color: C.text }}>
              <span style={{ color: C.accent }}>&gt; </span>
              {PROMPT.slice(0, Math.floor(clampI(f, 2, tStart - 4, 0, PROMPT.length)))}
              <span style={{ color: C.accent, opacity: Math.floor(f / 12) % 2 ? 0 : 1 }}>▍</span>
            </div>
          ) : (
            <CodePane code={before} shown={shown} scroll={typedScroll(shown, 26, LH)} size={17} />
          )}
        </Window>
        <div
          style={{
            position: "absolute",
            right: 90,
            top: 1120,
            padding: "14px 24px",
            borderRadius: 16,
            background: "rgba(255,92,92,0.12)",
            border: `2px solid ${C.red}`,
            fontFamily: F.mono,
            fontWeight: 700,
            fontSize: 40,
            color: C.red,
            opacity: clampI(f, tStart, tStart + 8),
          }}
        >
          {count} lines
        </div>
        {header && <SourceLine text="SOURCE · ponytail repo, examples/debounce.md (maker's test)" opacity={clampI(f, tEnd - 10, tEnd)} />}
      </div>
    </>
  );
};

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const tStart = wf("hook", "writes");
  const tEnd = wf("hook", "sixteen", 0, "end");
  return (
    <>
      <Sfx name="ticker" at={tStart} volume={0.2} dur={tEnd - tStart} />
      <Sfx name="impact" at={tEnd - 2} volume={0.35} />
      <HookView f={f} tStart={tStart} tEnd={tEnd} />
    </>
  );
};
