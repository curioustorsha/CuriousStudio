import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../../../theme";
import { Sfx, useTiming } from "../../../engine/kit";
import { pop, RepoCard, Space, Window } from "../../../productui";
import { clampI, FRAGMENTS, Header, QUOTE, SourceLine } from "./common";

export type HookCues = { tListed: number; tWrong: number; tSomeone: number; tOne: number; tFile: number };

/** Hook cue frames from the timing (the intro and the loop reuse the hook's picture). */
export const useHookCues = (): HookCues => {
  const t = useTiming();
  return {
    tListed: t.wf("hook", "listed"),
    tWrong: t.wf("hook", "wrong"),
    tSomeone: t.wf("hook", "someone"),
    tOne: t.wf("hook", "one"),
    tFile: t.wf("hook", "file"),
  };
};

const STARS = 233419;

/**
 * Karpathy's quote card types itself; three fragments of his list drop in under it; then it shrinks up and the
 * repo card flies in from depth, the CLAUDE.md chip snaps on and the stars land on "file".
 */
export const HookView: React.FC<{ f: number; cues: HookCues; dim?: number; header?: boolean }> = ({ f, cues, dim = 1, header = true }) => {
  const { fps } = useVideoConfig();
  const { tListed, tWrong, tSomeone, tOne, tFile } = cues;
  const typed = Math.floor(clampI(f, 3, tListed + 4, 0, QUOTE.length));
  const shrink = spring({ frame: f - tSomeone, fps, config: { damping: 200, stiffness: 90 } });
  const chip = pop(f, tOne, fps, 12);
  const cursorOn = typed < QUOTE.length || Math.floor(f / 12) % 2 === 0;
  return (
    <>
      <Space />
      <div style={{ opacity: dim }}>
        {header && <Header title="Karpathy's list, one file" />}
        <div style={{ position: "absolute", left: 60, top: 430, width: 960, height: 540, transform: `translateY(${-20 * shrink}px) scale(${1 - 0.3 * shrink})`, transformOrigin: "50% 0%", opacity: 1 - 0.35 * shrink }}>
          <Window title="Andrej Karpathy · on X, 26 Jan 2026" x={0} y={0} w={960} h={540} tilt={Math.sin(f / 50) * 2}>
            <div style={{ padding: "34px 44px 0", fontFamily: F.sans, fontSize: 40, fontWeight: 700, lineHeight: 1.3, color: C.text, height: 210 }}>
              <span style={{ color: C.accent }}>“</span>
              {QUOTE.slice(0, typed)}
              {typed === QUOTE.length && <span style={{ color: C.accent }}>”</span>}
              <span style={{ color: C.accent, opacity: cursorOn ? 1 : 0 }}>▍</span>
            </div>
            <div style={{ padding: "6px 44px", fontFamily: F.mono, fontSize: 21, color: C.muted, opacity: clampI(f, tListed - 8, tListed) }}>— Andrej Karpathy, on X</div>
            <div style={{ padding: "14px 44px 0" }}>
              {FRAGMENTS.slice(0, 3).map((fr, i) => {
                const p = pop(f, tListed + i * 5, fps, 16);
                const under = i === 0 ? clampI(f, tWrong, tWrong + 10) : 0;
                return (
                  <div key={fr} style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: F.mono, fontSize: 28, lineHeight: "50px", color: i === 0 && under > 0 ? C.text : "rgba(245,245,247,0.75)", opacity: p, transform: `translateY(${(1 - p) * -30}px)` }}>
                    <span style={{ color: C.accent, fontWeight: 700 }}>✓</span>
                    <span style={{ backgroundImage: `linear-gradient(${C.accent}, ${C.accent})`, backgroundRepeat: "no-repeat", backgroundPosition: "0 100%", backgroundSize: `${under * 100}% 3px`, paddingBottom: 2 }}>{fr}</span>
                  </div>
                );
              })}
            </div>
          </Window>
        </div>
        {f >= tSomeone - 2 && (
          <RepoCard
            repo="andrej-karpathy-skills"
            maker="multica-ai"
            byline="by Jiayuan Zhang (forrestchang)"
            repoSize={56}
            stars={STARS}
            full
            at={tSomeone + 2}
            countFrom={tSomeone + 8}
            countTo={tFile + 2}
            x={110}
            y={860}
          >
            <div
              style={{
                position: "absolute",
                right: -20,
                top: 250,
                padding: "10px 22px",
                borderRadius: 14,
                background: "rgba(255,181,71,0.14)",
                border: `2px solid ${C.accent}`,
                boxShadow: `0 0 40px ${C.accent}44`,
                fontFamily: F.mono,
                fontWeight: 700,
                fontSize: 30,
                color: C.accent,
                opacity: chip,
                transform: `translateY(${(1 - chip) * -60}px) scale(${0.6 + 0.4 * chip})`,
              }}
            >
              CLAUDE.md
            </div>
          </RepoCard>
        )}
        {header && <SourceLine text="SOURCE · Karpathy on X, 26 Jan 2026 (via README) · GitHub API, 15 Nov 2026" opacity={clampI(f, tSomeone, tSomeone + 10)} />}
      </div>
    </>
  );
};

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const cues = useHookCues();
  return (
    <>
      {[0, 1, 2].map((i) => (
        <Sfx key={i} name="click" at={cues.tListed + i * 5} volume={0.25} />
      ))}
      <Sfx name="whoosh" at={cues.tSomeone} volume={0.3} />
      <Sfx name="ticker" at={cues.tSomeone + 8} volume={0.16} dur={cues.tFile - cues.tSomeone - 4} />
      <Sfx name="pop" at={cues.tOne} volume={0.35} />
      <HookView f={f} cues={cues} />
    </>
  );
};
