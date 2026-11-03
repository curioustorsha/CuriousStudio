"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { comments, db, episodes, series } from "@/db";
import { checkCredentials, endSession, requireUser, startSession } from "@/lib/auth";
import * as ep from "@/lib/episodes";
import { startRun, stopRun } from "@/lib/runner";
import { saveSkill } from "@/lib/skills";
import { getStage, isFormat, isStage, stepStage } from "@/lib/stages";
import { isVisualStyle } from "@/lib/styles";
import { PLAN_KEYS, saveAnthropicKey, saveStageModel, setSetting } from "@/lib/settings";

function refreshAll() {
  revalidatePath("/", "layout");
}

// ── Auth ──────────────────────────────────────────────────────────────

export async function login(_prev: { error?: string } | undefined, formData: FormData) {
  const user = checkCredentials(String(formData.get("username") ?? ""), String(formData.get("password") ?? ""));
  if (!user) return { error: "Wrong username or password." };
  await startSession(user);
  redirect("/");
}

export async function logout() {
  await endSession();
  redirect("/login");
}

// ── Episodes ──────────────────────────────────────────────────────────

export async function createEpisodeAction(formData: FormData) {
  const user = await requireUser();
  const created = await ep.createEpisode(user.username, Object.fromEntries(formData));
  refreshAll();
  if (formData.get("_open") === "1") redirect(`/episodes/${created.id}`);
}

export async function updateEpisodeAction(id: number, formData: FormData) {
  const user = await requireUser();
  await ep.updateEpisode(user.username, id, ep.parsePatch(Object.fromEntries(formData)));
  refreshAll();
}

/** Also usable as a bound form action: `moveEpisodeAction.bind(null, id, "research")`. */
export async function moveEpisodeAction(id: number, stage: string, position?: unknown) {
  const user = await requireUser();
  if (!isStage(stage)) throw new Error("Unknown stage");
  await ep.updateEpisode(user.username, id, { stage });
  if (typeof position === "number" && Number.isFinite(position)) {
    await db.update(episodes).set({ position }).where(eq(episodes.id, id));
  }
  refreshAll();
}

/** Approve the current stage: move the episode to the next one. An optional note is kept in team chat. */
export async function approveStageAction(id: number, formData: FormData) {
  const user = await requireUser();
  const [row] = await db.select().from(episodes).where(eq(episodes.id, id));
  if (!row) return;
  const next = stepStage(row.stage, await ep.formatOf(row.seriesId));
  if (!next) return;
  const note = String(formData.get("body") ?? "").trim();
  if (note) {
    await db.insert(comments).values({ episodeId: id, author: user.username, body: `Approved ${getStage(row.stage).label}: ${note}` });
  }
  await ep.updateEpisode(user.username, id, { stage: next.key });
  refreshAll();
}

/** Accept the current stage's proposal: back to the earlier stage, with its fixes filed as a change request. */
export async function sendBackAction(id: number) {
  const user = await requireUser();
  await ep.sendBack(user.username, id);
  refreshAll();
}

export async function requestChangesAction(id: number, formData: FormData) {
  const user = await requireUser();
  const text = String(formData.get("body") ?? "").trim();
  const picked = formData.getAll("facts").map(String);
  let body = text;
  if (picked.length) {
    const episode = await ep.findEpisode(String(id));
    const facts = ep.researchFacts(episode?.research ?? "");
    const lines = picked.map((n) => `- **${n}.** ${facts.find((f) => f.id === n)?.text ?? ""}`.trimEnd());
    body = [
      `**Build the script around these research facts.** Give them the time; use other facts only where the story needs them.`,
      lines.join("\n"),
      text,
    ]
      .filter(Boolean)
      .join("\n\n");
  }
  if (!body) return;
  await ep.requestChanges(user.username, id, body);
  refreshAll();
}

// ── Skills ────────────────────────────────────────────────────────────

/** Runs the skill for the episode's current stage in the background. */
export async function runSkillAction(episodeId: number) {
  const user = await requireUser();
  await startRun(user.username, episodeId);
  refreshAll();
}

export async function stopRunAction(runId: number) {
  const user = await requireUser();
  await stopRun(user.username, runId);
  refreshAll();
}

export async function saveSkillAction(name: string, formData: FormData) {
  await requireUser();
  saveSkill(name, String(formData.get("content") ?? ""));
  refreshAll();
}

/** From a skill's page: pick an episode and run. */
export async function runSkillFromPageAction(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get("episodeId"));
  if (!id) return;
  await startRun(user.username, id);
  redirect(`/episodes/${id}`);
}

export async function toggleChecklistAction(id: number, key: string, checked: boolean) {
  const user = await requireUser();
  const [row] = await db.select({ checklist: episodes.checklist }).from(episodes).where(eq(episodes.id, id));
  if (!row) return;
  let map: Record<string, unknown> = {};
  try {
    map = JSON.parse(row.checklist);
  } catch {}
  if (checked) {
    map[key] = true;
    map[`by:${key}`] = user.username;
  } else {
    delete map[key];
    delete map[`by:${key}`];
  }
  await db.update(episodes).set({ checklist: JSON.stringify(map) }).where(eq(episodes.id, id));
  refreshAll();
}

export async function deleteEpisodeAction(id: number) {
  const user = await requireUser();
  const [row] = await db.select().from(episodes).where(eq(episodes.id, id));
  if (!row) return;
  await db.delete(episodes).where(eq(episodes.id, id));
  await ep.logActivity(user.username, `deleted ${row.code} “${row.title}”`);
  refreshAll();
  redirect("/board");
}

export async function addCommentAction(id: number, formData: FormData) {
  const user = await requireUser();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  await db.insert(comments).values({ episodeId: id, author: user.username, body });
  refreshAll();
}

// ── Series ────────────────────────────────────────────────────────────

export async function saveSeriesAction(formData: FormData) {
  await requireUser();
  const id = Number(formData.get("id")) || null;
  const values = {
    name: String(formData.get("name") ?? "").trim(),
    prefix: String(formData.get("prefix") ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, ""),
    color: String(formData.get("color") ?? "#7c5cff"),
    cadenceDays: formData.getAll("cadenceDays").map(String).join(","),
    description: String(formData.get("description") ?? ""),
    formatNotes: String(formData.get("formatNotes") ?? ""),
    format: isFormat(formData.get("format")) ? String(formData.get("format")) : "video",
    visualStyle: isVisualStyle(formData.get("visualStyle")) ? String(formData.get("visualStyle")) : "",
  };
  if (!values.name || !values.prefix) return;
  if (id) await db.update(series).set(values).where(eq(series.id, id));
  else await db.insert(series).values(values);
  refreshAll();
}

// ── Models & usage ────────────────────────────────────────────────────

/** From a skill's page: which model and effort the stage runs on. Picking the default clears the override. */
export async function saveStageModelAction(stage: string, formData: FormData) {
  await requireUser();
  await saveStageModel(stage, String(formData.get("model") ?? ""), String(formData.get("effort") ?? ""));
  refreshAll();
}

export async function savePlanFeesAction(formData: FormData) {
  await requireUser();
  for (const p of Object.values(PLAN_KEYS)) {
    const raw = String(formData.get(p.key) ?? "").trim();
    if (raw === "" || Number.isFinite(Number(raw))) await setSetting(p.key, raw === "" ? null : String(Number(raw)));
  }
  refreshAll();
}

export async function saveApiKeyAction(_prev: { error?: string; ok?: boolean } | undefined, formData: FormData) {
  await requireUser();
  const remove = formData.get("remove") === "1";
  try {
    saveAnthropicKey(remove ? null : String(formData.get("key") ?? ""));
  } catch (e) {
    return { error: (e as Error).message };
  }
  refreshAll();
  return { ok: true };
}
