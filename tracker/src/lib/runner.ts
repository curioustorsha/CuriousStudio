import "server-only";
import { execFileSync, spawn } from "node:child_process";
import { closeSync, existsSync, mkdirSync, openSync, readdirSync, readFileSync, renameSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import { and, asc, desc, eq, inArray, isNotNull, isNull, lt, ne, notInArray, sql } from "drizzle-orm";
import { db, episodes, notifications, runs, series, type Episode, type Run } from "@/db";
import { getStage } from "./stages";
import { API_ACTOR, getReviewHistory, logActivity, staleStages } from "./episodes";
import { IS_WORKER, PROJECT_DIR, publishMedia } from "./media";
import { elevenLabsUsage } from "./elevenlabs";
import { getSetting, setSetting, stageModel } from "./settings";
import { getSkill } from "./skills";

const RUNS_DIR = join(process.cwd(), ".runs");

/**
 * What a run may do: read, research, write and edit files (episode scenes, temp files), talk to the tracker
 * through the helper script, and run the video project's episode scripts (npm --prefix video run ep:…).
 * earshot (tools/earshot) listens to and measures audio. Real-sound sourcing may download recordings into
 * video/public/audio/assets/ only, cut them with earshot's ffmpeg, and run real-sound's licence scripts.
 */
const ALLOWED_TOOLS = [
  "Read",
  "Write",
  "Edit",
  "Glob",
  "Grep",
  "WebSearch",
  "WebFetch",
  "Skill",
  "Agent",
  "TodoWrite",
  "Bash(node tracker/scripts/episode.mjs *)",
  "Bash(npm --prefix video run *)",
  "Bash(python3 .claude/skills/yt-package/title.py *)",
  "Bash(tools/earshot/.venv/bin/python -m earshot *)",
  "Bash(mkdir -p video/public/audio/assets/*)",
  "Bash(curl -sSfL -o video/public/audio/assets/*)",
  "Bash(tools/earshot/.venv/bin/ffmpeg *)",
  "Bash(tools/earshot/.venv/bin/ffprobe *)",
  "Bash(tools/earshot/.venv/bin/python -I .claude/skills/real-sound/scripts/*)",
];

/**
 * The Claude Code binary. CLAUDE_BIN wins; otherwise a standalone install, otherwise the newest one
 * bundled with the VS Code extension (its folder name changes with every extension update).
 */
export function claudeBin(): string | null {
  if (process.env.CLAUDE_BIN && existsSync(process.env.CLAUDE_BIN)) return process.env.CLAUDE_BIN;
  for (const p of [join(homedir(), ".local/bin/claude"), "/opt/homebrew/bin/claude", "/usr/local/bin/claude"]) {
    if (existsSync(/*turbopackIgnore: true*/ p)) return p;
  }
  const extDir = join(homedir(), ".vscode/extensions");
  if (!existsSync(extDir)) return null;
  const bundled = readdirSync(extDir)
    .filter((d) => d.startsWith("anthropic.claude-code-"))
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
    .map((d) => join(extDir, d, "resources/native-binary/claude"))
    .find((p) => existsSync(p));
  return bundled ?? null;
}

const logPath = (id: number) => join(RUNS_DIR, `${id}.jsonl`);

const LIVE = ["queued", "running"];
const IDEA_FILL = "idea-fill";

export function runLabel(run: Pick<Run, "skill" | "stage">) {
  return run.skill === IDEA_FILL ? "Idea fill" : `${getStage(run.stage).label} skill`;
}

/** Joins the back of the queue, unless the episode already has a job waiting or running. Returns the run id. */
async function addToQueue(actor: string, ep: Episode, skill: string) {
  const active = await activeRun(ep.id);
  if (active) return active.id;
  const values = { episodeId: ep.id, stage: ep.stage, skill, startedBy: actor, status: "queued", queuedAt: sql`(datetime('now'))` };
  const [run] = await db.insert(runs).values(values).returning();
  await logActivity(actor, `queued ${runLabel(run)} on ${ep.code}`, ep.id);
  await pumpQueue();
  return run.id;
}

/** Queues the episode's current-stage skill. */
export async function enqueueRun(actor: string, episodeId: number) {
  const [ep] = await db.select().from(episodes).where(eq(episodes.id, episodeId));
  if (!ep) throw new Error("Episode not found");
  const stage = getStage(ep.stage);
  if (!stage.skill || !getSkill(stage.skill)) throw new Error(`${stage.label} has no skill`);
  return addToQueue(actor, ep, stage.skill);
}

export const enqueueIdeaFill = (actor: string, ep: Episode) => addToQueue(actor, ep, IDEA_FILL);

/**
 * Takes the oldest queued job, only if nothing is running. One statement, so concurrent calls can't both win
 * and SQLite can't start two jobs. The tracker's own pid marks the run alive until it has a process of its own.
 */
async function claimNext() {
  const [run] = await db
    .update(runs)
    .set({ status: "running", pid: process.pid, startedAt: sql`(datetime('now'))` })
    .where(
      and(
        eq(runs.id, sql`(select min(id) from runs where status = 'queued')`),
        sql`not exists (select 1 from runs where status = 'running')`,
      ),
    )
    .returning();
  return run;
}

/** Starts the next job if Claude is free. Safe to call any time, from anywhere. */
export async function pumpQueue() {
  if (!IS_WORKER) return;
  await reapStopped();
  const running = await db.select({ id: runs.id }).from(runs).where(eq(runs.status, "running"));
  for (const r of running) await syncRun(r.id);
  if (await queuePause()) return;
  for (let run = await claimNext(); run; run = await claimNext()) {
    try {
      if (await launch(run)) return;
    } catch (e) {
      await finish(run.id, "failed", (e as Error).message);
    }
  }
}

/** Starts a claimed job. False if it ended straight away, so the next one can go. */
async function launch(run: Run) {
  const [ep] = await db.select().from(episodes).where(eq(episodes.id, run.episodeId));
  if (!ep) return false;
  if (ep.stage !== run.stage) {
    await finish(run.id, "stopped", `Skipped: ${ep.code} had moved on from ${getStage(run.stage).label} by the time this came up.`);
    await logActivity(API_ACTOR, `skipped ${runLabel(run)} on ${ep.code}: the episode had moved on`, ep.id);
    return false;
  }
  const short = await voiceoverCreditsShort(ep);
  if (short) {
    await finish(run.id, "failed", short);
    await logActivity(API_ACTOR, `didn't start ${runLabel(run)} on ${ep.code}: not enough ElevenLabs credits`, ep.id);
    return false;
  }
  await logActivity(run.startedBy, `started ${runLabel(run)} on ${ep.code}`, ep.id);
  if (run.skill === IDEA_FILL) {
    const { runIdeaFill } = await import("./ideaFill"); // ideaFill imports this file
    void runIdeaFill(run.id, ep)
      .then(({ status, result }) => (status === "limit" ? holdForLimit(run, null) : finish(run.id, status, result)))
      .catch((e) => finish(run.id, "failed", (e as Error).message))
      .then(pumpQueue);
    return true;
  }
  const stage = getStage(ep.stage);
  if (!stage.skill || !getSkill(stage.skill)) throw new Error(`${stage.label} has no skill`);
  const episodeId = ep.id;

  const chosen = await stageModel(stage.key);
  await db.update(runs).set({ model: chosen?.model, effort: chosen?.effort }).where(eq(runs.id, run.id));
  const bin = claudeBin();
  if (!bin) {
    await finish(run.id, "failed", "Couldn't find Claude Code on this Mac. Install it, or set CLAUDE_BIN in tracker/.env.local.");
    return false;
  }

  mkdirSync(join(RUNS_DIR, String(run.id)), { recursive: true });
  // Say plainly why this run exists, so a re-run after an upstream change needs no comments from the reviewer.
  const history = await getReviewHistory(episodeId);
  const upstream = staleStages(history.revisions)[stage.key];
  const open = history.feedback.filter((f) => f.stage === stage.key && f.addressedIn === null);
  const openNotes = open.length;
  const pinnedScenes = [...new Set(open.map((f) => f.scene).filter(Boolean))];
  const allPinned = openNotes > 0 && open.every((f) => f.atSec !== null);
  const latest = history.revisions.filter((r) => r.stage === stage.key).at(-1);
  const why = [
    latest && upstream
      ? `${getStage(upstream).label} has changed since ${stage.label} v${latest.version}: redo this stage's work in full against the updated ${getStage(upstream).label} (don't reuse old verdicts or plans that depended on the old version).`
      : "",
    openNotes ? `There ${openNotes === 1 ? "is 1 open review note" : `are ${openNotes} open review notes`} for this stage: apply them.` : "",
    allPinned && !upstream
      ? `Every note is pinned to a moment in the render${pinnedScenes.length ? ` (scenes: ${pinnedScenes.join(", ")})` : ""}: this is a scene-scoped re-run. Follow "Pinned notes" in the make skill and leave every other scene alone.`
      : "",
    latest && !upstream && !openNotes ? `This is a re-run of ${stage.label} (v${latest.version} exists) with no new notes: check it again from the current inputs.` : "",
  ].filter(Boolean);
  const prompt = [
    `Use the ${stage.skill} skill for episode ${ep.code}.`,
    ...why,
    "You were started from the Curiously tracker UI and are running unattended: nobody can answer questions,",
    "so make sensible choices and explain anything you couldn't do in your final message.",
    `Save temporary files under tracker/.runs/${run.id}/.`,
    "Your final message is shown to the reviewer in the tracker: keep it short and use Markdown.",
  ].join(" ");
  const out = openSync(logPath(run.id), "a");
  const child = spawn(
    /*turbopackIgnore: true*/ bin,
    [
      "-p", prompt,
      "--output-format", "stream-json", "--verbose",
      ...(chosen ? ["--model", chosen.model, "--effort", chosen.effort] : []),
      "--allowedTools", ...ALLOWED_TOOLS,
    ],
    {
      cwd: PROJECT_DIR,
      detached: true, // survives a tracker restart; its own process group so Stop can end helpers too
      stdio: ["ignore", out, out],
      env: { ...process.env, PATH: `${dirname(process.execPath)}:${process.env.PATH ?? ""}` },
    },
  );
  closeSync(out);
  const ended = () => void syncRun(run.id).then(pumpQueue).catch((e) => console.error("Queue:", e));
  child.on("exit", ended);
  child.on("error", ended);
  child.unref();
  const [still] = await db
    .update(runs)
    .set({ pid: child.pid ?? null })
    .where(and(eq(runs.id, run.id), eq(runs.status, "running")))
    .returning();
  // Removed while it was launching: don't leave Claude working alongside the next job.
  if (!still && child.pid) process.kill(-child.pid, "SIGTERM");
  return true;
}

/** Stops a running job, or takes a waiting one out of the queue. */
export async function stopRun(actor: string, runId: number) {
  const [row] = await db
    .select({ run: runs, code: episodes.code })
    .from(runs)
    .innerJoin(episodes, eq(runs.episodeId, episodes.id))
    .where(eq(runs.id, runId));
  if (!row || !LIVE.includes(row.run.status)) return;
  const { run, code } = row;
  const wasRunning = run.status === "running";
  // shortcut: a running idea fill can't be stopped or it would overlap the next job; it ends within 2 minutes. Deleting the idea does free the slot early.
  if (wasRunning && run.skill === IDEA_FILL) return;
  await finish(runId, "stopped", `${wasRunning ? "Stopped" : "Removed from the queue"} by ${actor}.`);
  await logActivity(actor, `${wasRunning ? "stopped" : "removed from the queue:"} ${runLabel(run)} on ${code}`, run.episodeId);
  await pumpQueue();
}

async function finish(id: number, status: Run["status"], result: string) {
  const [ended] = await db
    .update(runs)
    .set({ status, result, finishedAt: sql`(datetime('now'))` })
    .where(and(eq(runs.id, id), inArray(runs.status, LIVE)))
    .returning();
  if (!ended) return;
  if (status !== "stopped") {
    const [ep] = await db.select({ code: episodes.code }).from(episodes).where(eq(episodes.id, ended.episodeId));
    if (ep) await logActivity(API_ACTOR, `${status === "done" ? "finished" : "failed"} ${runLabel(ended)} on ${ep.code}`, ended.episodeId);
  }
  await notifyStarter(ended);
  if (IS_WORKER && ended.skill !== IDEA_FILL) await publishMedia(ended.episodeId).catch((e) => console.error("Media upload:", e));
}

// ── Usage limits ──────────────────────────────────────────────────────

/** Words Claude Code uses when the plan's limit is reached, for runs whose log has no rate-limit status. */
export const LIMIT_TEXT = /usage limit|hit your limit|limit reached|rate limit/i;
const PAUSE_KEY = "queue:paused";
/** When Claude doesn't say when the limit resets, try again after this long. */
const RETRY_MINUTES = 30;

/** Why and until when the queue is paused, or null. Clears an expired pause. */
export async function queuePause(): Promise<{ until: string; reason: string } | null> {
  const raw = await getSetting(PAUSE_KEY);
  if (!raw) return null;
  let pause: { until: string; reason: string };
  try {
    pause = JSON.parse(raw);
  } catch {
    pause = { until: "", reason: "" };
  }
  if (pause.until > new Date().toISOString()) return pause;
  await setSetting(PAUSE_KEY, null);
  return null;
}

/**
 * A job stopped by the Claude usage limit: it goes back to the front of the queue (it keeps the oldest id) and
 * the queue waits until the limit resets, plus a minute. Its log is set aside so the retry starts clean.
 */
async function holdForLimit(run: Run, resetsAt: Date | null) {
  const [held] = await db
    .update(runs)
    .set({ status: "queued", pid: null, result: "", progress: "" })
    .where(and(eq(runs.id, run.id), eq(runs.status, "running")))
    .returning();
  if (!held) return;
  try {
    renameSync(logPath(run.id), join(RUNS_DIR, `${run.id}.limit-${Date.now()}.jsonl`));
  } catch {}
  const until = new Date((resetsAt?.getTime() ?? Date.now() + RETRY_MINUTES * 60_000) + 60_000).toISOString();
  await setSetting(PAUSE_KEY, JSON.stringify({ until, reason: "Claude usage limit reached" }));
  const [ep] = await db.select({ code: episodes.code }).from(episodes).where(eq(episodes.id, run.episodeId));
  await logActivity(API_ACTOR, `paused the queue at the Claude usage limit; ${runLabel(run)} on ${ep?.code ?? "?"} goes again first`, run.episodeId);
}

/** Lifts the pause now, for when the limit reset early or the plan changed. */
export async function resumeQueue(actor: string) {
  await setSetting(PAUSE_KEY, null);
  await logActivity(actor, "resumed the queue");
  await pumpQueue();
}

/** Voiceover takes about one ElevenLabs credit per character; listen-back retries need some spare. */
const CREDITS_PER_CHAR = 1.2;

/**
 * Why a Make run can't record its voiceover with the credits left, or null. Only checked when the next step is
 * the voiceover (video series, storyboard done, no voiceover yet), and skipped if ElevenLabs can't be reached.
 */
async function voiceoverCreditsShort(ep: Episode) {
  if (ep.stage !== "make" || !ep.storyboard.trim() || ep.voiceoverUrl.trim() || !ep.script.trim()) return null;
  const [s] = ep.seriesId ? await db.select({ format: series.format }).from(series).where(eq(series.id, ep.seriesId)) : [];
  if (s?.format === "carousel") return null;
  const usage = await elevenLabsUsage(1);
  if (!usage) return null;
  const need = Math.ceil(ep.script.length * CREDITS_PER_CHAR);
  const left = usage.limit - usage.used;
  if (left >= need) return null;
  const resets = usage.resetsAt.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  return `Not started: ElevenLabs has ${left.toLocaleString("en-US")} credits left and this voiceover needs about ${need.toLocaleString("en-US")}. Credits reset on ${resets}. Top up or wait, then press Run again.`;
}

/** Ends Claude for jobs stopped from either copy of the site. The pid is cleared so it's only tried once. */
async function reapStopped() {
  const stopped = await db
    .select({ id: runs.id, pid: runs.pid })
    .from(runs)
    .where(and(eq(runs.status, "stopped"), isNotNull(runs.pid), ne(runs.pid, process.pid)));
  for (const r of stopped) {
    // After a restart the pid may belong to something else now: only end it if it's still Claude Code.
    if (r.pid && alive(r.pid) && /claude/i.test(processCommand(r.pid))) {
      try {
        process.kill(-r.pid, "SIGTERM");
      } catch {}
    }
    await db.update(runs).set({ pid: null }).where(eq(runs.id, r.id));
  }
}

function processCommand(pid: number) {
  try {
    return execFileSync("ps", ["-o", "command=", "-p", String(pid)], { encoding: "utf8" });
  } catch {
    return "";
  }
}

/**
 * Tells whoever started the job how it went, once their last job of this kind has ended, so a batch of
 * 72 idea fills is one notification. Stopped jobs don't count: the person stopping them already knows.
 */
async function notifyStarter(ended: Run) {
  const mine = and(eq(runs.startedBy, ended.startedBy), eq(runs.skill, ended.skill));
  const [live] = await db.select({ id: runs.id }).from(runs).where(and(mine, inArray(runs.status, LIVE))).limit(1);
  if (live) return;
  const batch = await db
    .select({ run: runs, code: episodes.code })
    .from(runs)
    .innerJoin(episodes, eq(runs.episodeId, episodes.id))
    .where(and(mine, inArray(runs.status, ["done", "failed"]), eq(runs.notified, false)))
    .orderBy(asc(runs.id));
  if (!batch.length) return;
  const failed = batch.filter((b) => b.run.status === "failed").length;
  const [{ run, code }] = batch.slice(-1);
  const one = batch.length === 1;
  await db.insert(notifications).values({
    recipient: run.startedBy,
    actor: API_ACTOR,
    message: one
      ? `${runLabel(run)} ${failed ? "failed" : "finished"} on ${code}${failed ? `: ${run.result.slice(0, 200)}` : ""}`
      : `${runLabel(run)}: ${batch.length} jobs finished, ${batch.length - failed} done${failed ? `, ${failed} failed` : ""}`,
    href: one ? `/episodes/${run.episodeId}` : "/queue",
  });
  await db.update(runs).set({ notified: true }).where(inArray(runs.id, batch.map((b) => b.run.id)));
}

function alive(pid: number | null) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === "EPERM";
  }
}

/** Brings a running run's status up to date from its log: finished, failed, or still going. */
export async function syncRun(id: number) {
  const [run] = await db.select().from(runs).where(eq(runs.id, id));
  if (!IS_WORKER || !run || run.status !== "running") return run;
  const { result, errors, steps, skillsUsed, limit } = readLog(id);
  const progress = JSON.stringify({ steps, skillsUsed });
  if (run.skill !== IDEA_FILL && progress !== run.progress) await db.update(runs).set({ progress }).where(eq(runs.id, id));
  if (result && !result.ok && limit) {
    await holdForLimit(run, limit.resetsAt);
  } else if (result) {
    await finish(id, result.ok ? "done" : "failed", result.text || (result.ok ? "Done." : "The run failed."));
  } else if (!alive(run.pid)) {
    await finish(id, "failed", errors.at(-1) ?? "The run stopped before finishing.");
  }
  await saveUsage(id);
  const [fresh] = await db.select().from(runs).where(eq(runs.id, id));
  return fresh;
}

/**
 * Copies a finished run's cost, tokens and billing from its log onto the run, once (billing marks it done).
 * Runs that ended without a result line (stopped, crashed) keep their cost empty: Claude Code only reports
 * the total at the end.
 */
async function saveUsage(id: number) {
  const [run] = await db.select().from(runs).where(eq(runs.id, id));
  if (!IS_WORKER || !run || LIVE.includes(run.status) || run.billing) return;
  const { result, usage } = readLog(id);
  await db
    .update(runs)
    .set({
      billing: usage.billing,
      model: run.model ?? usage.mainModel,
      costUsd: result?.costUsd ?? null,
      durationSec: result?.seconds ?? null,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cacheReadTokens: usage.cacheReadTokens,
      cacheWriteTokens: usage.cacheWriteTokens,
    })
    .where(eq(runs.id, id));
}

/** Fills in usage for finished runs from before usage was saved (and any the tracker missed while it was down). */
export async function backfillUsage() {
  const rows = await db
    .select({ id: runs.id })
    .from(runs)
    .where(and(isNull(runs.billing), notInArray(runs.status, LIVE)));
  for (const r of rows) await saveUsage(r.id);
}

/** The episode's job that's running or waiting in the queue. */
export async function activeRun(episodeId: number) {
  const [run] = await db
    .select()
    .from(runs)
    .where(and(eq(runs.episodeId, episodeId), inArray(runs.status, LIVE)))
    .orderBy(desc(runs.id))
    .limit(1);
  if (!run) return null;
  const fresh = await syncRun(run.id);
  return fresh && LIVE.includes(fresh.status) ? fresh : null;
}

/** How many jobs are ahead of this one, the running one included. */
export async function jobsAhead(runId: number) {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(runs)
    .where(and(inArray(runs.status, LIVE), lt(runs.id, runId)));
  return row.n;
}

export async function liveJobCount() {
  const [row] = await db.select({ n: sql<number>`count(*)` }).from(runs).where(inArray(runs.status, LIVE));
  return row.n;
}

export async function loadQueue() {
  const select = () =>
    db
      .select({ run: runs, code: episodes.code, title: episodes.title })
      .from(runs)
      .innerJoin(episodes, eq(runs.episodeId, episodes.id));
  const [live, recent] = await Promise.all([
    select().where(inArray(runs.status, LIVE)).orderBy(asc(runs.id)),
    select().where(notInArray(runs.status, LIVE)).orderBy(desc(runs.id)).limit(10),
  ]);
  return { live, recent };
}

/** Latest run of an episode's stage, with its status synced. */
export async function latestRun(episodeId: number, stage: string) {
  const [run] = await db
    .select()
    .from(runs)
    .where(and(eq(runs.episodeId, episodeId), eq(runs.stage, stage)))
    .orderBy(desc(runs.id))
    .limit(1);
  return run ? syncRun(run.id) : null;
}

export async function recentRuns(skill: string, limit = 15) {
  const rows = await db
    .select({ run: runs, code: episodes.code, title: episodes.title })
    .from(runs)
    .innerJoin(episodes, eq(runs.episodeId, episodes.id))
    .where(eq(runs.skill, skill))
    .orderBy(desc(runs.id))
    .limit(limit);
  return Promise.all(rows.map(async (r) => ({ ...r, run: (await syncRun(r.run.id)) ?? r.run })));
}

/** What a run did, as last copied from its log by the worker. */
export function runProgress(run: Run): { steps: RunStep[]; skillsUsed: string[] } {
  try {
    return JSON.parse(run.progress);
  } catch {
    return { steps: [], skillsUsed: [] };
  }
}

/** Copies progress from the logs of runs that ended before progress was kept in the database. Worker only. */
export async function backfillProgress() {
  const rows = await db.select({ id: runs.id }).from(runs).where(and(eq(runs.progress, ""), ne(runs.skill, IDEA_FILL), notInArray(runs.status, LIVE)));
  for (const r of rows) {
    const { steps, skillsUsed } = readLog(r.id);
    await db.update(runs).set({ progress: JSON.stringify({ steps, skillsUsed }) }).where(eq(runs.id, r.id));
  }
}

export type RunStep = { kind: "search" | "read" | "tool" | "submit" | "note"; text: string };

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Turns Claude Code's stream-json log into readable progress steps and the final result. */
export function readLog(id: number) {
  const steps: RunStep[] = [];
  const errors: string[] = [];
  let result: { ok: boolean; text: string; costUsd?: number; seconds?: number } | null = null;
  const usage = {
    billing: "subscription" as "subscription" | "api-key",
    mainModel: null as string | null,
    inputTokens: null as number | null,
    outputTokens: null as number | null,
    cacheReadTokens: null as number | null,
    cacheWriteTokens: null as number | null,
  };
  // Skills the run loaded (Skill tool) or opened (read a file in .claude/skills/<name>/), in order of first use.
  const skillsUsed: string[] = [];
  // Claude Code reports the plan's usage window as it goes; "rejected" means the limit was hit.
  type RateLimit = { status?: string; resetsAt?: number };
  let rateLimit: RateLimit | null = null;
  const used = (name: string | undefined) => name && !skillsUsed.includes(name) && skillsUsed.push(name);
  let raw = "";
  try {
    raw = readFileSync(logPath(id), "utf8");
  } catch {}
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(line);
    } catch {
      errors.push(clip(line.trim(), 300));
      continue;
    }
    if (msg.type === "system" && msg.subtype === "init") {
      // "none" means Claude Code signed in with the subscription; anything else is an API key.
      if (msg.apiKeySource && msg.apiKeySource !== "none") usage.billing = "api-key";
      continue;
    }
    if (msg.type === "rate_limit_event") {
      rateLimit = (msg.rate_limit_info ?? null) as RateLimit | null;
      continue;
    }
    if (msg.type === "result") {
      const u = (msg.usage ?? {}) as Record<string, number>;
      usage.inputTokens = u.input_tokens ?? null;
      usage.outputTokens = u.output_tokens ?? null;
      usage.cacheReadTokens = u.cache_read_input_tokens ?? null;
      usage.cacheWriteTokens = u.cache_creation_input_tokens ?? null;
      const byModel = Object.entries((msg.modelUsage ?? {}) as Record<string, { costUSD?: number }>);
      usage.mainModel = byModel.sort((a, b) => (b[1].costUSD ?? 0) - (a[1].costUSD ?? 0))[0]?.[0] ?? null;
      result = {
        ok: msg.subtype === "success" && !msg.is_error,
        text: String(msg.result ?? ""),
        costUsd: typeof msg.total_cost_usd === "number" ? msg.total_cost_usd : undefined,
        seconds: typeof msg.duration_ms === "number" ? Math.round(msg.duration_ms / 1000) : undefined,
      };
      continue;
    }
    if (msg.type !== "assistant") continue;
    const content = (msg.message as { content?: unknown[] })?.content ?? [];
    for (const block of content as Record<string, unknown>[]) {
      if (block.type === "text" && String(block.text).trim()) {
        steps.push({ kind: "note", text: clip(String(block.text).trim(), 280) });
      } else if (block.type === "tool_use") {
        const input = (block.input ?? {}) as Record<string, string>;
        const name = String(block.name);
        if (name === "Skill") used(input.skill);
        if (name === "Read") used((input.file_path ?? "").match(/\/\.claude\/skills\/([^/]+)\//)?.[1]);
        if (name === "WebSearch") steps.push({ kind: "search", text: `Searched “${input.query}”` });
        else if (name === "WebFetch") steps.push({ kind: "read", text: `Read ${clip(input.url ?? "", 90)}` });
        else if (name === "Bash" && /episode\.mjs submit/.test(input.command ?? ""))
          steps.push({ kind: "submit", text: "Submitted the new version to the tracker" });
        else if (name === "Bash" && /episode\.mjs get/.test(input.command ?? ""))
          steps.push({ kind: "tool", text: "Loaded the episode from the tracker" });
        else if (name === "Skill") steps.push({ kind: "tool", text: `Using the ${input.skill} skill` });
        else if (name === "Agent") steps.push({ kind: "tool", text: `Started a helper: ${input.description ?? "subtask"}` });
        else if (name === "Write") steps.push({ kind: "tool", text: `Wrote ${basename(input.file_path ?? "")}` });
        else if (name === "Bash") steps.push({ kind: "tool", text: `Ran ${clip(input.command ?? "", 80)}` });
      }
    }
  }
  const limitHit = rateLimit?.status === "rejected" || (result !== null && !result.ok && LIMIT_TEXT.test(result.text));
  const limit = limitHit ? { resetsAt: rateLimit?.resetsAt ? new Date(rateLimit.resetsAt * 1000) : null } : null;
  return { steps, result, errors, usage, skillsUsed, limit };
}
