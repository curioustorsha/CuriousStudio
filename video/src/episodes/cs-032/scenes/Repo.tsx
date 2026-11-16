import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../../../theme";
import { Sfx, useWord } from "../../../engine/kit";
import { CodePane, pop, RepoCard, Space, useProofText, Window } from "../../../productui";
import { RemotionLogo } from "../../../logos";
import { clampI, Header, PROOF, SourceLine, STARS, Tag } from "./common";

/** "Behind them are Remotion's own skills, made by the Remotion team." Repo card, then our animate skill loading it. */
export const Repo: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const excerpt = useProofText(`${PROOF}/pipeline/animate-SKILL-excerpt.md`);
  if (!excerpt) return null;
  const tOwn = wf("repo", "own");
  const tTeam = wf("repo", "team");
  const win = pop(f, tOwn - 2, fps);
  const ring = clampI(f, tOwn + 4, tOwn + 16);
  return (
    <>
      <Sfx name="whoosh" at={0} volume={0.25} />
      <Sfx name="ticker" at={4} volume={0.14} dur={tTeam - 4} />
      <Sfx name="pop" at={tOwn - 2} volume={0.3} />
      <Sfx name="ding" at={tTeam} volume={0.3} />
      <Space />
      <Header title="Behind every video" />
      <RepoCard repo="skills" maker="remotion-dev" byline="Official, by the Remotion team" stars={STARS} full at={0} countFrom={4} countTo={tTeam} x={110} y={430}>
        <div style={{ position: "absolute", right: 44, top: 40 }}>
          <RemotionLogo size={88} />
        </div>
      </RepoCard>
      <div style={{ opacity: win, transform: `translateY(${(1 - win) * 80}px)` }}>
        <Window kind="editor" title=".claude/skills/animate/SKILL.md" x={60} y={800} w={960} h={330}>
          <CodePane code={excerpt} size={34} spans={[{ line: 3, text: "remotion-best-practices", p: ring }]} />
        </Window>
        <Tag text="OUR PIPELINE" p={win} top={1150} right={70} color={C.accent} />
      </div>
      <SourceLine text="SOURCE · GitHub API, checked 15 Nov 2026 · our animate skill" />
    </>
  );
};
