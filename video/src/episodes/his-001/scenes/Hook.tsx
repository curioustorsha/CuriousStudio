import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../../../theme";
import { ease, Header, Sfx, Title, useTiming } from "../../../engine/kit";
import { LogoKicker } from "../../../logos";
import { Chip, CITY, crowd, GATE_Y, World } from "./world";

export const HookHeader: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <div style={{ opacity }}>
    <Header>
      <LogoKicker logo="irctc" text="TATKAL" />
      <Title size={84}>
        10:00. <span style={{ color: C.accent }}>Everyone at once.</span>
      </Title>
    </Header>
  </div>
);

export type HookCues = { tTen: number; tAll: number; tHow: number };
export const useHookCues = (): HookCues => {
  const t = useTiming();
  return { tTen: t.wf("hook", "ten"), tAll: t.wf("hook", "all"), tHow: t.wf("hook", "how") };
};

/**
 * The hook's district at any frame `f`: the clock flips 9:59 → 10:00, the crowd launches from every home and
 * bunches up at the gate, IRCTC's sign glows and a "?" pops over the gate. Intro, outro and CTA reuse it.
 */
export const HookWorld: React.FC<{ f: number; c: HookCues; dim?: number }> = ({ f, c, dim = 1 }) => {
  const ten = f >= c.tTen;
  const ring = ten ? Math.min(1, (f - c.tTen) / 22) : 0;
  const q = f >= c.tHow + 6 ? Math.min(1, (f - c.tHow - 6) / 8) : 0;
  const glow = 0.7 * ease(f, c.tHow, c.tHow + 10);
  return (
    <World
      cam={CITY}
      dim={dim}
      clock={{ time: ten ? "10:00" : "9:59", ring }}
      hall={{ glow, rack: 0.5 + 0.4 * ease(f, c.tAll, c.tAll + 30) }}
      pulses={crowd(f, c.tAll, { queue: true, n: 34, every: 1.6, speed: 0.15 })}
      overlay={<Chip x={7.5} y={GATE_Y} z={0.6} text="?" color={C.text} size={36} p={q} lift={64} />}
    />
  );
};

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useHookCues();

  return (
    <>
      <Sfx name="ticker" at={0} volume={0.22} dur={Math.max(1, c.tTen)} />
      <Sfx name="ding" at={c.tTen} volume={0.35} />
      <Sfx name="whoosh" at={c.tAll} volume={0.3} />
      <Sfx name="pop" at={c.tHow + 6} volume={0.4} />

      <HookHeader />
      <HookWorld f={frame} c={c} />
    </>
  );
};
