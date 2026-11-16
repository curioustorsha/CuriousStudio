import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../../../theme";
import { Sfx, useWord } from "../../../engine/kit";
import { boldHead, ChatPane, CodePane, Label, pop, Ring, Space, Window } from "../../../productui";
import { BarCount, changedLines, chatBlocks, clampI, Header, lineCount, SourceLine, useProof } from "./common";

const SIZE = 20;
const LH = SIZE * 1.55;
const ED = { x: 60, y: 460, w: 960, h: 436 };
const SCROLL_TO = 23 * LH; // brings the new DISCOUNT_CODES block (line 25 on) into view

/** Picks the "I picked these rules without checking with you" block and the four numbered heads after it. */
export const pickedRules = (reply: string) => {
  const blocks = chatBlocks(reply);
  const i = blocks.findIndex((b) => b.startsWith("I picked these rules"));
  return i < 0 ? blocks.slice(0, 5) : [blocks[i], ...blocks.slice(i + 1, i + 5).map(boldHead)];
};

/** "Plain Claude just started. Fifteen new lines, built on rules it guessed, and it only told us after." */
export const Before: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const { fixture, before, beforeReply } = useProof();
  if (!fixture || !before || !beforeReply) return null;
  const tStarted = wf("before", "started");
  const tFifteen = wf("before", "fifteen");
  const tRules = wf("before", "rules");
  const tGuessed = wf("before", "guessed");
  const tOnly = wf("before", "only");
  const tAfter = wf("before", "after");
  const total = lineCount(before);
  const base = lineCount(fixture);
  const marks = changedLines(fixture, before);
  // the new lines type in fast from "started", while the editor scrolls down to them
  const shown = clampI(f, tStarted, tFifteen, 24, total);
  const scroll = spring({ frame: f - tStarted, fps, config: { damping: 200, stiffness: 50 } }) * SCROLL_TO;
  const count = Math.round(clampI(f, tStarted, tFifteen + 4, base, total));
  const plus = pop(f, tFifteen + 2, fps, 12);
  const ringP = clampI(f, tRules, tGuessed + 8);
  const chatIn = pop(f, tOnly - 4, fps);
  const blocks = pickedRules(beforeReply);
  const listShown = clampI(f, tAfter, tAfter + 14, 1, blocks.length);
  // DISCOUNT_CODES comment + table: lines 25–29, in scene coordinates (window body starts 52px under its top)
  const ringTop = ED.y + 52 + 18 - scroll + 24 * LH;
  return (
    <>
      <Sfx name="data" at={tStarted} volume={0.2} dur={tFifteen - tStarted} />
      <Sfx name="thud" at={tFifteen + 2} volume={0.4} />
      <Sfx name="click" at={tRules} volume={0.3} />
      <Sfx name="whoosh" at={tOnly - 4} volume={0.25} />
      <Sfx name="click" at={tAfter} volume={0.3} />
      <Space />
      <Header title="Without the file" />
      <Label text="WITHOUT" color={C.muted} style={{ top: 420, left: 70 }} />
      <Window title="cart.js" {...ED} dim>
        <CodePane code={before} shown={shown} scroll={scroll} size={SIZE} marks={marks} markP={clampI(f, tStarted, tStarted + 8)} />
      </Window>
      <Ring x={ED.x + 24} y={ringTop - 4} w={ED.w - 48} h={5 * LH + 8} p={ringP} opacity={1 - clampI(f, tOnly, tOnly + 8, 0, 0.6)} />
      <BarCount lines={count} delta={total - base} deltaP={plus} cy={ED.y + 26} color={C.muted} deltaColor={C.red} />
      <div style={{ opacity: chatIn, transform: `translateY(${(1 - chatIn) * 120}px)` }}>
        <Window title="Claude" x={60} y={ED.y + ED.h + 16} w={960} h={1246 - ED.y - ED.h - 16}>
          <ChatPane blocks={blocks} shown={listShown} size={22} gap={2} ring={{ 0: clampI(f, tOnly + 2, tOnly + 10) }} color="rgba(245,245,247,0.6)" />
        </Window>
      </div>
      <SourceLine text="SOURCE · Curiously test, 15 Nov 2026 (one run)" />
    </>
  );
};
