import { createReadStream, statSync } from "node:fs";
import { extname } from "node:path";
import { Readable } from "node:stream";
import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { IS_WORKER, localMediaFile, MEDIA_TYPES, mediaUrl } from "@/lib/media";

/**
 * GET /media/out/his-003/final.mp4 — streams a file from the video project for the episode page's players
 * (on the Mac), or redirects to its uploaded copy (hosted).
 * Supports Range requests so video and audio can seek.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/media/[...path]">) {
  if (!(await getUser())) return new NextResponse("Unauthorized", { status: 401 });
  const path = (await ctx.params).path.join("/");
  const file = localMediaFile(path);
  if (!file) return new NextResponse("Not found", { status: 404 });
  // Hosted: the Mac uploaded the file to Blob; send the browser there so it streams and seeks from the CDN.
  if (!IS_WORKER) {
    const url = mediaUrl(path);
    return url ? NextResponse.redirect(url + request.nextUrl.search, { headers: { "Cache-Control": "private, no-store" } }) : new NextResponse("Not found", { status: 404 });
  }
  const type = MEDIA_TYPES[extname(path).toLowerCase()];

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
