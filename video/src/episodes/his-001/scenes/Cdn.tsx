import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "../../../theme";
import { ease, Header, IsoPacket, Kicker, Reveal, Sfx, Source, Title, useWord } from "../../../engine/kit";
import { CAB_PATHS, CABS, CAB_W, CITY, crowd, dropIn, LandRing, mixCam, useMove, World, type Cam } from "./world";
import { PageCard } from "./parts";
import { bookedSeat } from "./Copies";

const FROM: Cam = { fx: 7.1, fy: 3.7, u: 76, sx: 560, sy: 900 };
/** Where the booking page floats, in screen pixels (top-left of the frame's visual area, clear of the district). */
export const PAGE_AT = { x: 270, y: 545, s: 0.66 };

/** The district after the content delivery network exists: cabinets landed, neighbourhoods tinted. */
export const CDN_ON = {
  cabs: () => ({ drop: 1 }),
  zones: () => 1,
};

/** The page's unchanging parts are copied onto servers near you: a content delivery network. */
export const Cdn: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tUn = wf("cdn", "unchanging");
  const tLogo = wf("cdn", "logo");
  const tCopied = wf("cdn", "copied");
  const tNear = wf("cdn", "near");
  const tContent = wf("cdn", "content");

  const back = useMove(0, 36);
  const cam = mixCam(FROM, CITY, back);
  const pPage = ease(frame, 6, 18);
  const split = ease(frame, tUn, tUn + 12);
  const pulse = frame >= tLogo && frame < tLogo + 24 ? Math.sin(((frame - tLogo) / 24) * Math.PI) : 0;
  const land = (k: number) => tCopied - 2 + k * 7;
  const gone = ease(frame, tCopied + 4, tCopied + 24);
  const label = ease(frame, tContent, tContent + 14);
  const glowAll = frame >= tContent ? 0.6 + 0.3 * Math.sin((frame - tContent) * 0.3) : 0;

  // three copies (logo, button, frame) ride each wire from the hall to its cabinet
  const packets = CAB_PATHS.flatMap((pts, k) =>
    [0, 1, 2].map((j) => {
      const start = land(k) + 4 + j * 4;
      const t = (frame - start) / 26;
      return t > 0 && t < 1 ? <IsoPacket key={`${k}-${j}`} points={pts} t={t} color={j === 0 ? "#FFFFFF" : C.cyan} size={Math.max(5, cam.u * 0.1)} /> : null;
    }),
  );

  return (
    <>
      <Sfx name="swoosh" at={tUn} volume={0.3} />
      {CABS.map((_, k) => (
        <React.Fragment key={k}>
          <Sfx name="thud" at={land(k) + 4} volume={0.28} />
          <Sfx name="pop" at={land(k) + 30} volume={0.22} />
        </React.Fragment>
      ))}
      <Sfx name="data" at={tNear} volume={0.22} />
      <Sfx name="riser" at={tContent - 10} volume={0.2} />

      <Header>
        <Reveal at={0}>
          <Kicker text="THE BIG IDEA" color={C.cyan} />
        </Reveal>
        <Reveal at={4}>
          <Title size={84}>
            Copies, <span style={{ color: C.green }}>close to you</span>
          </Title>
        </Reveal>
      </Header>

      <World
        cam={cam}
        clock={{ time: "10:00" }}
        hall={{ rack: 0.6, glow: 0.5 * pulse }}
        res={{ seat: bookedSeat }}
        pulses={crowd(frame + 600, 0, { n: 18, every: 4, speed: 0.12, opacity: 0.6 })}
        cabs={(k) => ({ plot: ease(frame, tCopied - 8, tCopied), drop: dropIn(frame, land(k)), glow: Math.max(frame >= land(k) + 30 ? 0.5 * Math.max(0, 1 - (frame - land(k) - 30) / 20) : 0, glowAll) })}
        zones={(k) => ease(frame, tNear + k * 5, tNear + k * 5 + 12)}
        serve={(k, j) => ease(frame, tNear + k * 4 + j * 3, tNear + k * 4 + j * 3 + 14)}
        overlay={
          <>
            {packets}
            {/* landing rings */}
            {CABS.map(([x, y], k) => (
              <LandRing key={k} x={x + CAB_W / 2} y={y + CAB_W / 2} t={(frame - land(k) - 6) / 16} r={0.5} />
            ))}
            {pPage > 0.01 && (
              <g transform={`translate(${PAGE_AT.x},${PAGE_AT.y}) scale(${PAGE_AT.s})`} opacity={pPage}>
                <PageCard split={split} gone={gone} pulse={pulse} />
              </g>
            )}
          </>
        }
      />

      {label > 0.01 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1160, display: "flex", justifyContent: "center", opacity: label, transform: `translateY(${(1 - label) * 24}px)` }}>
          <div style={{ padding: "10px 26px", borderRadius: 16, background: "rgba(7,8,12,0.92)", border: `2px solid ${C.green}`, boxShadow: `0 0 30px ${C.green}44`, fontFamily: F.mono, fontWeight: 700, fontSize: 36, letterSpacing: 3, color: C.green }}>
            CONTENT DELIVERY NETWORK
          </div>
        </div>
      )}

      <Source text="Akamai; Ministry of Railways, Jun 2025" at={tCopied} />
    </>
  );
};
