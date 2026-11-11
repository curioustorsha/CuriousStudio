import Link from "next/link";
import type { ClaudeLimits } from "@/lib/runner";
import { LocalTime } from "./client";
import { timeAgo } from "./ui";

/** Always-visible strip at the bottom of every page: Claude's session and weekly usage from the latest run. */
export function UsageFooter({ limits, nowMs }: { limits: ClaudeLimits | null; nowMs: number }) {
  const rows = [
    { label: "Session", w: limits?.windows.five_hour },
    { label: "Weekly", w: limits?.windows.seven_day },
  ];
  return (
    <footer className="sticky bottom-0 z-10 border-t border-line bg-panel px-5 py-2 md:px-10">
      <Link href="/usage" className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-muted hover:text-fg">
        <span className="font-semibold text-fg">Claude</span>
        {!limits && <span>No reading yet.</span>}
        {limits &&
          rows.map(({ label, w }) => {
            const pct = Math.round((w?.utilization ?? 0) * 100);
            const reset = w?.resetsAt ? new Date(w.resetsAt * 1000) : null;
            // A reset time in the past means the window has started over since this reading.
            const stale = reset !== null && reset.getTime() < nowMs;
            const shown = stale ? 0 : Math.min(100, pct);
            return (
              <span key={label} className="flex items-center gap-2 tabular-nums">
                <span>{label}</span>
                <span
                  className="h-1.5 w-16 rounded-full bg-fg/[0.08]"
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={shown}
                  aria-label={`Claude ${label.toLowerCase()} usage`}
                >
                  <span className={`block h-full rounded-full ${pct >= 90 && !stale ? "bg-warn" : "bg-accent"}`} style={{ width: `${shown}%` }} />
                </span>
                <span className={pct >= 90 && !stale ? "font-semibold text-warn" : "text-fg"}>{stale ? "reset" : `${pct}%`}</span>
                {reset && !stale && (
                  <span className="text-faint">
                    resets <LocalTime iso={reset.toISOString()} />
                  </span>
                )}
              </span>
            );
          })}
        {limits && <span className="ml-auto text-faint">updated {timeAgo(limits.at).toLowerCase()}</span>}
      </Link>
    </footer>
  );
}
