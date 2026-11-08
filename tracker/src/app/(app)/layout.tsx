import {
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarClock,
  CalendarDays,
  Clapperboard,
  Ear,
  Eye,
  Film,
  Gauge,
  Images,
  Mic,
  Package,
  FileText,
  Layers,
  ListOrdered,
  LayoutGrid,
  Lightbulb,
  LogOut,
  Search,
  ShieldCheck,
  Sparkles,
  SquareKanban,
  Users,
  WandSparkles,
} from "lucide-react";
import { logout } from "@/app/actions";
import { AutoRefresh, HelperLink, NavLink, NavSection, SkillGroup, ThemeToggle } from "@/components/client";
import { DialogProvider } from "@/components/Dialog";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { unreadCount } from "@/lib/comments";
import { liveJobCount } from "@/lib/runner";
import { skillLabel, skillTree } from "@/lib/skills";

const iconProps = { className: "size-[17px]", strokeWidth: 1.8 };

const WORKSPACE = [
  { href: "/", label: "Dashboard", icon: <LayoutGrid {...iconProps} /> },
  { href: "/ideas", label: "Ideas", icon: <Lightbulb {...iconProps} /> },
  { href: "/board", label: "Pipeline", icon: <SquareKanban {...iconProps} /> },
  { href: "/calendar", label: "Calendar", icon: <CalendarDays {...iconProps} /> },
  { href: "/series", label: "Series", icon: <Layers {...iconProps} /> },
];

const TEAM = [
  { href: "/notifications", label: "Notifications", icon: <Bell {...iconProps} />, badgeLabel: "unread" },
  { href: "/queue", label: "Queue", icon: <ListOrdered {...iconProps} />, badgeLabel: "in the queue" },
  { href: "/users", label: "Users", icon: <Users {...iconProps} /> },
];

const SETTINGS = [
  { href: "/usage", label: "AI Usage", icon: <Gauge {...iconProps} /> },
];

type NavItem = { href: string; label: string; icon: React.ReactNode; badgeLabel?: string };

// Lucide ships no brand logos, so these three are inline.
const brandIcon = { className: "size-[17px]", viewBox: "0 0 24 24", "aria-hidden": true };

const CHANNELS = [
  {
    href: "https://studio.youtube.com",
    label: "YouTube Studio",
    title: "Sign in as projectcuriositystar@gmail.com",
    icon: (
      <svg {...brandIcon} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="4" />
        <path d="M10 9.2v5.6l4.8-2.8z" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "https://www.instagram.com/proj_curiosity/",
    label: "Instagram",
    title: "@proj_curiosity",
    icon: (
      <svg {...brandIcon} fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: "https://www.tiktok.com/@proj_curiosity",
    label: "TikTok",
    title: "@proj_curiosity",
    icon: (
      <svg {...brandIcon} fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
  },
];

function ChannelLink({ channel }: { channel: (typeof CHANNELS)[number] }) {
  return (
    <a
      href={channel.href}
      target="_blank"
      rel="noreferrer"
      title={channel.title}
      className="flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-[9px] px-2.5 py-[7px] text-[13px] font-medium text-fg/80 transition-colors hover:bg-fg/[0.06]"
    >
      <span className="text-accent">{channel.icon}</span>
      <span className="flex-1">{channel.label}</span>
      <ArrowUpRight className="size-3.5 text-faint" strokeWidth={1.8} aria-label="Opens in a new tab" />
    </a>
  );
}

const SKILL_ICONS: Record<string, React.ReactNode> = {
  research: <Search {...iconProps} />,
  script: <FileText {...iconProps} />,
  factcheck: <ShieldCheck {...iconProps} />,
  storyboard: <Clapperboard {...iconProps} />,
  voiceover: <Mic {...iconProps} />,
  animate: <Film {...iconProps} />,
  design: <Images {...iconProps} />,
  make: <Clapperboard {...iconProps} />,
  qa: <Eye {...iconProps} />,
  package: <Package {...iconProps} />,
  publish: <CalendarClock {...iconProps} />,
  posted: <BarChart3 {...iconProps} />,
  humanizer: <WandSparkles {...iconProps} />,
  earshot: <Ear {...iconProps} />,
};

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const tree = skillTree();
  const [unread, jobs] = await Promise.all([unreadCount(user.username), liveJobCount()]);
  const badges: Record<string, number> = { "/notifications": unread, "/queue": jobs };
  const navLinks = (items: NavItem[]) =>
    items.map((item) => (
      <NavLink key={item.href} href={item.href} icon={item.icon} badge={badges[item.href]} badgeLabel={item.badgeLabel}>
        {item.label}
      </NavLink>
    ));
  const stageSkills = tree.stages.map((s) => s.skill);

  return (
    <DialogProvider>
      <div className="flex min-h-screen">
        <aside className="vibrancy scroll-thin sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col overflow-y-auto border-r border-line px-3 pb-3 pt-5 md:flex">
          <div className="mb-6 flex items-center gap-2.5 px-2">
            <Logo size={30} />
            <div className="leading-tight">
              <div className="text-[13px] font-semibold tracking-tight">Curiously</div>
              <div className="text-[11px] text-muted">Studio</div>
            </div>
          </div>

          <div className="mb-1.5 px-2.5 text-[11px] font-semibold text-faint">Workspace</div>
          <nav className="space-y-0.5">{navLinks(WORKSPACE)}</nav>

          {/* Not foldable, so the unread and queue counts are always in view. */}
          <div className="mb-1.5 mt-6 px-2.5 text-[11px] font-semibold text-faint">Team</div>
          <nav className="space-y-0.5">{navLinks(TEAM)}</nav>

          {tree.stages.length > 0 && (
            <NavSection id="skills" label="Skills">
              <nav className="space-y-0.5">
                {tree.stages.map(({ skill, helpers }) => {
                  const link = (
                    <NavLink href={`/skills/${skill.name}`} icon={SKILL_ICONS[skill.name] ?? <Sparkles {...iconProps} />}>
                      {skillLabel(skill)}
                    </NavLink>
                  );
                  if (!helpers.length) return <div key={skill.name}>{link}</div>;
                  return (
                    <SkillGroup key={skill.name} id={`skill:${skill.name}`} link={link} helperHrefs={helpers.map((h) => `/skills/${h.name}`)}>
                      <div className="mb-1 ml-[19px] border-l border-line pl-2">
                        {helpers.map((h) => (
                          <HelperLink key={h.name} href={`/skills/${h.name}`}>
                            {skillLabel(h)}
                          </HelperLink>
                        ))}
                      </div>
                    </SkillGroup>
                  );
                })}
                {tree.other.length > 0 && (
                  <div className="pt-2">
                    <SkillGroup
                      id="skill:other"
                      link={<div className="px-2.5 py-1 text-[11px] text-faint">Other helpers</div>}
                      helperHrefs={tree.other.map((h) => `/skills/${h.name}`)}
                    >
                      <div className="ml-[19px] border-l border-line pl-2">
                        {tree.other.map((h) => (
                          <HelperLink key={h.name} href={`/skills/${h.name}`}>
                            {skillLabel(h)}
                          </HelperLink>
                        ))}
                      </div>
                    </SkillGroup>
                  </div>
                )}
              </nav>
            </NavSection>
          )}

          <NavSection id="channels" label="Channels">
            <nav className="space-y-0.5">
              {CHANNELS.map((channel) => (
                <ChannelLink key={channel.href} channel={channel} />
              ))}
            </nav>
          </NavSection>

          <NavSection id="settings" label="Settings">
            <nav className="space-y-0.5">{navLinks(SETTINGS)}</nav>
          </NavSection>

        <div className="mt-auto space-y-3 pt-6">
            <ThemeToggle />
            <div className="flex items-center gap-2.5 rounded-xl bg-fg/[0.04] p-2">
              <Avatar username={user.username} size={28} />
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[13px] font-medium">{user.name}</div>
                <div className="text-[11px] capitalize text-muted">{user.role}</div>
              </div>
              <form action={logout}>
                <button className="btn btn-ghost btn-icon" title="Sign out" aria-label="Sign out">
                  <LogOut className="size-4" strokeWidth={1.8} />
                </button>
              </form>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Compact nav for narrow windows */}
          <nav className="vibrancy scroll-thin sticky top-0 z-10 flex items-center gap-1 overflow-x-auto border-b border-line px-3 py-2 md:hidden">
            {navLinks([...WORKSPACE, ...TEAM, ...SETTINGS])}
            {stageSkills.map((skill) => (
              <NavLink key={skill.name} href={`/skills/${skill.name}`} icon={SKILL_ICONS[skill.name] ?? <Sparkles {...iconProps} />}>
                {skillLabel(skill)}
              </NavLink>
            ))}
            {CHANNELS.map((channel) => (
              <ChannelLink key={channel.href} channel={channel} />
            ))}
            <form action={logout} className="shrink-0">
              <button className="btn btn-ghost btn-sm whitespace-nowrap">
                <LogOut className="size-4" strokeWidth={1.8} /> Sign out
              </button>
            </form>
          </nav>
          <main className="flex-1 px-5 py-7 md:px-10 md:py-10">{children}</main>
        </div>
        <AutoRefresh />
      </div>
    </DialogProvider>
  );
}
