import React from "react";
import { AbsoluteFill } from "remotion";
import { Backdrop, Header, Kicker, Title } from "../lib";
import { Product } from "../products";
import { C } from "../theme";
import { IsoBox, IsoGrid, IsoLabel, IsoPacket, IsoPath, IsoStage, IsoTile } from "./iso";

/**
 * Reference still for the isometric style (How It Scales): requests flow through a load balancer to three
 * servers and a database. `npx remotion still IsoDemo out/iso-demo.png` to look at it. Not part of any episode.
 */
export const IsoDemo: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <Backdrop />
    <Header>
      <Kicker text="THE FIX" />
      <Title>Spread the load</Title>
    </Header>
    <IsoStage originY={600} unit={70}>
      <IsoGrid w={9} d={9} />
      <IsoTile x={4} y={0.5} w={3.5} d={8} color={C.cyan} opacity={0.08} />
      <IsoPath points={[[0.5, 4.5], [2.5, 4.5]]} color={C.accent} dashed />
      <IsoPath points={[[2.5, 4.5], [5, 1.5]]} color={C.cyan} />
      <IsoPath points={[[2.5, 4.5], [5, 4.5]]} color={C.cyan} />
      <IsoPath points={[[2.5, 4.5], [5, 7.5]]} color={C.cyan} />
      <IsoPath points={[[5.5, 4.5], [8, 4.5]]} color={C.green} />
      {/* Packets before the blocks: anything behind a block is drawn first */}
      <IsoPacket points={[[0.5, 4.5], [2.5, 4.5]]} t={0.4} />
      <IsoPacket points={[[2.5, 4.5], [5, 1.5]]} t={0.55} />
      <IsoPacket points={[[2.5, 4.5], [5, 7.5]]} t={0.3} />
      <IsoBox x={1.8} y={3.8} w={1.4} d={1.4} h={0.9} color={C.accent} label="BALANCER" />
      <IsoBox x={4.6} y={1} w={1.2} d={1.2} h={1.6} color={C.cyan} label="SERVER 1" />
      <IsoBox x={4.6} y={3.9} w={1.2} d={1.2} h={1.6} color={C.cyan} glow={1} label="SERVER 2" />
      <IsoBox x={4.6} y={6.9} w={1.2} d={1.2} h={1.6} color={C.cyan} label="SERVER 3" />
      <IsoBox x={7.4} y={3.9} w={1.3} d={1.3} h={1.1} color={C.green} icon={<Product p="stack" size={48} />} />
      <IsoLabel x={8.05} y={4.55} z={1.1} text="DATABASE" />
    </IsoStage>
  </AbsoluteFill>
);
