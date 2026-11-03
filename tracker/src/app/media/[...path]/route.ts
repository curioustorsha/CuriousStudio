import { createReadStream, statSync } from "node:fs";
import { extname, join, resolve, sep } from "node:path";
import { Readable } from "node:stream";
import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { PROJECT_DIR } from "@/lib/skills";

/** Only these folders of the video project are served: renders and stills, and generated audio. */
const ROOTS: Record<string, string> = {
  out: join(PROJECT_DIR, "video", "out"),
  public: join(PROJECT_DIR, "video", "public"),
};

const TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".json": "application/json",
};

/**
 * GET /media/out/his-003/final.mp4 — streams a file from the video project for the episode page's players.
 * Supports Range requests so video and audio can seek.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/media/[...path]">) {
  if (!(await getUser())) return new NextResponse("Unauthorized", { status: 401 });
  const [rootKey, ...rest] = (await ctx.params).path;
  const root = ROOTS[rootKey];
  const type = TYPES[extname(rest.at(-1) ?? "").toLowerCase()];
  if (!root || !type || !rest.length) return new NextResponse("Not found", { status: 404 });
  const file = resolve(root, ...rest);
  if (!file.startsWith(root + sep)) return new NextResponse("Not found", { status: 404 });

  let size: number;
  try {
    size = statSync(file).size;
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
  const headers: Record<string, string> = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": "no-store" };
  const range = request.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start >= size || start > end) {
      return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    const body = Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream;
    return new NextResponse(body, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }
  const body = Readable.toWeb(createReadStream(file)) as ReadableStream;
  return new NextResponse(body, { headers: { ...headers, "Content-Length": String(size) } });
}
