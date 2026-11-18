import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "../../../theme";
import { Header, Kicker, Reveal, Sfx, Source, Title, useIn, useWord } from "../../../engine/kit";
import { hookSeg } from "./Hook";
import { Chip, jamPhones, STREET, trafficPhones, World } from "./world";

/** A source tag at the top: who adds this kind of clue. */
const Tag: React.FC<{ text: string; color: string; x: number; p: number }> = ({ text, color, x, p }) => (
  <div
    style={{
      position: "absolute",
      top: 440,
      left: x,
      transform: `translateX(-50%) scale(${0.6 + 0.4 * Math.min(1, p)})`,
      opacity: Math.min(1, p * 1.6),
      padding: "12px 26px",
      borderRadius: 18,
      background: "rgba(7,8,12,0.94)",
      border: `3px solid ${color}`,
      fontFamily: F.mono,
      fontWeight: 700,
      fontSize: 30,
      letterSpacing: 3,
      color,
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
);

/** More clues on the same street view: driver reports (closures, roadworks) and government data (speed limits, tolls). */
export const Reports: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tDrivers = wf("reports", "drivers");
  const tClosures = wf("reports", "closures");
  const tWorks = wf("reports", "roadworks");
  const tGov = wf("reports", "governments");
  const tSpeed = wf("reports", "speed");
  const tTolls = wf("reports", "tolls");

  const spring = { damping: 11, stiffness: 210 };
  const pDrv = useIn(tDrivers, spring);
  const pClosed = useIn(tClosures, spring);
  const pWorks = useIn(tWorks, spring);
  const pGov = useIn(tGov, spring);
  const pSpeed = useIn(tSpeed, spring);
  const pToll = useIn(tTolls, spring);
  const on = (t: number, p: number) => (frame >= t ? p : 0);

  return (
    <>
      <Sfx name="pop" at={tDrivers} volume={0.28} />
      <Sfx name="error" at={tClosures} volume={0.2} />
      <Sfx name="click" at={tWorks} volume={0.25} />
      <Sfx name="pop" at={tGov} volume={0.28} />
      <Sfx name="click" at={tSpeed} volume={0.22} />
      <Sfx name="coin" at={tTolls} volume={0.25} />

      <Header>
        <Reveal at={0}>
          <Kicker text="MORE CLUES" />
        </Reveal>
        <Reveal at={4}>
          <Title size={80}>
            Reports + <span style={{ color: C.cyan }}>official data</span>
          </Title>
        </Reveal>
      </Header>

      <World
        cam={STREET}
        seg={hookSeg(frame, 0, 1)}
        route={{ progress: 1, opacity: 0.85 }}
        phones={[...trafficPhones(frame), ...jamPhones(frame, 1)]}
        overlay={
          <>
            <Chip x={6.2} y={2.5} text="ROAD CLOSED" color={C.red} size={24} dashed p={on(tClosures, pClosed)} lift={40} />
            <Chip x={8.9} y={7.5} text="ROADWORKS" color={C.accent} size={24} p={on(tWorks, pWorks)} lift={40} />
            <Chip x={10} y={6.6} text="SPEED LIMIT" color={C.cyan} size={24} p={on(tSpeed, pSpeed)} lift={40} />
            <Chip x={10} y={3.6} text="TOLL" color={C.cyan} size={24} p={on(tTolls, pToll)} lift={40} />
          </>
        }
      />

      <Tag text="DRIVER REPORTS" color={C.accent} x={300} p={on(tDrivers, pDrv)} />
      <Tag text="LOCAL GOVT DATA" color={C.cyan} x={780} p={on(tGov, pGov)} />

      <Source text="Google, 2020" at={tDrivers} />
    </>
  );
};
