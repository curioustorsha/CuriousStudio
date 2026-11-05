import { desc, eq } from "drizzle-orm";
import { ChevronRight, CircleCheck, Clapperboard, Film, Plus, Rocket, Target, TriangleAlert, UserRound } from "lucide-react";
import Link from "next/link";
import { activity, db, episodes, series as seriesTable, type Episode, type Series } from "@/db";
import { Avatar, Empty, formatDate, PageHeader, PipelineBar, SeriesTag, StageBadge, stageColor, timeAgo } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { runwayWindow, seriesRunway, weeklyPace } from "@/lib/runway";
import { LAUNCH, READY_FROM, stageIndex, STAGES } from "@/lib/stages";

const YEAR_GOAL = 156; // 3 per week × 52

function todayIso() {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, local time
}

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default async function Dashboard() {
  const user = await requireUser();
  const [all, seriesList, recent] = await Promise.all([
    db.select().from(episodes),
    db.select().from(seriesTable),
    db
      .select({ a: activity, code: episodes.code })
      .from(activity)
      .leftJoin(episodes, eq(activity.episodeId, episodes.id))
      .orderBy(desc(activity.id))
      .limit(12),
  ]);
  const seriesById = new Map(seriesList.map((s) => [s.id, s]));
  const today = todayIso();
  const daysToLaunch = daysBetween(today, LAUNCH);

  const counts = Object.fromEntries(STAGES.map((s) => [s.key, 0])) as Record<string, number>;
  for (const e of all) counts[e.stage] = (counts[e.stage] ?? 0) + 1;

  const posted = counts.posted ?? 0;
  const ready = all.filter((e) => stageIndex(e.stage) >= READY_FROM && e.stage !== "posted");
  const inProgress = all.filter((e) => e.stage !== "idea" && stageIndex(e.stage) < READY_FROM);
  const perWeek = seriesList.reduce((n, s) => n + s.cadenceDays.split(",").filter(Boolean).length, 0);
  const window = runwayWindow(today);
  const runways = seriesList.map((s) => ({
    series: s,
    ...seriesRunway(s.cadenceDays, all.filter((e) => e.seriesId === s.id), window),
  }));
  const need = runways.reduce((n, r) => n + r.need, 0);
  const banked = runways.reduce((n, r) => n + Math.min(r.ready, r.need), 0);
  const building = runways.reduce((n, r) => n + r.building, 0);
  const pace = window.preLaunch ? weeklyPace(need - banked, today, LAUNCH) : null;
  const upcoming = all
    .filter((e) => e.publishDate && e.publishDate >= today && e.stage !== "posted")
    .sort((a, b) => a.publishDate!.localeCompare(b.publishDate!))
    .slice(0, 8);
  const overdue = all.filter((e) => e.publishDate && e.publishDate < today && e.stage !== "posted");
  const mine = all
    .filter((e) => e.owner === user.username && e.stage !== "posted" && e.stage !== "idea")
    .sort((a, b) => stageIndex(b.stage) - stageIndex(a.stage));

  return (
    <div>
      <PageHeader title={`${greeting()}, ${user.name}`} subtitle="Here’s where Curiously stands today.">
        <Link href="/ideas" className="btn btn-primary">
          <Plus className="size-4" strokeWidth={2.2} /> New Idea
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={<Rocket />}
          tint="var(--stage-2)"
          label={daysToLaunch > 0 ? "Days to launch" : "Days since launch"}
          value={Math.abs(daysToLaunch)}
          sub={formatDate(LAUNCH, { day: "numeric", month: "long", year: "numeric" })}
        />
        <Stat
          icon={<Film />}
          tint="var(--stage-10)"
          label="Ready to publish"
          value={ready.length}
          sub={perWeek ? `${(ready.length / perWeek).toFixed(1)} weeks of runway at ${perWeek} per week` : "No publishing days set"}
        />
        <Stat icon={<Clapperboard />} tint="var(--stage-3)" label="In production" value={inProgress.length} sub={`${counts.idea} ideas in the backlog`} />
        <Stat
          icon={<Target />}
          tint="var(--stage-4)"
          label="2027 goal"
          value={
            <>
              {posted}
              <span className="text-xl text-faint">/{YEAR_GOAL}</span>
            </>
          }
          sub={`${Math.round((posted / YEAR_GOAL) * 100)}% posted`}
          progress={posted / YEAR_GOAL}
        />
      </div>

      <section className="card mt-4 p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="section-title">Pipeline</h2>
          <SeeAll href="/board">Open Board</SeeAll>
        </div>
        <PipelineBar counts={counts} />
        <div className="mt-5 grid grid-cols-3 gap-1 sm:grid-cols-6 lg:grid-cols-11">
          {STAGES.map((s) => (
            <Link key={s.key} href={`/board#${s.key}`} className="rounded-xl px-2.5 py-2 transition-colors hover:bg-panel-2">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
                <span className="size-1.5 rounded-full" style={{ background: stageColor(s.key) }} />
                {s.label}
              </div>
              <div className="mt-1 text-[22px] font-semibold tracking-tight tabular-nums">{counts[s.key]}</div>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="card p-6 lg:col-span-2">
          <div className="mb-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="section-title">One Month Ahead</h2>
              <span className="text-[13px] font-semibold tabular-nums">
                {banked}<span className="font-normal text-faint">/{need} ready</span>
              </span>
            </div>
            <p className="mt-1 text-[13px] text-muted">
              {banked >= need
                ? `All ${need} posts up to ${formatDate(window.end, { day: "numeric", month: "long" })} are made. `
                : window.preLaunch
                  ? `Make all ${need} posts up to ${formatDate(window.end, { day: "numeric", month: "long" })} by launch. `
                  : `Keep the next month's ${need} posts made in advance. ${need - banked} still to make. `}
              {building > 0 && `${building} in progress. `}
              {banked < need && pace !== null && <span className="font-medium text-fg">That’s about {pace.toFixed(1)} a week.</span>}
            </p>
            <p className="mt-1 text-xs text-faint">An episode counts as ready once it reaches Review.</p>
          </div>
          <div className="space-y-5">
            {runways.map((r) => (
              <Runway key={r.series.id} {...r} />
            ))}
            {seriesList.length === 0 && <Empty>Create your series first on the Series page.</Empty>}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="section-title mb-4">Needs Attention</h2>
          {overdue.length === 0 && mine.length === 0 && (
            <Empty icon={<CircleCheck className="size-4 text-ok" />}>You’re all caught up.</Empty>
          )}
          {overdue.length > 0 && (
            <div className="mb-5">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-danger">
                <TriangleAlert className="size-3.5" /> Past publish date
              </div>
              <EpisodeList items={overdue} seriesById={seriesById} showDate />
            </div>
          )}
          {mine.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted">
                <UserRound className="size-3.5" /> Assigned to you
              </div>
              <EpisodeList items={mine.slice(0, 6)} seriesById={seriesById} />
            </div>
          )}
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">Coming Up</h2>
            <SeeAll href="/calendar">Calendar</SeeAll>
          </div>
          {upcoming.length ? <EpisodeList items={upcoming} seriesById={seriesById} showDate /> : <Empty>Nothing scheduled yet.</Empty>}
        </section>

        <section className="card p-6">
          <h2 className="section-title mb-4">Recent Activity</h2>
          {recent.length === 0 && <Empty>No activity yet.</Empty>}
          <ul className="space-y-3">
            {recent.map(({ a }) => {
              const text = (
                <>
                  <span className="font-medium">{a.actor}</span> <span className="text-muted">{a.message}</span>
                </>
              );
              return (
                <li key={a.id} className="flex items-start gap-3 text-[13px]">
                  <Avatar username={a.actor} size={22} />
                  <div className="min-w-0 flex-1 pt-0.5">
                    {a.episodeId ? <Link href={`/episodes/${a.episodeId}`} className="hover:opacity-70">{text}</Link> : text}
                  </div>
                  <span className="shrink-0 pt-0.5 text-xs text-faint">{timeAgo(a.createdAt)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}

function SeeAll({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-0.5 text-[13px] text-accent hover:opacity-80">
      {children}
      <ChevronRight className="size-3.5" strokeWidth={2.2} />
    </Link>
  );
}

function Stat({
  icon,
  tint,
  label,
  value,
  sub,
  progress,
}: {
  icon: React.ReactElement;
  tint: string;
  label: string;
  value: React.ReactNode;
  sub: string;
  progress?: number;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2.5">
        <span
          className="grid size-7 place-items-center rounded-lg [&>svg]:size-4"
          style={{ color: tint, background: `color-mix(in srgb, ${tint} 14%, transparent)` }}
        >
          {icon}
        </span>
        <span className="text-[13px] font-medium text-muted">{label}</span>
      </div>
      <div className="mt-3 font-[family-name:var(--font-display)] text-[34px] font-semibold leading-none tracking-tight tabular-nums">
        {value}
      </div>
      <div className="mt-2 text-xs text-faint">{sub}</div>
      {progress !== undefined && (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-panel-2">
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, progress * 100)}%`, background: tint }} />
        </div>
      )}
    </div>
  );
}

function Runway({ series, need, ready, building, ideas, ideasShort }: { series: Series } & ReturnType<typeof seriesRunway>) {
  const readyPct = need ? Math.min(100, (ready / need) * 100) : 0;
  const buildingPct = need ? Math.min(100 - readyPct, (building / need) * 100) : 0;
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-[13px]">
        <SeriesTag series={series} />
        <span className="text-xs text-muted">
          {need ? (
            <>
              <span className="font-semibold text-fg tabular-nums">{ready}/{need}</span> ready
            </>
          ) : (
            "No publishing days set"
          )}
          <span className="text-faint"> · {building} in progress · {ideas} {ideas === 1 ? "idea" : "ideas"}</span>
          {ideasShort > 0 && (
            <span className="font-medium text-warn"> · needs {ideasShort} more {ideasShort === 1 ? "idea" : "ideas"}</span>
          )}
        </span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-panel-2">
        <div className="h-full" style={{ width: `${readyPct}%`, background: series.color }} />
        <div className="h-full opacity-35" style={{ width: `${buildingPct}%`, background: series.color }} />
      </div>
    </div>
  );
}

function EpisodeList({ items, seriesById, showDate }: { items: Episode[]; seriesById: Map<number, Series>; showDate?: boolean }) {
  return (
    <ul className="-mx-2">
      {items.map((e) => {
        const s = e.seriesId ? seriesById.get(e.seriesId) : null;
        return (
          <li key={e.id}>
            <Link href={`/episodes/${e.id}`} className="flex items-center gap-3 rounded-[10px] px-2 py-2 transition-colors hover:bg-panel-2">
              {showDate && <span className="w-12 shrink-0 text-xs font-medium tabular-nums text-muted">{formatDate(e.publishDate)}</span>}
              <span className="size-2 shrink-0 rounded-full" style={{ background: s?.color ?? "var(--faint)" }} />
              <span className="min-w-0 flex-1 truncate text-[13px]">{e.title}</span>
              <StageBadge stage={e.stage} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
