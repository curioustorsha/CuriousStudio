import "server-only";
import { and, asc, desc, eq, isNull, like, max, sql } from "drizzle-orm";
import { activity, db, episodes, feedback, revisions, series, type Episode, type Revision } from "@/db";
import {
  canMove,
  getStage,
  HUMAN_CHECKS,
  inFormat,
  isFormat,
  isStage,
  PRIORITIES,
  stageIndex,
  STAGES,
  type Format,
  type StageKey,
} from "./stages";

/** Actor name for changes made through the API (Claude Code skills). */
export const API_ACTOR = "claude";

/** Fields that can be edited from forms and the API, grouped by type. */
export const TEXT_FIELDS = [
  "title", "hook", "summary", "whyNow", "audience", "keyPoints", "visualIdeas", "tags",
  "research", "sources", "script", "factcheck", "storyboard",
  "folderPath", "voiceoverUrl", "renderUrl", "productionNotes", "voiceoverNotes", "renderNotes", "reviewReport",
  "slides", "designNotes",
  "publishPlan",
  "ytTitle", "ytDescription", "igCaption", "tiktokCaption", "hashtags", "thumbnailNotes",
  "postedYt", "postedIg", "postedTiktok", "analyticsNotes",
] as const;

export const NUMBER_FIELDS = ["targetSeconds", "views", "likes", "shares", "avgRetention"] as const;

export type EpisodePatch = Partial<
  Pick<Episode, (typeof TEXT_FIELDS)[number] | (typeof NUMBER_FIELDS)[number]> & {
    stage: string;
    priority: string;
    owner: string | null;
    seriesId: number | null;
    publishDate: string | null;
    readyForReview: boolean;
    sendBack: string;
  }
>;

/** Turn loose input (FormData entries or JSON) into a validated patch. Unknown keys are ignored. */
export function parsePatch(input: Record<string, unknown>): EpisodePatch {
  const patch: Record<string, unknown> = {};
  for (const key of TEXT_FIELDS) {
    if (key in input) patch[key] = String(input[key] ?? "");
  }
  for (const key of NUMBER_FIELDS) {
    if (key in input) {
      const raw = String(input[key] ?? "").trim();
      const n = Number(raw);
      patch[key] = raw === "" || Number.isNaN(n) ? null : n;
    }
  }
  if (typeof patch.title === "string" && !patch.title.trim()) delete patch.title;
  if (patch.targetSeconds === null) delete patch.targetSeconds;

  if ("stage" in input && isStage(String(input.stage))) patch.stage = String(input.stage);
  if ("priority" in input && (PRIORITIES as readonly string[]).includes(String(input.priority))) {
    patch.priority = String(input.priority);
  }
  if ("readyForReview" in input) patch.readyForReview = input.readyForReview === true || input.readyForReview === "true";
  if ("owner" in input) patch.owner = String(input.owner ?? "") || null;
  if ("seriesId" in input) {
    const n = Number(input.seriesId);
    patch.seriesId = input.seriesId === "" || input.seriesId == null || Number.isNaN(n) ? null : n;
  }
  if ("publishDate" in input) {
    const d = String(input.publishDate ?? "");
    patch.publishDate = /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
  }
  return patch as EpisodePatch;
}

/** The series' format (video or carousel), which decides the episode's stages. No series means video. */
export async function formatOf(seriesId: number | null | undefined): Promise<Format> {
  if (!seriesId) return "video";
  const [s] = await db.select({ format: series.format }).from(series).where(eq(series.id, seriesId));
  return isFormat(s?.format) ? s.format : "video";
}

export async function logActivity(actor: string, message: string, episodeId?: number | null) {
  await db.insert(activity).values({ actor, message, episodeId: episodeId ?? null });
}

/** Default target length for a new episode, by series prefix. How It Scales runs longer for its technical layer. */
const DEFAULT_SECONDS: Record<string, number> = { HIS: 80 };

async function defaultSeconds(seriesId: number | null) {
  if (!seriesId) return undefined;
  const [s] = await db.select({ prefix: series.prefix }).from(series).where(eq(series.id, seriesId));
  return s ? DEFAULT_SECONDS[s.prefix] : undefined;
}

async function nextCode(seriesId: number | null) {
  let prefix = "PB";
  if (seriesId) {
    const [s] = await db.select({ prefix: series.prefix }).from(series).where(eq(series.id, seriesId));
    if (s) prefix = s.prefix;
  }
  const rows = await db
    .select({ code: episodes.code })
    .from(episodes)
    .where(like(episodes.code, `${prefix}-%`));
  const highest = rows.reduce((m, r) => Math.max(m, Number(r.code.split("-").pop()) || 0), 0);
  return `${prefix}-${String(highest + 1).padStart(3, "0")}`;
}

export async function createEpisode(actor: string, input: Record<string, unknown>) {
  const patch = parsePatch(input);
  const title = (patch.title ?? "").trim() || "Untitled idea";
  const seriesId = patch.seriesId ?? null;
  const stage = patch.stage ?? "idea";
  const [{ top }] = await db
    .select({ top: max(episodes.position) })
    .from(episodes)
    .where(eq(episodes.stage, stage));
  const [created] = await db
    .insert(episodes)
    .values({
      ...(patch.targetSeconds == null ? { targetSeconds: await defaultSeconds(seriesId) } : {}),
      ...patch,
      title,
      seriesId,
      stage,
      code: await nextCode(seriesId),
      createdBy: actor,
      position: (top ?? 0) + 1,
    })
    .returning();
  await logActivity(actor, `created ${created.code} “${created.title}”`, created.id);
  return created;
}

/** `allowJump` is only for sending an episode back several stages with fixes (see sendBack). */
export async function updateEpisode(actor: string, id: number, patch: EpisodePatch, opts: { allowJump?: boolean } = {}) {
  const [before] = await db.select().from(episodes).where(eq(episodes.id, id));
  if (!before) throw new Error("Episode not found");
  if (Object.keys(patch).length === 0) return before;
  if (patch.stage && patch.stage !== before.stage) {
    const backwards = stageIndex(patch.stage) < stageIndex(before.stage);
    const format = await formatOf(patch.seriesId !== undefined ? patch.seriesId : before.seriesId);
    if (!inFormat(getStage(patch.stage), format)) {
      throw new Error(`${getStage(patch.stage).label} isn't part of a ${format} episode's pipeline.`);
    }
    if (!canMove(before.stage, patch.stage, format) && !(opts.allowJump && backwards)) {
      throw new Error(`Can't jump from ${getStage(before.stage).label} to ${getStage(patch.stage).label}; move one stage at a time.`);
    }
    // A send-back proposal belongs to the stage that made it; it no longer applies once the stage changes.
    patch = { ...patch, readyForReview: false, sendBack: "" };
  }

  const [after] = await db
    .update(episodes)
    .set({ ...patch, updatedAt: sql`(datetime('now'))` })
    .where(eq(episodes.id, id))
    .returning();

  const versions = await snapshotStages(actor, before, after);

  if (patch.stage && patch.stage !== before.stage) {
    await logActivity(
      actor,
      `moved ${before.code} from ${getStage(before.stage).label} to ${getStage(patch.stage).label}`,
      id,
    );
  } else if (versions.length) {
    const what = versions.map((v) => `${getStage(v.stage).label} v${v.version}`).join(", ");
    const submitted = patch.readyForReview === true;
    await logActivity(actor, submitted ? `submitted ${before.code} ${what} for review` : `edited ${before.code} ${what}`, id);
  } else {
    const changed = Object.keys(patch).filter(
      (k) => before[k as keyof Episode] !== after[k as keyof Episode],
    );
    if (changed.length) await logActivity(actor, `updated ${before.code} (${changed.join(", ")})`, id);
  }
  return after;
}

/** Saves a new version of every stage whose output fields changed. Claude's versions answer open feedback. */
async function snapshotStages(actor: string, before: Episode, after: Episode) {
  const created: { stage: string; version: number }[] = [];
  for (const stage of STAGES) {
    const fields = stage.fields as readonly (keyof Episode)[];
    if (!fields.length || fields.every((f) => before[f] === after[f])) continue;
    const [{ top }] = await db
      .select({ top: max(revisions.version) })
      .from(revisions)
      .where(and(eq(revisions.episodeId, after.id), eq(revisions.stage, stage.key)));
    const version = (top ?? 0) + 1;
    const content = JSON.stringify(Object.fromEntries(fields.map((f) => [f, after[f]])));
    await db.insert(revisions).values({ episodeId: after.id, stage: stage.key, version, content, author: actor });
    if (actor === API_ACTOR) {
      await db
        .update(feedback)
        .set({ addressedIn: version })
        .where(and(eq(feedback.episodeId, after.id), eq(feedback.stage, stage.key), isNull(feedback.addressedIn)));
    }
    created.push({ stage: stage.key, version });
  }
  return created;
}

export type CheckUpdate = { item: number; done: boolean; note?: string };

/**
 * Claude's pass over the current stage's checklist: tick what it confirmed, untick what it couldn't,
 * and leave a note on anything a person should look at. Human-only items keep their tick; only the note changes.
 */
export async function applyChecks(actor: string, id: number, updates: CheckUpdate[]) {
  const [ep] = await db.select().from(episodes).where(eq(episodes.id, id));
  if (!ep) throw new Error("Episode not found");
  const stage = ep.stage;
  const total = getStage(stage).checklist.length;
  const human = HUMAN_CHECKS[stage as StageKey] ?? [];
  let map: Record<string, unknown> = {};
  try {
    map = JSON.parse(ep.checklist);
  } catch {}
  for (const u of updates) {
    const i = Number(u.item);
    if (!Number.isInteger(i) || i < 0 || i >= total) continue;
    const key = `${stage}:${i}`;
    if (!human.includes(i)) {
      if (u.done) {
        map[key] = true;
        map[`by:${key}`] = actor;
      } else {
        delete map[key];
        delete map[`by:${key}`];
      }
    }
    const note = String(u.note ?? "").trim();
    if (note) map[`note:${key}`] = note.slice(0, 600);
    else delete map[`note:${key}`];
  }
  await db.update(episodes).set({ checklist: JSON.stringify(map) }).where(eq(episodes.id, id));
}

export type SendBack = { stage: string; from: string; notes: string };

/** The current stage's proposal to send the episode back to an earlier stage, if any. */
export function parseSendBack(ep: Pick<Episode, "sendBack" | "stage">): SendBack | null {
  if (!ep.sendBack) return null;
  try {
    const p = JSON.parse(ep.sendBack) as SendBack;
    if (p.from !== ep.stage || !isStage(p.stage) || stageIndex(p.stage) >= stageIndex(ep.stage)) return null;
    return p;
  } catch {
    return null;
  }
}

/**
 * A skill proposes sending the episode back to an earlier stage with fixes (or clears its proposal with null).
 * Only an earlier stage is allowed. Nothing moves until a person presses "Send fixes to …".
 */
export async function setSendBack(id: number, proposal: { stage?: unknown; notes?: unknown } | null) {
  const [ep] = await db.select().from(episodes).where(eq(episodes.id, id));
  if (!ep) throw new Error("Episode not found");
  if (!proposal) {
    await db.update(episodes).set({ sendBack: "" }).where(eq(episodes.id, id));
    return null;
  }
  const stage = String(proposal.stage ?? "");
  const notes = String(proposal.notes ?? "").trim();
  if (!isStage(stage) || stageIndex(stage) >= stageIndex(ep.stage)) {
    throw new Error(`sendBack.stage must be an earlier stage than ${getStage(ep.stage).label}`);
  }
  if (!inFormat(getStage(stage), await formatOf(ep.seriesId))) {
    throw new Error(`sendBack.stage ${stage} isn't part of this series' pipeline`);
  }
  if (!notes) throw new Error("sendBack.notes is required: the exact fixes for that stage");
  const value: SendBack = { stage, from: ep.stage, notes: notes.slice(0, 8000) };
  await db.update(episodes).set({ sendBack: JSON.stringify(value) }).where(eq(episodes.id, id));
  return value;
}

/**
 * Accepts the current stage's send-back proposal: moves the episode back to that stage (several steps if
 * needed) and files the fixes there as a "request changes" note, so the next run of that stage applies them.
 */
export async function sendBack(actor: string, id: number) {
  const [ep] = await db.select().from(episodes).where(eq(episodes.id, id));
  if (!ep) throw new Error("Episode not found");
  const proposal = parseSendBack(ep);
  if (!proposal) throw new Error("No send-back proposal on this stage");
  const from = getStage(proposal.from).label;
  await updateEpisode(actor, id, { stage: proposal.stage }, { allowJump: true });
  const [{ top }] = await db
    .select({ top: max(revisions.version) })
    .from(revisions)
    .where(and(eq(revisions.episodeId, id), eq(revisions.stage, proposal.stage)));
  await db.insert(feedback).values({
    episodeId: id,
    stage: proposal.stage,
    version: top ?? null,
    body: `**From ${from}:** apply these fixes exactly. Change nothing else.\n\n${proposal.notes}`,
    author: actor,
  });
  await logActivity(actor, `sent ${ep.code} back from ${from} to ${getStage(proposal.stage).label} with fixes`, id);
}

/** The numbered facts in research notes ("- **F4.** Zepto: a packer…"), for picking which ones the script leans on. */
export function researchFacts(research: string) {
  const seen = new Set<string>();
  return [...research.matchAll(/^\s*[-*]\s+\*\*(F\d+)\.?\*\*\s*(.+)$/gm)]
    .filter((m) => !seen.has(m[1]) && seen.add(m[1]))
    .map((m) => ({
      id: m[1],
      text: m[2]
        .replace(/\s*\(\[[^\]]*\]\([^)]*\)\)/g, "")
        .replace(/\s*·\s*(Primary|Secondary|Reported).*$/, "")
        .trim(),
    }));
}

/** "Request changes" on the episode's current stage: Claude picks the note up on its next run. */
export async function requestChanges(actor: string, id: number, body: string) {
  const [ep] = await db.select().from(episodes).where(eq(episodes.id, id));
  if (!ep) throw new Error("Episode not found");
  const [{ top }] = await db
    .select({ top: max(revisions.version) })
    .from(revisions)
    .where(and(eq(revisions.episodeId, id), eq(revisions.stage, ep.stage)));
  await db.insert(feedback).values({ episodeId: id, stage: ep.stage, version: top ?? null, body, author: actor });
  await db.update(episodes).set({ readyForReview: false }).where(eq(episodes.id, id));
  const label = `${getStage(ep.stage).label}${top ? ` v${top}` : ""}`;
  await logActivity(actor, `requested changes on ${ep.code} ${label}`, id);
}

/** Every version and review note for an episode, oldest first. */
export async function getReviewHistory(episodeId: number) {
  const [revs, notes] = await Promise.all([
    db.select().from(revisions).where(eq(revisions.episodeId, episodeId)).orderBy(asc(revisions.id)),
    db.select().from(feedback).where(eq(feedback.episodeId, episodeId)).orderBy(asc(feedback.id)),
  ]);
  return { revisions: revs, feedback: notes };
}

/**
 * Stages whose latest version is older than a newer version of an earlier stage, mapped to that
 * earlier stage. E.g. the script changed after the storyboard was made → { storyboard: "script" }.
 */
export function staleStages(revs: Revision[]) {
  const latest = new Map<string, number>();
  for (const r of revs) latest.set(r.stage, Math.max(latest.get(r.stage) ?? 0, r.id));
  const stale: Record<string, string> = {};
  for (const [stage, id] of latest) {
    for (const [upstream, upId] of latest) {
      if (stageIndex(upstream) < stageIndex(stage) && upId > id) {
        if (!stale[stage] || stageIndex(upstream) < stageIndex(stale[stage])) stale[stage] = upstream;
      }
    }
  }
  return stale;
}

export async function findEpisode(idOrCode: string) {
  const byCode = /^\d+$/.test(idOrCode)
    ? eq(episodes.id, Number(idOrCode))
    : eq(episodes.code, idOrCode.toUpperCase());
  const [row] = await db.select().from(episodes).where(byCode);
  return row ?? null;
}

export async function listEpisodes(filters: { stage?: string; seriesId?: number; owner?: string } = {}) {
  const conditions = [];
  if (filters.stage) conditions.push(eq(episodes.stage, filters.stage));
  if (filters.seriesId) conditions.push(eq(episodes.seriesId, filters.seriesId));
  if (filters.owner) conditions.push(eq(episodes.owner, filters.owner));
  return db
    .select()
    .from(episodes)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(episodes.position, desc(episodes.updatedAt));
}
