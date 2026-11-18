import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "../../../theme";
import { ease, Header, Kicker, Reveal, Sfx, Source, Title, useIn, useWord } from "../../../engine/kit";
import { CITY, jamPhones, trafficPhones, World } from "./world";

const WEEKS = 10;
/** The last four weeks are the trusted window ("two to four weeks"); the newest two are the core. */
const recent = (k: number) => k >= WEEKS - 4;

/** 2020 lockdowns: the roads empty, and the history Google trusts shrinks to the last two to four weeks. */
export const Lockdown: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tEmpty = wf("lockdown", "emptied");
  const tTrust = wf("lockdown", "trusting");
  const tTwo = wf("lockdown", "two");
  const tOlder = wf("lockdown", "older");

  const empty = ease(frame, tEmpty, tEmpty + 16);
  const pStrip = useIn(tTrust - 4, { damping: 13, stiffness: 200 });
  const pick = ease(frame, tTwo, tTwo + 12);
  const fadeOld = ease(frame, tOlder, tOlder + 12);
  const pTag = useIn(tTwo + 4, { damping: 11, stiffness: 220 });

  const W = 74;
  const GAP = 12;
  const total = WEEKS * W + (WEEKS - 1) * GAP;
  const left0 = (1080 - total) / 2;
  const winLeft = left0 + (WEEKS - 4) * (W + GAP) - 8;
  const winW = 4 * W + 3 * GAP + 16;

  return (
    <>
      <Sfx name="whoosh" at={tEmpty} volume={0.22} />
      <Sfx name="scan" at={tTrust} volume={0.2} dur={24} />
      <Sfx name="ding" at={tTwo + 4} volume={0.28} />

      <Header>
        <Reveal at={0}>
          <Kicker text="2020 · LOCKDOWNS" color={C.red} />
        </Reveal>
        <Reveal at={4}>
          <Title size={80}>
            Recent weeks <span style={{ color: C.accent }}>count more</span>
          </Title>
        </Reveal>
      </Header>

      <World
        cam={CITY}
        route={{ progress: 1, opacity: 0.85 }}
        seg={() => ({ tint: 0, on: 0.75 })}
        you={{ label: 1 }}
        phones={[...trafficPhones(frame, 1 - 0.8 * empty), ...jamPhones(frame, 1, 1 - 0.9 * empty)]}
      />

      {/* History as weekly tiles; the last 2–4 weeks light up, older ones fade */}
      <div style={{ position: "absolute", top: 1060, left: 0, right: 0, height: 150, opacity: frame >= tTrust - 4 ? Math.min(1, pStrip * 1.6) : 0 }}>
        {Array.from({ length: WEEKS }, (_, k) => {
          const on = recent(k);
          return (
            <div
              key={k}
              style={{
                position: "absolute",
                top: 40,
                left: left0 + k * (W + GAP),
                width: W,
                height: 74,
                borderRadius: 14,
                background: on ? `rgba(255,181,71,${0.15 + 0.6 * pick})` : "rgba(30,34,48,0.9)",
                border: `3px ${on ? "solid" : "dashed"} ${on ? C.accent : C.muted}`,
                opacity: on ? 1 : 1 - 0.65 * fadeOld,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: F.mono,
                fontWeight: 700,
                fontSize: 20,
                color: on ? C.text : C.muted,
              }}
            >
              {k === WEEKS - 1 ? "NOW" : ""}
            </div>
          );
        })}
        <div
          style={{
            position: "absolute",
            top: 26,
            left: winLeft,
            width: winW,
            height: 102,
            borderRadius: 20,
            border: `3px solid ${C.accent}`,
            opacity: pick,
            boxShadow: `0 0 30px ${C.accent}55`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -26,
            left: winLeft + winW / 2,
            transform: `translateX(-50%) scale(${0.6 + 0.4 * Math.min(1, pTag)})`,
            opacity: frame >= tTwo + 4 ? Math.min(1, pTag * 1.6) : 0,
            fontFamily: F.mono,
            fontWeight: 700,
            fontSize: 28,
            letterSpacing: 3,
            color: C.accent,
            whiteSpace: "nowrap",
          }}
        >
          LAST 2–4 WEEKS
        </div>
      </div>

      <Source text="Google, 2020" at={tEmpty} />
    </>
  );
};
