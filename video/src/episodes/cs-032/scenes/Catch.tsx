import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../../../theme";
import { Sfx, useWord } from "../../../engine/kit";
import { CatchCard, pop, Space, Window } from "../../../productui";
import { clampI, Header, SourceLine } from "./common";

const Chip: React.FC<{ text: string; p: number }> = ({ text, p }) => (
  <div style={{ padding: "8px 18px", borderRadius: 12, border: "2px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.06)", fontFamily: F.mono, fontWeight: 700, fontSize: 28, color: C.text, opacity: p, transform: `translateY(${(1 - p) * -20}px) scale(${0.7 + 0.3 * p})` }}>{text}</div>
);

const Row: React.FC<{ k: string; v: React.ReactNode; p: number; sub?: string }> = ({ k, v, p, sub }) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: 24, padding: "20px 34px", borderBottom: "1px solid rgba(255,255,255,0.07)", opacity: p, transform: `translateX(${(1 - p) * 40}px)` }}>
    <div style={{ width: 250, flexShrink: 0, fontFamily: F.mono, fontSize: 23, color: C.muted, letterSpacing: 1 }}>{k}</div>
    <div>
      <div style={{ fontFamily: F.sans, fontSize: 32, fontWeight: 700, color: C.text }}>{v}</div>
      {sub && <div style={{ fontFamily: F.mono, fontSize: 20, color: C.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  </div>
);

/** "The catch: you need Node and a Remotion project, and companies over three people need a paid Remotion licence." */
export const Catch: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const tNode = wf("catch", "node");
  const tProject = wf("catch", "project");
  const tThree = wf("catch", "three");
  const tPaid = wf("catch", "paid");
  const tLicence = wf("catch", "licence");
  const card = pop(f, 4, fps);
  const line = clampI(f, tThree - 4, tThree + 8);
  // the empty pricing page arrives after "project", so the frame never sits half empty; its rows fill on their words
  const win = pop(f, tProject + 6, fps);
  return (
    <>
      <Sfx name="thud" at={4} volume={0.4} />
      <Sfx name="pop" at={tNode} volume={0.3} />
      <Sfx name="pop" at={tProject - 6} volume={0.3} />
      <Sfx name="whoosh" at={tProject + 6} volume={0.2} />
      <Sfx name="click" at={tPaid} volume={0.3} />
      <Sfx name="click" at={tLicence} volume={0.3} />
      <Space />
      <Header title="The catch" accent={C.accent} />
      <CatchCard
        x={110}
        y={440}
        p={card}
        text={
          <div>
            <div style={{ display: "flex", gap: 14, alignItems: "center", fontSize: 26, color: C.muted, fontWeight: 500 }}>
              <span style={{ opacity: clampI(f, tNode - 8, tNode) }}>Needs</span>
              <Chip text="Node.js" p={pop(f, tNode, fps, 14)} />
              <Chip text="a Remotion project" p={pop(f, tProject - 6, fps, 14)} />
            </div>
            <div style={{ marginTop: 18, opacity: line, transform: `translateY(${(1 - line) * 16}px)` }}>Free up to 3 people. Bigger companies pay.</div>
          </div>
        }
      />
      <div style={{ opacity: win, transform: `translateY(${(1 - win) * 80}px)` }}>
        <Window kind="browser" title="remotion.dev/docs/license" x={60} y={810} w={900} h={400} tilt={Math.sin(f / 60) * 1.5}>
          <div style={{ paddingTop: 6 }}>
            <Row k="Free License" v="Individuals, companies up to 3" p={pop(f, tThree, fps)} />
            <Row k="Company License" v={<span style={{ color: C.accent }}>Paid, for everyone else</span>} sub="Creators: $25 per seat a month" p={pop(f, tPaid - 2, fps)} />
            <Row k="Skills repo" v="No licence file" sub="github.com/remotion-dev/skills" p={pop(f, tLicence - 2, fps)} />
          </div>
        </Window>
      </div>
      <SourceLine text="SOURCE · remotion.dev licence pricing · GitHub API, checked 15 Nov 2026" />
    </>
  );
};
