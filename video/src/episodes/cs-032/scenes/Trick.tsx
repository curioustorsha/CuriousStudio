import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../../../theme";
import { Sfx, useWord } from "../../../engine/kit";
import { CodePane, Cursor, pop, PreviewWindow, Space, Window } from "../../../productui";
import { RemotionLogo } from "../../../logos";
import { Card, clampI, fold, Header, SourceLine, useCode } from "./common";

const SIZE = 19;
const ED = { x: 60, y: 420, w: 900, h: 240 };
const PV = { x: 250, y: 680, w: 290 };
const S = PV.w / 1080;
/** Title's translate + scale (lines 39–46), dedented by 8; line 39 is the one Studio rewrites (see proof/edited/README.md). */
const RANGES: [number, number][] = [[39, 46]];
const CHANGED = 39;
/** Title centre in the card at rest, and the drag (160 px up), in card units. */
const TITLE_Y = 908;
const DRAG = -160;
/** Keyframe strip: 0 to 1.2 s across its width. */
const TRACK = { x: 590, y: 1010, w: 360 };
const sx = (sec: number) => TRACK.x + 30 + (sec / 1.2) * (TRACK.w - 60);

const Diamond: React.FC<{ x: number; y: number; on?: boolean }> = ({ x, y, on }) => (
  <div style={{ position: "absolute", left: x - 13, top: y - 13, width: 26, height: 26, transform: "rotate(45deg)", borderRadius: 4, background: on ? C.accent : "rgba(255,181,71,0.35)", boxShadow: on ? `0 0 20px ${C.accent}` : undefined }} />
);

/** "That's the trick. Remotion Studio can edit code written this way by hand: drag a line, move a keyframe, and it saves the change back into your code." */
export const Trick: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const { after, edited } = useCode();
  if (!after || !edited) return null;
  const tTrick = wf("trick", "trick");
  const tStudio = wf("trick", "studio");
  const tDrag = wf("trick", "drag");
  const tMove = wf("trick", "move");
  const tKey = wf("trick", "keyframe");
  const tSaves = wf("trick", "saves");
  const tBack = wf("trick", "back");
  const saved = f >= tSaves + 4;
  const code = fold(saved ? edited : after, RANGES, 8);
  const sweep = clampI(f, tTrick - 4, tTrick + 22);
  const sweepGlow = sweep > 0 && sweep < 1 ? Math.sin(sweep * Math.PI) : 0;
  const ed = pop(f, 0, fps);
  const pv = pop(f, 6, fps);
  const chip = pop(f, tStudio - 4, fps, 14);
  // drag: cursor grabs the title, pulls it down 160 card px; the edited card's real frame fades in under it
  const drag = spring({ frame: f - tDrag, fps, config: { damping: 200, stiffness: 90 } });
  const titleY = PV.y + 52 + TITLE_Y * S;
  const grab = clampI(f, tDrag - 16, tDrag - 4);
  const cx = interpolate(grab, [0, 1], [700, PV.x + PV.w / 2]);
  const cy = interpolate(grab, [0, 1], [1220, titleY]) + DRAG * S * drag;
  // keyframe: the translate's end keyframe slides from 0.6 s to 1 s
  const kf = spring({ frame: f - tKey, fps, config: { damping: 200, stiffness: 90 } });
  const kfSec = 0.6 + 0.4 * kf;
  const kfCursor = f >= tMove - 8;
  const kcx = kfCursor ? sx(kfSec) : cx;
  const kcy = kfCursor ? TRACK.y + 62 : cy;
  const replay = f >= tBack;
  const savedP = clampI(f, tSaves + 4, tSaves + 14);
  return (
    <>
      <Sfx name="riser" at={Math.max(0, tTrick - 18)} volume={0.2} dur={24} />
      <Sfx name="pop" at={tStudio - 4} volume={0.3} />
      <Sfx name="click" at={tDrag - 4} volume={0.35} />
      <Sfx name="swoosh" at={tDrag} volume={0.15} />
      <Sfx name="click" at={tKey - 2} volume={0.3} />
      <Sfx name="ding" at={tSaves + 4} volume={0.35} />
      <Space />
      <Header title="Drag it. The code updates." />
      <div style={{ opacity: ed, transform: `translateY(${(1 - ed) * -40}px)` }}>
        <Window title="TitleCard.tsx · Title" {...ED} style={{ boxShadow: `0 40px 90px rgba(0,0,0,0.6), 0 0 ${80 * sweepGlow}px ${C.accent}66` }}>
          <CodePane
            code={code.text}
            size={SIZE}
            marks={saved ? [code.at(CHANGED)] : []}
            markP={savedP}
            spans={saved ? [{ line: code.at(CHANGED), text: "[0, 1 * fps], ['0px 80px', '0px -160px']", p: savedP }] : []}
            glowLine={{ line: code.at(CHANGED), p: sweepGlow }}
          />
        </Window>
      </div>
      <div
        style={{
          position: "absolute",
          left: TRACK.x,
          top: 760,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 18px 10px 12px",
          borderRadius: 14,
          border: `2px solid ${C.accent}`,
          background: "rgba(255,181,71,0.10)",
          fontFamily: F.mono,
          fontWeight: 700,
          fontSize: 22,
          color: C.accent,
          opacity: chip,
          transform: `scale(${0.7 + 0.3 * chip})`,
          transformOrigin: "0 50%",
        }}
      >
        <RemotionLogo size={30} />
        Remotion Studio
      </div>
      <div style={{ opacity: pv, transform: `scale(${0.85 + 0.15 * pv})` }}>
        <PreviewWindow
          {...PV}
          title="Preview"
          overlay={
            // where the title sat before the drag (annotation, card units), with an arrow down to where it went
            <div style={{ opacity: clampI(f, tDrag - 2, tDrag + 6) * (1 - clampI(f, tBack - 6, tBack + 4)) }}>
              <div style={{ position: "absolute", left: 90, right: 90, top: TITLE_Y - 72, height: 144, borderRadius: 24, border: `8px dashed ${C.accent}`, opacity: 0.8 }} />
              <div style={{ position: "absolute", left: 1080 - 130, top: TITLE_Y + DRAG * drag, width: 0, height: Math.abs(DRAG) * drag, borderLeft: `10px solid ${C.accent}` }} />
            </div>
          }
        >
          {replay ? (
            <Card kind="edited" from={tBack} />
          ) : (
            <>
              <div style={{ position: "absolute", inset: 0, opacity: 1 - drag }}>
                <Card kind="after" freeze={89} />
              </div>
              <div style={{ position: "absolute", inset: 0, opacity: drag }}>
                <Card kind="edited" freeze={89} />
              </div>
            </>
          )}
        </PreviewWindow>
      </div>
      <div style={{ opacity: pop(f, tMove - 10, fps) }}>
        <div style={{ position: "absolute", left: TRACK.x, top: TRACK.y - 50, fontFamily: F.mono, fontSize: 20, color: C.muted }}>Title · translate</div>
        <div style={{ position: "absolute", left: TRACK.x + 30, top: TRACK.y - 2, width: TRACK.w - 60, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
        <Diamond x={sx(0)} y={TRACK.y} />
        <Diamond x={sx(kfSec)} y={TRACK.y} on />
        <div style={{ position: "absolute", left: sx(kfSec) - 40, top: TRACK.y + 22, width: 80, textAlign: "center", fontFamily: F.mono, fontWeight: 700, fontSize: 22, color: C.accent }}>{kfSec.toFixed(1)} s</div>
      </div>
      {f >= tDrag - 16 && f < tBack + 10 && <Cursor x={kcx} y={kcy} click={kfCursor ? clampI(f, tKey - 2, tKey + 10) : clampI(f, tDrag - 4, tDrag + 8)} opacity={1 - clampI(f, tBack, tBack + 10)} />}
      <SourceLine text="SOURCE · remotion.dev, Studio interactivity · edit shown by hand" />
    </>
  );
};
