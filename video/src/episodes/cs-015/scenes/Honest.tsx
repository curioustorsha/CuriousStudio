import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../../../theme";
import { Sfx, useWord } from "../../../engine/kit";
import { CodePane, CountPill, Label, pop, Space, useProofText, Window } from "../../../productui";
import { changedLines, clampI, Header, PROOF, SourceLine, Tag } from "./common";

const SIZE = 26;
const LH = SIZE * 1.55;
const SCROLL = 12 * LH; // starts at line 13, so lineTotal (14–16) sits near the top of each pane

/** "On clear bug fixes, plain Claude was already careful in our tests. The file matters when the job is vague." */
export const Honest: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const fixture = useProofText(`${PROOF}/surgical/fixture/price.js`);
  const without = useProofText(`${PROOF}/surgical/before/price.js`);
  const withFile = useProofText(`${PROOF}/surgical/after/price.js`);
  if (!fixture || !without || !withFile) return null;
  const tClear = wf("honest", "clear");
  const tCareful = wf("honest", "careful");
  const tTests = wf("honest", "tests");
  const tVague = wf("honest", "vague");
  const a = pop(f, 0, fps);
  const b = pop(f, tClear, fps);
  const same = pop(f, tCareful, fps, 14);
  const fade = clampI(f, tVague - 10, tVague + 2, 1, 0.35);
  const pane = (code: string, y: number, label: string, color: string, p: number, dim?: boolean) => (
    <div style={{ opacity: p * fade, transform: `translateY(${(1 - p) * 60}px)` }}>
      <Label text={label} color={color} style={{ top: y - 40, left: 70 }} />
      <Window title="price.js" x={60} y={y} w={960} h={300} dim={dim}>
        <CodePane code={code} size={SIZE} scroll={SCROLL} marks={changedLines(fixture, code)} markP={same} />
      </Window>
      <CountPill value={1} unit="line changed" color={color} y={y + 216} right={90} scale={0.8} opacity={same} />
    </div>
  );
  return (
    <>
      <Sfx name="whoosh" at={0} volume={0.25} />
      <Sfx name="whoosh" at={tClear} volume={0.2} />
      <Sfx name="ding" at={tCareful} volume={0.3} />
      <Sfx name="pop" at={tTests} volume={0.25} />
      <Sfx name="click" at={tVague} volume={0.3} />
      <Space />
      <Header title="Clear job? Same result." />
      <Tag text="OUR TESTS · TWO CLEAR BUG FIXES" p={pop(f, tTests, fps)} top={420} left={64} />
      {pane(without, 520, "WITHOUT", C.muted, a, true)}
      {pane(withFile, 900, "WITH THE FILE", C.accent, b)}
      <SourceLine text="SOURCE · Curiously tests, 15 Nov 2026 (cart quantity, free shipping)" />
    </>
  );
};
