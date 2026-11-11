/** Moves the queue on even when nobody has the app open, including after a restart. */
export async function register() {
  // Hosted on Vercel there's no queue to move: the Mac's tracker runs the jobs.
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.VERCEL) return;
  const { backfillProgress, pollClaudeUsage, pumpQueue } = await import("@/lib/runner");
  void backfillProgress().catch((e) => console.error("Progress backfill:", e));
  const tick = () => pumpQueue().catch((e) => console.error("Queue:", e));
  void tick();
  setInterval(tick, 5000).unref();
  // Claude's session and weekly usage for the footer, between runs too.
  const usage = () => pollClaudeUsage().catch((e) => console.error("Claude usage:", e.message));
  void usage();
  setInterval(usage, 5 * 60_000).unref();
}
