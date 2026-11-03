import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PROJECT_DIR } from "./skills";

const API = "https://api.elevenlabs.io/v1";

/** The ElevenLabs key lives in the Curiously project's .env.local, next to the video scripts that use it. */
function apiKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY;
  try {
    const line = readFileSync(join(PROJECT_DIR, ".env.local"), "utf8")
      .split("\n")
      .find((l) => l.startsWith("ELEVENLABS_API_KEY="));
    return line?.slice("ELEVENLABS_API_KEY=".length).trim().replace(/^["']|["']$/g, "") || null;
  } catch {
    return null;
  }
}

async function get<T>(path: string): Promise<T | null> {
  const key = apiKey();
  if (!key) return null;
  try {
    const res = await fetch(`${API}${path}`, { headers: { "xi-api-key": key }, next: { revalidate: 600 } });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

export type ElevenLabsUsage = {
  tier: string;
  used: number;
  limit: number;
  resetsAt: Date;
  /** Next invoice in USD: the plan fee plus anything extra this period. */
  nextInvoiceUsd: number | null;
  overageUsd: number;
  /** Credits used per calendar month, oldest first. */
  months: { month: string; credits: number }[];
};

/** Plan, credits this billing period and monthly history. Null when there's no key or ElevenLabs can't be reached. */
export async function elevenLabsUsage(monthsBack = 6): Promise<ElevenLabsUsage | null> {
  const sub = await get<{
    tier: string;
    character_count: number;
    character_limit: number;
    next_character_count_reset_unix: number;
    next_invoice?: { amount_due_cents?: number } | null;
    current_overage?: { amount?: string } | null;
  }>("/user/subscription");
  if (!sub) return null;

  const end = Date.now();
  const start = new Date();
  start.setMonth(start.getMonth() - monthsBack + 1, 1);
  start.setHours(0, 0, 0, 0);
  const stats = await get<{ time: number[]; usage: Record<string, number[]> }>(
    `/usage/character-stats?start_unix=${start.getTime()}&end_unix=${end}&aggregation_interval=month`,
  );
  const all = stats?.usage?.All ?? [];
  const months = (stats?.time ?? []).map((t, i) => ({ month: new Date(t).toISOString().slice(0, 7), credits: Math.round(all[i] ?? 0) }));

  return {
    tier: sub.tier,
    used: sub.character_count,
    limit: sub.character_limit,
    resetsAt: new Date(sub.next_character_count_reset_unix * 1000),
    nextInvoiceUsd: sub.next_invoice?.amount_due_cents != null ? sub.next_invoice.amount_due_cents / 100 : null,
    overageUsd: Number(sub.current_overage?.amount ?? 0) || 0,
    months,
  };
}
