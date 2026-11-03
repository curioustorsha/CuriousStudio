import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../theme";
import { ease, Header, Kicker, Sfx, Source, Title, useIn } from "../lib";
import { wf } from "../timing";
import { binXY, BH, BW, GAP, KEY, Shelf, SHELF_W, Tag } from "./Shelf";

export const HOOK_TOP = 400;
export const HOOK_LEFT = (1080 - SHELF_W) / 2;

// The opening frame. The outro ends on exactly this layout so the video loops.
export const HookHeader: React.FC = () => (
  <Header>
    <Kicker text="INSIDE AN AMAZON WAREHOUSE" />
    <Title size={70}>
      Why is this shelf <span style={{ color: C.accent }}>a mess?</span>
    </Title>
  </Header>
);

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const tPurpose = wf("hook", "purpose");
  const tPhone = wf("hook", "phone");
  const tBook = wf("hook", "cookbook");
  const tDog = wf("hook", "dog");
  const tEnd = wf("hook", "toy", 0, "end");

  const pPhone = useIn(tPhone);
  const pBook = useIn(tBook);
  const pDog = useIn(tDog);
  const pStamp = useIn(tPurpose - 3, { damping: 12, stiffness: 220 });
  const stampOut = ease(frame, tPhone - 8, tPhone);

  const keys = [KEY.phone, KEY.cookbook, KEY.dog];
  const shown = [tPhone, tBook, tDog];
  const glow = (i: number) => {
    const k = keys.indexOf(i);
    if (k < 0 || frame < shown[k]) return 0;
    return ease(frame, shown[k], shown[k] + 8) * (1 - ease(frame, tEnd + 6, tEnd + 14));
  };
  const focus = ease(frame, tPhone, tPhone + 8) * (1 - ease(frame, tEnd + 6, tEnd + 14));
  const dim = (i: number) => (keys.includes(i) ? 0 : 0.45 * focus);
  // Items jitter while the narrator says "a mess", then settle.
  const shake = 0.6 * (1 - ease(frame, tPurpose - 10, tPurpose));
  const zoom = 1 + 0.05 * ease(frame, 0, durationInFrames);
  const behind = ease(frame, tPurpose - 4, tPurpose + 4) * (1 - stampOut);

  const tagAt = (i: number, text: string, p: number) => {
    const { x, y } = binXY(i);
    return <Tag text={text} p={p} style={{ left: HOOK_LEFT + x + BW / 2, top: HOOK_TOP + y - 4 }} />;
  };

  return (
    <>
      <Sfx name="ambience" at={0} volume={0.1} dur={durationInFrames} />
      <Sfx name="impact" at={tPurpose - 3} volume={0.75} />
      <Sfx name="whoosh" at={tPhone - 8} volume={0.25} />
      <Sfx name="pop" at={tPhone} volume={0.55} />
      <Sfx name="pop" at={tBook} volume={0.55} />
      <Sfx name="pop" at={tDog} volume={0.55} />

      <HookHeader />

      <div
        style={{
          position: "absolute",
          left: HOOK_LEFT,
          top: HOOK_TOP,
          transform: `scale(${zoom})`,
          transformOrigin: "50% 40%",
          filter: `blur(${behind * 6}px) brightness(${1 - behind * 0.5})`,
        }}
      >
        <Shelf popStart={-100} glow={glow} dim={dim} shake={shake} />
      </div>

      {frame >= tPhone - 2 && (
        <div style={{ opacity: 1 - ease(frame, tEnd + 6, tEnd + 14) }}>
          {tagAt(KEY.phone, "Phone case", pPhone)}
          {tagAt(KEY.cookbook, "Cookbook", pBook)}
          {tagAt(KEY.dog, "Dog toy", pDog)}
        </div>
      )}

      {frame >= tPurpose - 3 && stampOut < 1 && (
        <div
          style={{
            position: "absolute",
            top: HOOK_TOP + 2.5 * (BH + GAP) - 110,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: 1 - stampOut,
            transform: `scale(${1 - 0.2 * stampOut})`,
          }}
        >
          <div
            style={{
              padding: "26px 50px",
              border: `8px solid ${C.accent}`,
              borderRadius: 28,
              color: C.accent,
              fontFamily: F.sans,
              fontWeight: 900,
              fontSize: 118,
              letterSpacing: -4,
              lineHeight: 1,
              transform: `rotate(-5deg) scale(${2.2 - 1.2 * pStamp})`,
              opacity: Math.min(1, pStamp * 1.5),
              background: "rgba(7,8,12,0.6)",
              boxShadow: `0 0 80px rgba(255,181,71,0.35)`,
              textShadow: `0 0 40px rgba(255,181,71,0.5)`,
            }}
          >
            ON PURPOSE.
          </div>
        </div>
      )}

      <Source text="ABOUTAMAZON.COM" at={20} />
    </>
  );
};
