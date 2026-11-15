import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "../../../theme";
import { ease, Header, isoPoint, Reveal, Sfx, Source, Title, useIn, useIsoStage, useWord } from "../../../engine/kit";
import { LogoKicker } from "../../../logos";
import { hookSeg } from "./Hook";
import { CITY, jamPhones, JUNCTION, mixCam, OFFICE, trafficPhones, useMove, World } from "./world";

/** A clock-face chip (no time shown) floating over the office: "your arrival time". */
const ClockChip: React.FC<{ p: number; frame: number }> = ({ p, frame }) => {
  const s = useIsoStage();
  if (p <= 0.01) return null;
  const pt = isoPoint(s, OFFICE.x + OFFICE.w / 2, OFFICE.y + OFFICE.d / 2, OFFICE.h);
  const sc = 0.6 + 0.4 * Math.min(1, p);
  const a = frame * 0.12;
  return (
    <g transform={`translate(${pt.x},${pt.y - 70}) scale(${sc})`} opacity={Math.min(1, p * 1.6)}>
      <rect x={-42} y={-42} width={84} height={84} rx={22} fill="rgba(7,8,12,0.94)" stroke={C.green} strokeWidth={3} />
      <circle r={26} fill="none" stroke={C.text} strokeWidth={4} />
      <line x1={0} y1={0} x2={Math.sin(a) * 18} y2={-Math.cos(a) * 18} stroke={C.green} strokeWidth={4} strokeLinecap="round" />
      <line x1={0} y1={0} x2={Math.sin(a / 12) * 12} y2={-Math.cos(a / 12) * 12} stroke={C.text} strokeWidth={4} strokeLinecap="round" />
      <circle r={4} fill={C.text} />
      <path d="M -8 42 L 0 52 L 8 42 Z" fill={C.green} />
    </g>
  );
};

/** The number moment: Google said its arrival-time predictions were accurate for over 97% of trips (2020). */
export const NumberScene: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tArr = wf("number", "arrival");
  const tNinety = wf("number", "ninety");
  const tTrips = wf("number", "trips");

  const back = useMove(0, 28);
  const cam = mixCam(JUNCTION, CITY, back);
  const graph = 1 - ease(frame, 2, 22);

  const pClock = useIn(tArr, { damping: 11, stiffness: 210 });
  const pBig = useIn(tNinety - 2, { damping: 9, stiffness: 240 });
  const ring = frame >= tNinety ? Math.min(1, (frame - tNinety) / 22) : 0;
  const pSub = useIn(tTrips - 2, { damping: 13, stiffness: 200 });

  return (
    <>
      <Sfx name="whoosh" at={0} volume={0.22} />
      <Sfx name="pop" at={tArr} volume={0.3} />
      <Sfx name="impact" at={tNinety} volume={0.3} />
      <Sfx name="ding" at={tTrips} volume={0.3} />

      <Header>
        <Reveal at={0}>
          <LogoKicker logo="googlemaps" text="GOOGLE MAPS · 2020" />
        </Reveal>
        <Reveal at={4}>
          <Title size={80}>
            Arrival times, <span style={{ color: C.green }}>checked</span>
          </Title>
        </Reveal>
      </Header>

      <World
        cam={cam}
        dim={1 - 0.35 * ease(frame, tNinety - 4, tNinety + 6)}
        graph={graph}
        route={{ progress: 1, opacity: 0.9 * (1 - graph) }}
        seg={hookSeg(frame, 0, 1)}
        you={{ label: 1 - graph, opacity: 1 - graph }}
        office={{ glow: 0.6 * Math.min(1, pClock) }}
        phones={[...trafficPhones(frame, 1 - graph), ...jamPhones(frame, 1, 1 - graph)]}
        overlay={<ClockChip p={frame >= tArr ? pClock : 0} frame={frame} />}
      />

      {/* OVER 97% · OF TRIPS */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 640, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {ring > 0 && ring < 1 && (
            <div
              style={{
                position: "absolute",
                width: 420 + 360 * ring,
                height: 420 + 360 * ring,
                borderRadius: 999,
                border: `4px solid ${C.green}`,
                opacity: 0.8 * (1 - ring),
              }}
            />
          )}
          <div
            style={{
              opacity: frame >= tNinety - 2 ? Math.min(1, pBig * 1.6) : 0,
              transform: `scale(${frame >= tNinety - 2 ? 1.5 - 0.5 * Math.min(1, pBig) : 1.5})`,
              padding: "24px 46px 20px",
              borderRadius: 32,
              background: "rgba(7,8,12,0.92)",
              border: `3px solid ${C.green}`,
              boxShadow: `0 0 60px ${C.green}44`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 34, letterSpacing: 6, color: C.muted }}>OVER</div>
            <div style={{ fontFamily: F.sans, fontWeight: 900, fontSize: 190, lineHeight: 0.95, letterSpacing: -8, color: C.green }}>97%</div>
            <div
              style={{
                fontFamily: F.mono,
                fontWeight: 700,
                fontSize: 36,
                letterSpacing: 6,
                color: C.text,
                opacity: frame >= tTrips - 2 ? Math.min(1, pSub * 1.5) : 0,
                transform: `translateY(${(1 - Math.min(1, pSub)) * 16}px)`,
              }}
            >
              OF TRIPS
            </div>
          </div>
        </div>
      </div>

      <Source text="Google, 2020" at={tArr} />
    </>
  );
};
