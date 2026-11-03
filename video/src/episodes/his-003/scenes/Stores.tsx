import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../../../theme";
import { ease, Header, Kicker, Reveal, Sfx, Source, Title, useIn, useWord } from "../../../engine/kit";
import { Chip, CITY, CLOSE, DISTRICT, dropIn, mixCam, R0, R1, STORES, useMove, World } from "./world";

/** When S2–S5 land, frames after "neighbourhoods". */
export const NEIGH_LAND = [2, 9, 16, 23];

export const Stores: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tMoves = wf("stores", "moves");
  const tDark = wf("stores", "dark");
  const tNo = wf("stores", "no");
  const tNeigh = wf("stores", "neighbourhoods");

  // Camera: CITY → CLOSE on "moves the shop closer", then out to DISTRICT on "neighbourhoods"
  const zoomIn = useMove(tMoves, 40);
  const zoomOut = useMove(tNeigh - 8, 36);
  const cam = mixCam(mixCam(CITY, CLOSE, zoomIn), DISTRICT, zoomOut);

  // The warehouse sinks as S1 drops onto its plot next to your home; the long road goes, the short one draws on
  const wDown = 1 - ease(frame, tMoves, tMoves + 18);
  const s1 = dropIn(frame, tMoves + 6);
  const r0Out = 1 - ease(frame, tMoves, tMoves + 16);
  const r1 = ease(frame, tMoves + 14, tMoves + 34);
  const riderIn = ease(frame, tMoves + 26, tMoves + 36);
  const riderOut = 1 - ease(frame, tMoves - 2, tMoves + 6);

  // "Dark": darker walls, x-ray with racks inside, no people. Back to solid as the camera pulls out.
  const dark = ease(frame, tDark, tDark + 12) * (1 - ease(frame, tNeigh - 6, tNeigh + 14));
  const xray = ease(frame, tDark + 4, tDark + 18) * (1 - ease(frame, tNeigh - 6, tNeigh + 10));
  const label = ease(frame, tDark + 2, tDark + 12) * (1 - ease(frame, tNeigh - 10, tNeigh));
  const pNo = useIn(tNo, { damping: 10, stiffness: 260 });
  const s = STORES[0];

  const onR0 = frame < tMoves + 6;

  return (
    <>
      <Sfx name="whoosh" at={tMoves - 2} volume={0.45} />
      <Sfx name="thud" at={tMoves + 12} volume={0.55} />
      <Sfx name="scan" at={tDark} volume={0.2} dur={20} />
      <Sfx name="thud" at={tNo} volume={0.45} />
      {NEIGH_LAND.map((d, i) => (
        <Sfx key={i} name="pop" at={tNeigh + d + 6} volume={0.4} />
      ))}

      <Header>
        <Reveal at={0}>
          <Kicker text="THE FIX" color={C.cyan} />
        </Reveal>
        <Reveal at={tMoves}>
          <Title size={80}>
            Move the shop <span style={{ color: C.cyan }}>closer</span>
          </Title>
        </Reveal>
      </Header>

      <World
        cam={cam}
        wh={{ rise: wDown }}
        h0={{ label: 1 - ease(frame, tNeigh - 6, tNeigh + 6) }}
        store={(k) => (k === 0 ? s1 : k <= 4 ? dropIn(frame, tNeigh + NEIGH_LAND[k - 1]) : { rise: 0 })}
        s1={{ dark, xray, label }}
        r0={{ progress: 1, opacity: r0Out }}
        r1={{ progress: r1 }}
        rider={onR0 ? { points: R0, t: 0, opacity: riderOut, parked: 1, tag: { text: "15 km/h", p: 1 } } : { points: R1, t: 0, opacity: riderIn, parked: 1, tag: { text: "15 km/h", p: 1 } }}
        overlay={<Chip x={s.x + s.w / 2} y={s.y + s.d / 2} z={s.h} text="NO WALK-INS" color={C.text} size={24} p={frame >= tNo ? pNo : 0} lift={34} opacity={label} />}
      />

      <Source text="Blinkit; Calif. Mgmt Review, 2026" at={tDark} />
    </>
  );
};
