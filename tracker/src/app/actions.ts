"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, episodes, series } from "@/db";
import {
  changeOwnPassword,
  checkCredentials,
  createUser,
  endSession,
  requireAdmin,
  requireUser,
  resetPassword,
  startSession,
  updateUserAccess,
} from "@/lib/auth";
import * as ep from "@/lib/episodes";
import { addComment, markAllRead } from "@/lib/comments";
import { MAX_SELECTED, queueIdeaFills } from "@/lib/ideaFill";
import { activeRun, enqueueRun, stopRun } from "@/lib/runner";
import { saveSkill } from "@/lib/skills";
import { getStage, isFormat, isStage, stepStage } from "@/lib/stages";
import { isVisualStyle } from "@/lib/styles";
import { PLAN_KEYS, saveAnthropicKey, saveStageModel, setSetting } from "@/lib/settings";

function refreshAll() {
  revalidatePath("/", "layout");
}

// ── Auth ──────────────────────────────────────────────────────────────

export async function login(_prev: { error?: string } | undefined, formData: FormData) {
  const user = await checkCredentials(String(formData.get("username") ?? ""), String(formData.get("password") ?? ""));
  if (user === "locked") return { error: "Too many wrong passwords. This account is locked for 15 minutes, or an admin can reset its password." };
  if (!user) return { error: "Wrong username or password." };
  await startSession(user);
  redirect("/");
}

export async function logout() {
  await endSession();
  redirect("/login");
}

// ── Users ─────────────────────────────────────────────────────────────

type FormResult = { error?: string; ok?: boolean } | undefined;

async function formResult(change: () => Promise<void>): Promise<FormResult> {
  try {
    await change();
  } catch (e) {
    return { error: (e as Error).message };
  }
  refreshAll();
  return { ok: true };
}

const field = (formData: FormData, name: string) => String(formData.get(name) ?? "");

export async function createUserAction(_prev: FormResult, formData: FormData) {
  const actor = await requireAdmin();
  return formResult(async () => {
    await createUser({
      username: field(formData, "username"),
      name: field(formData, "name"),
      password: field(formData, "password"),
      role: field(formData, "role"),
    });
    await ep.logActivity(actor.username, `added user ${field(formData, "username").trim().toLowerCase()}`);
  });
}

export async function updateUserAction(username: string, _prev: FormResult, formData: FormData) {
  const actor = await requireAdmin();
  return formResult(async () => {
    await updateUserAccess(actor, username, {
      name: field(formData, "name"),
      role: field(formData, "role"),
      active: formData.get("active") === "on",
    });
    await ep.logActivity(actor.username, `updated user ${username}`);
  });
}

export async function resetPasswordAction(username: string, _prev: FormResult, formData: FormData) {
  const actor = await requireAdmin();
  return formResult(async () => {
    await resetPassword(username, field(formData, "password"));
    await ep.logActivity(actor.username, `reset the password of ${username}`);
  });
}

export async function changeOwnPasswordAction(_prev: FormResult, formData: FormData) {
  const user = await requireUser();
  return formResult(() => changeOwnPassword(user, field(formData, "current"), field(formData, "next")));
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
  if (note) await addComment(user.username, `Approved ${getStage(row.stage).label}: ${note}`, id);
  await ep.updateEpisode(user.username, id, { stage: next.key });
  refreshAll();
}

/** Accept the current stage's proposal: back to the earlier stage, with its fixes filed as a change request. */
export async function sendBackAction(id: number) {
  const user = await requireUser();
  await ep.sendBack(user.username, id);
  refreshAll();
}

/** Stops anything still running on the episode, so it doesn't keep spending after the delete, then removes it and all its tracker data. */
async function removeEpisode(actor: string, id: number) {
  const [row] = await db.select().from(episodes).where(eq(episodes.id, id));
  if (!row) return false;
  const active = await activeRun(id);
  if (active) await stopRun(actor, active.id);
  await db.delete(episodes).where(eq(episodes.id, id));
  await ep.logActivity(actor, `deleted ${row.code} “${row.title}”`);
  return true;
}

/** Deletes from the Ideas list, at any stage, and stays on the list. */
export async function deleteIdeaAction(id: number) {
  const user = await requireUser();
  await removeEpisode(user.username, id);
  refreshAll();
}

export async function fillIdeasAction(_prev: { message: string; failed: boolean } | undefined, formData: FormData) {
  const user = await requireUser();
  const ids = [...new Set(formData.getAll("ids").map(Number).filter(Number.isInteger))];
  if (!ids.length) return { message: "Tick at least one idea first.", failed: true };
  if (ids.length > MAX_SELECTED) return { message: `Tick up to ${MAX_SELECTED} ideas at a time.`, failed: true };
  const { queued, skipped } = await queueIdeaFills(user.username, ids);
  refreshAll();
  const parts = [
    queued ? `Added ${queued} ${queued === 1 ? "idea" : "ideas"} to the queue.` : "",
    skipped ? `Skipped ${skipped}: already filled or past the Idea stage.` : "",
  ];
  return { message: parts.filter(Boolean).join(" "), failed: false };
}

export async function addPinnedNoteAction(id: number, atSec: number, body: string) {
  const user = await requireUser();
  const text = body.trim();
  if (!text || !Number.isFinite(atSec) || atSec < 0) return;
  await ep.addPinnedNote(user.username, id, atSec, text);
  refreshAll();
}

export async function deletePinnedNoteAction(noteId: number) {
  const user = await requireUser();
  await ep.deletePinnedNote(user.username, noteId);
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
  await enqueueRun(user.username, episodeId);
  refreshAll();
}

export async function stopRunAction(runId: number) {
  const user = await requireUser();
  await stopRun(user.username, runId);
  refreshAll();
}

export async function saveSkillAction(name: string, formData: FormData) {
  const actor = await requireAdmin();
  saveSkill(name, String(formData.get("content") ?? ""));
  await ep.logActivity(actor.username, `edited the ${name} skill`);
  refreshAll();
}

/** From a skill's page: pick an episode and run. */
export async function runSkillFromPageAction(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get("episodeId"));
  if (!id) return;
  await enqueueRun(user.username, id);
  redirect(`/episodes/${id}`);
}

export async function toggleChecklistAction(id: number, key: string, checked: boolean) {
  const user = await requireUser();
  const [row] = await db.select({ checklist: episodes.checklist, code: episodes.code }).from(episodes).where(eq(episodes.id, id));
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
  await ep.logActivity(user.username, `${checked ? "ticked" : "unticked"} a checklist item on ${row.code}`, id);
  refreshAll();
}

export async function deleteEpisodeAction(id: number) {
  const user = await requireUser();
  if (!(await removeEpisode(user.username, id))) return;
  refreshAll();
  redirect("/board");
}

/** On an episode, or on the team feed when id is null. */
export async function addCommentAction(id: number | null, formData: FormData) {
  const user = await requireUser();
  await addComment(user.username, String(formData.get("body") ?? ""), id);
  refreshAll();
}

export async function markAllNotificationsReadAction() {
  const user = await requireUser();
  await markAllRead(user.username);
  refreshAll();
}

// ── Series ────────────────────────────────────────────────────────────

export async function saveSeriesAction(formData: FormData) {
  const user = await requireUser();
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
    targetSeconds: Math.min(180, Math.max(10, Math.round(Number(formData.get("targetSeconds"))) || 60)),
  };
  if (!values.name || !values.prefix) return;
  if (id) await db.update(series).set(values).where(eq(series.id, id));
  else await db.insert(series).values(values);
  await ep.logActivity(user.username, `${id ? "updated" : "created"} the ${values.name} series`);
  refreshAll();
}

// ── Models & usage ────────────────────────────────────────────────────

/** From a skill's page: which model and effort the stage runs on. Picking the default clears the override. */
export async function saveStageModelAction(stage: string, formData: FormData) {
  const actor = await requireAdmin();
  await saveStageModel(stage, String(formData.get("model") ?? ""), String(formData.get("effort") ?? ""));
  await ep.logActivity(actor.username, `changed the model for the ${getStage(stage).label} stage`);
  refreshAll();
}

export async function savePlanFeesAction(formData: FormData) {
  const actor = await requireAdmin();
  for (const p of Object.values(PLAN_KEYS)) {
    const raw = String(formData.get(p.key) ?? "").trim();
    if (raw === "" || Number.isFinite(Number(raw))) await setSetting(p.key, raw === "" ? null : String(Number(raw)));
  }
  await ep.logActivity(actor.username, "updated the monthly plan fees");
  refreshAll();
}

export async function saveApiKeyAction(_prev: { error?: string; ok?: boolean } | undefined, formData: FormData) {
  const actor = await requireAdmin();
  const remove = formData.get("remove") === "1";
  try {
    saveAnthropicKey(remove ? null : String(formData.get("key") ?? ""));
  } catch (e) {
    return { error: (e as Error).message };
  }
  await ep.logActivity(actor.username, `${remove ? "removed" : "changed"} the Claude API key`);
  refreshAll();
  return { ok: true };
}
