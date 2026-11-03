import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Asterisk } from "../brand";
import { CompanyLogo } from "../logos";
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
  | { kind: "story"; kicker: string; title: string; body: string; why: string; source: string; icon?: string; logo?: string; stat?: string }
  | { kind: "takeaway"; title: string; points: string[] }
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

const StorySlide: React.FC<{ s: Extract<Slide, { kind: "story" }>; n: number }> = ({ s, n }) => {
  const top = useTopPad();
  return (
    <div style={{ position: "absolute", top, left: PAD, right: PAD + 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 30 }}>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 64, color: "rgba(245,245,247,0.18)", letterSpacing: -2 }}>{String(n).padStart(2, "0")}</div>
        {s.logo ? <CompanyLogo name={s.logo} size={84} /> : s.icon && <Product p={s.icon} size={84} />}
        {s.stat && (
          <div style={{ marginLeft: "auto", fontFamily: F.display, fontWeight: 700, fontSize: 64, color: C.accent, letterSpacing: -2 }}>{s.stat}</div>
        )}
      </div>
      <Kicker>{s.kicker}</Kicker>
      <div style={{ marginTop: 18, fontFamily: F.display, fontWeight: 700, fontSize: 76, lineHeight: 1.04, letterSpacing: -2, color: C.text }}>{s.title}</div>
      <div style={{ marginTop: 28, fontFamily: F.sans, fontWeight: 500, fontSize: 38, lineHeight: 1.35, color: "rgba(245,245,247,0.78)" }}>{s.body}</div>
      <div
        style={{
          marginTop: 36,
          padding: "22px 26px",
          borderRadius: 20,
          background: C.panel2,
          border: `1px solid ${C.stroke}`,
          borderLeft: `6px solid ${C.accent}`,
        }}
      >
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 20, letterSpacing: 2.5, color: C.accent }}>WHY IT MATTERS</div>
        <div style={{ marginTop: 10, fontFamily: F.sans, fontWeight: 700, fontSize: 34, lineHeight: 1.3, color: C.text }}>{s.why}</div>
      </div>
      <div style={{ marginTop: 26, fontFamily: F.mono, fontWeight: 500, fontSize: 22, letterSpacing: 1.5, color: C.muted }}>SOURCE · {s.source}</div>
    </div>
  );
};

const TakeawaySlide: React.FC<{ s: Extract<Slide, { kind: "takeaway" }> }> = ({ s }) => {
  const top = useTopPad();
  return (
    <div style={{ position: "absolute", top: top + 20, left: PAD, right: PAD + 40 }}>
      <Kicker>What it means for you</Kicker>
      <div style={{ marginTop: 18, fontFamily: F.display, fontWeight: 700, fontSize: 84, lineHeight: 1.02, letterSpacing: -2.5, color: C.text }}>{s.title}</div>
      <div style={{ marginTop: 44, display: "flex", flexDirection: "column", gap: 26 }}>
        {s.points.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 22, alignItems: "flex-start" }}>
            <div style={{ marginTop: 8 }}>
              <Asterisk size={30} />
            </div>
            <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 40, lineHeight: 1.3, color: "rgba(245,245,247,0.9)" }}>{p}</div>
          </div>
        ))}
      </div>
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
  const storyNo = slide.kind === "story" ? index : 0;
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <Glow />
      <Brand series={series} />
      {slide.kind === "cover" && <CoverSlide s={slide} />}
      {slide.kind === "story" && <StorySlide s={slide} n={storyNo} />}
      {slide.kind === "takeaway" && <TakeawaySlide s={slide} />}
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
