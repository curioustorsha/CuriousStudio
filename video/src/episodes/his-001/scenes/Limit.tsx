import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "../../../theme";
import { ease, Header, Kicker, Reveal, Sfx, Source, Title, useIn, useWord } from "../../../engine/kit";
import { BerthPulse, MY_BERTH, SEATS_WIDE, mixCam, useMove, World, type Cam } from "./world";
import { RailwaysTag } from "./parts";
import { bookedSeat } from "./Copies";
import { CDN_ON } from "./Cdn";

export const LIMIT: Cam = { fx: 7.5, fy: 2.5, u: 80, sx: 540, sy: 1020 };

/** Gauge geometry: a semicircle from 180° (0) to 0° (MAX). The red line sits at 32,000, the record at 31,814. */
const MAX = 34000;
const CX = 540;
const CY = 760;
const R = 230;
const ang = (v: number) => Math.PI - (v / MAX) * Math.PI;
const pt = (v: number, r = R) => ({ x: CX + Math.cos(ang(v)) * r, y: CY - Math.sin(ang(v)) * r });

const Gauge: React.FC<{ draw: number; needle: number; gap: number; pRec: number; pLine: number }> = ({ draw, needle, gap, pRec, pLine }) => {
  if (draw <= 0.01) return null;
  const end = pt(MAX * draw);
  const tip = pt(needle, R - 18);
  const red0 = pt(32000, R - 34);
  const red1 = pt(32000, R + 34);
  const recP = pt(needle, R - 80);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <path d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${end.x} ${end.y}`} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={34} strokeLinecap="butt" />
      {needle > 0 && <path d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${pt(needle).x} ${pt(needle).y}`} fill="none" stroke={C.cyan} strokeWidth={34} opacity={0.75} />}
      {[0, 8000, 16000, 24000].map((v) => {
        const a = pt(v, R - 30);
        const b = pt(v, R - 46);
        return draw * MAX > v ? <line key={v} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.muted} strokeWidth={3} /> : null;
      })}
      {pLine > 0.01 && (
        <g opacity={Math.min(1, pLine * 1.5)}>
          <line x1={red0.x} y1={red0.y} x2={red1.x} y2={red1.y} stroke={C.red} strokeWidth={7} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 8px ${C.red})` }} />
          <text x={900} y={CY + 52} textAnchor="end" fontFamily={F.mono} fontWeight={700} fontSize={28} fill={C.red}>
            ~32,000 / MIN
          </text>
        </g>
      )}
      {gap > 0.01 && <path d={`M ${pt(needle, R + 22).x} ${pt(needle, R + 22).y} A ${R + 22} ${R + 22} 0 0 1 ${pt(32000, R + 22).x} ${pt(32000, R + 22).y}`} fill="none" stroke={C.accent} strokeWidth={10} opacity={gap * (0.6 + 0.4 * Math.sin(gap * 20))} />}
      {needle > 0 && (
        <g>
          <line x1={CX} y1={CY} x2={tip.x} y2={tip.y} stroke={C.text} strokeWidth={7} strokeLinecap="round" />
          <circle cx={CX} cy={CY} r={14} fill={C.text} />
        </g>
      )}
      {pRec > 0.01 && (
        <g transform={`translate(${recP.x - 70},${recP.y + 6})`} opacity={Math.min(1, pRec * 1.5)}>
          <rect x={-78} y={-24} width={156} height={48} rx={12} fill="rgba(7,8,12,0.94)" stroke={C.accent} strokeWidth={2.5} />
          <text textAnchor="middle" dominantBaseline="central" fontFamily={F.mono} fontWeight={700} fontSize={28} fill={C.accent}>
            31,814
          </text>
        </g>
      )}
    </svg>
  );
};

/** Today's system handles about 32,000 bookings a minute; the record (31,814) came very close. */
export const Limit: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tAbout = wf("limit", "about");
  const tRail = wf("limit", "railways");
  const tRec = wf("limit", "record");
  const tClose = wf("limit", "close");

  const move = useMove(0, 30);
  const cam = mixCam(SEATS_WIDE, LIMIT, move);
  const draw = ease(frame, 4, tAbout + 6);
  const pLine = ease(frame, tAbout, tAbout + 10);
  const needle = 31814 * ease(frame, tRec - 4, tClose + 4);
  const pRec = ease(frame, tRec, tRec + 8);
  const gap = ease(frame, tClose + 4, tClose + 14);
  const warm = ease(frame, tClose, tClose + 18);
  const pTag = useIn(tRail, { damping: 14, stiffness: 180 });

  return (
    <>
      <Sfx name="pop" at={tAbout} volume={0.25} />
      <Sfx name="riser" at={tRec - 4} volume={0.24} />
      <Sfx name="thud" at={tClose + 4} volume={0.3} />

      <Header>
        <Reveal at={0}>
          <Kicker text="THE LIMIT" color={C.red} />
        </Reveal>
        <Reveal at={4}>
          <Title size={84}>
            Right at <span style={{ color: C.accent }}>the edge</span>
          </Title>
        </Reveal>
      </Header>

      <World cam={cam} clock={{ time: "10:00" }} {...CDN_ON} res={{ seat: bookedSeat, cylLit: () => 0.6 + 0.4 * warm, warm, label: 1 - move }} hall={{ rack: 0.6 }} overlay={<BerthPulse i={MY_BERTH} />} />

      <Gauge draw={draw} needle={needle} gap={gap} pRec={pRec} pLine={pLine} />
      <RailwaysTag p={frame >= tRail ? pTag : 0} x={400} y={790} text="THE RAILWAYS SAYS" />
      <Source text="PIB, Aug 2026; Ministry of Railways, Jun 2025" at={tAbout} />
    </>
  );
};
