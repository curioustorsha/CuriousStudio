import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "../../../theme";
import { ease, Header, IsoPath, isoPoint, Kicker, Reveal, Sfx, Source, Title, useIn, useIsoStage, useWord } from "../../../engine/kit";
import { hookSeg } from "./Hook";
import { BAND_MID, Bands } from "./Super";
import { Chip, CITY, HOME_DOOR, jamPhones, JUNCTION, mixCam, OFFICE, OFFICE_DOOR, trafficPhones, useMove, World, type P2 } from "./world";

/** A second way to the office that avoids the jammed avenue: down the west lane, across avenue y = 10, up lane x = 12.5. */
export const ALT: P2[] = [HOME_DOOR, [2.5, HOME_DOOR[1]], [2.5, 10], [12.5, 10], [12.5, OFFICE_DOOR[1]], OFFICE_DOOR];

/** The ETA tag over the office: a clock face plus "ETA". */
export const EtaTag: React.FC<{ p: number; frame: number }> = ({ p, frame }) => {
  const s = useIsoStage();
  if (p <= 0.01) return null;
  const pt = isoPoint(s, OFFICE.x + OFFICE.w / 2, OFFICE.y + OFFICE.d / 2, OFFICE.h);
  const sc = 0.6 + 0.4 * Math.min(1, p);
  const a = frame * 0.12;
  return (
    <g transform={`translate(${pt.x},${pt.y - 74}) scale(${sc})`} opacity={Math.min(1, p * 1.6)}>
      <rect x={-96} y={-40} width={192} height={80} rx={22} fill="rgba(7,8,12,0.94)" stroke={C.green} strokeWidth={3} />
      <g transform="translate(-52,0)">
        <circle r={22} fill="none" stroke={C.text} strokeWidth={4} />
        <line x1={0} y1={0} x2={Math.sin(a) * 15} y2={-Math.cos(a) * 15} stroke={C.green} strokeWidth={4} strokeLinecap="round" />
        <circle r={3.5} fill={C.text} />
      </g>
      <text x={26} y={2} textAnchor="middle" dominantBaseline="central" fontFamily={F.mono} fontWeight={700} fontSize={34} letterSpacing={2} fill={C.green}>
        ETA
      </text>
      <path d="M -8 40 L 0 50 L 8 40 Z" fill={C.green} />
    </g>
  );
};

/** Back from the graph to the map: a travel time per supersegment, then your ETA, for every possible route. */
export const Eta: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tTravel = wf("eta", "travel");
  const tEach = wf("eta", "supersegment");
  const tEta = wf("eta", "eta");
  const tEvery = wf("eta", "every");

  const back = useMove(0, 28);
  const cam = mixCam(JUNCTION, CITY, back);
  const graph = 1 - ease(frame, 2, 22);
  const spring = { damping: 11, stiffness: 220 };
  const pT = [useIn(tTravel + 2, spring), useIn(tTravel + 8, spring), useIn(tTravel + 14, spring)];
  const pEta = useIn(tEta, spring);
  const alt = ease(frame, tEvery, tEvery + 22);

  return (
    <>
      <Sfx name="whoosh" at={0} volume={0.22} />
      {[0, 1, 2].map((k) => (
        <Sfx key={k} name="pop" at={tTravel + 2 + k * 6} volume={0.26} />
      ))}
      <Sfx name="ding" at={tEta} volume={0.3} />
      <Sfx name="swoosh" at={tEvery} volume={0.25} />

      <Header>
        <Reveal at={0}>
          <Kicker text="STEP 3 · ETA" color={C.green} />
        </Reveal>
        <Reveal at={4}>
          <Title size={80}>
            Your <span style={{ color: C.green }}>arrival time</span>
          </Title>
        </Reveal>
      </Header>

      <World
        cam={cam}
        graph={graph}
        route={{ progress: 1, opacity: 0.6 * (1 - graph) }}
        seg={hookSeg(frame, 0, 1)}
        you={{ label: 1 - graph, opacity: 1 - graph }}
        office={{ glow: 0.6 * Math.min(1, pEta) }}
        phones={[...trafficPhones(frame, 0.6 * (1 - graph)), ...jamPhones(frame, 1, 1 - graph)]}
        overlay={
          <>
            <Bands p={() => 1 - graph} glow={0.4} />
            {alt > 0.001 && <IsoPath points={ALT} color={C.muted} progress={alt} dashed width={8} z={0.04} />}
            {BAND_MID.map((m, k) => (
              <Chip key={k} x={m[0]} y={m[1]} text={`TIME ${k + 1}`} color={C.cyan} size={22} p={frame >= tTravel + 2 + k * 6 ? pT[k] : 0} lift={52} />
            ))}
            <EtaTag p={frame >= tEta ? pEta : 0} frame={frame} />
          </>
        }
      />

      <Source text="DeepMind, 2020" at={tTravel} />
    </>
  );
};
