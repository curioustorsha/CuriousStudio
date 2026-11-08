import React from "react";
import { AbsoluteFill, Audio, Composition, Sequence, Series, staticFile, Still, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F, FPS, H, W } from "./theme";
import { Backdrop, Captions, SceneShell } from "./lib";
import { musicFile, ORDER, scene, SceneId, sceneFrames, speechRanges, totalFrames } from "./timing";
import { Hook } from "./scenes/Hook";
import { Stow } from "./scenes/Stow";
import { Track } from "./scenes/Track";
import { Spread } from "./scenes/Spread";
import { Benefits } from "./scenes/Benefits";
import { Kiva } from "./scenes/Kiva";
import { Million } from "./scenes/Million";
import { Outro } from "./scenes/Outro";
import { Cover } from "./scenes/Cover";
import { LOGO_FRAMES, LogoSting } from "./scenes/LogoSting";
import { Asterisk, LogoMark } from "./brand";
import { EPISODES } from "./episodes";
import { CarouselSlide, Slideshow, slideshowFrames, type SlideProps, type SlideshowProps } from "./carousel/Slides";
import { IsoDemo } from "./engine/IsoDemo";

const SCENES: Record<SceneId, React.FC> = {
  hook: Hook,
  stow: Stow,
  track: Track,
  spread: Spread,
  benefits: Benefits,
  kiva: Kiva,
  million: Million,
  outro: Outro,
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

// Channel mark + series tag, top-left.
export const Watermark: React.FC = () => (
  <div style={{ position: "absolute", top: 56, left: 60, display: "flex", alignItems: "center", gap: 16 }}>
    <div style={{ display: "flex", alignItems: "flex-start", fontFamily: F.sans, fontWeight: 800, fontSize: 32, color: "rgba(245,245,247,0.8)", letterSpacing: -0.5, lineHeight: 1 }}>
      curiously
      <span style={{ display: "flex", marginLeft: 3, marginTop: -3 }}>
        <Asterisk size={15} />
      </span>
    </div>
    <div
      style={{
        fontFamily: F.mono,
        fontWeight: 700,
        fontSize: 18,
        letterSpacing: 2,
        color: C.accent,
        padding: "5px 12px",
        borderRadius: 8,
        border: "1px solid rgba(255,181,71,0.4)",
        background: "rgba(255,181,71,0.08)",
      }}
    >
      HOW IT SCALES
    </div>
  </div>
);

// Music ducks under the narration and comes up in the gaps.
const DUCKED = 0.09;
const OPEN = 0.2;
const Music: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const gains = React.useMemo(() => {
    const speaking = new Float32Array(durationInFrames);
    for (const [a, b] of speechRanges()) for (let f = Math.floor(a); f <= Math.ceil(b) && f < durationInFrames; f++) speaking[f] = 1;
    // Smooth: fast attack (duck in ~4 frames), slow release (~12 frames).
    const g = new Float32Array(durationInFrames);
    let level = OPEN;
    for (let f = 0; f < durationInFrames; f++) {
      const target = speaking[f] ? DUCKED : OPEN;
      level += (target - level) * (target < level ? 0.35 : 0.1);
      g[f] = level;
    }
    return g;
  }, [durationInFrames]);
  return (
    <Audio
      src={staticFile(musicFile())}
      volume={(f) => {
        const edge = Math.min(1, f / 6, (durationInFrames - f) / 12);
        return gains[Math.min(f, durationInFrames - 1)] * Math.max(0, edge);
      }}
    />
  );
};

export const AmazonChaos: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <Backdrop />
    <Music />
    <Series>
      {ORDER.map((id, i) => {
        const Scene = SCENES[id];
        return (
          <Series.Sequence key={id} durationInFrames={sceneFrames(id)} name={id}>
            <SceneShell enter={i !== 0}>
              <Scene />
            </SceneShell>
            <Audio src={staticFile(scene(id).file)} />
            <Captions id={id} />
          </Series.Sequence>
        );
      })}
      <Series.Sequence durationInFrames={LOGO_FRAMES} name="logo">
        <LogoSting />
      </Series.Sequence>
    </Series>
    <Sequence durationInFrames={totalFrames()} layout="none">
      <Watermark />
    </Sequence>
    <Progress />
  </AbsoluteFill>
);

const SAMPLE_SLIDE: SlideProps = {
  series: "AI THIS WEEK",
  index: 1,
  total: 7,
  slide: {
    kind: "story",
    kicker: "Anthropic",
    title: "A sample headline that fits two lines",
    body: "What happened, in one or two short sentences a phone can read without zooming.",
    why: "The one-line reason a viewer should care.",
    source: "Company blog, 30 Oct 2026",
    icon: "ai",
    stat: "2×",
  },
};

const SAMPLE_SHOW: SlideshowProps = { series: "AI THIS WEEK", slides: [SAMPLE_SLIDE.slide] };

// Square logo for profile pictures and app icons. `bg` null = transparent; the mark stays inside the circle crop.
type AvatarProps = { bg: string | null; cColor: string };
const Avatar: React.FC<AvatarProps> = ({ bg, cColor }) => (
  <AbsoluteFill style={{ background: bg ?? "transparent", alignItems: "center", justifyContent: "center" }}>
    <LogoMark size={640} cColor={cColor} />
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="AmazonChaos" component={AmazonChaos} durationInFrames={totalFrames() + LOGO_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="Cover" component={Cover} durationInFrames={1} fps={FPS} width={W} height={H} />
    {/* Carousel episodes: rendered with props from src/carousels/<slug>/slides.json by scripts/carousel.mjs */}
    <Still id="Slide-4x5" component={CarouselSlide} width={W} height={1350} defaultProps={SAMPLE_SLIDE} />
    <Still id="Slide-9x16" component={CarouselSlide} width={W} height={H} defaultProps={SAMPLE_SLIDE} />
    <Composition
      id="Slideshow"
      component={Slideshow}
      fps={FPS}
      width={W}
      height={H}
      durationInFrames={slideshowFrames(SAMPLE_SHOW)}
      defaultProps={SAMPLE_SHOW}
      calculateMetadata={({ props }) => ({ durationInFrames: slideshowFrames(props) })}
    />
    {/* Logo square: npx remotion still Avatar ../brand/curiously-logo-dark.png --props='{"bg":"#07080C","cColor":"#F5F5F7"}' */}
    <Still id="Avatar" component={Avatar} width={1024} height={1024} defaultProps={{ bg: C.bg, cColor: C.text } as AvatarProps} />
    {/* Isometric kit preview for How It Scales */}
    <Still id="IsoDemo" component={IsoDemo} width={W} height={H} />
    {EPISODES.map((ep) => (
      <React.Fragment key={ep.code}>
        <Composition id={ep.code} component={ep.Video} durationInFrames={ep.durationInFrames} fps={FPS} width={W} height={H} />
        <Still id={`${ep.code}-cover`} component={ep.Cover} width={W} height={H} />
      </React.Fragment>
    ))}
  </>
);
