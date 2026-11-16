import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../../../theme";
import { Sfx, useWord } from "../../../engine/kit";
import { boldHead, ChatPane, CodePane, Label, pop, Space, Window } from "../../../productui";
import { BarCount, chatBlocks, clampI, Header, lineCount, SourceLine, Tag, useProof } from "./common";

/** The six numbered question heads and the closing "I haven't touched `cart.js` yet.", cut from the real reply. */
export const sixQuestions = (reply: string) => {
  const blocks = chatBlocks(reply);
  const qs = blocks.filter((b) => /^\d+\.\s+\*\*/.test(b)).map(boldHead);
  const last = blocks.at(-1) ?? "";
  const tail = last.match(/I haven't touched[^.]*\./)?.[0] ?? last;
  return { qs, tail };
};

/** "With the file, it wrote nothing, in our test. It asked six questions first, like before tax or after?" */
export const After: React.FC = () => {
  const f = useCurrentFrame();
  const { fps, durationInFrames: D } = useVideoConfig();
  const wf = useWord();
  const { fixture, after, afterReply } = useProof();
  if (!fixture || !after || !afterReply) return null;
  const tNothing = wf("after", "nothing");
  const tOur = wf("after", "our");
  const tSix = wf("after", "six");
  const tTax = wf("after", "tax");
  const lit = clampI(f, 0, 10);
  const zero = pop(f, tNothing, fps, 12);
  const { qs, tail } = sixQuestions(afterReply);
  const step = Math.max(3, Math.floor((tTax - 6 - tSix) / qs.length));
  const shown = clampI(f, tSix, tSix + step * qs.length, 0, qs.length) + clampI(f, D - 26, D - 12);
  const added = lineCount(after) - lineCount(fixture);
  return (
    <>
      <Sfx name="swoosh" at={0} volume={0.3} />
      <Sfx name="ding" at={tNothing + 2} volume={0.35} />
      <Sfx name="pop" at={tOur} volume={0.25} />
      {qs.map((_, i) => (
        <Sfx key={i} name="pop" at={tSix + i * step} volume={0.14} />
      ))}
      <Sfx name="click" at={tTax - 4} volume={0.35} />
      <Space />
      <Header title="With the file" accent={C.accent} />
      <Label text="WITHOUT" color={C.muted} style={{ top: 420, left: 70, opacity: 1 - lit }} />
      <Label text="WITH THE FILE" style={{ top: 420, left: 70, opacity: lit }} />
      <Tag text="OUR TEST · ONE RUN EACH" p={pop(f, tOur, fps)} f={f} blinkFrom={tOur} top={414} right={70} />
      <Window title="cart.js" x={60} y={460} w={960} h={280} dim={lit < 0.5} tilt={Math.sin(f / 60) * 1.2}>
        <CodePane code={after} size={20} />
      </Window>
      <BarCount lines={lineCount(after)} delta={added} deltaP={zero} cy={486} color={lit > 0.5 ? C.accent : C.muted} deltaColor={C.accent} />
      <Window title="Claude" x={60} y={770} w={960} h={474} tilt={Math.sin(f / 60) * 1.2}>
        <ChatPane blocks={[...qs, tail]} shown={shown} size={24} gap={4} ring={{ 2: clampI(f, tTax - 6, tTax + 4) }} />
      </Window>
      <SourceLine text="SOURCE · Curiously test, 15 Nov 2026 (one run)" />
    </>
  );
};
