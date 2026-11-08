import "server-only";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { IS_WORKER, PROJECT_DIR } from "./media";
import { STAGES } from "./stages";

export { PROJECT_DIR };

const SKILLS_DIR = join(PROJECT_DIR, ".claude", "skills");

export type Skill = {
  name: string;
  description: string;
  content: string;
  /** Stage this skill does the work for, or null for helper skills such as humanizer. */
  stage: (typeof STAGES)[number] | null;
  /** Installed from someone else's repo (ships a LICENSE) rather than written for Curiously. */
  installed: boolean;
};

function frontmatterField(content: string, field: string) {
  const fm = content.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const lines = fm.split("\n");
  const i = lines.findIndex((l) => l.startsWith(`${field}:`));
  if (i === -1) return "";
  const value = lines[i].slice(field.length + 1).trim();
  if (value !== "|" && value !== ">") return value.replace(/^["']|["']$/g, "");
  const block: string[] = [];
  for (const l of lines.slice(i + 1)) {
    if (!/^\s+/.test(l)) break;
    block.push(l.trim());
  }
  return block.join(" ");
}

function readSkill(name: string): Skill | null {
  const file = join(SKILLS_DIR, name, "SKILL.md");
  if (!existsSync(file)) return null;
  const content = readFileSync(file, "utf8");
  return {
    name,
    description: frontmatterField(content, "description"),
    content,
    stage: STAGES.find((s) => s.skill === name) ?? null,
    installed: existsSync(join(SKILLS_DIR, name, "LICENSE")),
  };
}

/** Stage skills in pipeline order, then helper skills by name. */
export function listSkills(): Skill[] {
  if (!existsSync(SKILLS_DIR)) return [];
  const skills = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => readSkill(d.name))
    .filter((s): s is Skill => s !== null);
  const order = (s: Skill) => (s.stage ? STAGES.indexOf(s.stage) : STAGES.length);
  return skills.sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name));
}

export function getSkill(name: string) {
  return listSkills().find((s) => s.name === name) ?? null;
}

/**
 * Whether a skill's instructions call another skill: skills name the helpers they use in bold ("follow the
 * **package** skill"). Backticks don't count: `factcheck` or `storyboard` in backticks is usually an episode field.
 */
function mentions(skill: Skill, name: string) {
  return skill.content.includes(`**${name}**`);
}

/**
 * Stage skills in pipeline order, each with the helper skills its instructions use. A helper can sit under
 * several stages (earshot: Animation and Review). Helpers no stage uses come back in `other`.
 */
export function skillTree() {
  const all = listSkills();
  const helpers = all.filter((s) => !s.stage);
  // A stage's helpers include the helpers its helpers use (Make → voiceover → elevenlabs-text-to-speech).
  const reach = (skill: Skill) => {
    const found: Skill[] = [];
    const queue = [skill];
    while (queue.length) {
      const s = queue.shift()!;
      for (const h of helpers) {
        if (!found.includes(h) && mentions(s, h.name)) {
          found.push(h);
          queue.push(h);
        }
      }
    }
    return found;
  };
  const stages = all.filter((s) => s.stage).map((skill) => ({ skill, helpers: reach(skill) }));
  const used = new Set(stages.flatMap((s) => s.helpers.map((h) => h.name)));
  return { stages, other: helpers.filter((h) => !used.has(h.name)) };
}

/** Stage skills whose instructions use this helper. */
export function usedBy(helper: Skill) {
  return listSkills().filter((s) => s.stage && mentions(s, helper.name));
}

const HELPER_LABELS: Record<string, string> = {
  humanizer: "Humanizer",
  "remotion-best-practices": "Remotion",
  "elevenlabs-text-to-speech": "ElevenLabs voice",
  "elevenlabs-speech-to-text": "ElevenLabs listen-back",
  "elevenlabs-sound-effects": "ElevenLabs sound effects",
  "elevenlabs-music": "ElevenLabs music",
  "yt-package": "YouTube title & cover",
  "yt-seo": "YouTube description & SEO",
  "yt-comment": "YouTube comments",
  earshot: "earshot (audio check)",
};

export function skillLabel(skill: Skill) {
  if (skill.stage) return skill.stage.label;
  const words = skill.name.replace(/-/g, " ");
  return HELPER_LABELS[skill.name] ?? words.charAt(0).toUpperCase() + words.slice(1);
}

/** Overwrites a skill's SKILL.md. Only existing skills can be saved (no new paths from form input). */
export function saveSkill(name: string, content: string) {
  // Runs read skills from the Mac's folder, so an edit on the hosted copy would never reach them.
  if (!IS_WORKER) throw new Error("Skills are edited in the tracker on the Mac.");
  if (!getSkill(name)) throw new Error("Unknown skill");
  writeFileSync(join(SKILLS_DIR, name, "SKILL.md"), content.replace(/\r\n/g, "\n"));
}
