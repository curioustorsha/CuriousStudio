import React from "react";
import { spring, useCurrentFrame } from "remotion";
import { C, FPS } from "../../../theme";
import { ease, Header, isoPoint, Kicker, Reveal, Sfx, Title, useIn, useIsoStage, useWord } from "../../../engine/kit";
import { berth, BerthPulse, Chip, HALL, MY_BERTH, NEXT_BERTH, RES, SEATS, mixCam, useMove, World, YouPulse, type P2, type SeatState } from "./world";

/** Your path from the hall's door, through the hall, along the wire to the edge of the seat grid. */
export const BOOK_PATH: P2[] = [[7.5, 5.72], [7.5, 3.62]];

/** Your berth once booked: solid amber with a lock bar. */
export const mySeat = (lift = 0, ring = 0): SeatState => ({ color: C.accent, lift, lock: 1, ring });
/** The other person's berth (they slid there after bouncing off yours). */
export const otherSeat: SeatState = { color: "#C98A2E", lock: 1 };

/** A second booker's pulse riding over the grid: arrives at your berth, bounces off red, slides to the next. */
const Rival: React.FC<{ k: number; flash: number }> = ({ k, flash }) => {
  const s = useIsoStage();
  if (k <= 0 || k >= 1.5) return null;
  const a = berth(RES, MY_BERTH);
  const n = berth(RES, NEXT_BERTH);
  const start = { x: a.x, y: RES.y + RES.d + 0.5 };
  let x: number;
  let y: number;
  if (k < 0.5) {
    const t = k / 0.5;
    x = start.x;
    y = start.y + (a.y + 0.05 - start.y) * t;
  } else if (k < 0.75) {
    const t = (k - 0.5) / 0.25;
    x = a.x;
    y = a.y + 0.05 + 0.25 * Math.sin(t * Math.PI);
  } else {
    const t = Math.min(1, (k - 0.75) / 0.25);
    x = a.x + (n.x - a.x) * t;
    y = a.y + 0.05 + (n.y - a.y) * t;
  }
  const q = isoPoint(s, x, y, a.z + 0.12);
  const size = Math.max(6, s.unit * 0.09);
  const col = "#E0A040";
  return (
    <g opacity={k > 1.2 ? 1 - (k - 1.2) / 0.3 : 1}>
      {flash > 0.01 && <circle cx={q.x} cy={q.y} r={size * (2 + 3 * (1 - flash))} fill="none" stroke={C.red} strokeWidth={4} opacity={flash} />}
      <circle cx={q.x} cy={q.y} r={size * 2} fill={col} opacity={0.15} />
      <circle cx={q.x} cy={q.y} r={size} fill={col} style={{ filter: `drop-shadow(0 0 ${size}px ${col})` }} />
      <circle cx={q.x} cy={q.y} r={size * 0.45} fill="#FFF6E0" />
    </g>
  );
};

/** Step three, you hit Book: that's writing. It takes a seat away; no two people can get the same one. */
export const Writing: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tBook = wf("writing", "book");
  const tWrite = wf("writing", "writing");
  const tTakes = wf("writing", "takes");
  const tTwo = wf("writing", "two");
  const tSame = wf("writing", "same");

  const glide = useMove(tBook, 34);
  const cam = mixCam(HALL, SEATS, glide);
  const pTag = useIn(tBook, { damping: 11, stiffness: 220 });
  const run = ease(frame, tBook + 4, tBook + 26);
  const onGrid = frame >= tBook + 24;
  const pulseTag = 1 + 0.15 * Math.sin(Math.max(0, frame - tWrite) * 0.5) * (frame >= tWrite && frame < tWrite + 20 ? 1 : 0);

  const flip = frame >= tTakes ? spring({ frame: frame - tTakes, fps: FPS, config: { damping: 10, stiffness: 200 } }) : 0;
  const k = frame >= tTwo - 10 ? (frame - (tTwo - 10)) / 34 : 0;
  const bounceAt = tTwo - 10 + 17;
  const flash = frame >= bounceAt ? Math.max(0, 1 - (frame - bounceAt) / 12) : 0;
  const nextTaken = frame >= tTwo - 10 + 34;
  const ring = frame >= tSame ? Math.max(0, 1 - (frame - tSame) / 20) : 0;
  const pSeats = useIn(tTakes - 6, { damping: 12, stiffness: 200 });
  const a = berth(RES, MY_BERTH);

  const seat = (i: number): SeatState | null => {
    if (i === MY_BERTH && frame >= tTakes) return mySeat(0.12 * Math.sin(Math.min(1, flip) * Math.PI) * 1 + 0.02, 0.4 + ring);
    if (i === NEXT_BERTH && nextTaken) return otherSeat;
    return null;
  };

  return (
    <>
      <Sfx name="click" at={tBook} volume={0.45} />
      <Sfx name="whoosh" at={tBook + 4} volume={0.2} />
      <Sfx name="thud" at={tTakes} volume={0.35} />
      <Sfx name="pop" at={tTakes + 6} volume={0.25} />
      <Sfx name="error" at={bounceAt} volume={0.2} />
      <Sfx name="ding" at={tSame} volume={0.22} />

      <Header>
        <Reveal at={0}>
          <Kicker text="STEP 3 · BOOK" />
        </Reveal>
        <Reveal at={4}>
          <Title size={84}>
            One seat, <span style={{ color: C.accent }}>one person</span>
          </Title>
        </Reveal>
      </Header>

      <World
        cam={cam}
        clock={{ time: "10:00" }}
        hall={{ rack: 0.6, wire: frame >= tBook ? 1 : 0.2 }}
        gate={{ glow: 1 }}
        res={{ seat }}
        overlay={
          <>
            {!onGrid && (
              <YouPulse
                pts={frame >= tBook + 4 ? BOOK_PATH : [[7.5, 5.72], [7.5, 5.71]]}
                d={frame >= tBook + 4 ? run * 2.1 : 0}
                tag={frame >= tBook ? "BOOK" : "READ"}
                tagColor={frame >= tBook ? C.accent : C.green}
                tagP={frame >= tBook ? pTag : 1}
                moving={frame >= tBook + 4}
              />
            )}
            {onGrid && <BerthPulse i={MY_BERTH} p={1} />}
            {onGrid && <Chip x={a.x} y={a.y} z={a.z} text="BOOK" size={22} color={C.accent} lift={46 * pulseTag} />}
            <Rival k={k} flash={flash} />
            <Chip x={RES.x + RES.w} y={RES.y} z={RES.pz} text={`SEATS LEFT ${frame >= tTakes + 6 ? 2 : 3}`} size={26} color={frame >= tTakes + 6 ? C.accent : C.text} p={frame >= tTakes - 6 ? pSeats : 0} lift={70} dx={-30} />
          </>
        }
      />
    </>
  );
};
