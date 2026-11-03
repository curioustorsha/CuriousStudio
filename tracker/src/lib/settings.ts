import "server-only";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { db, settings } from "@/db";
import { defaultModel, EFFORTS, getStage, MODELS, type Effort } from "./stages";

export async function getSetting(key: string) {
  const [row] = await db.select().from(settings).where(eq(settings.key, key));
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string | null) {
  if (value === null || value === "") {
    await db.delete(settings).where(eq(settings.key, key));
    return;
  }
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date().toISOString() } });
}

/** Model and effort a stage's skill runs on: the override saved from the skill's page, else the stage default. */
export async function stageModel(stageKey: string): Promise<{ model: string; effort: Effort; overridden: boolean } | null> {
  const fallback = defaultModel(getStage(stageKey));
  if (!fallback) return null;
  const raw = await getSetting(`model:${stageKey}`);
  if (!raw) return { ...fallback, overridden: false };
  const [model, effort] = raw.split("|");
  return {
    model: MODELS.some((m) => m.id === model) ? model : fallback.model,
    effort: (EFFORTS as readonly string[]).includes(effort) ? (effort as Effort) : fallback.effort,
    overridden: true,
  };
}

/** Saves a stage's model; saving the stage default clears the override. */
export async function saveStageModel(stageKey: string, model: string, effort: string) {
  const fallback = defaultModel(getStage(stageKey));
  if (!fallback || !MODELS.some((m) => m.id === model) || !(EFFORTS as readonly string[]).includes(effort)) return;
  const same = fallback.model === model && fallback.effort === effort;
  await setSetting(`model:${stageKey}`, same ? null : `${model}|${effort}`);
}

/** Fixed monthly fees in USD, typed in on the AI Usage page. */
export const PLAN_KEYS = {
  claude: { key: "plan:claude", label: "Claude subscription", fallback: 20 },
  elevenlabs: { key: "plan:elevenlabs", label: "ElevenLabs plan", fallback: 0 },
} as const;

export async function planFee(which: keyof typeof PLAN_KEYS) {
  const p = PLAN_KEYS[which];
  const raw = await getSetting(p.key);
  const n = raw === null ? p.fallback : Number(raw);
  return Number.isFinite(n) ? n : p.fallback;
}

// ── Claude API key ────────────────────────────────────────────────────
// Kept in tracker/.env.local (never in the database, which may be shared through Turso). Runs inherit the
// tracker's environment, so once it's set Claude Code bills runs to the key instead of the subscription.

const ENV_FILE = join(process.cwd(), ".env.local");

export function anthropicKeyStatus() {
  const key = process.env.ANTHROPIC_API_KEY;
  return key ? { set: true as const, hint: `…${key.slice(-4)}` } : { set: false as const };
}

export function saveAnthropicKey(key: string | null) {
  const clean = key?.trim() ?? "";
  if (clean && !/^sk-ant-[A-Za-z0-9_-]{20,}$/.test(clean)) throw new Error("That doesn't look like a Claude API key (sk-ant-…).");
  let lines: string[] = [];
  try {
    lines = readFileSync(ENV_FILE, "utf8").split("\n");
  } catch {}
  lines = lines.filter((l) => !l.startsWith("ANTHROPIC_API_KEY="));
  while (lines.length && lines.at(-1) === "") lines.pop();
  if (clean) lines.push(`ANTHROPIC_API_KEY=${clean}`);
  writeFileSync(ENV_FILE, `${lines.join("\n")}\n`, { mode: 0o600 });
  if (clean) process.env.ANTHROPIC_API_KEY = clean;
  else delete process.env.ANTHROPIC_API_KEY;
}
