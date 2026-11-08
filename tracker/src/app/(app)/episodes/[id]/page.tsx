import {
  Check,
  ChevronLeft,
  ChevronRight,
  History,
  ListChecks,
  Play,
  Sparkles,
  Trash2Icon,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addCommentAction,
  approveStageAction,
  deleteEpisodeAction,
  moveEpisodeAction,
  requestChangesAction,
  runSkillAction,
  sendBackAction,
  updateEpisodeAction,
} from "@/app/actions";
import { db, series as seriesTable, type Episode, type Run } from "@/db";
import { FeedItems } from "@/components/FeedItems";
import { Checklist, FeedDisclosure, FillIdeasButton, Markdown, MarkdownField, MentionInput, SubmitButton } from "@/components/client";
import { StageFlow } from "@/components/StageFlow";
import { Avatar, ReadyBadge, StageBadge, timeAgo } from "@/components/ui";
import { listUsers, requireUser } from "@/lib/auth";
import { loadFeed } from "@/lib/comments";
import { RunCard } from "@/components/RunCard";
import { TimedReview } from "@/components/TimedReview";
import { findEpisode, getReviewHistory, parseSendBack, researchFacts, staleStages } from "@/lib/episodes";
import { latestRun } from "@/lib/runner";
import { emptyIdeaFields, IDEA_FILL_FIELDS } from "@/lib/ideaFields";
import { episodeScenes } from "@/lib/scenes";
import { getSkill } from "@/lib/skills";
import { hasOutFile } from "@/lib/media";
import { timecode } from "@/lib/timecode";
import { checklistItems, checklistProgress, getStage, isFormat, stageIndex, stagesFor, stepStage, type Format } from "@/lib/stages";

export default async function EpisodePage({ params }: PageProps<"/episodes/[id]">) {
  await requireUser();
  const { id } = await params;
  const ep = await findEpisode(id);
  if (!ep) notFound();

  const [seriesList, feedItems, review] = await Promise.all([
    db.select().from(seriesTable),
    loadFeed(ep.id),
    getReviewHistory(ep.id),
  ]);
  const run = await latestRun(ep.id, ep.stage);
  const users = await listUsers();
  const idx = stageIndex(ep.stage);
  const save = updateEpisodeAction.bind(null, ep.id);
  const epSeries = seriesList.find((s) => s.id === ep.seriesId);
  const format: Format = isFormat(epSeries?.format) ? epSeries.format : "video";
  const targetSeconds = epSeries?.targetSeconds ?? 60;
  const pipeline = stagesFor(format);

  return (
    <div>
      <div className="mb-5 flex items-center gap-1.5 text-[13px]">
        <Link href="/board" className="inline-flex items-center gap-0.5 text-accent hover:opacity-80">
          <ChevronLeft className="size-4" strokeWidth={2.2} /> Pipeline
        </Link>
        <span className="ml-2 font-mono text-xs text-faint">{ep.code}</span>
        <StageBadge stage={ep.stage} />
        {ep.readyForReview && <ReadyBadge />}
      </div>

      {/* Meta */}
      <form key={ep.updatedAt} action={save} className="card mb-6 p-6">
        <input
          name="title"
          defaultValue={ep.title}
          aria-label="Title"
          className="large-title w-full bg-transparent outline-none placeholder:text-faint"
          placeholder="Episode title"
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Field label="Series">
            <select name="seriesId" defaultValue={ep.seriesId ?? ""} className="input">
              <option value="">None</option>
              {seriesList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Owner">
            <select name="owner" defaultValue={ep.owner ?? ""} className="input">
              <option value="">Unassigned</option>
              {/* A disabled owner stays listed, or saving this form would silently unassign them. */}
              {users.filter((u) => u.active || u.username === ep.owner).map((u) => <option key={u.username} value={u.username}>{u.name}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select name="priority" defaultValue={ep.priority} className="input">
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </Field>
          <Field label="Publish date">
            <input type="date" name="publishDate" defaultValue={ep.publishDate ?? ""} className="input" />
          </Field>
          <div className="flex items-end">
            <SubmitButton className="btn btn-primary h-10 w-full">Save</SubmitButton>
          </div>
        </div>
      </form>

      <StageFlow
        key={ep.stage}
        current={ep.stage}
        steps={pipeline.map((st) => ({
          key: st.key,
          label: st.label,
          ...checklistProgress(st.key, ep.checklist),
          state: stageIndex(st.key) < idx ? "done" : st.key === ep.stage ? "current" : "upcoming",
        }))}
        panels={Object.fromEntries(
          pipeline.map((st) => [
            st.key,
            <StagePanel key={st.key} ep={ep} format={format} targetSeconds={targetSeconds} stageKey={st.key} review={review} run={run} save={save} />,
          ]),
        )}
        sidePanels={Object.fromEntries(
          pipeline.map((st) => [
            st.key,
            <div key={st.key} className="space-y-4">
              <StageChecklist ep={ep} stageKey={st.key} format={format} staleFrom={staleStages(review.revisions)[st.key]} pinnedOpen={openPinned(review).length} />
              <StageHistory stageKey={st.key} review={review} />
            </div>,
          ]),
        )}
        feed={
          <section id="feed" className="card scroll-mt-20 p-5">
            <form action={addCommentAction.bind(null, ep.id)} className="space-y-2">
              <MentionInput users={users.filter((u) => u.active)} label="Leave a comment" placeholder="Leave a comment. Type @ to tag someone. Claude doesn’t read these." />
              <div className="flex justify-end">
                <SubmitButton className="btn btn-primary btn-sm" pendingText="Posting…">Post</SubmitButton>
              </div>
            </form>
            {feedItems.length > 0 && (
              <FeedDisclosure summary={`Notes and history (${feedItems.length})`}>
                <FeedItems items={feedItems} usernames={users.map((u) => u.username)} showEpisode={false} />
              </FeedDisclosure>
            )}
          </section>
        }
        aside={
        <aside className="space-y-4">
          <form action={deleteEpisodeAction.bind(null, ep.id)} className="flex justify-center">
            <SubmitButton
              className="btn btn-ghost btn-danger btn-sm"
              pendingText="Deleting…"
              confirmText={`Delete ${ep.code}?`}
              confirmMessage={`“${ep.title}” and all its work will be removed for good.`}
              confirmLabel="Delete"
            >
              <Trash2Icon className="size-3.5" strokeWidth={2} /> Delete Episode
            </SubmitButton>
          </form>
        </aside>
        }
      />
    </div>
  );
}

const FIELD_LABELS: Record<string, string> = {
  hook: "Hook", summary: "Details", whyNow: "Why now", audience: "Audience", keyPoints: "Key points",
  visualIdeas: "Visual ideas", research: "Research notes", sources: "Sources", script: "Script",
  factcheck: "Fact-check", storyboard: "Storyboard", voiceoverUrl: "Voiceover file", renderUrl: "Render file",
  voiceoverNotes: "Voiceover check", renderNotes: "Animation notes", reviewReport: "Review report",
  slides: "Slides", designNotes: "Design notes",
  publishDate: "Publish date", publishPlan: "Publishing plan", postedYt: "YouTube link", postedIg: "Instagram link",
  postedTiktok: "TikTok link", analyticsNotes: "What we learned",
  ytTitle: "YouTube title", ytDescription: "YouTube description", igCaption: "Instagram caption",
  tiktokCaption: "TikTok caption", hashtags: "Hashtags", thumbnailNotes: "Cover notes",
};

/** Each stage's fields. Script, Make and Publish each show the parts they hold; Make's depend on the format. */
const STAGE_CONTENT: Record<string, (props: TabProps) => React.ReactNode> = {
  idea: IdeaTab,
  research: ResearchTab,
  script: (p) => (
    <>
      <ScriptTab {...p} />
      <FactcheckTab {...p} />
    </>
  ),
  make: (p) => (
    <>
      <StoryboardTab {...p} />
      {p.format === "carousel" ? (
        <DesignTab {...p} />
      ) : (
        <>
          <VoiceoverTab {...p} />
          <AnimationTab {...p} />
        </>
      )}
    </>
  ),
  review: ReviewTab,
  publish: (p) => (
    <>
      <PackagingTab {...p} />
      <ScheduledTab {...p} />
    </>
  ),
  posted: PostedTab,
};

/**
 * One stage of an episode: its fields (Claude's output lands here), and for the current stage the
 * Run button and the Review box (checklist, one comment box, Request changes / Approve).
 */
function StagePanel({ ep, format, targetSeconds, stageKey, review, run, save }: {
  ep: Episode;
  format: Format;
  targetSeconds: number;
  stageKey: string;
  review: Awaited<ReturnType<typeof getReviewHistory>>;
  run: Run | null;
  save: TabProps["save"];
}) {
  const stage = getStage(stageKey);
  const idx = stageIndex(stageKey);
  const isCurrent = stageKey === ep.stage;
  const revs = review.revisions.filter((r) => r.stage === stageKey);
  const notes = review.feedback.filter((f) => f.stage === stageKey);
  const open = notes.filter((f) => f.addressedIn === null);
  const latest = revs.at(-1);
  const staleFrom = staleStages(review.revisions)[stageKey];
  const skill = stage.skill ? getSkill(stage.skill) : null;
  const running = isCurrent && run?.status === "running";
  const queued = isCurrent && run?.status === "queued";
  const proposal = isCurrent ? parseSendBack(ep) : null;
  const Content = STAGE_CONTENT[stageKey];
  const sectionNames = stage.fields.map((f) => FIELD_LABELS[f] ?? f);
  const facts = stageKey === "script" && isCurrent ? researchFacts(ep.research) : [];
  const pinned = openPinned(review);

  let status: string;
  if (!isCurrent) status = idx < stageIndex(ep.stage) ? "Done" : "Not started";
  else if (running) status = `Claude is writing ${latest ? `v${latest.version + 1}` : "v1"}…`;
  else if (queued) status = "Waiting in the queue";
  else if (open.length) status = `Changes requested. Run it again to get ${latest ? `v${latest.version + 1}` : "a new version"}.`;
  else if (staleFrom && latest && skill)
    status = `${getStage(staleFrom).label} changed since v${latest.version}. Run ${stage.label} again to update it.`;
  else if (ep.readyForReview && latest) status = `v${latest.version} is ready for your review`;
  else if (!latest && skill) status = `Run ${stage.label} to write v1, or fill it in yourself`;
  else status = "In progress";

  return (
    <>
      <section className="card p-6">
        <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="text-xl font-semibold tracking-tight">{stage.label}</h2>
          {latest && <span className="rounded-full bg-fg/[0.06] px-2 py-0.5 text-[11px] font-medium text-muted">v{latest.version}</span>}
          <span className="text-[13px] text-muted">{status}</span>
        </div>
        <p className="-mt-3 mb-5 text-[13px] text-muted">{stage.description}</p>

        {staleFrom && (
          <p className="mb-5 flex items-start gap-2 rounded-xl bg-warn/10 px-3 py-2 text-[13px] text-warn">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" strokeWidth={2.2} />
            <span>
              Out of date: {getStage(staleFrom).label} changed after {latest ? `v${latest.version}` : "this version"} was made.
              {isCurrent && skill && ` Press Run ${stage.label} again: it works from the updated ${getStage(staleFrom).label}. No comments needed.`}
            </span>
          </p>
        )}

        {proposal && (
          <div className="mb-6 rounded-2xl bg-warn/10 p-4 ring-1 ring-warn/30">
            <div className="flex flex-wrap items-center gap-2">
              <TriangleAlert className="size-4 text-warn" strokeWidth={2.2} />
              <h3 className="text-[14px] font-semibold text-warn">
                {stage.label} found changes needed in {getStage(proposal.stage).label}
              </h3>
            </div>
            <p className="mt-1 text-xs text-muted">
              Approving now would carry the problem forward. Sending the fixes moves the episode back to{" "}
              {getStage(proposal.stage).label} with these notes filed as Request Changes, ready for you to run it again.
            </p>
            <div className="scroll-thin mt-3 max-h-72 overflow-auto rounded-xl bg-panel px-4 py-2 text-[13px]">
              <Markdown>{proposal.notes}</Markdown>
            </div>
            <form action={sendBackAction.bind(null, ep.id)} className="mt-3">
              <SubmitButton
                className="btn btn-primary"
                pendingText="Sending…"
                confirmText={`Send ${ep.code} back to ${getStage(proposal.stage).label}?`}
                confirmMessage={`The fixes are filed as Request Changes on ${getStage(proposal.stage).label}. After you run it again, the stages after it will be marked out of date so they can be re-checked.`}
                confirmLabel="Send fixes"
              >
                <ChevronLeft className="size-4" strokeWidth={2.2} /> Send fixes to {getStage(proposal.stage).label}
              </SubmitButton>
            </form>
          </div>
        )}

        {isCurrent && skill && (
          <div className="mb-6 space-y-3">
            {!running && !queued && (
              <form action={runSkillAction.bind(null, ep.id)}>
                <SubmitButton className="btn btn-primary" pendingText="Adding to the queue…">
                  <Sparkles className="size-4" strokeWidth={2} />
                  {!latest
                    ? `Run ${stage.label}`
                    : staleFrom && !open.length
                      ? `Run ${stage.label} on the updated ${getStage(staleFrom).label}`
                      : `Run ${stage.label} again`}
                  {open.length > 0 && (latest ? " with my comments" : " with my direction")}
                </SubmitButton>
              </form>
            )}
            {run && <RunCard run={run} />}
          </div>
        )}

        <div key={ep.updatedAt}>
          <Content ep={ep} format={format} targetSeconds={targetSeconds} save={save} stageKey={stageKey} pinned={pinned} running={run?.status === "running"} />
        </div>
      </section>

      {isCurrent && skill && (
        <section className="card p-6 ring-2 ring-accent/30">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            <ListChecks className="size-4 text-accent" strokeWidth={2} />
            Review {stage.label}
          </h3>

          <form className="mt-4 space-y-3">
            {stageKey === "script" && facts.length > 0 && (
              <fieldset>
                <legend className="label">Facts to build the script around</legend>
                <p className="mb-2 text-xs text-faint">
                  Tick the research facts that deserve the time. Claude leans on these and uses the rest only where the story needs them.
                </p>
                <div className="scroll-thin max-h-80 space-y-1 overflow-auto rounded-xl bg-panel-2 p-2">
                  {facts.map((f) => (
                    <label key={f.id} className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 text-[13px] hover:bg-fg/[0.04]">
                      <input type="checkbox" name="facts" value={f.id} className="mt-0.5 accent-[var(--accent)]" />
                      <span>
                        <span className="font-mono text-[11px] font-semibold text-accent">{f.id}</span> {f.text}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <label className="label" htmlFor={`review-${stageKey}`}>
              {latest ? "Your comments for Claude" : `Direction for ${stage.label} v1 (optional)`}
            </label>
            <textarea
              id={`review-${stageKey}`}
              name="body"
              rows={6}
              className="input text-[13px]"
              placeholder={
                sectionNames.length
                  ? sectionNames.map((n) => `${n}: …`).join("\n")
                  : "Anything to note before moving on?"
              }
            />
            <p className="text-xs text-faint">
              {latest
                ? "Write everything in this one box, section by section. Request Changes sends it to Claude for the next version. When you're happy, approve from the checklist on the right."
                : `Optional: anything ${stage.label} should know before it writes v1 (an angle, an emphasis, what to leave out). Save it, then press Run. Nothing earlier is re-run.`}
            </p>
            <div className="flex justify-end">
              <SubmitButton className="btn btn-primary" pendingText="Sending…" formAction={requestChangesAction.bind(null, ep.id)}>
                {latest ? "Request Changes" : "Save Direction"}
              </SubmitButton>
            </div>
          </form>
        </section>
      )}

    </>
  );
}

/** Notes pinned to a moment in the render that the next Make run hasn't answered yet. */
function openPinned(review: Awaited<ReturnType<typeof getReviewHistory>>) {
  return review.feedback
    .filter((f) => f.stage === "make" && f.addressedIn === null && f.atSec !== null)
    .map((f) => ({ id: f.id, atSec: f.atSec as number, scene: f.scene, body: f.body, author: f.author }))
    .sort((a, b) => a.atSec - b.atSec);
}

/** A stage's versions and review comments, newest first, in the right column under its checklist. */
function StageHistory({ stageKey, review }: { stageKey: string; review: Awaited<ReturnType<typeof getReviewHistory>> }) {
  const stage = getStage(stageKey);
  const thread = [
    ...review.revisions.filter((r) => r.stage === stageKey).map((r) => ({ kind: "version" as const, at: r.createdAt, order: 0, r })),
    ...review.feedback.filter((f) => f.stage === stageKey).map((f) => ({ kind: "note" as const, at: f.createdAt, order: 1, f })),
  ].sort((a, b) => b.at.localeCompare(a.at) || b.order - a.order);
  if (!thread.length) return null;
  return (
    <section className="card p-5">
      <h3 className="mb-3 flex items-center gap-2 text-[14px] font-semibold tracking-tight">
        <History className="size-4 text-accent" strokeWidth={2} /> {stage.label} versions and comments
      </h3>
      <ol className="space-y-3">
        {thread.map((t) =>
          t.kind === "version" ? (
            <li key={`v${t.r.id}`}>
              <details className="rounded-xl bg-panel-2 px-3 py-2 text-[13px]">
                <summary className="flex cursor-pointer items-center gap-2">
                  <span className="font-semibold">v{t.r.version}</span>
                  <span className="text-muted">by {t.r.author}</span>
                  <span className="ml-auto text-xs text-faint">{timeAgo(t.r.createdAt)}</span>
                </summary>
                <div className="scroll-thin mt-3 max-h-[480px] space-y-4 overflow-auto">
                  {Object.entries(JSON.parse(t.r.content) as Record<string, string>).map(([field, value]) => (
                    <div key={field}>
                      <div className="label">{FIELD_LABELS[field] ?? field}</div>
                      {value ? <Markdown>{value}</Markdown> : <p className="text-faint">Empty</p>}
                    </div>
                  ))}
                </div>
              </details>
            </li>
          ) : (
            <li key={`f${t.f.id}`} className="flex gap-2.5">
              <Avatar username={t.f.author} size={22} />
              <div className="min-w-0 flex-1">
                <div className="text-xs">
                  <span className="font-medium">{t.f.author}</span>{" "}
                  {t.f.atSec !== null && (
                    <span className="mr-1 rounded-md bg-accent/10 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-accent">
                      {timecode(t.f.atSec)}{t.f.scene ? ` ${t.f.scene}` : ""}
                    </span>
                  )}
                  <span className="text-muted">{t.f.version ? `requested changes on v${t.f.version}` : "gave direction"}</span>{" "}
                  <span className="text-faint">{timeAgo(t.f.createdAt)}</span>
                  <span className={`ml-2 font-medium ${t.f.addressedIn ? "text-ok" : "text-warn"}`}>
                    {t.f.addressedIn ? `Addressed in v${t.f.addressedIn}` : "Waiting for next version"}
                  </span>
                </div>
                <div className="mt-1 rounded-2xl rounded-tl-md bg-panel-2 px-3 py-2 text-[13px]">
                  <Markdown>{t.f.body}</Markdown>
                </div>
              </div>
            </li>
          ),
        )}
      </ol>
    </section>
  );
}

/** The stage's own checklist, shown at the top of the right column for whichever stage is open. */
function StageChecklist({ ep, stageKey, format, staleFrom, pinnedOpen }: { ep: Episode; stageKey: string; format: Format; staleFrom?: string; pinnedOpen: number }) {
  const stage = getStage(stageKey);
  const progress = checklistProgress(stageKey, ep.checklist);
  const openChecks = progress.total - progress.done;
  const items = checklistItems(stageKey, ep.checklist);
  const attention = items.filter((it) => !it.done && it.note).length;
  const isCurrent = stageKey === ep.stage;
  const next = isCurrent ? stepStage(stageKey, format) : undefined;
  const prev = isCurrent ? stepStage(stageKey, format, -1) : undefined;
  const proposal = isCurrent ? parseSendBack(ep) : null;
  const pinnedWaiting = stageKey === "make" || stageKey === "review" ? pinnedOpen : 0;
  return (
    <section className="card p-5">
      <div className="mb-1 flex items-center gap-2">
        <ListChecks className="size-4 text-accent" strokeWidth={2} />
        <h3 className="text-[15px] font-semibold tracking-tight">{stage.label} Checklist</h3>
        <span className={`ml-auto text-xs font-medium tabular-nums ${progress.done === progress.total ? "text-ok" : "text-faint"}`}>
          {progress.done}/{progress.total}
        </span>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-muted">
        These {progress.total} checks are only for the {stage.label} stage. Every stage has its own list.
        {stage.skill && " Claude ticks what it confirmed and flags what you should look at."}
      </p>
      {proposal && (
        <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-warn/10 px-2.5 py-1.5 text-xs font-medium text-warn">
          <TriangleAlert className="size-3.5" strokeWidth={2.2} />
          Fixes needed in {getStage(proposal.stage).label}: see the stage panel
        </p>
      )}
      {attention > 0 && (
        <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-warn/10 px-2.5 py-1.5 text-xs font-medium text-warn">
          <TriangleAlert className="size-3.5" strokeWidth={2.2} />
          {attention} item{attention === 1 ? " needs" : "s need"} your attention
        </p>
      )}
      {/* Remount when the checklist changes (e.g. Claude just updated it) so ticks and notes stay current */}
      <Checklist key={`${stageKey}:${ep.checklist}`} episodeId={ep.id} stage={stageKey} items={items} />
      {next && (
        <form action={approveStageAction.bind(null, ep.id)} className="mt-4 border-t border-line pt-4">
          <SubmitButton
            className="btn btn-primary w-full"
            pendingText="Approving…"
            confirmText={
              proposal
                ? `${stage.label} says ${getStage(proposal.stage).label} needs changes`
                : pinnedWaiting > 0
                  ? `${pinnedWaiting} pinned note${pinnedWaiting === 1 ? "" : "s"} not fixed yet`
                : staleFrom && stage.skill
                  ? `${stage.label} is out of date`
                  : openChecks > 0
                  ? `${openChecks} ${stage.label} checklist item${openChecks === 1 ? "" : "s"} still open`
                  : undefined
            }
            confirmMessage={
              proposal
                ? `Approve and move to ${next.label} anyway? The fixes won't reach ${getStage(proposal.stage).label}. Use "Send fixes to ${getStage(proposal.stage).label}" instead.`
                : pinnedWaiting > 0
                  ? `Approve and move to ${next.label} anyway? The render still has what those notes describe. To fix them, run Make with the notes first.`
                : staleFrom && stage.skill
                  ? `It was made before ${getStage(staleFrom).label} changed. Approve and move to ${next.label} anyway, or run ${stage.label} again first?`
                  : `Approve ${stage.label} and move to ${next.label} anyway?`
            }
            confirmLabel="Approve anyway"
          >
            <Check className="size-4" strokeWidth={2.4} /> Approve, move to {next.label}
          </SubmitButton>
        </form>
      )}
      {prev && (
        <form action={moveEpisodeAction.bind(null, ep.id, prev.key)} className="mt-2 flex justify-center">
          <SubmitButton className="btn btn-ghost btn-sm" pendingText="Moving…" confirmText={`Send back to ${prev.label}?`} confirmLabel="Send back">
            <ChevronLeft className="size-3.5" strokeWidth={2.2} /> Send back to {prev.label}
          </SubmitButton>
        </form>
      )}
    </section>
  );
}

type TabProps = {
  ep: Episode;
  format: Format;
  targetSeconds: number;
  save: (formData: FormData) => Promise<void>;
  stageKey: string;
  pinned: ReturnType<typeof openPinned>;
  running: boolean;
};

/** The render with its pinned notes. Notes can be added while this stage is the episode's current one and Make isn't running. */
async function PinnedPlayer({ ep, stageKey, pinned, running }: TabProps) {
  return (
    <TimedReview
      episodeId={ep.id}
      src={fresh(ep, ep.renderUrl)}
      poster={(await outFile(ep, "cover.png")) ?? undefined}
      scenes={await episodeScenes(ep.code)}
      notes={pinned}
      canNote={stageKey === ep.stage && !running}
    />
  );
}

/**
 * A stage's fields. `readOnly` drops the Save button: filled-in notes show as formatted text and change through
 * the Review box, so there's nothing to save until a field is empty and needs typing into.
 */
function TabForm({ save, readOnly, children }: { save: TabProps["save"]; readOnly?: boolean; children: React.ReactNode }) {
  return (
    <form action={save} className="space-y-5">
      {children}
      {!readOnly && (
        <div className="flex justify-end border-t border-line pt-5">
          <SubmitButton>Save Changes</SubmitButton>
        </div>
      )}
    </form>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-faint">{hint}</p>}
    </div>
  );
}

function IdeaTab({ ep, save }: TabProps) {
  const empty = emptyIdeaFields(ep);
  return (
    <>
    {ep.stage === "idea" && empty.length > 0 && (
      <div className="mb-5 rounded-xl bg-panel-2 px-4 py-3">
        <FillIdeasButton id={ep.id} label="Fill empty fields with AI" />
        <p className="mt-1.5 text-xs text-faint">
          Empty: {empty.map((f) => IDEA_FILL_FIELDS[f].label).join(", ")}. It won’t change what’s already written, and Research checks the facts later.
        </p>
      </div>
    )}
    <TabForm save={save}>
      <Field label="Hook: the first 2 seconds">
        <input name="hook" defaultValue={ep.hook} className="input" placeholder="A line that stops the scroll" />
      </Field>
      <MarkdownField name="summary" label="Details" defaultValue={ep.summary} rows={6} placeholder="What's the story and what will viewers walk away with?" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Why now, or why it will do well">
          <textarea name="whyNow" defaultValue={ep.whyNow} rows={3} className="input" />
        </Field>
        <Field label="Audience">
          <textarea name="audience" defaultValue={ep.audience} rows={3} className="input" />
        </Field>
      </div>
      <MarkdownField name="keyPoints" label="Key points to cover" defaultValue={ep.keyPoints} rows={5} />
      <MarkdownField name="visualIdeas" label="Visual ideas" defaultValue={ep.visualIdeas} rows={4} />
      <Field label="Tags"><input name="tags" defaultValue={ep.tags} className="input" placeholder="Comma separated" /></Field>
    </TabForm>
    </>
  );
}

function ResearchTab({ ep, save }: TabProps) {
  return (
    <TabForm save={save} readOnly={Boolean(ep.research && ep.sources)}>
      <MarkdownField
        name="research"
        label="Research notes"
        defaultValue={ep.research}
        rows={16}
        placeholder={"## The one insight\n…\n\n## Key facts and numbers\n- … (source)\n\n## How it works\n…\n\n## Open questions\n- …"}
        hint="Run Research above and Claude fills this in. You can also edit it yourself."
      />
      <MarkdownField name="sources" label="Sources" defaultValue={ep.sources} rows={6} placeholder={"- [Engineering blog title](https://…)\n- [Paper or talk](https://…)"} />
    </TabForm>
  );
}

function ScriptTab({ ep, targetSeconds, save }: TabProps) {
  return (
    <TabForm save={save} readOnly={Boolean(ep.script)}>
      <MarkdownField
        name="script"
        label="Voiceover script"
        defaultValue={ep.script}
        rows={18}
        showWordCount
        placeholder={"**HOOK (0–2s):** …\n\n**SETUP (2–10s):** …\n\n**HOW IT WORKS (10–45s):** …\n\n**PAYOFF (45–55s):** …\n\n**LOOP / CTA (55–60s):** …"}
        hint={`Series target ${targetSeconds}s, about ${Math.round(targetSeconds * 2.5)} words at a natural ElevenLabs pace.`}
      />
    </TabForm>
  );
}

/** One line for the folded fact-check: its own verdict line, else counts from the claims table. */
function factcheckSummary(md: string) {
  const verdict = md.match(/^\*\*Verdict:\*\*\s*(.+)$/m)?.[1]?.trim();
  if (verdict) return verdict;
  const rows = md.split("\n").filter((l) => /^\|\s*\d+\s*\|/.test(l));
  if (!rows.length) return md.trim() ? "Report written" : "Not checked yet";
  const count = (status: string) => rows.filter((r) => new RegExp(`\\|\\s*${status}\\s*\\|`, "i").test(r)).length;
  return `${rows.length} claims · ${count("Verified")} verified · ${count("Fix wording")} fix wording · ${count("Unsupported")} unsupported`;
}

/** The fact-check report, folded under the script. It opens by itself when a claim still needs fixing. */
function FactcheckTab({ ep, save }: TabProps) {
  const summary = factcheckSummary(ep.factcheck);
  const needsWork = /[1-9]\d*\s+(fix wording|unsupported)/i.test(summary);
  return (
    <details open={needsWork} className="rounded-xl bg-panel-2 px-4 py-3">
      <summary className="flex cursor-pointer items-center gap-2 text-[13px]">
        <ChevronRight className="chevron-rotate size-4 shrink-0 text-faint transition-transform" strokeWidth={2.2} />
        <span className="font-semibold">Fact-check report</span>
        <span className={`min-w-0 truncate ${needsWork ? "text-warn" : "text-muted"}`}>{summary}</span>
      </summary>
      <div className="mt-4">
        <TabForm save={save} readOnly={Boolean(ep.factcheck)}>
          <MarkdownField
            name="factcheck"
            label="Claims and sources"
            defaultValue={ep.factcheck}
            rows={16}
            placeholder={"| Claim in script | Source | Status |\n|---|---|---|\n| IRCTC sells ~X tickets/min at Tatkal open | https://… | Verified |\n| … | … | Fix wording |"}
            hint="Every claim in the script, its source and its status. The fixes are already applied to the script. A second person signs off using the checklist."
          />
        </TabForm>
      </div>
    </details>
  );
}

function StoryboardTab({ ep, save }: TabProps) {
  return (
    <TabForm save={save} readOnly={Boolean(ep.storyboard)}>
      <MarkdownField
        name="storyboard"
        label="Scene list"
        defaultValue={ep.storyboard}
        rows={18}
        placeholder={"| # | VO line | Visual | Component | Secs |\n|---|---|---|---|---|\n| 1 | “10 lakh people…” | Crowd of dots rushing a gate | ParticleQueue | 2 |\n| 2 | … | … | SystemDiagram | 4 |"}
        hint="Use component names from the Remotion studio library so rendering is mechanical."
      />
    </TabForm>
  );
}

/** URL of a file in the video project's out/ folder for this episode, if it exists (served by /media). */
async function outFile(ep: Episode, name: string) {
  return (await hasOutFile(ep.code, name)) ? `/media/out/${ep.code.toLowerCase()}/${name}?v=${encodeURIComponent(ep.updatedAt)}` : null;
}

/** Adds a cache-busting version to a /media URL so a re-render shows up without a hard refresh. */
function fresh(ep: Episode, url: string) {
  return url.startsWith("/media/") ? `${url}${url.includes("?") ? "&" : "?"}v=${encodeURIComponent(ep.updatedAt)}` : url;
}

async function VideoPlayer({ ep, src }: { ep: Episode; src: string }) {
  return (
    <video
      key={src}
      src={fresh(ep, src)}
      poster={(await outFile(ep, "cover.png")) ?? undefined}
      controls
      playsInline
      preload="metadata"
      className="aspect-[9/16] w-full max-w-[340px] rounded-2xl bg-black shadow-[var(--shadow-lg)]"
    />
  );
}

function VoiceoverTab({ ep, save }: TabProps) {
  return (
    <TabForm save={save}>
      {ep.voiceoverUrl ? (
        <div>
          <div className="label">Listen</div>
          <audio key={ep.voiceoverUrl} src={fresh(ep, ep.voiceoverUrl)} controls preload="metadata" className="w-full" />
        </div>
      ) : (
        <p className="rounded-xl bg-panel-2 px-4 py-3 text-[13px] text-muted">No voiceover yet. Run Make above (after the storyboard is approved).</p>
      )}
      <MarkdownField
        name="voiceoverNotes"
        label="Voiceover check"
        defaultValue={ep.voiceoverNotes}
        rows={10}
        placeholder="Pronunciation check per line, timings, anything to listen for."
      />
      <Field label="Voiceover file" hint="Set by the Voiceover skill. A /media/… path plays here.">
        <input name="voiceoverUrl" defaultValue={ep.voiceoverUrl} className="input font-mono text-[13px]" />
      </Field>
    </TabForm>
  );
}

function AnimationTab(props: TabProps) {
  const { ep, save } = props;
  return (
    <>
    {ep.renderUrl ? (
      <PinnedPlayer {...props} />
    ) : (
      <p className="rounded-xl bg-panel-2 px-4 py-3 text-[13px] text-muted">No render yet. Run Make above (after the storyboard is approved).</p>
    )}
    <TabForm save={save}>
      <MarkdownField
        name="renderNotes"
        label="Animation notes"
        defaultValue={ep.renderNotes}
        rows={10}
        placeholder="What each scene shows, sound design, anything to check."
      />
      <Field label="Render file" hint="Set by the Animation skill. A /media/… path plays here.">
        <input name="renderUrl" defaultValue={ep.renderUrl} className="input font-mono text-[13px]" />
      </Field>
    </TabForm>
    </>
  );
}

/** A carousel's slides, in order: one /media/… image path per line. */
function slideList(ep: Episode) {
  return ep.slides.split("\n").map((l) => l.trim()).filter(Boolean);
}

function SlideGallery({ ep }: { ep: Episode }) {
  const slides = slideList(ep);
  if (!slides.length) return null;
  return (
    <div>
      <div className="label">Slides ({slides.length}), swipe order</div>
      <div className="scroll-thin flex snap-x gap-3 overflow-x-auto pb-2">
        {slides.map((src, i) => (
          <a key={src} href={fresh(ep, src)} target="_blank" rel="noreferrer" className="relative shrink-0 snap-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fresh(ep, src)} alt={`Slide ${i + 1}`} className="h-[340px] w-auto rounded-xl bg-panel-2 shadow-[var(--shadow-lg)]" />
            <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">{i + 1}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function DesignTab({ ep, save }: TabProps) {
  return (
    <TabForm save={save}>
      {slideList(ep).length ? (
        <SlideGallery ep={ep} />
      ) : (
        <p className="rounded-xl bg-panel-2 px-4 py-3 text-[13px] text-muted">No slides yet. Run Make above (after the slide plan is approved).</p>
      )}
      {ep.renderUrl && (
        <div>
          <div className="label">Slideshow Short (YouTube)</div>
          <VideoPlayer ep={ep} src={ep.renderUrl} />
        </div>
      )}
      <MarkdownField
        name="designNotes"
        label="Design notes"
        defaultValue={ep.designNotes}
        rows={10}
        placeholder="What each slide shows, the sizes rendered, anything to check."
      />
      <Field label="Slides" hint="Set by the Design skill: one /media/… image path per line, in swipe order (4:5 versions).">
        <textarea name="slides" defaultValue={ep.slides} rows={4} className="input font-mono text-[12px]" />
      </Field>
      <Field label="Slideshow Short" hint="Set by the Design skill. A /media/… path plays here.">
        <input name="renderUrl" defaultValue={ep.renderUrl} className="input font-mono text-[13px]" />
      </Field>
    </TabForm>
  );
}

async function ReviewTab(props: TabProps) {
  const { ep, format, save, pinned, stageKey } = props;
  const sheet = await outFile(ep, "frames/sheet.jpg");
  const video = format === "video" && ep.renderUrl;
  return (
    <>
      {video && <PinnedPlayer {...props} />}
      {video && pinned.length > 0 && ep.stage === stageKey && (
        <form action={moveEpisodeAction.bind(null, ep.id, "make")} className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-warn/10 px-4 py-3">
          <span className="text-[13px] text-warn">
            {pinned.length} pinned note{pinned.length === 1 ? "" : "s"} ready. Make will change only {pinned.length === 1 ? "that moment’s scene" : "the scenes they’re in"}.
          </span>
          <SubmitButton className="btn btn-primary btn-sm" pendingText="Sending…">
            <ChevronLeft className="size-3.5" strokeWidth={2.2} /> Send to Make
          </SubmitButton>
        </form>
      )}
      <div className={video ? "mt-5" : undefined}>
        <TabForm save={save} readOnly={Boolean(ep.reviewReport)}>
          <SlideGallery ep={ep} />
          <div className="grid gap-5 md:grid-cols-[340px_1fr]">
            {!video && (ep.renderUrl ? <VideoPlayer ep={ep} src={ep.renderUrl} /> : <p className="text-[13px] text-muted">No render yet.</p>)}
            {sheet && (
              <div className={video ? "md:col-span-2" : undefined}>
                <div className="label">Every 2 seconds</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sheet} alt="Contact sheet of the render" className="w-full rounded-xl" />
              </div>
            )}
          </div>
          <MarkdownField
            name="reviewReport"
            label="Review report"
            defaultValue={ep.reviewReport}
            rows={12}
            placeholder="Technical checks, listen-back, visual issues with timestamps."
          />
        </TabForm>
      </div>
    </>
  );
}

async function PackagingTab({ ep, save }: TabProps) {
  const cover = await outFile(ep, "cover.png");
  return (
    <TabForm save={save}>
      {cover && (
        <div>
          <div className="label">Cover</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt="Cover frame" className="aspect-[9/16] w-full max-w-[220px] rounded-xl" />
        </div>
      )}
      <Field label="YouTube Shorts title" hint={`${ep.ytTitle.length}/100 characters`}>
        <input name="ytTitle" defaultValue={ep.ytTitle} maxLength={100} className="input" />
      </Field>
      <Field label="YouTube description">
        <textarea name="ytDescription" defaultValue={ep.ytDescription} rows={4} className="input" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Instagram caption">
          <textarea name="igCaption" defaultValue={ep.igCaption} rows={6} className="input" />
        </Field>
        <Field label="TikTok caption">
          <textarea name="tiktokCaption" defaultValue={ep.tiktokCaption} rows={6} className="input" />
        </Field>
      </div>
      <Field label="Hashtags"><input name="hashtags" defaultValue={ep.hashtags} className="input" placeholder="#systemdesign #claudecode" /></Field>
      <Field label="Cover or thumbnail notes"><textarea name="thumbnailNotes" defaultValue={ep.thumbnailNotes} rows={2} className="input" /></Field>
    </TabForm>
  );
}

async function ScheduledTab({ ep, save }: TabProps) {
  const video = await outFile(ep, "final.mp4");
  const cover = await outFile(ep, "cover.png");
  return (
    <TabForm save={save}>
      <div className="grid gap-4 sm:grid-cols-[200px_1fr] sm:items-end">
        <Field label="Publish date">
          <input type="date" name="publishDate" defaultValue={ep.publishDate ?? ""} className="input" />
        </Field>
        <div className="flex flex-wrap gap-2">
          {video && (
            <a href={video} download={`${ep.code}.mp4`} className="btn">
              <Play className="size-3.5 fill-current" strokeWidth={2} /> Download video
            </a>
          )}
          {cover && (
            <a href={cover} download={`${ep.code}-cover.png`} className="btn">
              Download cover
            </a>
          )}
        </div>
      </div>
      <MarkdownField
        name="publishPlan"
        label="Publishing plan"
        defaultValue={ep.publishPlan}
        rows={14}
        placeholder="Times per platform and the copy-paste upload kit."
      />
    </TabForm>
  );
}

function PostedTab({ ep, save }: TabProps) {
  return (
    <TabForm save={save}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="YouTube link"><input name="postedYt" defaultValue={ep.postedYt} className="input" /></Field>
        <Field label="Instagram link"><input name="postedIg" defaultValue={ep.postedIg} className="input" /></Field>
        <Field label="TikTok link"><input name="postedTiktok" defaultValue={ep.postedTiktok} className="input" /></Field>
      </div>
      <div>
        <div className="mb-3 text-[13px] font-semibold">7-day stats, all platforms combined</div>
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Views"><input type="number" name="views" defaultValue={ep.views ?? ""} className="input" /></Field>
          <Field label="Likes"><input type="number" name="likes" defaultValue={ep.likes ?? ""} className="input" /></Field>
          <Field label="Shares"><input type="number" name="shares" defaultValue={ep.shares ?? ""} className="input" /></Field>
          <Field label="Avg. retention %"><input type="number" step="0.1" name="avgRetention" defaultValue={ep.avgRetention ?? ""} className="input" /></Field>
        </div>
      </div>
      <MarkdownField name="analyticsNotes" label="What we learned" defaultValue={ep.analyticsNotes} rows={6} placeholder="Where did viewers drop off? What would we do differently?" />
    </TabForm>
  );
}
