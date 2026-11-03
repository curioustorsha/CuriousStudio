import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C } from "../../../theme";
import { clamp, ease, Header, Kicker, Reveal, Sfx, Source, Title, useIn, useWord } from "../../../engine/kit";
import { along, Chip, CLOSE, DISTRICT, door, HOMES, mixCam, R1, route, STORE_HOMES, STORES, useMove, World, type Link } from "./world";
import { inOut } from "./Hook";

/** The five stores built so far (S1–S5), S1 first. */
export const SERVED = [0, 1, 2, 3, 4];
/** Camera at the end of this scene: DISTRICT nudged toward your neighbourhood. */
export const AREA_END = mixCam(DISTRICT, CLOSE, 0.45);

/** Up to three homes per served store send an order to it, along the streets. */
const PINGS = SERVED.flatMap((k, i) =>
  STORE_HOMES[k].slice(0, 3).map((h, j) => ({ k, i, j, points: route(door(HOMES[h]), door(STORES[k])) })),
);

export const Area: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tServes = wf("area", "serves");
  const tHomes = wf("area", "homes");
  const tAvg = wf("area", "average");
  const tTwo = wf("area", "two");

  const nudge = useMove(tAvg - 4, 30);
  const cam = mixCam(DISTRICT, AREA_END, nudge);

  // Each store's own, uneven territory grows out from it, S1 first
  const terr = (k: number) => (k <= 4 ? ease(frame, tServes + k * 5, tServes + k * 5 + 20) : 0);
  const lit = (k: number, n: number) => (k <= 4 ? ease(frame, tHomes + k * 4 + n * 2, tHomes + k * 4 + n * 2 + 8) : 0);

  // Homes inside a territory ping their own store, along the streets
  const pings: Link[] = PINGS.map(({ i, j, points }) => {
    const at = tHomes + i * 4 + j * 3 + 4;
    const t = interpolate(frame, [at, at + 26], [0, 1], clamp);
    return {
      points,
      progress: ease(frame, at - 2, at + 10),
      t: t > 0 && t < 1 ? t : null,
      opacity: 1 - ease(frame, at + 26, at + 36),
      size: 6,
      width: 3,
    };
  });

  // The rider makes its short ride S1 → home, still at 15 km/h
  const hop = inOut(interpolate(frame, [tAvg + 2, tAvg + 40], [0, 1], clamp));
  const measure = ease(frame, tTwo - 2, tTwo + 14);
  const pAvg = useIn(tTwo + 6, { damping: 11, stiffness: 220 });
  const [mx, my] = along(R1, 0.5);

  return (
    <>
      <Sfx name="swoosh" at={tServes} volume={0.35} />
      <Sfx name="swoosh" at={tServes + 12} volume={0.3} />
      <Sfx name="pop" at={tHomes} volume={0.25} />
      <Sfx name="pop" at={tHomes + 8} volume={0.2} />
      <Sfx name="moped" at={tAvg} volume={0.25} />
      <Sfx name="ding" at={tTwo + 6} volume={0.4} />

      <Header>
        <Reveal at={0}>
          <Kicker text="ONE STORE, ONE PATCH" color={C.green} />
        </Reveal>
        <Reveal at={tServes}>
          <Title size={80}>
            Short rides <span style={{ color: C.green }}>only</span>
          </Title>
        </Reveal>
      </Header>

      <World
        cam={cam}
        terr={terr}
        homeLit={lit}
        store={(k) => ({ rise: k <= 4 ? 1 : 0 })}
        h0={{ label: ease(frame, tAvg, tAvg + 10) }}
        links={[...pings, { points: R1, progress: measure, t: null, color: C.text, dashed: true, opacity: measure > 0 ? 1 : 0, width: 4 }]}
        rider={{ points: R1, t: hop, moving: hop > 0 && hop < 1 ? 1 : 0, parked: hop <= 0 || hop >= 1 ? 1 : 0, tag: { text: "15 km/h", p: 1 } }}
        overlay={<Chip x={mx} y={my} text="< 2 km AVG" color={C.green} p={frame >= tTwo + 6 ? pAvg : 0} lift={-50} dx={60} />}
      />

      <Source text="Blinkit (Deepinder Goyal), Jan 2026" at={tAvg} />
    </>
  );
};
