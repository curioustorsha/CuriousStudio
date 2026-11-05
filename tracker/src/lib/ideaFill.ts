import "server-only";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";
import { db, episodes, runs, series as seriesTable, type Episode, type Series } from "@/db";
import { API_ACTOR, updateEpisode } from "./episodes";
import { emptyIdeaFields, IDEA_FILL_FIELDS, type IdeaFillField } from "./ideaFields";
import { claudeBin } from "./runner";

const MODEL = "claude-haiku-5-5";
const EFFORT = "medium";
const USD_PER_TOKEN = { input: 0.1 / 1e6, output: 0.5 / 1e6 };
const MAX_USD_PER_IDEA = "0.25";
const TIMEOUT_MS = 120_000;
/** Enough for a selection to finish quickly without hitting rate limits. */
const AT_ONCE = 3;
/** More than the whole backlog today: a guard against a runaway selection, not a working limit. */
export const MAX_SELECTED = 100;

const SYSTEM = `You fill in the empty fields of a content idea for Curiously, a channel of short explainer videos and carousels.
Write in plain, specific language, following the series playbook.
Research happens later and checks every fact, so never state a statistic, date, number, quote or claim about a company unless the idea already contains it. Describe what to find out instead.
Use only what you are given. Return only the requested fields.`;

type Result = { values: Record<string, unknown>; costUsd: number | null; inputTokens: number; outputTokens: number; billing: "api-key" | "subscription" };

function schemaFor(fields: IdeaFillField[]) {
  return {
    type: "object",
    properties: Object.fromEntries(fields.map((f) => [f, { type: "string", description: IDEA_FILL_FIELDS[f].brief }])),
    required: fields,
    additionalProperties: false,
  };
}

function promptFor(ep: Episode, s: Series | undefined, fields: IdeaFillField[]) {
  const known = Object.fromEntries(
    (Object.keys(IDEA_FILL_FIELDS) as IdeaFillField[]).filter((f) => !fields.includes(f)).map((f) => [IDEA_FILL_FIELDS[f].label, ep[f]]),
  );
  return [
    `Series: ${s?.name ?? "none"}`,
    s?.visualStyle && `Visual style: ${s.visualStyle}`,
    s?.formatNotes && `Series playbook:\n${s.formatNotes}`,
    `Idea title: ${ep.title}`,
    `What the idea already says:\n${JSON.stringify(known, null, 2)}`,
    `Fill in these fields:\n${fields.map((f) => `- ${f}: ${IDEA_FILL_FIELDS[f].brief}`).join("\n")}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** One direct API call, used when an API key is set. The cheapest way to do this. */
async function callApi(prompt: string, fields: IdeaFillField[]): Promise<Result> {
  const message = await new Anthropic().messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
    output_config: { effort: EFFORT, format: { type: "json_schema", schema: schemaFor(fields) } },
  });
  if (message.stop_reason === "refusal") throw new Error("the model declined this idea");
  if (message.stop_reason === "max_tokens") throw new Error("the answer was cut off");
  const text = message.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  const { input_tokens: inputTokens, output_tokens: outputTokens } = message.usage;
  return {
    values: JSON.parse(text),
    costUsd: inputTokens * USD_PER_TOKEN.input + outputTokens * USD_PER_TOKEN.output,
    inputTokens,
    outputTokens,
    billing: "api-key",
  };
}

/** Without a key: Claude Code on the subscription, with no tools, project files, settings or saved session. */
function callClaudeCode(prompt: string, fields: IdeaFillField[]): Promise<Result> {
  const bin = claudeBin();
  if (!bin) throw new Error("Claude Code isn't installed on this Mac. Add an API key on the AI Usage page instead.");
  const args = [
    "-p", prompt,
    "--model", MODEL,
    "--effort", EFFORT,
    "--system-prompt", SYSTEM,
    "--json-schema", JSON.stringify(schemaFor(fields)),
    "--output-format", "json",
    "--tools", "",
    "--setting-sources", "",
    "--strict-mcp-config",
    "--disable-slash-commands",
    "--no-session-persistence",
    "--max-budget-usd", MAX_USD_PER_IDEA,
  ];
  return new Promise((resolve, reject) => {
    const child = execFile(bin, args, { cwd: tmpdir(), timeout: TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 }, (error, stdout) => {
      let out;
      try {
        out = JSON.parse(stdout);
      } catch {
        return reject(new Error(error?.killed ? "it took too long" : "Claude Code didn't return an answer"));
      }
      if (out.is_error || !out.structured_output) return reject(new Error("Claude Code couldn't finish. Your plan's usage limit may have been reached."));
      resolve({
        values: out.structured_output,
        costUsd: out.total_cost_usd ?? null,
        inputTokens: out.usage?.input_tokens ?? 0,
        outputTokens: out.usage?.output_tokens ?? 0,
        billing: "subscription",
      });
    });
    child.stdin?.end(); // It waits for input on an open pipe.
  });
}

function reason(e: unknown) {
  if (e instanceof Anthropic.AuthenticationError) return "the API key was rejected";
  if (e instanceof Anthropic.RateLimitError) return "rate limited, try again in a minute";
  if (e instanceof Anthropic.APIConnectionError) return "couldn't reach the API";
  if (e instanceof Anthropic.APIError) return `the API returned an error (${e.status})`;
  if (e instanceof SyntaxError) return "the answer wasn't valid";
  return e instanceof Error ? e.message : "something went wrong";
}

/** Fills one idea's empty fields. Returns how many it filled, or why it couldn't. */
async function fillIdea(actor: string, id: number): Promise<{ code: string; filled: number; error?: string }> {
  const [ep] = await db.select().from(episodes).where(eq(episodes.id, id));
  if (!ep) return { code: `#${id}`, filled: 0, error: "not found" };
  if (ep.stage !== "idea") return { code: ep.code, filled: 0 }; // Changing an idea now would mark later stages out of date.
  const fields = emptyIdeaFields(ep);
  if (!fields.length) return { code: ep.code, filled: 0 };

  const [s] = ep.seriesId ? await db.select().from(seriesTable).where(eq(seriesTable.id, ep.seriesId)) : [];
  const started = Date.now();
  const log = (values: Partial<typeof runs.$inferInsert> & { status: string; result: string; billing: string }) =>
    db.insert(runs).values({
      episodeId: id, stage: "idea", skill: "idea-fill", model: MODEL, effort: EFFORT, startedBy: actor,
      durationSec: Math.round((Date.now() - started) / 1000), finishedAt: new Date().toISOString(), ...values,
    });
  const billing = process.env.ANTHROPIC_API_KEY ? "api-key" : "subscription";
  try {
    const prompt = promptFor(ep, s, fields);
    const r = await (billing === "api-key" ? callApi : callClaudeCode)(prompt, fields);
    // Someone may have typed into a field while this ran: only write to what's still empty.
    const [now] = await db.select().from(episodes).where(eq(episodes.id, id));
    if (!now) return { code: ep.code, filled: 0, error: "deleted while filling" };
    const patch = Object.fromEntries(
      emptyIdeaFields(now).flatMap((f) => {
        const value = r.values[f];
        return fields.includes(f) && typeof value === "string" && value.trim() ? [[f, value.trim()]] : [];
      }),
    );
    if (Object.keys(patch).length) await updateEpisode(API_ACTOR, id, patch);
    const filled = Object.keys(patch).length;
    await log({ status: "done", result: `Filled ${filled} idea fields.`, billing: r.billing, costUsd: r.costUsd, inputTokens: r.inputTokens, outputTokens: r.outputTokens });
    return { code: ep.code, filled };
  } catch (e) {
    const error = reason(e);
    await log({ status: "failed", result: error, billing });
    return { code: ep.code, filled: 0, error };
  }
}

export async function fillIdeas(actor: string, ids: number[]) {
  const queue = [...ids];
  const results: Awaited<ReturnType<typeof fillIdea>>[] = [];
  await Promise.all(
    Array.from({ length: Math.min(AT_ONCE, queue.length) }, async () => {
      for (let id = queue.shift(); id !== undefined; id = queue.shift()) results.push(await fillIdea(actor, id));
    }),
  );
  return results;
}
