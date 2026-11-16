import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const TITLE = "How It Scales";
const BYLINE = "by Curiously";

const FONT =
  'Inter, "SF Pro Display", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif';

export const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = TITLE.split(" ");

  // Byline starts once the last title word has mostly landed.
  const bylineStart = 8 + words.length * 5 + 8;
  const byline = spring({
    frame: frame - bylineStart,
    fps,
    config: { damping: 200 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0f0f12",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 36,
          padding: "0 80px",
        }}
      >
        <h1
          style={{
            margin: 0,
            color: "#ffffff",
            fontSize: 150,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -3,
            textAlign: "center",
          }}
        >
          {words.map((word, i) => {
            // Each word springs up from below, staggered by 5 frames.
            const p = spring({
              frame: frame - 8 - i * 5,
              fps,
              config: { damping: 14, stiffness: 120 },
            });
            return (
              <span
                key={word + i}
                style={{
                  display: "inline-block",
                  marginRight: i < words.length - 1 ? "0.25em" : 0,
                  opacity: interpolate(p, [0, 0.4], [0, 1], {
                    extrapolateRight: "clamp",
                  }),
                  transform: `translateY(${interpolate(p, [0, 1], [80, 0])}px)`,
                }}
              >
                {word}
              </span>
            );
          })}
        </h1>

        <div
          style={{
            color: "#ffcc00",
            fontSize: 64,
            fontWeight: 600,
            letterSpacing: 1,
            opacity: byline,
            transform: `translateY(${interpolate(byline, [0, 1], [30, 0])}px)`,
          }}
        >
          {BYLINE}
        </div>
      </div>
    </AbsoluteFill>
  );
};
