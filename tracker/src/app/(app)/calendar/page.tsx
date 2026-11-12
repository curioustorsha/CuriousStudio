import { ChevronLeft, ChevronRight, CircleCheck, CircleDashed, Rocket } from "lucide-react";
import Link from "next/link";
import { updateEpisodeAction } from "@/app/actions";
import { db, episodes as episodesTable, series as seriesTable } from "@/db";
import { PageHeader, StageBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { LAUNCH, READY_FROM, stageIndex } from "@/lib/stages";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function iso(d: Date) {
  return d.toLocaleDateString("en-CA");
}

export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  await requireUser();
  const { m } = await searchParams;
  const now = new Date();
  const [year, month] =
    typeof m === "string" && /^\d{4}-\d{2}$/.test(m)
      ? m.split("-").map(Number)
      : [now.getFullYear(), now.getMonth() + 1];

  const [all, seriesList] = await Promise.all([db.select().from(episodesTable), db.select().from(seriesTable)]);
  const seriesById = new Map(seriesList.map((s) => [s.id, s]));
  const today = iso(now);
  // Open slots only make sense once publishing has started.
  const slotsFrom = today > LAUNCH ? today : LAUNCH;

  // Grid starts on the Monday on/before the 1st and ends on the Sunday on/after month end.
  const first = new Date(year, month - 1, 1);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7));
  const last = new Date(year, month, 0);
  const end = new Date(last);
  end.setDate(last.getDate() + ((7 - last.getDay()) % 7));
  const days: Date[] = [];
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) days.push(new Date(d));

  const byDate = new Map<string, typeof all>();
  for (const e of all) {
    if (!e.publishDate) continue;
    byDate.set(e.publishDate, [...(byDate.get(e.publishDate) ?? []), e]);
  }

  const monthKey = (y: number, mo: number) => {
    const d = new Date(y, mo - 1, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };
  const unscheduled = all.filter((e) => !e.publishDate && stageIndex(e.stage) >= READY_FROM && e.stage !== "posted");
  const inMonth = all.filter((e) => e.publishDate?.startsWith(monthKey(year, month)));
  // What an open slot can be filled with: the series' episodes that aren't posted or dated yet, furthest along first.
  const candidates = (seriesId: number) =>
    all
      .filter((e) => e.seriesId === seriesId && !e.publishDate && e.stage !== "posted")
      .sort((a, b) => stageIndex(b.stage) - stageIndex(a.stage) || a.position - b.position);

  return (
    <div>
      <PageHeader
        title={first.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        subtitle={`${inMonth.length} episodes scheduled this month. Publishing starts ${new Date(`${LAUNCH}T00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}. Dashed slots mean a series is due that day but nothing is scheduled.`}
      >
        <Link href={`/calendar?m=${LAUNCH.slice(0, 7)}`} className="btn">
          <Rocket className="size-3.5" strokeWidth={2} /> Launch
        </Link>
        <div className="segmented">
          <Link href={`/calendar?m=${monthKey(year, month - 1)}`} aria-label="Previous month" className="!px-2">
            <ChevronLeft className="size-4" strokeWidth={2.2} />
          </Link>
          <Link href="/calendar">Today</Link>
          <Link href={`/calendar?m=${monthKey(year, month + 1)}`} aria-label="Next month" className="!px-2">
            <ChevronRight className="size-4" strokeWidth={2.2} />
          </Link>
        </div>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-line text-right text-[11px] font-semibold text-muted">
            {WEEKDAYS.map((d) => <div key={d} className="px-3 py-2.5">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {days.map((d) => {
              const key = iso(d);
              const items = byDate.get(key) ?? [];
              const inThisMonth = d.getMonth() === month - 1;
              const openSlots =
                key >= slotsFrom
                  ?seriesList.filter(
                      (s) =>
                        s.cadenceDays.split(",").filter(Boolean).map(Number).includes(d.getDay()) &&
                        !items.some((e) => e.seriesId === s.id),
                    )
                  : [];
              return (
                <div
                  key={key}
                  className={`min-h-28 border-b border-r border-line p-1.5 [&:nth-child(7n)]:border-r-0 ${inThisMonth ? "" : "opacity-40"}`}
                >
                  <div className="mb-1 flex items-center justify-end gap-1">
                    {key === LAUNCH && (
                      <span className="mr-auto flex items-center gap-1 rounded-md bg-fg/[0.06] px-1.5 py-0.5 text-[10px] font-semibold">
                        <Rocket className="size-2.5" strokeWidth={2.4} /> Launch
                      </span>
                    )}
                    <span
                      className={`grid size-6 place-items-center rounded-full text-[12px] tabular-nums ${
                        key === today ? "bg-danger font-semibold text-white" : inThisMonth ? "text-fg" : "text-faint"
                      }`}
                    >
                      {d.getDate()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {items.map((e) => {
                      const s = e.seriesId ? seriesById.get(e.seriesId) : null;
                      const late = key < today && e.stage !== "posted";
                      return (
                        <Link
                          key={e.id}
                          href={`/episodes/${e.id}`}
                          title={`${e.code} · ${e.title}`}
                          className="flex items-center gap-1 truncate rounded-md px-1.5 py-1 text-[11px] font-medium leading-tight transition-opacity hover:opacity-75"
                          style={{
                            background: `color-mix(in srgb, ${s?.color ?? "#8e8e93"} 16%, transparent)`,
                            boxShadow: `inset 3px 0 0 ${s?.color ?? "#8e8e93"}`,
                            color: late ? "var(--danger)" : undefined,
                          }}
                        >
                          {e.stage === "posted" && <CircleCheck className="size-3 shrink-0 text-ok" strokeWidth={2.4} />}
                          <span className="truncate">{e.title}</span>
                        </Link>
                      );
                    })}
                    {openSlots.map((s) => {
                      const options = candidates(s.id);
                      return (
                        <details key={s.id} className="relative">
                          <summary
                            className="flex cursor-pointer list-none items-center gap-1 truncate rounded-md border border-dashed px-1.5 py-0.5 text-[10px] font-medium hover:bg-fg/[0.04] [&::-webkit-details-marker]:hidden"
                            style={{ borderColor: `color-mix(in srgb, ${s.color} 50%, transparent)`, color: s.color }}
                            title={`Open slot: ${s.name}. Click to schedule an episode here.`}
                          >
                            <CircleDashed className="size-2.5 shrink-0" strokeWidth={2.4} />
                            <span className="truncate">{s.name}</span>
                          </summary>
                          <div className={`card absolute top-full z-20 mt-1 w-64 p-1.5 shadow-lg ${[5, 6, 0].includes(d.getDay()) ? "right-0" : "left-0"}`}>
                            <div className="px-2 pb-1 pt-0.5 text-[11px] font-semibold text-muted">
                              Schedule {s.name} on {d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </div>
                            {options.length === 0 && <p className="px-2 py-1.5 text-[12px] text-faint">No unscheduled episodes in this series.</p>}
                            <ul className="scroll-thin max-h-64 overflow-auto">
                              {options.map((e) => (
                                <li key={e.id}>
                                  <form action={updateEpisodeAction.bind(null, e.id)}>
                                    <input type="hidden" name="publishDate" value={key} />
                                    <button type="submit" className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] hover:bg-panel-2">
                                      <span className="min-w-0 flex-1 truncate">{e.title}</span>
                                      <StageBadge stage={e.stage} />
                                    </button>
                                  </form>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </details>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="card h-fit p-5">
          <h2 className="section-title mb-1">Ready, Not Scheduled</h2>
          <p className="mb-3 text-xs text-muted">Click a dashed slot in the calendar to schedule one there.</p>
          {unscheduled.length === 0 && <p className="py-2 text-[13px] text-faint">Nothing waiting.</p>}
          <ul className="-mx-2">
            {unscheduled.map((e) => (
              <li key={e.id}>
                <Link href={`/episodes/${e.id}`} className="flex items-center gap-2 rounded-[10px] px-2 py-2 text-[13px] hover:bg-panel-2">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: (e.seriesId && seriesById.get(e.seriesId)?.color) || "var(--faint)" }} />
                  <span className="min-w-0 flex-1 truncate">{e.title}</span>
                  <StageBadge stage={e.stage} />
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
