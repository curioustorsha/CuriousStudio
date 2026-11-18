import React from "react";
import { AbsoluteFill, Audio, Series, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../theme";
import { LOGO_FRAMES, LogoSting } from "../scenes/LogoSting";
import { Backdrop, Captions, SceneShell, TimingContext, useTiming } from "./kit";
import { makeTiming, type Manifest } from "./timing";

export type EpisodeDef = {
  /** Tracker code, e.g. "HIS-003". Also the Remotion composition id. */
  code: string;
  title: string;
  /** Series tag, e.g. "HOW IT SCALES". No longer drawn on the video: the top 260 px sit under the platforms' status bar and tabs. */
  seriesTag: string;
  manifest: Manifest;
  /** One component per scene id in the manifest. */
  scenes: Record<string, React.FC>;
  /** Static cover / thumbnail frame. */
  Cover: React.FC;
  /** Extra silence (seconds) after a scene's last word. */
  tail?: Record<string, number>;
  /**
   * Append the generic logo sting after the last scene (default true). Set false when the last scene is its
   * own sign-off end card (e.g. the "like, share and follow" card), so the video ends on it and loops cleanly.
   */
  endSting?: boolean;
  /** Cut straight between scenes instead of the blur-fade in and out (Claude Skills: no dip to dark at every cut). */
  hardCuts?: boolean;
  /** Moves every scene's picture down (captions stay put). For episodes laid out before the 2026-11-18 safe zones. */
  shiftY?: number;
};

const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, background: "rgba(255,255,255,0.06)" }}>
      <div style={{ width: `${(frame / durationInFrames) * 100}%`, height: "100%", background: C.accent, boxShadow: `0 0 16px ${C.accent}` }} />
    </div>
  );
};

// Music ducks under the narration and comes up in the gaps.
const DUCKED = 0.09;
const OPEN = 0.2;
const Music: React.FC<{ file: string }> = ({ file }) => {
  const t = useTiming();
  const { durationInFrames } = useVideoConfig();
  const gains = React.useMemo(() => {
    const speaking = new Float32Array(durationInFrames);
    for (const [a, b] of t.speechRanges()) for (let f = Math.floor(a); f <= Math.ceil(b) && f < durationInFrames; f++) speaking[f] = 1;
    const g = new Float32Array(durationInFrames);
    let level = OPEN;
    for (let f = 0; f < durationInFrames; f++) {
      const target = speaking[f] ? DUCKED : OPEN;
      level += (target - level) * (target < level ? 0.35 : 0.1);
      g[f] = level;
    }
    return g;
  }, [t, durationInFrames]);
  return (
    <Audio
      src={staticFile(file)}
      volume={(f) => {
        const edge = Math.min(1, f / 6, (durationInFrames - f) / 12);
        return gains[Math.min(f, durationInFrames - 1)] * Math.max(0, edge);
      }}
    />
  );
};

/** Builds an episode's composition from its manifest and scene components. Register it in src/episodes/index.ts. */
export const makeEpisode = (def: EpisodeDef) => {
  const t = makeTiming(def.manifest, def.tail);
  const missing = t.ORDER.filter((id) => !def.scenes[id]);
  const sting = def.endSting !== false;

  const Video: React.FC = () => (
    <TimingContext.Provider value={t}>
      <AbsoluteFill style={{ background: C.bg }}>
        <Backdrop />
        {t.music && <Music file={t.music} />}
        <Series>
          {t.ORDER.map((id, i) => {
            const Scene = def.scenes[id] ?? (() => <MissingScene id={id} />);
            return (
              <Series.Sequence key={id} durationInFrames={t.sceneFrames(id)} name={id}>
                <SceneShell enter={!def.hardCuts && i !== 0} exit={!def.hardCuts && (sting || i !== t.ORDER.length - 1)}>
                  {def.shiftY ? (
                    <AbsoluteFill style={{ transform: `translateY(${def.shiftY}px)` }}>
                      <Scene />
                    </AbsoluteFill>
                  ) : (
                    <Scene />
                  )}
                </SceneShell>
                <Audio src={staticFile(t.scene(id).file)} />
                <Captions id={id} />
              </Series.Sequence>
            );
          })}
          {sting && (
            <Series.Sequence durationInFrames={LOGO_FRAMES} name="logo">
              <LogoSting />
            </Series.Sequence>
          )}
        </Series>
        <Progress />
      </AbsoluteFill>
    </TimingContext.Provider>
  );

  const Cover: React.FC = () => (
    <TimingContext.Provider value={t}>
      <def.Cover />
    </TimingContext.Provider>
  );

  return { code: def.code, title: def.title, Video, Cover, durationInFrames: t.totalFrames() + (sting ? LOGO_FRAMES : 0), missing };
};

export type Episode = ReturnType<typeof makeEpisode>;

/** Placeholder so a half-built episode still renders: shows which scene is missing. */
const MissingScene: React.FC<{ id: string }> = ({ id }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: F.mono, fontSize: 40, color: C.red }}>
    Scene “{id}” not built yet
  </AbsoluteFill>
);
