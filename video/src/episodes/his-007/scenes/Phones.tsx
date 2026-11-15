import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../../../theme";
import { ease, Header, Reveal, Sfx, Source, Title, useIn, useWord } from "../../../engine/kit";
import { LogoKicker } from "../../../logos";
import { Chip, CLOSE, JAM, JAM_MID, mixCam, STREET, trafficPhones, useMove, World, type P2, type Phone, type Ping } from "./world";

/** Phones in cars on the avenue in front of the Google block: 7 amber, 2 grey (location off). */
const X0 = 6.1;
const X1 = 10.1;
const streetPhones = (frame: number, slow: number): Phone[] =>
  Array.from({ length: 9 }, (_, k) => {
    const off = k === 2 || k === 6;
    // free-flowing: spread out and quick; crawling: bunched into the middle and slow
    const speed = 0.006 * (1 - slow) + 0.0011 * slow;
    const spread = 1 - 0.45 * slow;
    const t = ((k / 9) * spread + 0.27 * slow + frame * speed * (k % 2 ? 1 : 0.85)) % 1;
    const x = X0 + t * (X1 - X0);
    return { x, y: 5 + (k % 2 ? 0.2 : -0.2), dir: [1, 0] as P2, slow, off };
  });

/** Google pools location from lots of phones; when many crawl on one road, that stretch turns slow (red). */
export const Phones: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tPools = wf("phones", "pools");
  const tCrawl = wf("phones", "crawl");
  const tTell = wf("phones", "google", 1);
  const tSlow = wf("phones", "slow");

  const glide = useMove(0, 30);
  const cam = mixCam(CLOSE, STREET, glide);

  const slow = ease(frame, tCrawl - 4, tCrawl + 20);
  const ps = streetPhones(frame, slow);
  const amber = ps.filter((p) => !p.off);

  // Every amber phone pings the Google block, staggered, on a loop from "pools"
  const pings: Ping[] = amber.flatMap((p, n) => {
    const start = tPools + n * 4;
    if (frame < start) return [];
    const local = (frame - start) % 40;
    return [{ from: [p.x, p.y] as P2, t: local / 22 }];
  });
  const rack = frame >= tPools + 14 ? 0.6 + 0.4 * Math.sin(frame * 0.4) : 0.15;
  const pTag = useIn(tPools, { damping: 11, stiffness: 200 });

  const tint = 0.5 * ease(frame, tTell, tTell + 12) + 0.5 * ease(frame, tSlow, tSlow + 12);
  const segOn = ease(frame, tTell - 6, tTell + 6);
  const pSlow = useIn(tSlow, { damping: 10, stiffness: 220 });

  return (
    <>
      <Sfx name="data" at={tPools + 4} volume={0.28} />
      <Sfx name="data" at={tPools + 16} volume={0.22} />
      <Sfx name="data" at={tPools + 28} volume={0.18} />
      <Sfx name="pop" at={tPools} volume={0.3} />
      <Sfx name="error" at={tSlow} volume={0.22} />

      <Header>
        <Reveal at={0}>
          <LogoKicker logo="googlemaps" text="GOOGLE MAPS" />
        </Reveal>
        <Reveal at={4}>
          <Title size={80}>
            Many phones, <span style={{ color: C.accent }}>one speed</span>
          </Title>
        </Reveal>
      </Header>

      <World
        cam={cam}
        route={{ progress: 1, opacity: 0 }}
        seg={(i) => (i >= JAM[0] && i <= JAM[1] ? { tint, on: 0.85 * segOn } : {})}
        goog={{ tag: frame >= tPools ? pTag : 0, rack }}
        phones={[...trafficPhones(frame, 0.55), ...ps]}
        pings={pings}
        you={{ opacity: 0 }}
        overlay={<Chip x={JAM_MID[0]} y={JAM_MID[1]} text="SLOW" color={C.red} size={30} p={frame >= tSlow ? pSlow : 0} lift={-70} />}
      />

      <Source text="Google, 2020" at={tPools} />
    </>
  );
};
