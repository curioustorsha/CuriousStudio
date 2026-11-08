import Link from "next/link";
import { notFound } from "next/navigation";
import { saveSkillAction, saveStageModelAction } from "@/app/actions";
import { SkillInstructions, SubmitButton } from "@/components/client";
import { PageHeader, StageBadge, timeAgo } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { IS_WORKER } from "@/lib/media";
import { recentRuns, runProgress } from "@/lib/runner";
import { stageModel } from "@/lib/settings";
import { getSkill, skillLabel } from "@/lib/skills";
import { EFFORTS, modelLabel, MODELS } from "@/lib/stages";

const STATUS_STYLE: Record<string, string> = {
  running: "text-accent",
  done: "text-ok",
  failed: "text-danger",
  stopped: "text-faint",
};

/** A skill: its instructions as a preview, and for stage skills the model it runs on and its recent runs. */
export default async function SkillPage({ params }: PageProps<"/skills/[name]">) {
  const user = await requireUser();
  const isAdmin = user.role === "admin";
  const { name } = await params;
  const skill = getSkill(name);
  if (!skill) notFound();

  const stage = skill.stage;
  const [history, chosen] = await Promise.all([
    stage ? recentRuns(skill.name) : Promise.resolve([]),
    stage ? stageModel(stage.key) : Promise.resolve(null),
  ]);

  return (
    <div>
      <PageHeader title={skillLabel(skill)}>{stage && <StageBadge stage={stage.key} />}</PageHeader>

      <div className={`grid gap-6 ${stage ? "lg:grid-cols-[1fr_480px]" : ""}`}>
        <section className="card min-w-0 p-6">
          <SkillInstructions key={skill.content} content={skill.content} save={saveSkillAction.bind(null, skill.name)} canEdit={isAdmin && IS_WORKER} />
        </section>

        {stage && (
          <aside className="space-y-4">
            {chosen && isAdmin && (
              <section className="card p-5">
                <h3 className="mb-3 text-[15px] font-semibold tracking-tight">Model</h3>
                <form action={saveStageModelAction.bind(null, stage.key)} className="space-y-2">
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <select name="model" defaultValue={chosen.model} className="input" aria-label="Model">
                      {MODELS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label} · {m.price}
                        </option>
                      ))}
                    </select>
                    <select name="effort" defaultValue={chosen.effort} className="input" aria-label="Effort">
                      {EFFORTS.map((e) => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </div>
                  <SubmitButton className="btn btn-ghost btn-sm w-full">Save Model</SubmitButton>
                </form>
              </section>
            )}

            <section className="card p-5">
              <h3 className="mb-3 text-[15px] font-semibold tracking-tight">Recent runs</h3>
              {history.length ? (
                <table className="w-full text-left text-[12px]">
                  <thead className="text-[11px] text-faint">
                    <tr>
                      <th className="pb-2 font-medium">Episode</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Model</th>
                      <th className="pb-2 font-medium">Helpers</th>
                      <th className="pb-2 text-right font-medium">Cost</th>
                      <th className="pb-2 text-right font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {history.map(({ run, code }) => (
                      <tr key={run.id}>
                        <td className="py-1.5">
                          <Link href={`/episodes/${run.episodeId}`} className="font-mono hover:text-accent">
                            {code}
                          </Link>
                        </td>
                        <td className={`py-1.5 capitalize ${STATUS_STYLE[run.status] ?? ""}`}>{run.status}</td>
                        <td className="py-1.5 text-muted">{run.model ? modelLabel(run.model) : "—"}</td>
                        <td className="py-1.5 text-muted">
                          {runProgress(run).skillsUsed.filter((s) => s !== skill.name).join(", ") || "—"}
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-muted">
                          {run.costUsd != null ? `$${run.costUsd.toFixed(2)}` : "—"}
                        </td>
                        <td className="py-1.5 text-right text-faint">{timeAgo(run.startedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-xs text-faint">No runs yet.</p>
              )}
            </section>
          </aside>
        )}
      </div>
    </div>
  );
}
