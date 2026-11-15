import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../../../theme";
import { ease, Header, Kicker, Reveal, Sfx, Source, Title, useIn, useWord } from "../../../engine/kit";
import { AGENT_PATH, AGENT_X, at, bots, crowd, GATE, GATE_Y, pathLen, World, YOU_PATH, YouPulse, type Pulse } from "./world";
import { Anchored } from "./parts";
import { D_FRONT, D_THROUGH } from "./Bots";

/** The AADHAAR ✓ chip (the tick is drawn as a path, not a glyph). */
const AadhaarChip: React.FC = () => (
  <g>
    <rect x={-118} y={-26} width={236} height={52} rx={14} fill="rgba(7,8,12,0.94)" stroke={C.green} strokeWidth={3} />
    <text x={-20} y={1} textAnchor="middle" dominantBaseline="central" fontFamily={F.mono} fontWeight={700} fontSize={26} letterSpacing={2} fill={C.green}>
      AADHAAR
    </text>
    <path d="M 66 0 L 78 12 L 100 -12" fill="none" stroke={C.green} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

/** The half-hour clock for the agents' lane: a ring filling as 10:00 → 10:30 passes in fast-forward. */
const HalfHour: React.FC<{ fill: number }> = ({ fill }) => {
  const r = 34;
  const a = -Math.PI / 2 + fill * Math.PI * 2;
  return (
    <g>
      <rect x={-112} y={-50} width={224} height={100} rx={18} fill="rgba(7,8,12,0.94)" stroke={C.red} strokeWidth={2.5} />
      <circle cx={-62} cy={0} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={7} />
      {fill > 0.005 && fill < 0.999 && <path d={`M -62 ${-r} A ${r} ${r} 0 ${fill > 0.5 ? 1 : 0} 1 ${-62 + Math.cos(a) * r} ${Math.sin(a) * r}`} fill="none" stroke={C.red} strokeWidth={7} strokeLinecap="round" />}
      {fill >= 0.999 && <circle cx={-62} cy={0} r={r} fill="none" stroke={C.green} strokeWidth={7} />}
      <text x={30} y={-14} textAnchor="middle" dominantBaseline="central" fontFamily={F.mono} fontWeight={700} fontSize={22} fill={C.text}>
        10:00
      </text>
      <text x={30} y={16} textAnchor="middle" dominantBaseline="central" fontFamily={F.mono} fontWeight={700} fontSize={22} fill={fill >= 0.999 ? C.green : C.muted}>
        → 10:30
      </text>
    </g>
  );
};

/** Online Tatkal needs an Aadhaar-verified account; authorised agents can't book in the first half hour. */
export const Gate: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames: D } = useVideoConfig();
  const wf = useWord();
  const tAad = wf("gate", "aadhaar");
  const tAuth = wf("gate", "authorised");
  const tFirst = wf("gate", "first");

  const arch = ease(frame, 0, 14);
  const scan = frame >= tAad && frame <= tAad + 22 ? (frame - tAad) / 22 : null;
  const pTick = useIn(tAad + 18, { damping: 11, stiffness: 220 });
  const tGo = tAad + 30;
  const d = D_FRONT + (D_THROUGH - D_FRONT) * ease(frame, tGo, tGo + 30);
  const you = at(YOU_PATH, d);

  const lane = ease(frame, tAuth - 6, tAuth + 8);
  const drop = ease(frame, tFirst, tFirst + 8);
  const lift = ease(frame, D - 16, D - 6);
  const agentBar = drop * (1 - lift);
  const fill = ease(frame, tFirst + 8, D - 18, 0, 1);
  const pClock = useIn(tFirst, { damping: 12, stiffness: 200 });

  // Agents: three amber pulses queueing in their own lane from "authorised" on
  const aLen = pathLen(AGENT_PATH);
  const agents: Pulse[] = [0, 1, 2].flatMap((k) => {
    const start = tAuth - 4 + k * 8;
    if (frame < start) return [];
    const dmax = aLen - 0.1 - k * 0.42;
    const dd = Math.min((frame - start) * 0.05, dmax);
    return [{ pts: AGENT_PATH, t: dd / aLen, trail: dd < dmax ? 1 : 0, ring: dd >= dmax ? 0.4 : 0 }];
  });
  const a0 = agents[0] ? at(AGENT_PATH, agents[0].t * aLen) : null;

  return (
    <>
      <Sfx name="scan" at={tAad} volume={0.35} />
      <Sfx name="ding" at={tAad + 18} volume={0.25} />
      <Sfx name="pop" at={tAuth} volume={0.25} />
      <Sfx name="thud" at={tFirst + 4} volume={0.35} />
      <Sfx name="ticker" at={tFirst + 8} volume={0.16} dur={Math.max(1, D - 26 - tFirst)} />
      <Sfx name="click" at={D - 16} volume={0.3} />

      <Header>
        <Reveal at={0}>
          <Kicker text="STEP 1 · GETTING IN" />
        </Reveal>
        <Reveal at={4}>
          <Title size={84}>
            Real <span style={{ color: C.green }}>people</span> first
          </Title>
        </Reveal>
      </Header>

      <World
        cam={GATE}
        clock={{ time: "10:00" }}
        gate={{ glow: 1, arch, scan, agentLane: lane, agentBar, label: 1 - arch }}
        pulses={[...crowd(frame + 700, 0, { n: 20, every: 3, speed: 0.06, opacity: 0.8 }), ...agents]}
        bots={bots(frame + 200, 0, 0, { n: 8, slipEvery: 99, speed: 0.07 })}
        overlay={
          <>
            <YouPulse pts={YOU_PATH} d={d} tag={frame < tAad + 18 ? "YOU" : undefined} moving={frame >= tGo && frame < tGo + 30} />
            <Anchored x={you[0]} y={you[1]} z={0.2} dy={-90} p={frame >= tAad + 18 ? pTick : 0} scale={0.9}>
              <AadhaarChip />
            </Anchored>
            {a0 && frame >= tAuth && (
              <Anchored x={a0[0]} y={a0[1]} z={0.2} dy={-44} p={lane}>
                <g>
                  <rect x={-54} y={-16} width={108} height={32} rx={9} fill="rgba(7,8,12,0.92)" stroke={C.accent} strokeWidth={2} />
                  <text textAnchor="middle" dominantBaseline="central" fontFamily={F.mono} fontWeight={700} fontSize={20} letterSpacing={1} fill={C.accent}>
                    AGENT
                  </text>
                </g>
              </Anchored>
            )}
            <Anchored x={AGENT_X + 0.9} y={GATE_Y - 0.4} z={0.3} dy={-120} p={frame >= tFirst ? pClock : 0}>
              <HalfHour fill={fill} />
            </Anchored>
          </>
        }
      />

      <Source text="Ministry of Railways, Jun 2025" at={tAad} />
    </>
  );
};
