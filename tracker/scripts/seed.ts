/**
 * Seeds the three launch series and a starter backlog. Safe to re-run: skips if series exist.
 * Run with `npm run setup` (creates tables first) or `npm run seed`.
 */
try {
  process.loadEnvFile(".env.local");
} catch {}

async function main() {
  const { db, series, episodes, activity } = await import("../src/db");

  const existing = await db.select().from(series);
  if (existing.length) {
    console.log(`Already seeded (${existing.length} series). Nothing to do.`);
    return;
  }

  const [his, cl, aiw, cs] = await db
    .insert(series)
    .values([
      {
        name: "How It Scales",
        prefix: "HIS",
        color: "#4fd1ff",
        cadenceDays: "1",
        format: "video",
        visualStyle: "isometric",
        targetSeconds: 80,
        description: "Scenario-based system design: how real products survive massive scale.",
        formatNotes: [
          "**Structure:** Hook with the scale problem, show the naive approach failing, explain 2–3 real techniques, end on the payoff insight.",
          "**Tone:** Calm, confident, curious. No jargon without a visual.",
          "**Visuals:** Isometric 2D. One isometric world per episode (servers, stores, warehouses as blocks on a grid; requests and orders as packets moving along routes). The camera moves around the same world; colour roles: cyan system, amber users/requests, green healthy, red overload.",
          "**Rule:** Every number must be sourced and checked in the Script stage. Say “reportedly” when the company hasn’t published it.",
        ].join("\n\n"),
      },
      {
        name: "Claude Lab",
        prefix: "CL",
        color: "#8b6cff",
        cadenceDays: "3",
        format: "video",
        visualStyle: "flat-metaphor",
        targetSeconds: 60,
        description: "Claude Code, Cowork, Desktop, skills, notable repos and vibe-coded apps.",
        formatNotes: [
          "**Structure:** Hook with the outcome, explain it in one line, show it working, then how to try it.",
          "**Visuals:** Flat 2D vector + metaphors. Every idea becomes one concrete object (context is a desk, a subagent is a teammate at their own desk, a skill is a manual on a shelf) that stays the same whenever it returns. Flat shapes and duotone icons, amber as the only accent; at most one simple flat terminal mockup as proof.",
          "**Freshness:** Produce at most 2–4 weeks ahead. Re-check versions right before posting.",
        ].join("\n\n"),
      },
      {
        name: "AI This Week",
        prefix: "AIW",
        color: "#ff9f5c",
        cadenceDays: "5",
        format: "carousel",
        visualStyle: "carousel-editorial",
        description: "Last week in AI: new models, local LLMs, the news that matters. Made fresh every week.",
        formatNotes: [
          "**Fast lane:** Research Thursday, slide copy and fact-check Thursday night, design Friday morning, post Friday.",
          "**Format:** Carousel (picture stack), about 7 slides: cover (the hook) → 3–4 story slides (headline, what happened, why it matters, dated source) → what it means for you → follow. 4:5 for Instagram, 9:16 for TikTok photo mode, plus a slideshow Short with music for YouTube.",
          "**Template:** Same slide template every week (video/src/carousel/Slides.tsx) so only the content changes.",
        ].join("\n\n"),
      },
      {
        name: "Claude Skills",
        prefix: "CS",
        color: "#3ddc97",
        cadenceDays: "4",
        format: "video",
        visualStyle: "flat-metaphor",
        description: "Great Claude skills to look out for: what each one does, a real example, and how to install it.",
        formatNotes: [
          "**Format:** Narrated vertical Short: hook → 3 skills (what it lets you do, an example, when to use it, where to get it) → the short version → where to get them.",
          "**Vetting:** Recommend only skills you have opened: read the SKILL.md, the licence, the last update and what any scripts do.",
        ].join("\n\n"),
      },
    ])
    .returning();

  const ideas: { seriesId: number; code: string; title: string; hook: string; summary: string; priority?: string }[] = [
    { seriesId: his.id, code: "HIS-001", title: "How IRCTC survives the Tatkal rush", hook: "Lakhs of people hit ‘Book’ at exactly 10:00. Why doesn’t it all collapse?", summary: "Waiting rooms, rate limiting, seat-inventory locking and why ‘first come first served’ is hard at scale.", priority: "high" },
    { seriesId: his.id, code: "HIS-002", title: "How Uber picks your driver at peak time", hook: "It’s not the closest driver. Here’s what actually happens.", summary: "Geo-indexing (H3 hexagons), batched matching vs greedy, surge as a supply signal, ETA prediction.", priority: "high" },
    { seriesId: his.id, code: "HIS-003", title: "How 10-minute delivery actually works", hook: "Your order is packed before the rider even arrives. How?", summary: "Dark stores, demand forecasting per pin code, pick-path optimisation, rider batching.", priority: "high" },
    { seriesId: his.id, code: "HIS-004", title: "Why Amazon warehouses look like chaos (on purpose)", hook: "Amazon puts toothpaste next to tyres. It’s genius.", summary: "Random/chaotic storage, bin barcodes, pick-route optimisation, robots bringing shelves to people." },
    { seriesId: his.id, code: "HIS-005", title: "How live cricket streams to millions at once", hook: "One six. Crores of screens. Zero buffering?", summary: "CDNs, adaptive bitrate, pre-scaling for big matches, handling the toss-time spike." },
    { seriesId: his.id, code: "HIS-006", title: "How UPI handles festival-day payment spikes", hook: "Diwali night: everyone pays at once. Here’s why it (mostly) works.", summary: "NPCI switch, bank integrations, idempotency, timeouts and retries." },
    { seriesId: his.id, code: "HIS-007", title: "How Google Maps knows there’s traffic", hook: "Google knows about the jam before you’re in it.", summary: "Crowdsourced location pings, historical patterns, graph routing with live edge weights." },
    { seriesId: cl.id, code: "CL-001", title: "Claude Code in 60 seconds", hook: "An AI that doesn’t just write code. It ships it.", summary: "What Claude Code is, what it can do in a real repo, and how to start.", priority: "high" },
    { seriesId: cs.id, code: "CS-001", title: "5 Claude skills worth installing", hook: "These 5 skills turn Claude into a specialist.", summary: "Pick 5 useful skills from public repos, show each in action. Re-verify before posting." },
    { seriesId: cl.id, code: "CL-003", title: "Claude Code vs Cowork vs Desktop: which one when?", hook: "Three Claudes. Which one should you actually use?", summary: "Side-by-side: who each is for, with one concrete example each." },
    { seriesId: cl.id, code: "CL-004", title: "Vibe-coded app spotlight #1", hook: "Built in a weekend with AI and people actually use it.", summary: "Find a real vibe-coded Mac/Android app with traction; show what it does and how it was built." },
    { seriesId: aiw.id, code: "AIW-001", title: "AI This Week #1", hook: "The 3 AI stories you missed this week.", summary: "First weekly episode. Lock the template: intro, 3–4 stories, ‘what it means for you’, outro." },
    { seriesId: aiw.id, code: "AIW-002", title: "Best local LLMs you can run on a laptop", hook: "No internet. No API bill. Surprisingly good.", summary: "Special episode: current best local models by RAM tier, tools to run them (Ollama, LM Studio)." },
  ];

  await db.insert(episodes).values(
    ideas.map((idea, i) => ({ ...idea, stage: "idea", priority: idea.priority ?? "medium", position: i, createdBy: "seed" })),
  );
  await db.insert(activity).values({ actor: "seed", message: `set up 4 series and ${ideas.length} starter ideas` });
  console.log(`Seeded 4 series and ${ideas.length} ideas.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
