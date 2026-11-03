// Scaffolds an engine episode and registers it in src/episodes/index.ts. Safe to re-run (never overwrites).
// Usage: npm run ep:new -- HIS-003 --title "Why …" --tag "HOW IT SCALES"
import { existsSync, readFileSync, writeFileSync } from "fs";
import { ensureDir, episodeArg, paths } from "./_episode.mjs";

const code = episodeArg('ep:new -- <CODE> --title "<title>" --tag "<SERIES TAG>"');
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const p = paths(code);
const title = arg("title", code);
const tag = arg("tag", "CURIOUSLY").toUpperCase();
const ident = `ep_${p.slug.replace(/[^a-z0-9]/g, "_")}`;

ensureDir(`${p.src}/scenes`);
ensureDir(`${p.publicDir}/vo`);
ensureDir(p.out);

const write = (file, content) => {
  if (existsSync(file)) return console.log(`kept   ${file}`);
  writeFileSync(file, content);
  console.log(`wrote  ${file}`);
};

write(p.manifest, JSON.stringify({ scenes: [] }, null, 2) + "\n");
write(p.sfx, "{}\n");
write(
  `${p.src}/Cover.tsx`,
  `import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F } from "../../theme";
import { Backdrop, Kicker } from "../../engine/kit";
import { LogoMark } from "../../brand";

// Static cover / thumbnail. The Animation stage replaces this with the episode's own design.
export const Cover: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    <div style={{ position: "absolute", top: 180, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
      <Kicker text=${JSON.stringify(tag)} />
      <div style={{ fontFamily: F.sans, fontWeight: 900, fontSize: 100, lineHeight: 1.02, letterSpacing: -4, color: C.text, textAlign: "center", padding: "0 110px" }}>
        ${title.replace(/[{}<>]/g, "")}
      </div>
    </div>
    <div style={{ position: "absolute", bottom: 160, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <LogoMark size={120} />
    </div>
  </AbsoluteFill>
);
`,
);
write(
  `${p.src}/index.tsx`,
  `import { makeEpisode } from "../../engine/Episode";
import manifest from "./manifest.json";
import { Cover } from "./Cover";
// @scene-imports

export default makeEpisode({
  code: ${JSON.stringify(code)},
  title: ${JSON.stringify(title)},
  seriesTag: ${JSON.stringify(tag)},
  manifest,
  Cover,
  scenes: {
    // @scenes
  },
});
`,
);

const indexFile = "src/episodes/index.ts";
let index = readFileSync(indexFile, "utf8");
if (!index.includes(`from "./${p.slug}"`)) {
  index = index
    .replace("// @episodes-imports", `import ${ident} from "./${p.slug}";\n// @episodes-imports`)
    .replace("  // @episodes-list", `  ${ident},\n  // @episodes-list`);
  writeFileSync(indexFile, index);
  console.log(`registered ${code} in ${indexFile}`);
}
console.log(`\nNext: write ${p.script} (scenes + voice), then npm run ep:audio -- ${code} --only=vo`);
