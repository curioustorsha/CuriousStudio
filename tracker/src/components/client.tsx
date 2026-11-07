"use client";

import { ChevronRight, Circle, CircleCheck, Eye, EyeOff, Monitor, Moon, Sparkles, Sun, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { useFormStatus } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { fillIdeasAction, saveApiKeyAction, toggleChecklistAction } from "@/app/actions";
import type { checklistItems } from "@/lib/stages";
import { useDialog } from "./Dialog";

export function NavLink({ href, icon, badge, badgeLabel, children }: { href: string; icon?: React.ReactNode; badge?: number; badgeLabel?: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-[9px] px-2.5 py-[7px] text-[13px] font-medium transition-colors ${
        active ? "bg-accent text-white" : "text-fg/80 hover:bg-fg/[0.06]"
      }`}
    >
      {icon && <span className={active ? "text-white" : "text-accent"}>{icon}</span>}
      {children}
      {!!badge && (
        <span aria-label={`${badge} ${badgeLabel}`} className={`ml-auto rounded-full px-1.5 text-[11px] font-semibold tabular-nums ${active ? "bg-white/25 text-white" : "bg-accent text-white"}`}>
          {badge}
        </span>
      )}
    </Link>
  );
}

/** A helper skill nested under its stage skill in the sidebar: smaller, no icon. */
export function HelperLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`block truncate rounded-[7px] px-2 py-[3px] text-[12px] transition-colors ${
        active ? "bg-accent/15 font-medium text-accent" : "text-muted hover:bg-fg/[0.06] hover:text-fg"
      }`}
    >
      {children}
    </Link>
  );
}

// ── Collapsible sidebar groups ────────────────────────────────────────

const FOLD_KEY = "pb-sidebar-folds";
const foldListeners = new Set<() => void>();

/** Open/closed state per sidebar group, kept in localStorage so it survives reloads. Raw string for a stable snapshot. */
function useFolds() {
  const raw = useSyncExternalStore(
    (cb) => {
      foldListeners.add(cb);
      return () => foldListeners.delete(cb);
    },
    () => localStorage.getItem(FOLD_KEY) ?? "{}",
    () => "{}",
  );
  const folds = JSON.parse(raw) as Record<string, boolean>;
  const set = (id: string, open: boolean) => {
    localStorage.setItem(FOLD_KEY, JSON.stringify({ ...folds, [id]: open }));
    foldListeners.forEach((l) => l());
  };
  return [folds, set] as const;
}

function Chevron({ open }: { open: boolean }) {
  return <ChevronRight className={`size-3.5 transition-transform ${open ? "rotate-90" : ""}`} strokeWidth={2} />;
}

/** A sidebar section heading ("Skills") that folds everything under it. */
export function NavSection({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  const [folds, set] = useFolds();
  const open = folds[id] ?? true;
  return (
    <div>
      <button
        type="button"
        onClick={() => set(id, !open)}
        aria-expanded={open}
        className="mb-1.5 mt-6 flex w-full items-center gap-1 px-2.5 text-[11px] font-semibold text-faint hover:text-muted"
      >
        <span className="flex-1 text-left">{label}</span>
        <Chevron open={open} />
      </button>
      {open && children}
    </div>
  );
}

/**
 * A stage skill in the sidebar with its helper skills folded underneath. Helpers start folded, and open by
 * themselves while you're on one of their pages.
 */
export function SkillGroup({
  id,
  link,
  helperHrefs,
  children,
}: {
  id: string;
  link: React.ReactNode;
  helperHrefs: string[];
  children: React.ReactNode;
}) {
  const [folds, set] = useFolds();
  const pathname = usePathname();
  const open = folds[id] ?? helperHrefs.includes(pathname);
  return (
    <div>
      <div className="flex items-center">
        <div className="min-w-0 flex-1">{link}</div>
        <button
          type="button"
          onClick={() => set(id, !open)}
          aria-expanded={open}
          aria-label={open ? "Hide helper skills" : "Show helper skills"}
          title={`${helperHrefs.length} helper skill${helperHrefs.length === 1 ? "" : "s"}`}
          className="ml-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-faint hover:bg-fg/[0.06] hover:text-fg"
        >
          <Chevron open={open} />
        </button>
      </div>
      {open && children}
    </div>
  );
}

// ── Claude API key ────────────────────────────────────────────────────

/** Paste, replace or remove the Claude API key. The key is never sent back to the browser. */
export function PasswordInput({ className = "", ...props }: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;
  return (
    <div className="relative w-full">
      <input {...props} type={visible ? "text" : "password"} className={`${className} pr-10`} />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? "Hide password" : "Show password"}
        title={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted hover:text-fg"
      >
        <Icon className="size-4" strokeWidth={1.8} />
      </button>
    </div>
  );
}

/** Older notes and history, folded away. Opens itself when a link points at the feed or at a comment inside it. */
export function FeedDisclosure({ summary, children }: { summary: string; children: React.ReactNode }) {
  const details = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const reveal = () => {
      const { hash } = window.location;
      if (!details.current || !/^#(feed$|comment-\d+$)/.test(hash)) return;
      details.current.open = true;
      document.querySelector(hash)?.scrollIntoView({ block: "center" });
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, []);
  return (
    <details ref={details} className="group mt-3">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[13px] font-medium text-muted hover:text-fg [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-4 transition-transform group-open:rotate-90" strokeWidth={2} />
        {summary}
      </summary>
      <div className="scroll-thin mt-3 max-h-96 overflow-y-auto p-1.5">{children}</div>
    </details>
  );
}

/** A comment box that suggests people when you type @. */
export function MentionInput({
  users,
  label,
  placeholder,
}: {
  users: { username: string; name: string }[];
  label: string;
  placeholder: string;
}) {
  const box = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState<string | null>(null);
  const [selected, setSelected] = useState(0);
  const matches =
    query === null
      ? []
      : users.filter((u) => u.username !== query && (u.username.startsWith(query) || u.name.toLowerCase().startsWith(query))).slice(0, 6);

  const update = () => {
    const el = box.current;
    if (!el) return;
    const typed = el.value.slice(0, el.selectionStart).match(/(?:^|\s)@([a-z0-9_-]*)$/i);
    setQuery(typed ? typed[1].toLowerCase() : null);
    setSelected(0);
  };
  const choose = (username: string) => {
    const el = box.current;
    if (!el || query === null) return;
    const caret = el.selectionStart;
    const start = caret - query.length;
    el.value = `${el.value.slice(0, start)}${username} ${el.value.slice(caret)}`;
    el.selectionStart = el.selectionEnd = start + username.length + 1;
    el.focus();
    setQuery(null);
  };

  return (
    <div className="relative">
      <textarea
        ref={box}
        name="body"
        rows={2}
        required
        maxLength={5000}
        aria-label={label}
        placeholder={placeholder}
        className="input text-[13px]"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={matches.length > 0}
        aria-controls="mention-options"
        aria-activedescendant={matches.length ? `mention-${matches[selected]?.username}` : undefined}
        onInput={update}
        onClick={update}
        onBlur={() => setQuery(null)}
        onKeyDown={(e) => {
          if (!matches.length) return;
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setSelected((selected + (e.key === "ArrowDown" ? 1 : matches.length - 1)) % matches.length);
          } else if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();
            choose(matches[selected].username);
          } else if (e.key === "Escape") {
            setQuery(null);
          }
        }}
      />
      {matches.length > 0 && (
        <ul id="mention-options" role="listbox" aria-label="People" className="absolute left-0 z-20 mt-1 w-56 overflow-hidden rounded-xl border border-line bg-panel py-1 shadow-lg">
          {matches.map((u, i) => (
            <li
              key={u.username}
              id={`mention-${u.username}`}
              role="option"
              aria-selected={i === selected}
              // Keeps the textarea focused so its blur doesn't close this list before the click lands.
              onMouseDown={(e) => {
                e.preventDefault();
                choose(u.username);
              }}
              className={`cursor-pointer px-3 py-1.5 text-[13px] ${i === selected ? "bg-accent text-white" : ""}`}
            >
              {u.name} <span className={i === selected ? "text-white/70" : "text-faint"}>@{u.username}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** A form whose server action reports `{ error }` or `{ ok }` under the fields. */
export function ResultForm({
  action,
  okText = "Saved.",
  className,
  children,
}: {
  action: (prev: { error?: string; ok?: boolean } | undefined, formData: FormData) => Promise<{ error?: string; ok?: boolean } | undefined>;
  okText?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, undefined);
  return (
    <form action={formAction} className={className}>
      {children}
      {state?.error && <p role="alert" className="text-xs text-danger">{state.error}</p>}
      {state?.ok && <p role="status" className="text-xs text-ok">{okText}</p>}
    </form>
  );
}

export function ApiKeyForm({ isSet }: { isSet: boolean }) {
  const [state, action, pending] = useActionState(saveApiKeyAction, undefined);
  return (
    <form action={action} className="space-y-2">
      <input
        name="key"
        type="password"
        autoComplete="off"
        spellCheck={false}
        placeholder={isSet ? "Paste a new key to replace it" : "sk-ant-…"}
        className="input font-mono text-[12px]"
      />
      {state?.error && <p className="text-xs text-danger">{state.error}</p>}
      {state?.ok && <p className="text-xs text-ok">Saved. The next run uses it.</p>}
      <div className="flex gap-2">
        <button className="btn btn-primary btn-sm flex-1" disabled={pending}>
          {pending ? "Saving…" : isSet ? "Replace Key" : "Save Key"}
        </button>
        {isSet && (
          <button name="remove" value="1" className="btn btn-ghost btn-sm" disabled={pending}>
            Remove
          </button>
        )}
      </div>
    </form>
  );
}

// ── Theme ─────────────────────────────────────────────────────────────

type ThemePref = "system" | "light" | "dark";
const THEME_KEY = "pb-theme";
const themeListeners = new Set<() => void>();

function applyTheme(pref: ThemePref) {
  const dark = pref === "dark" || (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

function readTheme(): ThemePref {
  return (localStorage.getItem(THEME_KEY) as ThemePref) || "system";
}

export function ThemeToggle() {
  const pref = useSyncExternalStore(
    (cb) => {
      themeListeners.add(cb);
      return () => themeListeners.delete(cb);
    },
    readTheme,
    () => "system" as ThemePref,
  );

  // Follow macOS / Windows appearance changes live while on "system".
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => readTheme() === "system" && applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const set = (next: ThemePref) => {
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
    themeListeners.forEach((l) => l());
  };

  const options: { key: ThemePref; label: string; icon: React.ReactNode }[] = [
    { key: "light", label: "Light", icon: <Sun className="size-3.5" /> },
    { key: "dark", label: "Dark", icon: <Moon className="size-3.5" /> },
    { key: "system", label: "Automatic", icon: <Monitor className="size-3.5" /> },
  ];

  return (
    <div className="segmented w-full" role="radiogroup" aria-label="Appearance">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          role="radio"
          aria-checked={pref === o.key}
          title={o.label}
          data-active={pref === o.key}
          onClick={() => set(o.key)}
          className="flex-1 !px-2 !py-1.5"
        >
          {o.icon}
        </button>
      ))}
    </div>
  );
}

// ── Sync ──────────────────────────────────────────────────────────────

/** Keeps both partners' views in sync without a realtime backend. */
export function AutoRefresh({ seconds = 20 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => {
      const editing = document.activeElement?.matches("input, textarea, select");
      if (document.visibilityState === "visible" && !editing) router.refresh();
    };
    const t = setInterval(tick, seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}

/** Refreshes every few seconds while a skill run is in progress, so its steps stream in. */
export function RunWatcher({ seconds = 3 }: { seconds?: number }) {
  return <AutoRefresh seconds={seconds} />;
}

// ── Forms ─────────────────────────────────────────────────────────────

/** A select that applies its filter as soon as it changes, by submitting the form it sits in. */
export function AutoSubmitSelect(props: React.ComponentProps<"select">) {
  return <select {...props} onChange={(event) => event.currentTarget.form?.requestSubmit()} />;
}

export function SubmitButton({
  children,
  className = "btn btn-primary",
  pendingText = "Saving…",
  confirmText,
  confirmMessage,
  confirmLabel,
  formAction,
  formNoValidate,
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  /** Ask in an in-app dialog before submitting, e.g. when moving on with checklist items still open. */
  confirmText?: string;
  confirmMessage?: string;
  confirmLabel?: string;
  /** For a second button in the same form that does something else with the same fields. */
  formAction?: (formData: FormData) => void | Promise<void>;
  formNoValidate?: boolean;
}) {
  const { pending, action } = useFormStatus();
  const dialog = useDialog();
  // With two buttons in one form, only the one that was pressed shows its pending text.
  const mine = pending && (!formAction || action === formAction);
  return (
    <button
      className={className}
      disabled={pending}
      formAction={formAction}
      formNoValidate={formNoValidate}
      onClick={async (e) => {
        if (!confirmText) return;
        e.preventDefault();
        const button = e.currentTarget;
        const ok = await dialog.confirm({ title: confirmText, message: confirmMessage, confirmLabel });
        // requestSubmit keeps this button as the submitter, so its formAction and formNoValidate still apply.
        if (ok) button.form?.requestSubmit(button);
      }}
    >
      {mine ? pendingText : children}
    </button>
  );
}

/**
 * Fills ideas' empty fields with AI. Give `id` for one idea, or `formId` for the Ideas list, whose ticked checkboxes
 * name that form. Everything it writes can be edited afterwards, and it never replaces what's already there.
 */
export function FillIdeasButton({ id, formId, label }: { id?: number; formId?: string; label: string }) {
  const [state, action, pending] = useActionState(fillIdeasAction, undefined);
  return (
    <form id={formId} action={action} className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {id !== undefined && <input type="hidden" name="ids" value={id} />}
      <button className="btn btn-sm whitespace-nowrap" disabled={pending}>
        <Sparkles className="size-3.5" strokeWidth={2} /> {pending ? "Queuing…" : label}
      </button>
      {state && !pending && <span role="status" className={`text-xs ${state.failed ? "text-danger" : "text-muted"}`}>{state.message}</span>}
    </form>
  );
}

/** Ticks or clears every row checkbox of a form, which on the Ideas list means every idea the filters show. `syncKey` changes when those rows do. */
export function SelectAllIdeas({ formId, syncKey }: { formId: string; syncKey: string }) {
  const box = useRef<HTMLInputElement>(null);
  const rows = () => [...document.querySelectorAll<HTMLInputElement>(`input[type=checkbox][name=ids][form="${formId}"]`)];

  useEffect(() => {
    const sync = () => {
      const all = rows();
      const ticked = all.filter((r) => r.checked).length;
      if (!box.current) return;
      box.current.disabled = all.length === 0;
      box.current.checked = all.length > 0 && ticked === all.length;
      box.current.indeterminate = ticked > 0 && ticked < all.length;
    };
    sync();
    document.addEventListener("change", sync);
    return () => document.removeEventListener("change", sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, syncKey]);

  return (
    <input
      ref={box}
      type="checkbox"
      aria-label="Select all ideas shown"
      title="Select all ideas shown"
      className="check-round block"
      onChange={(e) => rows().forEach((r) => (r.checked = e.target.checked))}
    />
  );
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-pb">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}

export function MarkdownField({
  name,
  label,
  defaultValue,
  placeholder,
  rows = 12,
  hint,
  showWordCount,
}: {
  name: string;
  label: string;
  defaultValue: string;
  placeholder?: string;
  rows?: number;
  hint?: string;
  showWordCount?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  // Notes are read, not edited: anything with content shows as formatted Markdown, and changes normally go
  // through the stage's Review box. "Edit" opens the text for a small fix by hand; saving makes a new version.
  // An empty field stays a text box so it can still be filled in.
  const hasContent = defaultValue.trim() !== "";
  const [preview, setPreview] = useState(hasContent);
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="label mb-0">{label}</span>
        <span className="flex items-center gap-3">
          {showWordCount && (
            <span className={`text-xs tabular-nums ${words > 160 ? "text-warn" : "text-faint"}`}>
              {words} words · ~{Math.round(words / 2.5)}s spoken
            </span>
          )}
          {hasContent && preview && (
            <button type="button" onClick={() => setPreview(false)} className="text-xs font-medium text-accent hover:opacity-80">
              Edit
            </button>
          )}
        </span>
      </div>
      {/* Textarea stays mounted while previewing so the form still submits it */}
      <textarea
        name={name}
        rows={rows}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={`input ${preview ? "hidden" : ""}`}
      />
      {preview && (
        <div className="rounded-[10px] bg-panel-2 px-4 py-2">
          <Markdown>{value}</Markdown>
        </div>
      )}
      {hasContent && !preview && (
        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setValue(defaultValue);
              setPreview(true);
            }}
            className="btn btn-ghost btn-sm"
          >
            Cancel
          </button>
          <SubmitButton className="btn btn-primary btn-sm" pendingText="Saving…">
            Save as a new version
          </SubmitButton>
        </div>
      )}
      {hint && <p className="mt-2 text-xs text-faint">{hint}</p>}
    </div>
  );
}

export function Checklist({
  episodeId,
  stage,
  items,
}: {
  episodeId: number;
  stage: string;
  items: ReturnType<typeof checklistItems>;
}) {
  const [done, setDone] = useState(() => items.map((it) => it.done));
  const [, startTransition] = useTransition();

  return (
    <ul className="-mx-1.5 space-y-0.5">
      {items.map((it, i) => {
        const key = `${stage}:${i}`;
        const on = done[i];
        const flagged = !on && it.note;
        return (
          <li key={key}>
            <button
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => {
                setDone((d) => d.map((v, j) => (j === i ? !on : v)));
                startTransition(() => toggleChecklistAction(episodeId, key, !on));
              }}
              className="flex w-full items-start gap-2.5 rounded-[9px] px-1.5 py-1.5 text-left text-[13px] transition-colors hover:bg-panel-2"
            >
              {on ? (
                <CircleCheck className="mt-px size-[18px] shrink-0 fill-accent text-panel" strokeWidth={2} />
              ) : (
                <Circle className={`mt-px size-[18px] shrink-0 ${flagged ? "text-warn" : "text-faint"}`} strokeWidth={1.6} />
              )}
              <span className="min-w-0">
                <span className={on ? "text-faint line-through decoration-faint/60" : ""}>{it.text}</span>
                {it.humanOnly && <span className="ml-1.5 text-[10px] font-medium text-faint">You tick this</span>}
                {on && it.by === "claude" && <span className="ml-1.5 text-[10px] font-medium text-accent">Ticked by Claude</span>}
              </span>
            </button>
            {it.note && (
              <p
                className={`mb-1 ml-8 mr-1.5 rounded-lg px-2.5 py-1.5 text-xs leading-relaxed ${
                  flagged ? "bg-warn/10 text-warn" : "text-muted"
                }`}
              >
                {flagged && <TriangleAlert className="-mt-px mr-1 inline size-3" strokeWidth={2.2} />}
                {it.note}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * A skill's instructions as formatted text (frontmatter hidden). "Edit" opens the full SKILL.md, frontmatter
 * included, and saving rewrites the file. Remount with `key={content}` so it closes again after a save.
 */
export function SkillInstructions({ content, save, canEdit }: { content: string; save: (formData: FormData) => Promise<void>; canEdit: boolean }) {
  const [editing, setEditing] = useState(false);
  const body = content.replace(/^---\n[\s\S]*?\n---\n?/, "");

  if (editing) {
    return (
      <form action={save} className="space-y-3">
        <textarea
          name="content"
          defaultValue={content}
          rows={32}
          spellCheck={false}
          className="input font-mono text-[12px] leading-relaxed"
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setEditing(false)} className="btn btn-ghost btn-sm">
            Cancel
          </button>
          <SubmitButton className="btn btn-primary btn-sm">Save Instructions</SubmitButton>
        </div>
      </form>
    );
  }
  return (
    <div className="relative">
      {canEdit && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="absolute right-0 top-0 text-xs font-medium text-accent hover:opacity-80"
        >
          Edit
        </button>
      )}
      <Markdown>{body}</Markdown>
    </div>
  );
}
