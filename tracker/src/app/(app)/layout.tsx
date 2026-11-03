import {
  BarChart3,
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
  LayoutGrid,
  Lightbulb,
  LogOut,
  Search,
  ShieldCheck,
  Sparkles,
  SquareKanban,
  WandSparkles,
} from "lucide-react";
import { logout } from "@/app/actions";
import { AutoRefresh, HelperLink, NavLink, NavSection, SkillGroup, ThemeToggle } from "@/components/client";
import { DialogProvider } from "@/components/Dialog";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { skillLabel, skillTree } from "@/lib/skills";

const iconProps = { className: "size-[17px]", strokeWidth: 1.8 };

const NAV = [
  { href: "/", label: "Dashboard", icon: <LayoutGrid {...iconProps} /> },
  { href: "/ideas", label: "Ideas", icon: <Lightbulb {...iconProps} /> },
  { href: "/board", label: "Pipeline", icon: <SquareKanban {...iconProps} /> },
  { href: "/calendar", label: "Calendar", icon: <CalendarDays {...iconProps} /> },
  { href: "/series", label: "Series", icon: <Layers {...iconProps} /> },
  { href: "/usage", label: "AI Usage", icon: <Gauge {...iconProps} /> },
];

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
          <nav className="space-y-0.5">
            {NAV.map((item) => (
              <NavLink key={item.href} href={item.href} icon={item.icon}>
                {item.label}
              </NavLink>
            ))}
          </nav>

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

        <div className="mt-auto space-y-3 pt-6">
            <ThemeToggle />
            <div className="flex items-center gap-2.5 rounded-xl bg-fg/[0.04] p-2">
              <Avatar username={user.username} size={28} />
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[13px] font-medium">{user.name}</div>
                <div className="text-[11px] text-muted">Signed in</div>
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
            {NAV.map((item) => (
              <NavLink key={item.href} href={item.href} icon={item.icon}>
                {item.label}
              </NavLink>
            ))}
            {stageSkills.map((skill) => (
              <NavLink key={skill.name} href={`/skills/${skill.name}`} icon={SKILL_ICONS[skill.name] ?? <Sparkles {...iconProps} />}>
                {skillLabel(skill)}
              </NavLink>
            ))}
          </nav>
          <main className="flex-1 px-5 py-7 md:px-10 md:py-10">{children}</main>
        </div>
        <AutoRefresh />
      </div>
    </DialogProvider>
  );
}
