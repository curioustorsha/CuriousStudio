import { CircleCheck, CircleX, FileText, Globe, LoaderCircle, Search, Square, Upload, Wrench } from "lucide-react";
import { stopRunAction } from "@/app/actions";
import type { Run } from "@/db";
import { readLog, type RunStep } from "@/lib/runner";
import { Markdown, RunWatcher, SubmitButton } from "./client";
import { timeAgo } from "./ui";

const stepIcon = { className: "mt-px size-3.5 shrink-0", strokeWidth: 2 };
const STEP_ICONS: Record<RunStep["kind"], React.ReactNode> = {
  search: <Search {...stepIcon} />,
  read: <Globe {...stepIcon} />,
  tool: <Wrench {...stepIcon} />,
  submit: <Upload {...stepIcon} />,
  note: <FileText {...stepIcon} />,
};

const STATUS = {
  running: { label: "Working", className: "text-accent" },
  done: { label: "Finished", className: "text-ok" },
  failed: { label: "Failed", className: "text-danger" },
  stopped: { label: "Stopped", className: "text-faint" },
} as const;

/** Live view of a skill run: progress steps while it works, then Claude's summary. */
export function RunCard({ run }: { run: Run }) {
  const { steps, result } = readLog(run.id);
  const status = STATUS[run.status as keyof typeof STATUS] ?? STATUS.failed;
  const running = run.status === "running";
  const shown = running ? steps.slice(-8) : steps;

  return (
    <div className="rounded-xl bg-panel-2 p-3 text-xs">
      <div className="flex items-center gap-2">
        {running ? (
          <LoaderCircle className="size-3.5 animate-spin text-accent" strokeWidth={2.2} />
        ) : run.status === "done" ? (
          <CircleCheck className="size-3.5 text-ok" strokeWidth={2.2} />
        ) : (
          <CircleX className="size-3.5 text-faint" strokeWidth={2.2} />
        )}
        <span className={`font-semibold ${status.className}`}>{status.label}</span>
        <span className="text-faint">
          {running ? `started ${timeAgo(run.startedAt)}` : timeAgo(run.finishedAt ?? run.startedAt)} · {run.startedBy}
          {result?.seconds ? ` · ${Math.round(result.seconds / 60) || "<1"} min` : ""}
        </span>
        {running && (
          <form action={stopRunAction.bind(null, run.id)} className="ml-auto">
            <SubmitButton className="btn btn-ghost btn-sm" pendingText="Stopping…" confirmText="Stop this run?" confirmMessage="Claude stops where it is. Anything it already submitted stays saved." confirmLabel="Stop run">
              <Square className="size-3" strokeWidth={2.4} /> Stop
            </SubmitButton>
          </form>
        )}
      </div>

      {running && shown.length === 0 && <p className="mt-2 text-muted">Starting Claude Code…</p>}

      {running ? (
        <StepList steps={shown} />
      ) : (
        <>
          {run.result && (
            <div className="mt-2 text-[13px]">
              <Markdown>{run.result}</Markdown>
            </div>
          )}
          {steps.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-faint">What it did ({steps.length} steps)</summary>
              <StepList steps={steps} />
            </details>
          )}
        </>
      )}
      {running && <RunWatcher />}
    </div>
  );
}

function StepList({ steps }: { steps: RunStep[] }) {
  return (
    <ol className="scroll-thin mt-2 max-h-72 space-y-1.5 overflow-auto">
      {steps.map((s, i) => (
        <li key={i} className={`flex gap-2 ${s.kind === "note" ? "text-fg/80" : "text-muted"}`}>
          {STEP_ICONS[s.kind]}
          <span className="min-w-0 break-words">{s.text}</span>
        </li>
      ))}
    </ol>
  );
}
