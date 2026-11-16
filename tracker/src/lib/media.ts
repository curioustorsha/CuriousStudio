import "server-only";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmdirSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, extname, join, resolve, sep } from "node:path";
import { sql } from "drizzle-orm";
import { db, episodes } from "@/db";
import { getSetting } from "./settings";

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

/**
 * Public Blob store URL plus a long random folder, e.g. https://abc.public.blob.vercel-storage.com/m-3f9…
 * The folder name is the secret: the site only hands these links to people who are signed in.
 */
const BASE = process.env.MEDIA_BASE_URL?.replace(/\/$/, "") ?? "";

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

/** iCloud Drive/Curiously/<YYYY-MM Month | Unscheduled>/<CODE – title>/: each episode's finished files. */
const ICLOUD = join(homedir(), "Library", "Mobile Documents", "com~apple~CloudDocs", "Curiously");
const SEP = " – ";
const monthFolder = (date: string | null) =>
  date ? `${date.slice(0, 7)} ${new Date(`${date}T00:00`).toLocaleString("en", { month: "long" })}` : "Unscheduled";
const subdirs = (dir: string) =>
  readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => join(dir, d.name));

let syncing: Promise<void> | null = null;

/**
 * Copies every episode's render, cover, slides and upload kit to iCloud, skipping unchanged files, and moves
 * its folder when the publish date or title changes. Also saves a daily database copy to Backups/. Worker only; runs after each skill run and every 5 minutes.
 */
export function syncICloud() {
  if (!IS_WORKER || !existsSync(dirname(ICLOUD))) return Promise.resolve();
  return (syncing ??= doSync().finally(() => (syncing = null)));
}

async function doSync() {
  mkdirSync(join(ICLOUD, "Backups"), { recursive: true });
  // One database snapshot a day, all kept. VACUUM INTO gives a consistent copy even mid-write.
  const backup = join(ICLOUD, "Backups", `tracker-${new Date().toLocaleDateString("en-CA")}.db`);
  if (!existsSync(backup)) await db.run(sql`VACUUM INTO ${backup}`);
  const current = new Map<string, string>(); // CODE → its folder in iCloud now
  for (const month of subdirs(ICLOUD)) for (const dir of subdirs(month)) current.set(basename(dir).split(SEP)[0], dir);

  for (const ep of await db.select().from(episodes)) {
    const outDir = `out/${ep.code.toLowerCase()}/`;
    const paths = [ep.renderUrl, ...ep.slides.split("\n"), `/media/${outDir}final.mp4`, `/media/${outDir}cover.png`]
      .map((u) => u.trim().split("?")[0].replace(/^\/media\//, ""))
      .filter((p) => p.startsWith(outDir));
    const files = [...new Set(paths)]
      .map((p) => [p.slice(outDir.length), localMediaFile(p)] as const)
      .filter(([, f]) => f && existsSync(/*turbopackIgnore: true*/ f)) as [string, string][];
    if (!files.length && !ep.publishPlan) continue; // nothing finished yet

    const target = join(ICLOUD, monthFolder(ep.publishDate), `${ep.code}${SEP}${ep.title}`.replace(/[/:]/g, "-"));
    const was = current.get(ep.code);
    mkdirSync(dirname(target), { recursive: true });
    if (was && was !== target) {
      renameSync(was, target);
      try { rmdirSync(dirname(was)); } catch {} // drop the old month folder once it's empty
    }
    for (const [name, file] of files) {
      const dest = join(target, name);
      const src = statSync(file);
      const old = existsSync(dest) ? statSync(dest) : null;
      if (old && old.size === src.size && old.mtimeMs >= src.mtimeMs) continue;
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(file, dest);
    }
    const kit = join(target, "upload-kit.md");
    if (ep.publishPlan && (!existsSync(kit) || readFileSync(kit, "utf8") !== ep.publishPlan)) {
      mkdirSync(target, { recursive: true });
      writeFileSync(kit, ep.publishPlan);
    }
  }
}
