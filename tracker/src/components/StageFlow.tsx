"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { stageColor } from "./ui";

type Step = { key: string; label: string; done: number; total: number; state: "done" | "current" | "upcoming" };

/**
 * Full-width stage bar for an episode: where it is in the pipeline and each stage's checklist count.
 * Clicking a stage shows that stage's panel. Remount with `key={stage}` so it follows stage moves.
 */
export function StageFlow({ steps, current, panels, feed, sidePanels, aside }: {
  steps: Step[];
  current: string;
  panels: Record<string, React.ReactNode>;
  /** Per-stage cards at the top of the right column (the stage's checklist). */
  feed: React.ReactNode;
  sidePanels: Record<string, React.ReactNode>;
  aside: React.ReactNode;
}) {
  const [viewing, setViewing] = useState(current);

  return (
    <>
      <nav aria-label="Stages" className="card scroll-thin mb-6 overflow-x-auto p-2">
        <ol className="flex min-w-max gap-1 lg:min-w-0">
          {steps.map((s) => {
            const color = stageColor(s.key);
            const isCurrent = s.state === "current";
            return (
              <li key={s.key} className="min-w-[96px] flex-1">
                <button
                  type="button"
                  onClick={() => setViewing(s.key)}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`w-full rounded-xl px-2.5 pb-2 pt-2.5 text-left transition-colors ${
                    viewing === s.key ? "bg-fg/[0.07]" : "hover:bg-fg/[0.04]"
                  } ${isCurrent ? "ring-2 ring-inset" : ""}`}
                  style={isCurrent ? ({ "--tw-ring-color": color } as React.CSSProperties) : undefined}
                >
                  <div
                    className={`h-1 rounded-full ${s.state === "upcoming" ? "bg-line" : ""}`}
                    style={s.state === "upcoming" ? undefined : { background: color, opacity: isCurrent ? 1 : 0.55 }}
                  />
                  <div
                    className={`mt-2 flex items-center gap-1 text-[12px] font-semibold tracking-tight ${
                      s.state === "upcoming" ? "text-muted" : ""
                    }`}
                  >
                    {s.state === "done" && <Check className="size-3 shrink-0" strokeWidth={2.6} style={{ color }} />}
                    <span className="truncate">{s.label}</span>
                  </div>
                  <div className={`mt-0.5 text-[10px] tabular-nums ${isCurrent ? "font-medium" : "text-faint"}`} style={isCurrent ? { color } : undefined}>
                    {isCurrent ? "Now · " : ""}
                    {s.done}/{s.total} checks
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[7fr_3fr]">
        <div className="min-w-0 space-y-6">
          {feed}
          {/* All panels stay mounted so unsaved edits survive switching stages */}
          {steps.map((s) => (
            <div key={s.key} hidden={viewing !== s.key} className="space-y-6">
              {panels[s.key]}
            </div>
          ))}
        </div>
        {/* Stays in view while the left side scrolls; scrolls on its own if it's taller than the window */}
        <div className="scroll-thin space-y-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto">
          {steps.map((s) => (
            <div key={s.key} hidden={viewing !== s.key}>
              {sidePanels[s.key]}
            </div>
          ))}
          {aside}
        </div>
      </div>
    </>
  );
}
