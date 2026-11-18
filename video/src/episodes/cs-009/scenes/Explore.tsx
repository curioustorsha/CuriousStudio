import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Sfx, useWord } from "../../../engine/kit";
import { Cursor, ImagePane, pop, Ring, Space, Window } from "../../../productui";
import { clampI, Credit, Header, move, PROOF, SourceLine } from "./common";

const WIN = { x: 90, y: 470, w: 900, h: 552 };
const PW = WIN.w;
const PH = WIN.h - 52;

/** The maker's viewer demos from the README (docs/assets), 1280×720 each. */
const REACH = { src: `${PROOF}/archify-demo-reach.png`, natW: 1280, natH: 720 };
const ROUTE = { src: `${PROOF}/archify-demo-route.png`, natW: 1280, natH: 720 };
/** Spots in image units. */
const PLANNER = { x: 737, y: 415 };
const UP = { x: 46, y: 400, w: 125, h: 32 };
const DOWN = { x: 176, y: 400, w: 125, h: 32 };
const WEBAPP = { x: 220, y: 242 };
const POSTGRES = { x: 1072, y: 242 };
const CHIPS = { x: 40, y: 582, w: 186, h: 33 };
const SUMMARY = { x: 42, y: 657, w: 196, h: 20 };

type Cam = { cx: number; cy: number; scale: number };
const mix = (a: Cam, b: Cam, m: number): Cam => ({ cx: a.cx + (b.cx - a.cx) * m, cy: a.cy + (b.cy - a.cy) * m, scale: a.scale + (b.scale - a.scale) * m });
const toScreen = (cam: Cam, p: { x: number; y: number }) => ({ x: WIN.x + PW / 2 + (p.x - cam.cx) * cam.scale, y: WIN.y + 52 + PH / 2 + (p.y - cam.cy) * cam.scale });

/** "Pick a box and trace everything upstream or downstream. Pick a start and an end, and it traces the route between them." */
export const Explore: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const tBox = wf("explore", "box");
  const tTrace = wf("explore", "trace");
  const tUp = wf("explore", "upstream");
  const tDown = wf("explore", "downstream");
  const tPick2 = wf("explore", "pick", 1);
  const tStart = wf("explore", "start");
  const tEnd = wf("explore", "end");
  const tRoute = wf("explore", "route");
  const route = f >= tPick2;
  const win = pop(f, 0, fps);

  // reach: on the Agent Planner box → pull back to the passport → into the reach tiles
  let reachCam: Cam = { cx: PLANNER.x, cy: PLANNER.y, scale: 1.9 };
  reachCam = mix(reachCam, { cx: 430, cy: 420, scale: 1.05 }, move(f, tTrace - 4, fps));
  reachCam = mix(reachCam, { cx: 190, cy: 404, scale: 2.4 }, move(f, tUp - 8, fps));
  // route: whole sequence → the Path panel
  let routeCam: Cam = { cx: 640, cy: 360, scale: 0.7 };
  routeCam = mix(routeCam, { cx: 380, cy: 528, scale: 1.3 }, move(f, tRoute - 8, fps, 70));

  const upRing = clampI(f, tUp, tUp + 12) * (1 - clampI(f, tDown, tDown + 6));
  const downRing = clampI(f, tDown, tDown + 12);
  const chipRing = clampI(f, tRoute + 4, tRoute + 18);
  const sumRing = clampI(f, tRoute + 14, tRoute + 28);

  // cursor
  const planner = toScreen(reachCam, PLANNER);
  const web = toScreen(routeCam, WEBAPP);
  const pg = toScreen(routeCam, POSTGRES);
  const toPg = move(f, tEnd - 8, fps, 140);
  const cur = route ? { x: web.x + (pg.x - web.x) * toPg, y: web.y + (pg.y - web.y) * toPg } : { x: planner.x + 10, y: planner.y + 10 };
  const curOp = route ? clampI(f, tStart - 6, tStart) * (1 - clampI(f, tRoute - 6, tRoute + 2)) : clampI(f, 0, 4) * (1 - clampI(f, tTrace, tTrace + 8));
  const click = route ? (f < tEnd - 2 ? clampI(f, tStart - 2, tStart + 12) : clampI(f, tEnd - 2, tEnd + 12)) : clampI(f, tBox - 2, tBox + 12);

  return (
    <>
      <Sfx name="click" at={tBox - 2} volume={0.35} />
      <Sfx name="pop" at={tUp} volume={0.25} />
      <Sfx name="pop" at={tDown} volume={0.25} />
      <Sfx name="swoosh" at={tPick2} volume={0.25} />
      <Sfx name="click" at={tStart - 2} volume={0.35} />
      <Sfx name="click" at={tEnd - 2} volume={0.35} />
      <Sfx name="data" at={tRoute - 6} volume={0.18} dur={40} />
      <Space />
      <Header title="Trace any path" />
      <div style={{ opacity: win, transform: `translateY(${(1 - win) * 60}px)` }}>
        {!route ? (
          <Window kind="browser" title="Agent Tool Call Workflow" {...WIN} tilt={Math.sin(f / 60) * 1.2}>
            <ImagePane {...REACH} pw={PW} ph={PH} {...reachCam} label="Maker's reach demo: docs/assets/archify-demo-reach.png">
              <Ring {...UP} p={upRing} stroke={2} />
              <Ring {...DOWN} p={downRing} stroke={2} />
            </ImagePane>
          </Window>
        ) : (
          <Window kind="browser" title="Cache Miss Request Sequence" {...WIN} tilt={Math.sin(f / 60) * 1.2}>
            <ImagePane {...ROUTE} pw={PW} ph={PH} {...routeCam} label="Maker's route demo: docs/assets/archify-demo-route.png">
              <Ring {...CHIPS} p={chipRing} stroke={2.5} />
              <Ring {...SUMMARY} p={sumRing} stroke={2.5} />
            </ImagePane>
          </Window>
        )}
        <Credit top={WIN.y + WIN.h + 16} />
      </div>
      {curOp > 0 && <Cursor x={cur.x} y={cur.y} click={click} opacity={curOp} />}
      <SourceLine text="SOURCE · Archify README, viewer demos" />
    </>
  );
};
