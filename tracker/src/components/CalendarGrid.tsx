"use client";

import { CircleCheck, CircleDashed, Lightbulb, Rocket } from "lucide-react";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { scheduleEpisodeAction } from "@/app/actions";
import type { Episode, Series } from "@/db";
import { LAUNCH, READY_FROM, stageIndex } from "@/lib/stages";
import { useDialog } from "./Dialog";
import { StageBadge } from "./ui";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dueDays = (s: Series) => s.cadenceDays.split(",").filter(Boolean).map(Number);
const weekday = (key: string) => new Date(`${key}T00:00`).getDay();

export function CalendarGrid({ days, episodes, series, today, slotsFrom, tall }: {
  /** ISO dates shown, Monday first; `dim` greys out days outside the month. */
  days: { key: string; dim: boolean }[];
  episodes: Episode[];
  series: Series[];
  today: string;
  /** First day open slots (and drops) are allowed. */
  slotsFrom: string;
  /** Week view: each day is a tall column, titles wrap. */
  tall: boolean;
}) {
  const [items, applySchedule] = useOptimistic(episodes, (current, m: { id: number; date: string }) =>
    current.map((e) => (e.id === m.id ? { ...e, publishDate: m.date, stage: e.stage === "idea" ? "script" : e.stage } : e)),
  );
  const [dragId, setDragId] = useState<number | null>(null);
  const [overDay, setOverDay] = useState<string | null>(null);
  const [ideaSeries, setIdeaSeries] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const dialog = useDialog();
  const seriesById = new Map(series.map((s) => [s.id, s]));
  const dragging = dragId === null ? null : items.find((e) => e.id === dragId);

  const byDate = new Map<string, Episode[]>();
  for (const e of items) if (e.publishDate) byDate.set(e.publishDate, [...(byDate.get(e.publishDate) ?? []), e]);

  // Strict: only the episode's own series due days, from slotsFrom on, where that series has nothing else booked.
  const canDrop = (e: Episode, key: string) => {
    const s = e.seriesId ? seriesById.get(e.seriesId) : null;
    return (
      !!s &&
      key >= slotsFrom &&
      key !== e.publishDate &&
      dueDays(s).includes(weekday(key)) &&
      !(byDate.get(key) ?? []).some((x) => x.seriesId === s.id && x.id !== e.id)
    );
  };

  function schedule(id: number, date: string) {
    startTransition(async () => {
      applySchedule({ id, date });
      try {
        await scheduleEpisodeAction(id, date);
      } catch (err) {
        await dialog.alert({ title: "Couldn't schedule", message: err instanceof Error ? err.message : String(err) });
      }
    });
  }

  const dragProps = (e: Episode) => ({
    draggable: e.stage !== "posted",
    onDragStart: (ev: React.DragEvent) => {
      setDragId(e.id);
      ev.dataTransfer.effectAllowed = "move";
    },
    onDragEnd: () => {
      setDragId(null);
      setOverDay(null);
    },
  });

  const ideas = items.filter((e) => e.stage === "idea" && !e.publishDate && (ideaSeries === null || e.seriesId === ideaSeries)).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  const unscheduled = items.filter((e) => !e.publishDate && stageIndex(e.stage) >= READY_FROM && e.stage !== "posted");
  const candidates = (seriesId: number) =>
    items
      .filter((e) => e.seriesId === seriesId && !e.publishDate && e.stage !== "posted")
      .sort((a, b) => stageIndex(b.stage) - stageIndex(a.stage) || a.position - b.position);

  const sideItem = (e: Episode) => (
    <li key={e.id}>
      <Link
        href={`/episodes/${e.id}`}
        {...dragProps(e)}
        className={`flex cursor-grab items-center gap-2 rounded-[10px] px-2 py-2 text-[13px] hover:bg-panel-2 active:cursor-grabbing ${dragId === e.id ? "opacity-40" : ""}`}
      >
        <span className="size-2 shrink-0 rounded-full" style={{ background: (e.seriesId && seriesById.get(e.seriesId)?.color) || "var(--faint)" }} />
        <span className="min-w-0 flex-1 truncate">{e.title}</span>
        <StageBadge stage={e.stage} />
      </Link>
    </li>
  );

  return (
    // shortcut: 14rem ≈ page header + padding + usage footer; a long subtitle or the queue-paused banner adds a little scroll.
    <div className="grid gap-6 xl:h-[calc(100dvh-14rem)] xl:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
      <div className="card flex min-h-0 flex-col overflow-hidden">
        <div className="grid grid-cols-7 border-b border-line text-right text-[13px] font-semibold text-muted">
          {WEEKDAYS.map((d) => <div key={d} className="px-3 py-2.5">{d}</div>)}
        </div>
        <div className="grid flex-1 auto-rows-fr grid-cols-7">
          {days.map(({ key, dim }) => {
            const dayItems = byDate.get(key) ?? [];
            const droppable = !!dragging && canDrop(dragging, key);
            const openSlots =
              key >= slotsFrom
                ? series.filter((s) => dueDays(s).includes(weekday(key)) && !dayItems.some((e) => e.seriesId === s.id))
                : [];
            return (
              <div
                key={key}
                onDragOver={(ev) => {
                  if (!droppable) return; // not a drop target, so the browser shows "no drop"
                  ev.preventDefault();
                  setOverDay(key);
                }}
                onDragLeave={(ev) => {
                  if (!ev.currentTarget.contains(ev.relatedTarget as Node)) setOverDay(null);
                }}
                onDrop={(ev) => {
                  ev.preventDefault();
                  if (dragging && droppable) schedule(dragging.id, key);
                  setDragId(null);
                  setOverDay(null);
                }}
                className={`${tall ? "min-h-[32rem]" : "min-h-28"} scroll-thin overflow-y-auto xl:min-h-0 border-b border-r border-line p-1.5 transition-colors [&:nth-child(7n)]:border-r-0 ${
                  dim ? "opacity-40" : ""
                } ${droppable ? (overDay === key ? "bg-accent/15 ring-2 ring-inset ring-accent/50" : "bg-accent/[0.06]") : ""} ${
                  dragging && !droppable ? "opacity-50" : ""
                }`}
              >
                <div className="mb-1 flex items-center justify-end gap-1">
                  {key === LAUNCH && (
                    <span className="mr-auto flex items-center gap-1 rounded-md bg-fg/[0.06] px-1.5 py-0.5 text-[12px] font-semibold">
                      <Rocket className="size-3" strokeWidth={2.4} /> Launch
                    </span>
                  )}
                  <span
                    className={`grid size-7 place-items-center rounded-full text-[14px] tabular-nums ${
                      key === today ? "bg-danger font-semibold text-white" : dim ? "text-faint" : "text-fg"
                    }`}
                  >
                    {Number(key.slice(8))}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayItems.map((e) => {
                    const s = e.seriesId ? seriesById.get(e.seriesId) : null;
                    const late = key < today && e.stage !== "posted";
                    return (
                      <Link
                        key={e.id}
                        href={`/episodes/${e.id}`}
                        {...dragProps(e)}
                        title={`${e.code} · ${e.title}`}
                        className={`flex flex-col items-start gap-1 rounded-md px-2 py-1.5 text-[13px] font-medium leading-snug transition-opacity hover:opacity-75 ${
                          dragId === e.id ? "opacity-40" : ""
                        }`}
                        style={{
                          background: `color-mix(in srgb, ${s?.color ?? "#8e8e93"} 16%, transparent)`,
                          boxShadow: `inset 3px 0 0 ${s?.color ?? "#8e8e93"}`,
                          color: late ? "var(--danger)" : undefined,
                        }}
                      >
                        <span className="flex w-full min-w-0 items-start gap-1">
                          {e.stage === "posted" && <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-ok" strokeWidth={2.4} />}
                          <span>{e.title}</span>
                        </span>
                        <StageBadge stage={e.stage} />
                      </Link>
                    );
                  })}
                  {openSlots.map((s) => {
                    const options = candidates(s.id);
                    return (
                      <details key={s.id} className="relative">
                        <summary
                          className="flex cursor-pointer list-none items-center gap-1 truncate rounded-md border border-dashed px-2 py-1 text-[12px] font-medium hover:bg-fg/[0.04] [&::-webkit-details-marker]:hidden"
                          style={{ borderColor: `color-mix(in srgb, ${s.color} 50%, transparent)`, color: s.color }}
                          title={`Open slot: ${s.name}. Drag an idea here, or click to pick one.`}
                        >
                          <CircleDashed className="size-3 shrink-0" strokeWidth={2.4} />
                          <span className="truncate">{s.name}</span>
                        </summary>
                        <div className={`card absolute top-full z-20 mt-1 w-64 p-1.5 shadow-lg ${[5, 6, 0].includes(weekday(key)) ? "right-0" : "left-0"}`}>
                          <div className="px-2 pb-1 pt-0.5 text-[11px] font-semibold text-muted">
                            Schedule {s.name} on {new Date(`${key}T00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </div>
                          {options.length === 0 && <p className="px-2 py-1.5 text-[12px] text-faint">No unscheduled episodes in this series.</p>}
                          <ul className="scroll-thin max-h-64 overflow-auto">
                            {options.map((e) => (
                              <li key={e.id}>
                                <button
                                  type="button"
                                  onClick={(ev) => {
                                    ev.currentTarget.closest("details")?.removeAttribute("open");
                                    schedule(e.id, key);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] hover:bg-panel-2"
                                >
                                  <span className="min-w-0 flex-1 truncate">{e.title}</span>
                                  <StageBadge stage={e.stage} />
                                </button>
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

      <div className="flex min-h-0 flex-col gap-6">
        <aside className="card flex min-h-0 flex-1 flex-col p-5">
          <h2 className="section-title mb-1 flex items-center gap-1.5">
            <Lightbulb className="size-4" strokeWidth={2} /> Ideas
          </h2>
          <p className="mb-3 text-xs text-muted">Drag an idea onto a highlighted day of its series. It moves to Write.</p>
          <select
            aria-label="Filter ideas by series"
            value={ideaSeries ?? ""}
            onChange={(ev) => setIdeaSeries(ev.target.value ? Number(ev.target.value) : null)}
            className="input mb-3"
          >
            <option value="">All series</option>
            {series.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {ideas.length === 0 && <p className="py-2 text-[13px] text-faint">No ideas waiting.</p>}
          <ul className="scroll-thin -mx-2 min-h-0 flex-1 overflow-auto">{ideas.map(sideItem)}</ul>
        </aside>
        <aside className="card flex max-h-[40%] shrink-0 flex-col p-5">
          <h2 className="section-title mb-1">Ready, Not Scheduled</h2>
          <p className="mb-3 text-xs text-muted">Drag onto a highlighted day, or click a dashed slot.</p>
          {unscheduled.length === 0 && <p className="py-2 text-[13px] text-faint">Nothing waiting.</p>}
          <ul className="scroll-thin -mx-2 min-h-0 overflow-auto">{unscheduled.map(sideItem)}</ul>
        </aside>
      </div>
    </div>
  );
}
