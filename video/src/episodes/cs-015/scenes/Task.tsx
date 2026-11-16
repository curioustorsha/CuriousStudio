import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../../../theme";
import { Sfx, useWord } from "../../../engine/kit";
import { CodePane, CountPill, pop, Space, Window } from "../../../productui";
import { clampI, Header, lineCount, SourceLine, Tag, useProof } from "./common";

/** Our test prompt, exactly as given to both runs. */
export const PROMPT = "Add discount codes to the cart.";

/** "We gave Claude a vague job: add discount codes to a cart." The prompt types into a terminal above the real fixture. */
export const Task: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const { fixture } = useProof();
  if (!fixture) return null;
  const tGave = wf("task", "gave");
  const tVague = wf("task", "vague");
  const tAdd = wf("task", "add");
  const tCart = wf("task", "cart", 0, "end");
  const ed = pop(f, tGave, fps);
  const term = pop(f, 0, fps);
  const typed = Math.floor(clampI(f, tAdd - 2, tCart, 0, PROMPT.length));
  const typing = f >= tAdd - 2 && f < tCart;
  return (
    <>
      <Sfx name="whoosh" at={tGave} volume={0.25} />
      <Sfx name="pop" at={tVague} volume={0.3} />
      <Sfx name="ticker" at={tAdd - 2} volume={0.14} dur={tCart - tAdd + 2} />
      <Space />
      <Header title="One vague job" />
      <Tag text="OUR TEST · SAME TASK, TWO FRESH CLAUDES" p={pop(f, tVague, fps)} f={f} blinkFrom={tVague} top={420} left={64} />
      <div style={{ opacity: term, transform: `translateY(${(1 - term) * 40}px)` }}>
        <Window kind="terminal" title="claude" x={60} y={476} w={960} h={170} tilt={Math.sin(f / 55) * 1.5}>
          <div style={{ padding: "30px 36px", fontFamily: F.mono, fontSize: 36, color: C.text, whiteSpace: "pre" }}>
            <span style={{ color: C.accent }}>&gt; </span>
            {PROMPT.slice(0, typed)}
            <span style={{ color: C.accent, opacity: typing || Math.floor(f / 12) % 2 === 0 ? 1 : 0 }}>▍</span>
          </div>
        </Window>
      </div>
      <div style={{ opacity: ed, transform: `translateY(${(1 - ed) * 80}px)` }}>
        <Window title="cart.js" x={60} y={676} w={960} h={560} tilt={Math.sin(f / 60) * 1.5}>
          <CodePane code={fixture} size={22} />
        </Window>
        <CountPill value={lineCount(fixture)} color={C.muted} y={1150} right={90} />
      </div>
      <SourceLine text="SOURCE · Curiously test, 15 Nov 2026" />
    </>
  );
};
