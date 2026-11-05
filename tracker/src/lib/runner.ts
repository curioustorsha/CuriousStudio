import "server-only";
import { spawn } from "node:child_process";
import { closeSync, existsSync, mkdirSync, openSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import { and, desc, eq, isNull, ne, sql } from "drizzle-orm";
import { db, episodes, runs, type Run } from "@/db";
import { getStage } from "./stages";
import { getReviewHistory, logActivity, staleStages } from "./episodes";
import { stageModel } from "./settings";
import { getSkill, PROJECT_DIR } from "./skills";

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
    if (existsSync(p)) return p;
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

/**
 * Skills that may only run on one episode at a time. Animation renders with Remotion, which bundles every
 * episode: another episode's half-written scenes could break the render, and two renders fight for the CPU.
 */
export const EXCLUSIVE_SKILLS = ["make"];

/** If this skill is exclusive and already running on another episode, that run (with its episode code). */
export async function busyElsewhere(skill: string | null, episodeId: number) {
  if (!skill || !EXCLUSIVE_SKILLS.includes(skill)) return null;
  const rows = await db
    .select({ run: runs, code: episodes.code })
    .from(runs)
    .innerJoin(episodes, eq(runs.episodeId, episodes.id))
    .where(and(eq(runs.skill, skill), eq(runs.status, "running")));
  for (const r of rows) {
    if (r.run.episodeId === episodeId) continue;
    const fresh = await syncRun(r.run.id);
    if (fresh?.status === "running") return { code: r.code, episodeId: r.run.episodeId, runId: r.run.id };
  }
  return null;
}

/** Starts the episode's current-stage skill in the background. Returns the run id, or null if it has to wait. */
export async function startRun(actor: string, episodeId: number) {
  const [ep] = await db.select().from(episodes).where(eq(episodes.id, episodeId));
  if (!ep) throw new Error("Episode not found");
  const stage = getStage(ep.stage);
  if (!stage.skill || !getSkill(stage.skill)) throw new Error(`${stage.label} has no skill`);
  const active = await activeRun(episodeId);
  if (active) return active.id;
  if (await busyElsewhere(stage.skill, episodeId)) return null;

  const chosen = await stageModel(stage.key);
  const [run] = await db
    .insert(runs)
    .values({ episodeId, stage: stage.key, skill: stage.skill, startedBy: actor, model: chosen?.model, effort: chosen?.effort })
    .returning();
  const bin = claudeBin();
  if (!bin) {
    await finish(run.id, "failed", "Couldn't find Claude Code on this Mac. Install it, or set CLAUDE_BIN in tracker/.env.local.");
    return run.id;
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
    bin,
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
  child.on("exit", () => void syncRun(run.id));
  child.unref();
  await db.update(runs).set({ pid: child.pid ?? null }).where(eq(runs.id, run.id));
  await logActivity(actor, `started ${stage.label} skill on ${ep.code}`, episodeId);
  return run.id;
}

export async function stopRun(actor: string, runId: number) {
  const [run] = await db.select().from(runs).where(eq(runs.id, runId));
  if (!run || run.status !== "running") return;
  if (run.pid) {
    try {
      process.kill(-run.pid, "SIGTERM");
    } catch {}
  }
  await finish(runId, "stopped", `Stopped by ${actor}.`);
}

async function finish(id: number, status: Run["status"], result: string) {
  await db
    .update(runs)
    .set({ status, result, finishedAt: sql`(datetime('now'))` })
    .where(and(eq(runs.id, id), eq(runs.status, "running")));
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
  if (!run || run.status !== "running") return run;
  const { result, errors } = readLog(id);
  if (result) {
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
  if (!run || run.status === "running" || run.billing) return;
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
    .where(and(isNull(runs.billing), ne(runs.status, "running")));
  for (const r of rows) await saveUsage(r.id);
}

export async function activeRun(episodeId: number) {
  const [run] = await db
    .select()
    .from(runs)
    .where(and(eq(runs.episodeId, episodeId), eq(runs.status, "running")))
    .orderBy(desc(runs.id))
    .limit(1);
  if (!run) return null;
  const fresh = await syncRun(run.id);
  return fresh?.status === "running" ? fresh : null;
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
  return { steps, result, errors, usage, skillsUsed };
}
