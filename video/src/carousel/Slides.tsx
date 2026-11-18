import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Asterisk } from "../brand";
import { Product } from "../products";
import { C, F, FPS } from "../theme";

/**
 * Carousel slides for picture-stack episodes (AI This Week). One fixed template every week so only the content
 * changes. The same slide renders at 4:5 (1080×1350, Instagram) and 9:16 (1080×1920, TikTok photo mode and the
 * slideshow Short): the layout keeps the safe zone of both.
 *
 * Content comes from src/carousels/<slug>/slides.json (see scripts/carousel.mjs):
 *   { "series": "AI THIS WEEK", "music": "music.mp3", "slides": [ { "kind": "cover", … }, … ] }
 */

export type Slide =
  | { kind: "cover"; kicker: string; title: string; icon?: string; date?: string }
  | { kind: "story"; text: string; source: string }
  | { kind: "outro"; title: string; cta: string };

export type SlideProps = { slide: Slide; index: number; total: number; series: string };

const PAD = 84;

/** Distance from the top to the content block, so 4:5 and 9:16 both read well. */
function useTopPad() {
  const { height } = useVideoConfig();
  return height > 1500 ? 300 : 190;
}

const Brand: React.FC<{ series: string }> = ({ series }) => (
  <div style={{ position: "absolute", top: 64, left: PAD, right: PAD, display: "flex", alignItems: "center", gap: 16 }}>
    <div style={{ display: "flex", alignItems: "flex-start", fontFamily: F.sans, fontWeight: 800, fontSize: 34, color: C.text, letterSpacing: -0.5, lineHeight: 1 }}>
      curiously
      <span style={{ display: "flex", marginLeft: 3, marginTop: -3 }}>
        <Asterisk size={16} />
      </span>
    </div>
    <div
      style={{
        fontFamily: F.mono,
        fontWeight: 700,
        fontSize: 20,
        letterSpacing: 2,
        color: C.accent,
        padding: "6px 14px",
        borderRadius: 8,
        border: "1px solid rgba(255,181,71,0.4)",
        background: "rgba(255,181,71,0.08)",
      }}
    >
      {series}
    </div>
  </div>
);

/** Page dots at the bottom: where you are in the stack, and a nudge to keep swiping. */
const Dots: React.FC<{ index: number; total: number }> = ({ index, total }) => {
  const { height } = useVideoConfig();
  return (
    <div style={{ position: "absolute", bottom: height > 1500 ? 420 : 70, left: PAD, display: "flex", alignItems: "center", gap: 10 }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{ width: i === index ? 34 : 10, height: 10, borderRadius: 5, background: i === index ? C.accent : "rgba(245,245,247,0.22)" }}
        />
      ))}
      {index < total - 1 && (
        <span style={{ marginLeft: 14, fontFamily: F.mono, fontWeight: 700, fontSize: 20, letterSpacing: 2, color: C.muted }}>SWIPE →</span>
      )}
    </div>
  );
};

const Kicker: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 26, letterSpacing: 3, color: C.accent, textTransform: "uppercase" }}>{children}</div>
);

const Glow: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: `radial-gradient(900px 700px at 85% 10%, rgba(255,181,71,0.10), transparent 60%), radial-gradient(800px 800px at 0% 100%, rgba(79,209,255,0.07), transparent 60%)`,
    }}
  />
);

const CoverSlide: React.FC<{ s: Extract<Slide, { kind: "cover" }> }> = ({ s }) => {
  const top = useTopPad();
  return (
    <div style={{ position: "absolute", top: top + 60, left: PAD, right: PAD + 40 }}>
      {s.icon && <Product p={s.icon} size={150} style={{ marginBottom: 40 }} />}
      <Kicker>{s.kicker}</Kicker>
      <div style={{ marginTop: 22, fontFamily: F.display, fontWeight: 700, fontSize: 118, lineHeight: 1.0, letterSpacing: -3.5, color: C.text }}>{s.title}</div>
      {s.date && <div style={{ marginTop: 34, fontFamily: F.mono, fontWeight: 500, fontSize: 26, color: C.muted, letterSpacing: 1 }}>{s.date}</div>}
    </div>
  );
};

/** One plain news sentence, big and centred, like a news-desk card. */
const StorySlide: React.FC<{ s: Extract<Slide, { kind: "story" }> }> = ({ s }) => {
  const { height } = useVideoConfig();
  return (
    <div style={{ position: "absolute", left: PAD, right: PAD, top: 0, bottom: height > 1500 ? 300 : 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 62, lineHeight: 1.16, letterSpacing: -1.5, color: C.text }}>{s.text}</div>
      <div style={{ marginTop: 36, fontFamily: F.mono, fontWeight: 500, fontSize: 24, letterSpacing: 1.5, color: C.muted }}>SOURCE · {s.source}</div>
    </div>
  );
};

const OutroSlide: React.FC<{ s: Extract<Slide, { kind: "outro" }> }> = ({ s }) => {
  const { height } = useVideoConfig();
  return (
    <div style={{ position: "absolute", left: PAD, right: PAD, top: 0, bottom: height > 1500 ? 300 : 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <Asterisk size={150} />
      <div style={{ marginTop: 50, fontFamily: F.display, fontWeight: 700, fontSize: 84, lineHeight: 1.05, letterSpacing: -2.5, color: C.text }}>{s.title}</div>
      <div style={{ marginTop: 28, fontFamily: F.sans, fontWeight: 700, fontSize: 38, color: C.accent }}>{s.cta}</div>
    </div>
  );
};

/** One slide, as a still. */
export const CarouselSlide: React.FC<SlideProps> = ({ slide, index, total, series }) => {
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <Glow />
      <Brand series={series} />
      {slide.kind === "cover" && <CoverSlide s={slide} />}
      {slide.kind === "story" && <StorySlide s={slide} />}
      {slide.kind === "outro" && <OutroSlide s={slide} />}
      <Dots index={index} total={total} />
    </AbsoluteFill>
  );
};

export type SlideshowProps = { slides: Slide[]; series: string; music?: string; secondsPerSlide?: number };

export const slideshowFrames = (p: SlideshowProps) => Math.round(p.slides.length * (p.secondsPerSlide ?? 3) * FPS);

/** The slideshow Short for YouTube: each slide for a few seconds with a quick push-in, over a music bed. */
export const Slideshow: React.FC<SlideshowProps> = ({ slides, series, music, secondsPerSlide = 3 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const per = Math.round(secondsPerSlide * FPS);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {slides.map((slide, i) => (
        <Sequence key={i} from={i * per} durationInFrames={per}>
          <SlideIn>
            <CarouselSlide slide={slide} index={i} total={slides.length} series={series} />
          </SlideIn>
        </Sequence>
      ))}
      {music && (
        <Audio
          src={staticFile(music)}
          volume={() => 0.35 * Math.max(0, Math.min(1, frame / 8, (durationInFrames - frame) / 20))}
        />
      )}
    </AbsoluteFill>
  );
};

const SlideIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = spring({ frame, fps: FPS, config: { damping: 18, stiffness: 160 } });
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.03]);
  return (
    <AbsoluteFill style={{ opacity: Math.min(1, p * 1.5), transform: `translateX(${(1 - p) * 60}px) scale(${zoom})` }}>{children}</AbsoluteFill>
  );
};
