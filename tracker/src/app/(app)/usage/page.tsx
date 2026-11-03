import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { savePlanFeesAction } from "@/app/actions";
import { ApiKeyForm, SubmitButton } from "@/components/client";
import { PageHeader } from "@/components/ui";
import { db, episodes, runs } from "@/db";
import { requireUser } from "@/lib/auth";
import { elevenLabsUsage } from "@/lib/elevenlabs";
import { backfillUsage } from "@/lib/runner";
import { anthropicKeyStatus, getSetting, planFee, PLAN_KEYS } from "@/lib/settings";
import { getStage, modelLabel, STAGES } from "@/lib/stages";

const usd = (n: number) => `$${n.toFixed(n !== 0 && Math.abs(n) < 10 ? 2 : 0)}`;
const tokens = (n: number | null) =>
  n == null ? "—" : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n);
const monthName = (m: string) =>
  new Date(`${m}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });

function lastMonths(n: number) {
  const out: string[] = [];
  const d = new Date();
  d.setUTCDate(1);
  for (let i = 0; i < n; i++) {
    out.unshift(d.toISOString().slice(0, 7));
    d.setUTCMonth(d.getUTCMonth() - 1);
  }
  return out;
}

export default async function UsagePage() {
  await requireUser();
  await backfillUsage();

  const [rows, el, claudeFee, elFeeSetting] = await Promise.all([
    db
      .select({ run: runs, code: episodes.code, title: episodes.title })
      .from(runs)
      .innerJoin(episodes, eq(runs.episodeId, episodes.id))
      .orderBy(desc(runs.id)),
    elevenLabsUsage(6),
    planFee("claude"),
    getSetting(PLAN_KEYS.elevenlabs.key),
  ]);
  // ElevenLabs fee: what you typed in, else the plan's next invoice as ElevenLabs reports it.
  const elFee = elFeeSetting !== null ? Number(elFeeSetting) || 0 : (el?.nextInvoiceUsd ?? 0);
  const key = anthropicKeyStatus();

  const months = lastMonths(6);
  const thisMonth = months.at(-1)!;
  const monthOf = (r: (typeof rows)[number]) => r.run.startedAt.slice(0, 7);

  const byMonth = months.map((m) => {
    const inMonth = rows.filter((r) => monthOf(r) === m);
    const apiKey = inMonth.filter((r) => r.run.billing === "api-key").reduce((n, r) => n + (r.run.costUsd ?? 0), 0);
    const subValue = inMonth.filter((r) => r.run.billing !== "api-key").reduce((n, r) => n + (r.run.costUsd ?? 0), 0);
    const credits = el?.months.find((x) => x.month === m)?.credits ?? 0;
    const active = m === thisMonth || inMonth.length > 0;
    const claudePlan = active ? claudeFee : 0;
    const elPlan = m === thisMonth || credits > 0 ? elFee : 0;
    return { month: m, runs: inMonth.length, apiKey, subValue, claudePlan, elPlan, credits, total: claudePlan + apiKey + elPlan };
  });
  const now = byMonth.at(-1)!;

  const monthRuns = rows.filter((r) => monthOf(r) === thisMonth);
  const byStage = STAGES.filter((s) => s.skill)
    .map((s) => {
      const list = monthRuns.filter((r) => r.run.stage === s.key);
      const priced = list.filter((r) => r.run.costUsd != null);
      const total = priced.reduce((n, r) => n + (r.run.costUsd ?? 0), 0);
      const models = [...new Set(list.map((r) => modelLabel(r.run.model)).filter(Boolean))];
      return { stage: s, runs: list.length, total, avg: priced.length ? total / priced.length : 0, models };
    })
    .filter((s) => s.runs > 0);
  const stageMax = Math.max(...byStage.map((s) => s.total), 0.01);

  const episodeTotals = new Map<string, { code: string; title: string; id: number; runs: number; total: number }>();
  for (const r of rows) {
    const e = episodeTotals.get(r.code) ?? { code: r.code, title: r.title, id: r.run.episodeId, runs: 0, total: 0 };
    e.runs++;
    e.total += r.run.costUsd ?? 0;
    episodeTotals.set(r.code, e);
  }
  const perEpisode = [...episodeTotals.values()].sort((a, b) => b.total - a.total);
  const unpriced = rows.filter((r) => r.run.status !== "running" && r.run.costUsd == null).length;

  return (
    <div>
      <PageHeader
        title="AI Usage"
        subtitle={`What Claude and ElevenLabs cost each month. ${monthName(thisMonth)} so far.`}
      />

      {/* This month */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label={`Spent in ${monthName(thisMonth)}`} value={usd(now.total)} note="Plans plus API-key runs: what you're billed" />
        <Tile
          label="Claude"
          value={usd(now.claudePlan + now.apiKey)}
          note={`${usd(now.claudePlan)} plan${now.apiKey ? ` + ${usd(now.apiKey)} API key` : ""} · ${now.runs} run${now.runs === 1 ? "" : "s"}`}
        />
        <Tile
          label="ElevenLabs"
          value={usd(now.elPlan + (el?.overageUsd ?? 0))}
          note={el ? `${el.tier} plan${el.overageUsd ? ` + ${usd(el.overageUsd)} extra` : ""}` : "Couldn't reach ElevenLabs"}
        />
        <Tile
          label="Subscription work, at API prices"
          value={usd(now.subValue)}
          note="What this month's subscription runs would cost on an API key"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-6">
          {/* Month by month */}
          <section className="card p-6">
            <h2 className="text-[15px] font-semibold tracking-tight">Month by month</h2>
            <p className="mb-4 mt-1 text-xs text-muted">
              Plan fees count from the month they were used. API-key runs are billed per token.
            </p>
            <div className="scroll-thin overflow-x-auto">
              <table className="w-full text-[13px] tabular-nums">
                <thead className="text-left text-[11px] text-faint">
                  <tr className="border-b border-line">
                    <th className="py-2 pr-3 font-medium">Month</th>
                    <th className="py-2 pr-3 text-right font-medium">Runs</th>
                    <th className="py-2 pr-3 text-right font-medium">Claude plan</th>
                    <th className="py-2 pr-3 text-right font-medium">Claude API key</th>
                    <th className="py-2 pr-3 text-right font-medium">ElevenLabs</th>
                    <th className="py-2 pr-3 text-right font-medium">ElevenLabs credits</th>
                    <th className="py-2 text-right font-semibold text-muted">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {byMonth.map((m) => (
                    <tr key={m.month} className="border-b border-line/60 last:border-0">
                      <td className="py-2 pr-3">{monthName(m.month)}</td>
                      <td className="py-2 pr-3 text-right text-muted">{m.runs || "—"}</td>
                      <td className="py-2 pr-3 text-right">{m.claudePlan ? usd(m.claudePlan) : "—"}</td>
                      <td className="py-2 pr-3 text-right">{m.apiKey ? usd(m.apiKey) : "—"}</td>
                      <td className="py-2 pr-3 text-right">{m.elPlan ? usd(m.elPlan) : "—"}</td>
                      <td className="py-2 pr-3 text-right text-muted">{m.credits ? m.credits.toLocaleString() : "—"}</td>
                      <td className="py-2 text-right font-semibold">{m.total ? usd(m.total) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* By stage */}
          <section className="card p-6">
            <h2 className="text-[15px] font-semibold tracking-tight">Claude by stage, {monthName(thisMonth)}</h2>
            <p className="mb-4 mt-1 text-xs text-muted">Run cost at API prices, whichever way it was paid.</p>
            {byStage.length ? (
              <div className="space-y-3">
                {byStage.map((s) => (
                  <div key={s.stage.key} className="grid grid-cols-[110px_1fr_auto] items-center gap-3 text-[13px]">
                    <Link href={`/skills/${s.stage.skill}`} className="truncate font-medium hover:text-accent">
                      {s.stage.label}
                    </Link>
                    <div className="h-2 rounded-full bg-fg/[0.06]" title={`${s.stage.label}: ${usd(s.total)}`}>
                      <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(2, (s.total / stageMax) * 100)}%` }} />
                    </div>
                    <div className="text-right tabular-nums">
                      <span className="font-semibold">{usd(s.total)}</span>
                      <span className="ml-2 text-xs text-muted">
                        {s.runs} run{s.runs === 1 ? "" : "s"} · {usd(s.avg)} each · {s.models.join(", ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-faint">No runs this month yet.</p>
            )}
          </section>

          {/* Recent runs */}
          <section className="card p-6">
            <h2 className="mb-4 text-[15px] font-semibold tracking-tight">Recent runs</h2>
            <div className="scroll-thin overflow-x-auto">
              <table className="w-full text-[13px] tabular-nums">
                <thead className="text-left text-[11px] text-faint">
                  <tr className="border-b border-line">
                    <th className="py-2 pr-3 font-medium">When</th>
                    <th className="py-2 pr-3 font-medium">Episode</th>
                    <th className="py-2 pr-3 font-medium">Stage</th>
                    <th className="py-2 pr-3 font-medium">Model</th>
                    <th className="py-2 pr-3 font-medium">Paid by</th>
                    <th className="py-2 pr-3 text-right font-medium">Output</th>
                    <th className="py-2 pr-3 text-right font-medium">Cache read</th>
                    <th className="py-2 text-right font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 25).map(({ run, code }) => (
                    <tr key={run.id} className="border-b border-line/60 last:border-0">
                      <td className="py-2 pr-3 text-muted">{run.startedAt.slice(5, 16).replace("T", " ")}</td>
                      <td className="py-2 pr-3">
                        <Link href={`/episodes/${run.episodeId}`} className="font-mono text-xs hover:text-accent">{code}</Link>
                      </td>
                      <td className="py-2 pr-3">{getStage(run.stage).label}</td>
                      <td className="py-2 pr-3 text-muted">
                        {modelLabel(run.model) || "—"}
                        {run.effort ? ` · ${run.effort}` : ""}
                      </td>
                      <td className="py-2 pr-3 text-muted">
                        {run.status === "running" ? "Running" : run.billing === "api-key" ? "API key" : "Subscription"}
                      </td>
                      <td className="py-2 pr-3 text-right text-muted">{tokens(run.outputTokens)}</td>
                      <td className="py-2 pr-3 text-right text-muted">{tokens(run.cacheReadTokens)}</td>
                      <td className="py-2 text-right">{run.costUsd != null ? usd(run.costUsd) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {unpriced > 0 && (
              <p className="mt-3 text-xs text-faint">
                {unpriced} run{unpriced === 1 ? " has" : "s have"} no cost: stopped or crashed runs end before Claude Code reports a total.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          {/* ElevenLabs credits */}
          <section className="card p-5">
            <h3 className="text-[15px] font-semibold tracking-tight">ElevenLabs credits</h3>
            {el ? (
              <>
                <p className="mb-3 mt-1 text-xs text-muted">
                  {el.tier.charAt(0).toUpperCase() + el.tier.slice(1)} plan · resets{" "}
                  {el.resetsAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </p>
                <div className="mb-1.5 flex items-baseline justify-between text-[13px] tabular-nums">
                  <span className="text-xl font-semibold">{el.used.toLocaleString()}</span>
                  <span className="text-muted">of {el.limit.toLocaleString()} ({Math.round((el.used / el.limit) * 100)}%)</span>
                </div>
                <div
                  className="h-2 rounded-full bg-fg/[0.06]"
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={el.limit}
                  aria-valuenow={el.used}
                  aria-label="ElevenLabs credits used this period"
                >
                  <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (el.used / el.limit) * 100)}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted">
                  {(el.limit - el.used).toLocaleString()} left. A 60-second take is roughly 1,000; retakes add more.
                </p>
              </>
            ) : (
              <p className="mt-1 text-xs text-muted">Couldn&apos;t read usage. Check ELEVENLABS_API_KEY in the project&apos;s .env.local.</p>
            )}
          </section>

          {/* Cost per episode */}
          <section className="card p-5">
            <h3 className="mb-3 text-[15px] font-semibold tracking-tight">Claude cost per episode</h3>
            <div className="space-y-2 text-[13px]">
              {perEpisode.map((e) => (
                <div key={e.code} className="flex items-baseline gap-2">
                  <Link href={`/episodes/${e.id}`} className="min-w-0 flex-1 truncate hover:text-accent">
                    <span className="font-mono text-xs text-faint">{e.code}</span> {e.title}
                  </Link>
                  <span className="shrink-0 text-xs text-muted">{e.runs} runs</span>
                  <span className="w-14 shrink-0 text-right font-semibold tabular-nums">{usd(e.total)}</span>
                </div>
              ))}
              {perEpisode.length === 0 && <p className="text-xs text-faint">No runs yet.</p>}
            </div>
          </section>

          {/* Plans */}
          <section className="card p-5">
            <h3 className="text-[15px] font-semibold tracking-tight">Monthly plans</h3>
            <p className="mb-3 mt-1 text-xs text-muted">Fixed fees, in USD. Leave ElevenLabs empty to use the amount on its next invoice.</p>
            <form action={savePlanFeesAction} className="space-y-3">
              <div>
                <label className="label">{PLAN_KEYS.claude.label}</label>
                <input name={PLAN_KEYS.claude.key} defaultValue={claudeFee} inputMode="decimal" className="input" />
              </div>
              <div>
                <label className="label">{PLAN_KEYS.elevenlabs.label}</label>
                <input
                  name={PLAN_KEYS.elevenlabs.key}
                  defaultValue={elFeeSetting ?? ""}
                  placeholder={el?.nextInvoiceUsd != null ? `${el.nextInvoiceUsd} (from ElevenLabs)` : ""}
                  inputMode="decimal"
                  className="input"
                />
              </div>
              <SubmitButton className="btn btn-ghost btn-sm w-full">Save Plans</SubmitButton>
            </form>
          </section>

          {/* API key */}
          <section className="card p-5">
            <h3 className="text-[15px] font-semibold tracking-tight">Claude API key</h3>
            <p className="mb-3 mt-1 text-xs text-muted">
              {key.set
                ? `Set (${key.hint}). New runs bill to this key, per token, instead of the subscription.`
                : "Not set. Runs use the Claude subscription. Add a key to bill runs per token and see exact costs."}
            </p>
            <ApiKeyForm isSet={key.set} />
          </section>
        </aside>
      </div>
    </div>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-[28px] font-semibold leading-tight tracking-tight tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-faint">{note}</div>
    </div>
  );
}
