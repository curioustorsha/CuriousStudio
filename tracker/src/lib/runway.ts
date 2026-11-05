import { LAUNCH, READY_FROM, stageIndex } from "@/lib/stages";

/** How far ahead of the publishing schedule we want finished episodes to be. */
const RUNWAY_MONTHS = 1;

const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);
const toIso = (d: Date) => d.toISOString().slice(0, 10);

/** The stretch the runway has to cover: from launch until then, and after that a rolling month from today. */
export function runwayWindow(today: string) {
  const start = today > LAUNCH ? today : LAUNCH;
  const d = utc(start);
  const end = toIso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + RUNWAY_MONTHS, d.getUTCDate() - 1)));
  return { start, end, preLaunch: today < LAUNCH };
}

/** Publishing days (cadence: comma-separated weekdays, 0 = Sunday) between two dates, both included. */
export function slotsBetween(cadenceDays: string, start: string, end: string) {
  const days = new Set(cadenceDays.split(",").filter(Boolean).map(Number));
  let count = 0;
  for (const d = utc(start); toIso(d) <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    if (days.has(d.getUTCDay())) count++;
  }
  return count;
}

export function seriesRunway(cadenceDays: string, eps: { stage: string }[], window: { start: string; end: string }) {
  const need = slotsBetween(cadenceDays, window.start, window.end);
  const ready = eps.filter((e) => stageIndex(e.stage) >= READY_FROM && e.stage !== "posted").length;
  const building = eps.filter((e) => e.stage !== "idea" && stageIndex(e.stage) < READY_FROM).length;
  const ideas = eps.filter((e) => e.stage === "idea").length;
  return { need, ready, building, ideas, ideasShort: Math.max(0, need - ready - building - ideas) };
}

/** Episodes to finish per week to reach `remaining` by `deadline`. Null once the deadline has passed. */
export function weeklyPace(remaining: number, today: string, deadline: string) {
  const days = (utc(deadline).getTime() - utc(today).getTime()) / 86_400_000;
  return days > 0 ? remaining / (days / 7) : null;
}
