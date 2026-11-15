import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../../../theme";
import { ease, Header, Sfx, Title, useWord } from "../../../engine/kit";
import { LogoKicker } from "../../../logos";
import { Chip, CITY, JAM, JAM_MID, jamPhones, trafficPhones, World, type SegState } from "./world";

export const HookHeader: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <div style={{ opacity }}>
    <Header>
      <LogoKicker logo="googlemaps" text="GOOGLE MAPS" />
      <Title size={84}>
        Jam ahead. <span style={{ color: C.red }}>How?</span>
      </Title>
    </Header>
  </div>
);

/** Route tints in the hook / outro state: green everywhere, the jam stretch red (`red` 0→1, piece by piece). */
export const hookSeg =
  (frame: number, tJam: number, red: number | null = null) =>
  (i: number): SegState => {
    if (i < JAM[0] || i > JAM[1]) return { tint: 0, on: 0.75 };
    const k = i - JAM[0];
    const r = red ?? ease(frame, tJam + k * 4, tJam + k * 4 + 8);
    return { tint: r, on: 0.9 };
  };

/**
 * The hook's city at any frame `f`, with its cue frames. The CTA's last frames draw it at f = 0 so the video
 * loops into the hook; the cover uses its settled state.
 */
export const HookWorld: React.FC<{ f: number; tMaps: number; tJam: number; tBefore: number; dim?: number }> = ({ f, tMaps, tJam, tBefore, dim = 1 }) => {
  const gap = ease(f, tBefore, tBefore + 16);
  const slow = ease(f, tJam, tJam + 16);
  const ring = tJam > 0 && f >= tJam ? Math.max(0, 1 - (f - tJam) / 24) : 0;
  const bounce = ease(f, tMaps, tMaps + 14, 0, 1);
  const q = f >= tBefore + 10 ? Math.min(1, (f - tBefore - 10) / 8) : 0;
  return (
    <World
      cam={CITY}
      dim={dim}
      route={{ progress: 1, opacity: 1 }}
      seg={(i) => {
        const s = hookSeg(f, tJam)(i);
        return i >= JAM[0] && i <= JAM[1] ? { ...s, glow: ring } : s;
      }}
      gap={gap}
      you={{ label: 1, ring: 1 }}
      office={{ label: 1 }}
      goog={{ bounce: tMaps > 0 && f >= tMaps ? bounce : 0, rack: 0.4 }}
      phones={[...trafficPhones(f), ...jamPhones(f, 0.35 + 0.65 * slow)]}
      overlay={<Chip x={JAM_MID[0]} y={JAM_MID[1]} text="?" color={C.text} size={38} p={q} lift={70} />}
    />
  );
};

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tMaps = wf("hook", "google");
  const tJam = wf("hook", "jam");
  const tBefore = wf("hook", "before");

  return (
    <>
      <Sfx name="whoosh" at={0} volume={0.3} />
      <Sfx name="pop" at={tMaps} volume={0.3} />
      <Sfx name="error" at={tJam} volume={0.22} />
      <Sfx name="pop" at={tBefore + 10} volume={0.4} />

      <HookHeader />
      <HookWorld f={frame} tMaps={tMaps} tJam={tJam} tBefore={tBefore} />
    </>
  );
};
