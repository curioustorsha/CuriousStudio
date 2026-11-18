import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../../../theme";
import { ease, Header, Kicker, Reveal, Sfx, Source, Title, useWord } from "../../../engine/kit";
import { hookSeg } from "./Hook";
import { CITY, EDGES, HOME_DOOR, jamPhones, PIECES, trafficPhones, World } from "./world";

const fromHome = (p: [number, number]) => Math.hypot(p[0] - HOME_DOOR[0], p[1] - HOME_DOOR[1]);
/** Node pop-in delay (frames) by distance from your home: a wave outwards. */
export const nodeDelay = (i: number) => fromHome(PIECES[i].m) * 2.0;
/** Edge draw-on delay by its middle's distance from home. */
export const edgeDelay = (k: number) => {
  const [i, j] = EDGES[k];
  return fromHome([(PIECES[i].m[0] + PIECES[j].m[0]) / 2, (PIECES[i].m[1] + PIECES[j].m[1]) / 2]) * 1.5;
};

/** The graph neural network: every road stretch becomes a dot, touching stretches get a line. */
export const Graph: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tGraph = wf("graph", "graph");
  const tEvery = wf("graph", "every");
  const tLines = wf("graph", "lines");

  const graph = ease(frame, tEvery, tEvery + 18);
  const base = hookSeg(frame, 0, 1);

  return (
    <>
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <Sfx key={k} name="pop" at={tEvery + 4 + k * 6} volume={0.22 - k * 0.02} />
      ))}
      <Sfx name="scan" at={tLines} volume={0.25} dur={36} />

      <Header>
        <Reveal at={0}>
          <Kicker text="THE BIG IDEA · GNN" color={C.cyan} />
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
        nodeIn={(i) => ease(frame, tEvery + 6 + nodeDelay(i), tEvery + 14 + nodeDelay(i))}
        edgeIn={(k) => ease(frame, tLines + edgeDelay(k), tLines + 10 + edgeDelay(k))}
      />

      <Source text="DeepMind, 2020" at={tGraph} />
    </>
  );
};
