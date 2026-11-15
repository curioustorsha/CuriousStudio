import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../../../theme";
import { ease, Header, Reveal, Sfx, Source, Title, useIn, useWord } from "../../../engine/kit";
import { AlphabetWordmark, DeepMindWordmark, LogoKicker } from "../../../logos";
import { hookSeg } from "./Hook";
import { CITY, EDGES, GRAPH, HOME_DOOR, jamPhones, PIECES, pinTop, trafficPhones, World } from "./world";

const fromHome = (p: [number, number]) => Math.hypot(p[0] - HOME_DOOR[0], p[1] - HOME_DOOR[1]);
/** Node pop-in delay (frames) by distance from your home: a wave outwards. */
export const nodeDelay = (i: number) => fromHome(PIECES[i].m) * 2.0;
/** Edge draw-on delay by its middle's distance from home. */
export const edgeDelay = (k: number) => {
  const [i, j] = EDGES[k];
  return fromHome([(PIECES[i].m[0] + PIECES[j].m[0]) / 2, (PIECES[i].m[1] + PIECES[j].m[1]) / 2]) * 1.5;
};

/** DeepMind (an Alphabet AI lab) and the graph neural network: every road stretch becomes a dot, touching stretches get a line. */
export const Graph: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tDeep = wf("graph", "deepmind");
  const tAlpha = wf("graph", "alphabet");
  const tGraph = wf("graph", "graph");
  const tEvery = wf("graph", "every");
  const tLines = wf("graph", "lines");

  const graph = ease(frame, tEvery, tEvery + 18);
  const pDeep = useIn(tDeep - 2, { damping: 12, stiffness: 200 });
  const pAlpha = useIn(tAlpha - 2, { damping: 13, stiffness: 200 });
  const pin = pinTop(GRAPH);
  const base = hookSeg(frame, 0, 1);

  return (
    <>
      <Sfx name="swoosh" at={tDeep - 2} volume={0.3} />
      <Sfx name="pop" at={tAlpha - 2} volume={0.3} />
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <Sfx key={k} name="pop" at={tEvery + 4 + k * 6} volume={0.22 - k * 0.02} />
      ))}
      <Sfx name="scan" at={tLines} volume={0.25} dur={36} />

      <Header>
        <Reveal at={0}>
          <LogoKicker logo="deepmind" text="THE BIG IDEA" />
        </Reveal>
        <Reveal at={Math.max(4, tGraph - 2)}>
          <Title size={80}>
            <span style={{ color: C.cyan }}>Graph</span> neural network
          </Title>
        </Reveal>
      </Header>

      <World
        cam={CITY}
        graph={graph}
        route={{ progress: 1, opacity: 0.85 * (1 - graph) }}
        seg={base}
        you={{ label: 1 - graph, opacity: 1 - graph }}
        phones={[...trafficPhones(frame, 1 - graph), ...jamPhones(frame, 1, 1 - graph)]}
        goog={{ rack: frame >= tDeep ? 0.8 : 0.3, glow: 0.5 * pDeep * (1 - graph) }}
        nodeIn={(i) => ease(frame, tEvery + 6 + nodeDelay(i), tEvery + 14 + nodeDelay(i))}
        edgeIn={(k) => ease(frame, tLines + edgeDelay(k), tLines + 10 + edgeDelay(k))}
      />

      {/* DeepMind tag beside the Maps pin, Alphabet under it */}
      <div style={{ position: "absolute", left: pin.x + 34, top: pin.y - 70, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10 }}>
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
