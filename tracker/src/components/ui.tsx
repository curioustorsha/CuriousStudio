import type { Series } from "@/db";
import { getStage, STAGES } from "@/lib/stages";

export function SeriesTag({ series }: { series?: Series | null }) {
  if (!series) return <span className="text-xs text-faint">No series</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span className="size-2 rounded-full" style={{ background: series.color }} />
      {series.name}
    </span>
  );
}

/** Theme-aware stage colour (CSS variable defined per light/dark theme). */
export function stageColor(stage: string) {
  return `var(--stage-${getStage(stage).color})`;
}

export function StageBadge({ stage }: { stage: string }) {
  const color = stageColor(stage);
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ color, background: `color-mix(in srgb, ${color} 13%, transparent)` }}
    >
      {getStage(stage).label}
    </span>
  );
}

/** Claude finished this stage's work and is waiting for one of us to review and move it. */
export function ReadyBadge() {
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent"
      title="Claude marked this stage's work done. Review it, then move the card."
    >
      Ready for review
    </span>
  );
}

/** One of us asked for changes on this stage; waiting for Claude's next version. */
export function ChangesBadge({ label = "Changes requested" }: { label?: string }) {
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full bg-warn/15 px-2 py-0.5 text-[10px] font-semibold text-warn"
      title={label === "Changes requested" ? "Changes requested. Waiting for a new version." : `${label}: open the episode to send them back.`}
    >
      {label}
    </span>
  );
}

export function Avatar({ username, size = 22 }: { username?: string | null; size?: number }) {
  if (!username) return null;
  const hue = [...username].reduce((h, c) => h + c.charCodeAt(0) * 37, 0) % 360;
  return (
    <span
      title={username}
      className="inline-grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(180deg, hsl(${hue} 45% 62%), hsl(${hue} 45% 48%))`,
      }}
    >
      {username.charAt(0).toUpperCase()}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: string }) {
  const color = priority === "high" ? "var(--danger)" : priority === "low" ? "var(--faint)" : "var(--warn)";
  return <span title={`${priority} priority`} className="size-1.5 shrink-0 rounded-full" style={{ background: color }} />;
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="large-title">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[15px] text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function PipelineBar({ counts }: { counts: Record<string, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full">
      {STAGES.map((s) =>
        counts[s.key] ? (
          <div
            key={s.key}
            title={`${s.label}: ${counts[s.key]}`}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ width: `${(counts[s.key] / total) * 100}%`, background: stageColor(s.key) }}
          />
        ) : null,
      )}
    </div>
  );
}

export function Empty({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 py-3 text-[13px] text-faint">
      {icon}
      {children}
    </div>
  );
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function cadenceLabel(cadenceDays: string) {
  const days = cadenceDays.split(",").filter(Boolean).map(Number);
  return days.length ? days.map((d) => WEEKDAYS[d]).join(", ") : "No fixed day";
}

export function formatDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso.replace(" ", "T") + "Z");
  return d.toLocaleDateString("en-IN", opts);
}

export function timeAgo(sqliteUtc: string) {
  const then = new Date(sqliteUtc.replace(" ", "T") + "Z").getTime();
  const s = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
