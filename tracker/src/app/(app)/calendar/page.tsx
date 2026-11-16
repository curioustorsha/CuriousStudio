import { ChevronLeft, ChevronRight, Rocket } from "lucide-react";
import Link from "next/link";
import { db, episodes as episodesTable, series as seriesTable } from "@/db";
import { CalendarGrid } from "@/components/CalendarGrid";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { LAUNCH } from "@/lib/stages";

function iso(d: Date) {
  return d.toLocaleDateString("en-CA");
}

/** Monday on or before d. */
function monday(d: Date) {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-IN", o);

export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  await requireUser();
  const { m, w, v } = await searchParams;
  const view = v === "month" ? "month" : "week";
  const now = new Date();
  const today = iso(now);
  // Open slots only make sense once publishing has started.
  const slotsFrom = today > LAUNCH ? today : LAUNCH;

  let start: Date, end: Date, title: string, prev: string, next: string, todayHref: string, launchHref: string;
  let inMonth: (d: Date) => boolean = () => true;
  if (view === "month") {
    const [year, month] =
      typeof m === "string" && /^\d{4}-\d{2}$/.test(m) ? m.split("-").map(Number) : [now.getFullYear(), now.getMonth() + 1];
    const first = new Date(year, month - 1, 1);
    const last = new Date(year, month, 0);
    // Grid runs Monday on/before the 1st to Sunday on/after month end.
    start = monday(first);
    end = addDays(monday(last), 6);
    inMonth = (d) => d.getMonth() === month - 1;
    const key = (mo: number) => iso(new Date(year, mo - 1, 1)).slice(0, 7);
    title = fmt(first, { month: "long", year: "numeric" });
    prev = `/calendar?v=month&m=${key(month - 1)}`;
    next = `/calendar?v=month&m=${key(month + 1)}`;
    todayHref = "/calendar?v=month";
    launchHref = `/calendar?v=month&m=${LAUNCH.slice(0, 7)}`;
  } else {
    start = monday(typeof w === "string" && /^\d{4}-\d{2}-\d{2}$/.test(w) ? new Date(`${w}T00:00`) : now);
    end = addDays(start, 6);
    title = `${fmt(start, { day: "numeric", month: "short" })} – ${fmt(end, { day: "numeric", month: "short", year: "numeric" })}`;
    prev = `/calendar?w=${iso(addDays(start, -7))}`;
    next = `/calendar?w=${iso(addDays(start, 7))}`;
    todayHref = "/calendar";
    launchHref = `/calendar?w=${LAUNCH}`;
  }

  const days: { key: string; dim: boolean }[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push({ key: iso(d), dim: !inMonth(d) });

  const [all, seriesList] = await Promise.all([db.select().from(episodesTable), db.select().from(seriesTable)]);
  const from = days[0].key, to = days.at(-1)!.key;
  const shown = all.filter((e) => e.publishDate && e.publishDate >= from && e.publishDate <= to).length;
  // Keep the page you're on when switching views.
  const firstShown = days.find((d) => !d.dim)!.key;
  const weekHref = view === "week" || firstShown.slice(0, 7) === today.slice(0, 7) ? todayHref.replace("?v=month", "") : `/calendar?w=${firstShown}`;
  const monthHref = view === "month" ? todayHref : `/calendar?v=month&m=${firstShown.slice(0, 7)}`;

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={`${shown} episodes scheduled here. Publishing starts ${fmt(new Date(`${LAUNCH}T00:00`), { day: "numeric", month: "long", year: "numeric" })}. Dashed slots mean a series is due that day but nothing is scheduled; drag an idea onto one.`}
      >
        <div className="segmented">
          <Link href={weekHref} data-active={view === "week"}>Week</Link>
          <Link href={monthHref} data-active={view === "month"}>Month</Link>
        </div>
        <Link href={launchHref} className="btn">
          <Rocket className="size-3.5" strokeWidth={2} /> Launch
        </Link>
        <div className="segmented">
          <Link href={prev} aria-label="Previous" className="!px-2">
            <ChevronLeft className="size-4" strokeWidth={2.2} />
          </Link>
          <Link href={todayHref}>Today</Link>
          <Link href={next} aria-label="Next" className="!px-2">
            <ChevronRight className="size-4" strokeWidth={2.2} />
          </Link>
        </div>
      </PageHeader>
      <CalendarGrid days={days} episodes={all} series={seriesList} today={today} slotsFrom={slotsFrom} tall={view === "week"} />
    </div>
  );
}
