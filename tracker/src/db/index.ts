import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const client = createClient({
  // Local: a SQLite file next to the app. Shared: a Turso URL (libsql://…) + token; on Vercel the Turso
  // integration sets them as TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.
  url: process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.DATABASE_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle({ client, schema });
export * from "./schema";
