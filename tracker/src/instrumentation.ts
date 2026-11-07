/** Moves the queue on even when nobody has the app open, including after a restart. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { pumpQueue } = await import("@/lib/runner");
  const tick = () => pumpQueue().catch((e) => console.error("Queue:", e));
  void tick();
  setInterval(tick, 5000).unref();
}
