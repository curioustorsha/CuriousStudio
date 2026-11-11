import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { checkApiToken } from "@/lib/auth";
import { API_ACTOR, createEpisode, listEpisodes } from "@/lib/episodes";

/** GET /api/episodes?stage=script&series=1 — list episodes (for Claude Code / scripts). */
export async function GET(request: NextRequest) {
  if (!checkApiToken(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const q = request.nextUrl.searchParams;
  const items = await listEpisodes({
    stage: q.get("stage") ?? undefined,
    seriesId: Number(q.get("series")) || undefined,
    owner: q.get("owner") ?? undefined,
  });
  return NextResponse.json(items);
}

/** POST /api/episodes { title, seriesId?, hook?, summary?, … } — create an idea. Always lands in Idea. */
export async function POST(request: NextRequest) {
  if (!checkApiToken(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "JSON body required" }, { status: 400 });
  const created = await createEpisode(API_ACTOR, { ...body, stage: "idea" });
  revalidatePath("/", "layout");
  return NextResponse.json(created, { status: 201 });
}
