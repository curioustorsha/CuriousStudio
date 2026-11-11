#!/usr/bin/env node
/**
 * Tracker helper for the stage skills (/script, /make, /publish). Talks to the running tracker's API.
 *
 *   node tracker/scripts/episode.mjs get AIW-001
 *       Full episode as JSON, with series format notes, open review feedback, versions and stale stages.
 *
 *   node tracker/scripts/episode.mjs submit AIW-001 research=@/path/research.md script=@/path/script.md sources=@/path/sources.md checks=@/path/checks.json
 *       Writes the fields (value or @file) and marks the stage "Ready for review". Never changes the stage.
 *       checks (JSON) updates the current stage's checklist: [{ "item": 0, "done": true, "note": "…" }].
 *       sendBack (JSON) proposes sending the episode back to an earlier stage with fixes:
 *       { "stage": "script", "notes": "…" }; sendBack=none clears it.
 *
 *   node tracker/scripts/episode.mjs slot HIS-003
 *       The next free publishing day for the episode's series: its weekdays (series.cadenceDays), not before
 *       launch or tomorrow, and not a day another episode of that series already has. Prints YYYY-MM-DD.
 *
 *   node tracker/scripts/episode.mjs list
 *       Every episode, one per line: code, stage, series, publish date, title (for scheduling and comparisons).
 *
 * Reads API_TOKEN from tracker/.env.local. TRACKER_URL overrides http://localhost:3000.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
try {
  process.loadEnvFile(join(root, ".env.local"));
} catch {}

const base = process.env.TRACKER_URL ?? "http://localhost:3000";
const token = process.env.API_TOKEN;
const [command, code, ...pairs] = process.argv.slice(2);

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!token) fail("API_TOKEN missing from tracker/.env.local");
if (!command || (!code && command !== "list")) fail("Usage: episode.mjs list | get <code> | slot <code> | submit <code> field=value|field=@file …");

async function call(method, body, path = `/api/episodes/${encodeURIComponent(code)}`) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  }).catch(() => fail(`Tracker not reachable at ${base}. Is it running? (npm run service:status in tracker/)`));
  const data = await res.json().catch(() => ({}));
  if (!res.ok) fail(`${res.status}: ${data.error ?? "request failed"}`);
  return data;
}

if (command === "list") {
  const rows = await call("GET", undefined, "/api/episodes");
  for (const e of rows) {
    const stats = e.views != null ? ` · ${e.views} views` : "";
    console.log(`${e.code}\t${e.stage}\t${e.seriesId ?? "-"}\t${e.publishDate ?? "-"}\t${e.title}${stats}`);
  }
} else if (command === "get") {
  console.log(JSON.stringify(await call("GET"), null, 2));
} else if (command === "slot") {
  const LAUNCH = "2027-01-01"; // keep in step with LAUNCH in src/lib/stages.ts
  const ep = await call("GET");
  const days = String(ep.series?.cadenceDays ?? "").split(",").filter(Boolean).map(Number);
  if (!days.length) fail(`${ep.code}'s series has no publishing days set. Set them on the Series page.`);
  const taken = new Set(
    (await call("GET", undefined, "/api/episodes"))
      .filter((e) => e.seriesId === ep.seriesId && e.id !== ep.id && e.publishDate)
      .map((e) => e.publishDate),
  );
  const iso = (d) => d.toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 864e5);
  const d = new Date(`${iso(tomorrow) > LAUNCH ? iso(tomorrow) : LAUNCH}T00:00:00Z`);
  for (let i = 0; i < 400; i++, d.setUTCDate(d.getUTCDate() + 1)) {
    if (days.includes(d.getUTCDay()) && !taken.has(iso(d))) {
      console.log(iso(d));
      process.exit(0);
    }
  }
  fail("No free day in the next 400 days.");
} else if (command === "submit") {
  if (!pairs.length) fail("Nothing to submit. Pass field=value or field=@file.");
  const patch = { readyForReview: true };
  for (const pair of pairs) {
    const i = pair.indexOf("=");
    if (i < 1) fail(`Bad argument "${pair}". Use field=value or field=@file.`);
    const value = pair.slice(i + 1);
    const key = pair.slice(0, i);
    const text = value.startsWith("@") ? readFileSync(value.slice(1), "utf8").trim() : value;
    if (key === "sendBack") {
      if (text === "none" || text === "null" || text === "") patch.sendBack = null;
      else {
        try {
          patch.sendBack = JSON.parse(text);
        } catch {
          fail('sendBack must be JSON like {"stage":"script","notes":"…"} or none');
        }
      }
    } else if (key === "checks") {
      try {
        patch.checks = JSON.parse(text);
      } catch {
        fail("checks must be a JSON array like [{\"item\":0,\"done\":true,\"note\":\"…\"}]");
      }
    } else patch[key] = text;
  }
  const ep = await call("PATCH", patch);
  console.log(`Submitted ${ep.code} (${Object.keys(patch).filter((k) => k !== "readyForReview").join(", ")}) for review.`);
} else {
  fail(`Unknown command "${command}"`);
}
