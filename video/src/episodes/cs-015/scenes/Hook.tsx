import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../../../theme";
import { Sfx, useTiming } from "../../../engine/kit";
import { ChatPane, CodePane, pop, Space, Window } from "../../../productui";
import { sixQuestions } from "./After";
import { BarCount, changedLines, clampI, Header, lineCount, SourceLine, useProof } from "./common";
import { PROMPT } from "./Task";

export type HookCues = { tVague: number; tGuesses: number; tFile: number; tAsk: number; end: number };

export const useHookCues = (): HookCues => {
  const t = useTiming();
  return {
    tVague: t.wf("hook", "vague"),
    tGuesses: t.wf("hook", "guesses"),
    tFile: t.wf("hook", "file"),
    tAsk: t.wf("hook", "ask"),
    end: t.sceneFrames("hook"),
  };
};

const SIZE = 22;
const LH = SIZE * 1.55;
const ED = { x: 60, y: 600, w: 960, h: 380 };

/**
 * The vague prompt types in; plain Claude's real edit floods the editor (+15 on "guesses"); on "file" the real
 * reply with the file slides up over it, its first questions landing on "ask first". All text from the proof files.
 */
export const HookView: React.FC<{ f: number; cues: HookCues; dim?: number }> = ({ f, cues, dim = 1 }) => {
  const { fps } = useVideoConfig();
  const { fixture, before, afterReply } = useProof();
  if (!fixture || !before || !afterReply) return null;
  const { tVague, tGuesses, tFile, tAsk } = cues;
  const typed = Math.floor(clampI(f, 2, tVague + 4, 0, PROMPT.length));
  const total = lineCount(before);
  const base = lineCount(fixture);
  const shown = clampI(f, tVague + 2, tGuesses + 4, 24, total);
  const scroll = spring({ frame: f - tVague, fps, config: { damping: 200, stiffness: 60 } }) * 23 * LH;
  const plus = pop(f, tGuesses, fps, 12);
  const chat = spring({ frame: f - tFile + 2, fps, config: { damping: 200, stiffness: 120 } });
  const { qs } = sixQuestions(afterReply);
  const qShown = clampI(f, tAsk - 4, tAsk + 14, 0, 3);
  return (
    <>
      <Space />
      <div style={{ opacity: dim }}>
        <Header title="Vague job? It guesses." />
        <Window kind="terminal" title="claude" x={60} y={430} w={960} h={140}>
          <div style={{ padding: "26px 36px", fontFamily: F.mono, fontSize: 36, color: C.text, whiteSpace: "pre" }}>
            <span style={{ color: C.accent }}>&gt; </span>
            {PROMPT.slice(0, typed)}
            <span style={{ color: C.accent, opacity: Math.floor(f / 12) % 2 === 0 ? 1 : 0 }}>▍</span>
          </div>
        </Window>
        <Window title="cart.js" {...ED} dim>
          <CodePane code={before} shown={f < tVague + 2 ? 24 : shown} scroll={scroll} size={SIZE} marks={changedLines(fixture, before)} markP={clampI(f, tVague + 2, tVague + 10)} />
        </Window>
        <BarCount lines={Math.round(clampI(f, tVague + 2, tGuesses + 4, base, total))} delta={total - base} deltaP={plus} cy={ED.y + 26} color={C.muted} deltaColor={C.red} />
        {f >= tFile - 4 && (
          <div style={{ opacity: chat, transform: `translateY(${(1 - chat) * 500}px)` }}>
            <Window title="Claude · with the file" x={60} y={760} w={960} h={480} accent={C.accent}>
              <ChatPane blocks={qs.slice(0, 3)} shown={qShown} size={34} gap={10} ring={{ 0: clampI(f, tAsk + 2, tAsk + 12) }} />
            </Window>
          </div>
        )}
        <SourceLine text="SOURCE · Curiously test, 15 Nov 2026 (one run each)" opacity={clampI(f, tVague, tVague + 8)} />
      </div>
    </>
  );
};

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const cues = useHookCues();
  return (
    <>
      <Sfx name="ticker" at={2} volume={0.14} dur={cues.tVague} />
      <Sfx name="data" at={cues.tVague + 2} volume={0.2} dur={cues.tGuesses - cues.tVague} />
      <Sfx name="thud" at={cues.tGuesses} volume={0.4} />
      <Sfx name="whoosh" at={cues.tFile - 4} volume={0.3} />
      <Sfx name="ding" at={cues.tAsk + 2} volume={0.35} />
      <HookView f={f} cues={cues} />
    </>
  );
};
