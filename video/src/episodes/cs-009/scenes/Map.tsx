import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Sfx, useWord } from "../../../engine/kit";
import { Cursor, pop, Ring, Space, Window } from "../../../productui";
import { clampI, Credit, Header, MCO, McoDim, McoPane, move, REPO_URL, SourceLine, Tag } from "./common";

const WIN = { x: 90, y: 470, w: 900, h: 640 };
const PW = WIN.w;
const PH = WIN.h - 52;

/** "This is Archify. Ask it about one feature of your repo. It reads the real code, and its architecture boxes can open the files and lines behind them." */
export const MapScene: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const tArch = wf("map", "archify");
  const tOne = wf("map", "one");
  const tReads = wf("map", "reads");
  const tArchitecture = wf("map", "architecture");
  const tBoxes = wf("map", "boxes");
  const tOpen = wf("map", "open");
  const tFiles = wf("map", "files");
  const tLines = wf("map", "lines");
  const win = pop(f, 0, fps);
  // one feature lit, then the rest wipes in along the arrows, left to right
  const dimIn = clampI(f, tOne, tOne + 10);
  const wipe = clampI(f, tReads, tReads + 44, 612, 1440);
  const dimOut = clampI(f, tReads + 40, tReads + 50);
  const rowRing = clampI(f, tOne + 4, tOne + 20) * (1 - clampI(f, tReads + 30, tReads + 40));
  // camera: whole map → Command Router → its verified source
  const push = move(f, tArchitecture - 4, fps);
  const scale = 0.7 + (1.3 - 0.7) * push;
  const cx = 720 + (MCO.routerMap.x - 720) * push;
  const cy = 420 + (MCO.routerMap.y - 420) * push;
  const focus = clampI(f, tOpen + 2, tOpen + 12);
  const toSrc = move(f, tFiles - 6, fps, 70);
  const v = MCO.verified;
  const ring = clampI(f, tLines - 4, tLines + 12);
  const rx = WIN.x + PW / 2 + (MCO.routerMap.x - cx) * scale;
  const ry = WIN.y + 52 + PH / 2 + (MCO.routerMap.y - cy) * scale;
  const arrive = move(f, tBoxes - 6, fps, 120);
  const curX = 860 + (rx - 860) * arrive;
  const curY = 1120 + (ry + 8 - 1120) * arrive;
  const curOp = clampI(f, tBoxes - 6, tBoxes) * (1 - clampI(f, tFiles, tFiles + 8));
  return (
    <>
      <Sfx name="pop" at={tArch} volume={0.3} />
      <Sfx name="click" at={tOne} volume={0.25} />
      <Sfx name="scan" at={tReads} volume={0.22} dur={50} />
      <Sfx name="whoosh" at={tArchitecture - 4} volume={0.18} />
      <Sfx name="click" at={tOpen} volume={0.4} />
      <Sfx name="ding" at={tLines} volume={0.3} />
      <Space />
      <Header title="It reads your code" />
      <Tag text={REPO_URL} p={pop(f, tArch, fps, 14)} top={414} left={90} />
      <div style={{ opacity: win, transform: `translateY(${(1 - win) * 60}px)` }}>
        <Window kind="browser" title="mco-runtime.architecture.html" {...WIN} tilt={Math.sin(f / 60) * 1.2}>
          <McoPane
            pw={PW}
            ph={PH}
            cx={cx}
            cy={cy}
            scale={scale}
            focus={focus}
            dim={<McoDim amount={dimIn * (1 - dimOut)} wipe={f >= tReads ? wipe : 0} />}
            srcCam={{ cx: v.x + v.w / 2, cy: v.y + v.h / 2 + 4, scale: 3.1, mix: toSrc }}
            srcChildren={ring > 0 ? <Ring x={v.x} y={v.y} w={v.w} h={v.h} p={ring} stroke={1.4} /> : null}
          >
            {rowRing > 0 && <Ring x={MCO.row.x} y={MCO.row.y} w={MCO.row.w} h={MCO.row.h} p={rowRing} stroke={3} />}
          </McoPane>
        </Window>
        <Credit top={WIN.y + WIN.h + 16} />
      </div>
      <Tag text="ONE FEATURE" p={rowRing} top={WIN.y + WIN.h + 10} left={90} />
      <Tag text="OPENS runtime/cli.py · L1945" p={pop(f, tLines, fps, 14)} top={WIN.y + WIN.h + 10} left={90} />
      {curOp > 0 && <Cursor x={curX} y={curY} click={clampI(f, tOpen - 2, tOpen + 12)} opacity={curOp} />}
      <SourceLine text="SOURCE · Archify README, repository-authoring.md" />
    </>
  );
};
