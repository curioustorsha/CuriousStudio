import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, series } from "@/db";
import { checkApiToken } from "@/lib/auth";
import {
  API_ACTOR,
  applyChecks,
  findEpisode,
  getReviewHistory,
  parsePatch,
  parseSendBack,
  setSendBack,
  staleStages,
  updateEpisode,
  type CheckUpdate,
} from "@/lib/episodes";
import { checklistItems, isFormat, makeSteps, stagesFor } from "@/lib/stages";

/**
 * GET /api/episodes/HIS-001 (or numeric id) — full episode, plus what a stage skill needs:
 * the series format notes, open review feedback, the latest version of each stage, and stale stages.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/episodes/[code]">) {
  if (!checkApiToken(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ep = await findEpisode((await ctx.params).code);
  if (!ep) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [s] = ep.seriesId ? await db.select().from(series).where(eq(series.id, ep.seriesId)) : [];
  const history = await getReviewHistory(ep.id);
  const versions: Record<string, number> = {};
  for (const r of history.revisions) versions[r.stage] = r.version;
  return NextResponse.json({
    ...ep,
    series: s
      ? {
          id: s.id,
          name: s.name,
          prefix: s.prefix,
          description: s.description,
          formatNotes: s.formatNotes,
          cadenceDays: s.cadenceDays,
          // "video" or "carousel": what the Make stage builds. visualStyle names the section of the skill's
          // "Visual styles" to follow ("isometric", "flat-metaphor", "carousel-editorial"; "" = none set).
          format: s.format,
          visualStyle: s.visualStyle,
        }
      : null,
    // The stages this episode goes through, in order (the same for every series; Make differs by format).
    pipeline: stagesFor(isFormat(s?.format) ? s.format : "video").map((st) => st.key),
    // Make's sub-steps for this format, each done once its output field is filled in.
    makeSteps: makeSteps(isFormat(s?.format) ? s.format : "video", ep),
    review: {
      versions,
      openFeedback: history.feedback
        .filter((f) => f.addressedIn === null)
        .map(({ stage, version, body, author, createdAt }) => ({ stage, version, body, author, createdAt })),
      stale: staleStages(history.revisions),
      // The current stage's checklist. Submit `checks` to tick items and leave notes.
      checklist: checklistItems(ep.stage, ep.checklist),
      // This stage's open proposal to send the episode back with fixes. Submit `sendBack` to set or clear it.
      sendBack: parseSendBack(ep),
    },
  });
}

/**
 * PATCH /api/episodes/HIS-001 { research: "…", readyForReview: true } — update fields.
 * Optional `checks: [{ item: 0, done: true, note: "…" }]` updates the current stage's checklist.
 * Optional `sendBack: { stage: "script", notes: "…" }` proposes sending it back to an earlier stage with fixes
 * (a person accepts it in the app); `sendBack: null` clears the proposal.
 * Stage changes are refused: only a person moves an episode between stages, from the app.
 */
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/episodes/[code]">) {
  if (!checkApiToken(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ep = await findEpisode((await ctx.params).code);
  if (!ep) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "JSON body required" }, { status: 400 });
  if ("stage" in body && body.stage !== ep.stage) {
    return NextResponse.json(
      { error: "Stage changes need a person. Set readyForReview: true and move it in the app." },
      { status: 403 },
    );
  }
  const patch = parsePatch(body);
  delete patch.stage;
  let updated = await updateEpisode(API_ACTOR, ep.id, patch);
  if ("sendBack" in body) {
    try {
      await setSendBack(ep.id, body.sendBack && typeof body.sendBack === "object" ? body.sendBack : null);
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
    updated = (await findEpisode(String(ep.id))) ?? updated;
  }
  if (Array.isArray(body.checks)) {
    await applyChecks(API_ACTOR, ep.id, body.checks as CheckUpdate[]);
    updated = (await findEpisode(String(ep.id))) ?? updated;
  }
  revalidatePath("/", "layout");
  return NextResponse.json(updated);
}
