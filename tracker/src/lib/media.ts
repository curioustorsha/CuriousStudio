import "server-only";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve, sep } from "node:path";
import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { db, episodes } from "@/db";
import { getSetting, setSetting } from "./settings";

/**
 * Hosted on Vercel, the site only reads and writes the database. The tracker on the Mac is the worker: it runs
 * the queue, starts Claude, watches the logs and uploads what the episode page shows.
 */
export const IS_WORKER = !process.env.VERCEL;

/** Claude Code skills and the video project live in the Curiously folder, one level above the tracker. */
export const PROJECT_DIR = join(process.cwd(), "..");

/** /media/<root>/… paths: renders and stills, and generated audio, in the video project. */
export const MEDIA_ROOTS: Record<string, string> = {
  out: join(PROJECT_DIR, "video", "out"),
  public: join(PROJECT_DIR, "video", "public"),
};

export const MEDIA_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".json": "application/json",
};

/** Files the episode page looks for in out/<code>/ besides the ones its fields link to. */
const PAGE_FILES = ["cover.png", "final.mp4", "frames/sheet.jpg"];

/**
 * Public Blob store URL plus a long random folder, e.g. https://abc.public.blob.vercel-storage.com/m-3f9…
 * The folder name is the secret: the site only hands these links to people who are signed in.
 */
const BASE = process.env.MEDIA_BASE_URL?.replace(/\/$/, "") ?? "";
const FOLDER = BASE ? new URL(BASE).pathname.slice(1) : "";

/** Where a /media path (without "/media/") is served from on the hosted site. */
export function mediaUrl(path: string) {
  return BASE ? `${BASE}/${path}` : null;
}

/** The local file for a media path like "out/his-003/final.mp4", or null if it's outside the media folders. */
export function localMediaFile(path: string) {
  const [rootKey, ...rest] = path.split("/");
  const root = MEDIA_ROOTS[rootKey];
  if (!root || !rest.length || !MEDIA_TYPES[extname(path).toLowerCase()]) return null;
  const file = resolve(root, ...rest);
  return file.startsWith(root + sep) ? file : null;
}

const manifestPath = (code: string) => `src/episodes/${code.toLowerCase()}/manifest.json`;
const uploadedKey = (code: string) => `media:${code.toLowerCase()}`;

/** Media paths uploaded for an episode, with the local file's version when it went up. */
async function uploaded(code: string): Promise<Record<string, string>> {
  try {
    return JSON.parse((await getSetting(uploadedKey(code))) ?? "{}");
  } catch {
    return {};
  }
}

/** Whether out/<code>/<name> exists: on disk on the Mac, uploaded on the hosted site. */
export async function hasOutFile(code: string, name: string) {
  const path = `out/${code.toLowerCase()}/${name}`;
  if (IS_WORKER) return existsSync(/*turbopackIgnore: true*/ localMediaFile(path) ?? "");
  return path in (await uploaded(code));
}

/** The episode's voiceover manifest (scene timings), from disk on the Mac or from Blob on the hosted site. */
export async function readManifest(code: string): Promise<unknown> {
  if (IS_WORKER) return JSON.parse(readFileSync(join(PROJECT_DIR, "video", manifestPath(code)), "utf8"));
  const url = manifestPath(code) in (await uploaded(code)) ? mediaUrl(manifestPath(code)) : null;
  if (!url) throw new Error("No manifest");
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("No manifest");
  return res.json();
}

/**
 * Uploads what the episode page shows (the files its fields link to, the cover, render, contact sheet and
 * scene timings) to Blob, skipping files that haven't changed since the last upload. Worker only; does
 * nothing until MEDIA_BASE_URL and BLOB_READ_WRITE_TOKEN are set.
 */
export async function publishMedia(episodeId: number) {
  if (!IS_WORKER || !FOLDER || !process.env.BLOB_READ_WRITE_TOKEN) return;
  const [ep] = await db.select().from(episodes).where(eq(episodes.id, episodeId));
  if (!ep) return;
  const code = ep.code.toLowerCase();
  const linked = [ep.voiceoverUrl, ep.renderUrl, ...ep.slides.split("\n")]
    .map((u) => u.trim().split("?")[0])
    .filter((u) => u.startsWith("/media/"))
    .map((u) => u.slice("/media/".length));
  const files = new Map<string, string>(); // media path → local file
  for (const path of [...linked, ...PAGE_FILES.map((n) => `out/${code}/${n}`)]) {
    const file = localMediaFile(path);
    if (file && existsSync(/*turbopackIgnore: true*/ file)) files.set(path, file);
  }
  const manifest = join(PROJECT_DIR, "video", manifestPath(code));
  if (existsSync(manifest)) files.set(manifestPath(code), manifest);

  const done = await uploaded(code);
  for (const [path, file] of files) {
    const { mtimeMs, size } = statSync(file);
    const version = `${Math.round(mtimeMs)}:${size}`;
    if (done[path] === version) continue;
    await put(`${FOLDER}/${path}`, readFileSync(file), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60, // a re-render keeps its name, so don't let browsers hold the old one for long
      contentType: MEDIA_TYPES[extname(path).toLowerCase()],
      multipart: size > 50 * 1024 * 1024,
    });
    done[path] = version;
    await setSetting(uploadedKey(code), JSON.stringify(done));
  }
}
