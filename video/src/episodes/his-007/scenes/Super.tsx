import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../../../theme";
import { ease, Header, IsoPath, IsoPulse, Reveal, Sfx, Source, Title, useIn, useWord } from "../../../engine/kit";
import { AlphabetWordmark, DeepMindWordmark, LogoKicker } from "../../../logos";
import { hookSeg } from "./Hook";
import { at, Chip, CITY, jamPhones, pinTop, ROUTE, ROUTE_LEN, subPath, trafficPhones, World, type P2 } from "./world";

/** Your route split into three supersegments (runs of connected road), with a small gap between each. */
const CUTS = [0, ROUTE_LEN * 0.36, ROUTE_LEN * 0.68, ROUTE_LEN];
export const BANDS: P2[][] = [0, 1, 2].map((k) => subPath(ROUTE, CUTS[k] + (k ? 0.32 : 0), CUTS[k + 1] - (k < 2 ? 0.32 : 0)));
export const BAND_MID: P2[] = [0, 1, 2].map((k) => at(ROUTE, (CUTS[k] + CUTS[k + 1]) / 2));
export const BAND_COLORS = [C.cyan, C.text, C.cyan];

/** Thick supersegment bands over the route; `p(k)` 0→1 draws band k on. */
export const Bands: React.FC<{ p: (k: number) => number; glow?: number }> = ({ p, glow = 0.6 }) => (
  <>
    {BANDS.map((pts, k) => (p(k) > 0.001 ? <IsoPath key={k} points={pts} color={BAND_COLORS[k]} progress={p(k)} width={16} glow={glow} z={0.04} /> : null))}
  </>
);

/** DeepMind joins, and the route is cut into supersegments that share a lot of traffic. */
export const Super: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tDeep = wf("super", "deepmind");
  const tAlpha = wf("super", "alphabet");
  const tSplit = wf("super", "split");
  const tSuper = wf("super", "supersegments");
  const tShare = wf("super", "share");

  const pDeep = useIn(tDeep - 2, { damping: 12, stiffness: 200 });
  const pAlpha = useIn(tAlpha - 2, { damping: 13, stiffness: 200 });
  const pLabel = useIn(tSuper, { damping: 11, stiffness: 220 });
  const pin = pinTop(CITY);
  const band = (k: number) => ease(frame, tSplit + k * 6, tSplit + k * 6 + 14);
  const dimRoute = ease(frame, tSplit, tSplit + 12);

  return (
    <>
      <Sfx name="swoosh" at={tDeep - 2} volume={0.3} />
      <Sfx name="pop" at={tAlpha - 2} volume={0.3} />
      {[0, 1, 2].map((k) => (
        <Sfx key={k} name="click" at={tSplit + k * 6} volume={0.25} />
      ))}
      <Sfx name="ding" at={tSuper} volume={0.25} />

      <Header>
        <Reveal at={0}>
          <LogoKicker logo="deepmind" text="DEEPMIND · 2020" />
        </Reveal>
        <Reveal at={Math.max(4, tSplit - 4)}>
          <Title size={80}>
            Super<span style={{ color: C.cyan }}>segments</span>
          </Title>
        </Reveal>
      </Header>

      <World
        cam={CITY}
        route={{ progress: 1, opacity: 0.85 * (1 - 0.6 * dimRoute) }}
        seg={hookSeg(frame, 0, 1)}
        you={{ label: 1 - dimRoute }}
        phones={[...trafficPhones(frame, 1 - 0.5 * dimRoute), ...jamPhones(frame, 1)]}
        goog={{ rack: frame >= tDeep ? 0.8 : 0.3, glow: 0.5 * pDeep }}
        overlay={
          <>
            <Bands p={band} />
            {frame >= tShare &&
              BANDS.map((pts, k) => (
                <IsoPulse key={k} points={pts} t={((frame - tShare + k * 9) % 30) / 30} color={C.accent} size={10} trail={0.8} frame={frame} />
              ))}
            <Chip x={BAND_MID[1][0]} y={BAND_MID[1][1]} text="SUPERSEGMENT" color={C.cyan} size={24} p={frame >= tSuper ? pLabel : 0} lift={56} />
          </>
        }
      />

      <div style={{ position: "absolute", left: pin.x + 34, top: pin.y - 70, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10, opacity: 1 - dimRoute }}>
        <div style={{ opacity: frame >= tDeep - 2 ? Math.min(1, pDeep * 1.5) : 0, transform: `translateY(${(1 - Math.min(1, pDeep)) * -40}px) scale(${0.7 + 0.3 * Math.min(1, pDeep)})`, transformOrigin: "left center" }}>
          <DeepMindWordmark height={44} style={{ boxShadow: `0 0 0 3px ${C.cyan}, 0 0 24px ${C.cyan}66` }} />
        </div>
        <div style={{ opacity: frame >= tAlpha - 2 ? Math.min(1, pAlpha * 1.5) : 0, transform: `translateX(${(1 - Math.min(1, pAlpha)) * 30}px)`, marginLeft: 10 }}>
          <AlphabetWordmark height={32} />
        </div>
      </div>

      <Source text="Google; DeepMind, 2020" at={tDeep} />
    </>
  );
};
