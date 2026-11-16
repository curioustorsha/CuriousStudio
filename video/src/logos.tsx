import React from "react";
import { Img } from "remotion";
import { C, F } from "./theme";
import REMOTION_MARK from "../node_modules/@remotion/studio-server/web/favicon.png";

/**
 * Company logos, drawn as inline SVG so they render crisply anywhere (HTML or inside an iso scene).
 * Rule from review: whenever a company's name is shown on screen, show its logo.
 *
 * Blinkit: Wikimedia Commons "Blinkit-yellow-rounded.svg" (PD-textlogo; trademark of Blinkit).
 */

const BLINKIT_PATHS: { d: string; fill: string }[] = [
  {
    d: "M666.964 1551C715.913 1551 759.616 1563.24 798.076 1587.71C836.884 1611.83 867.302 1646.09 889.329 1690.48C910.656 1733.13 921.32 1783.3 921.32 1840.98C921.32 1896.91 910.656 1946.9 889.329 1990.95C868.001 2034.99 837.933 2069.43 799.124 2094.25C759.966 2119.42 715.913 2132 666.964 2132C631.302 2132 597.738 2124.66 566.271 2109.98C534.804 2095.29 507.883 2074.67 485.507 2048.1V2118.67H303L303 1368H485.507V1634.38C507.883 1607.81 534.804 1587.36 566.271 1573.03C597.738 1558.34 631.302 1551 666.964 1551ZM612.422 1980.46C638.295 1980.46 661.37 1974.52 681.649 1962.63C701.927 1950.74 717.836 1934.14 729.373 1912.82C740.911 1891.84 746.68 1867.89 746.68 1840.98C746.68 1814.76 740.911 1790.99 729.373 1769.66C717.836 1748.34 701.927 1731.73 681.649 1719.85C661.37 1707.96 638.295 1702.02 612.422 1702.02C587.948 1702.02 566.096 1707.96 546.867 1719.85C527.637 1731.39 512.603 1747.64 501.764 1768.61C490.926 1789.94 485.507 1814.06 485.507 1840.98C485.507 1867.89 490.926 1892.02 501.764 1913.34C512.603 1934.31 527.637 1950.74 546.867 1962.63C566.096 1974.52 587.948 1980.46 612.422 1980.46Z",
    fill: "#1C1C1C",
  },
  { d: "M946.305 2118.67V1368H1128.81V2118.67H946.305Z", fill: "#1C1C1C" },
  { d: "M1180.54 2118.67V1563.44H1362V2118.67H1180.54Z", fill: "#1C1C1C" },
  {
    d: "M1756.19 1551C1795 1551 1829.97 1560.09 1861.08 1578.27C1892.2 1596.1 1916.67 1621.27 1934.5 1653.78C1951.64 1686.64 1960.2 1723.87 1960.2 1765.47V2118.67H1786.09V1806.37C1786.09 1786.09 1782.07 1768.09 1774.02 1752.36C1766.33 1736.28 1755.32 1723.87 1740.98 1715.13C1727 1706.39 1710.57 1702.02 1691.69 1702.02C1673.86 1702.02 1657.42 1706.39 1642.39 1715.13C1627.35 1723.52 1615.64 1735.06 1607.25 1749.74C1598.51 1763.72 1594.14 1780.15 1594.14 1799.03L1593.09 2118.67H1411.63V1563.59H1593.09V1627.04C1610.22 1603.27 1633.12 1584.74 1661.79 1571.45C1690.46 1557.82 1721.93 1551 1756.19 1551Z",
    fill: "#1C1C1C",
  },
  { d: "M2361.21 1806.37L2567.1 2118.67H2361L2240.59 1922.25L2185 1986.75V2118.67H2002.49V1368H2185V1782.77L2360.46 1563.3L2566.42 1563.44L2361.21 1806.37Z", fill: "#1C1C1C" },
  { d: "M1180.44 1368.06H1362.5V1510.14H1180.44V1368.06Z", fill: "#1C1C1C" },
  { d: "M2594.84 2118.71V1563.44H2776.9V2118.71H2594.84Z", fill: "#0C831F" },
  {
    d: "M3161.43 1960.44L3197.61 2077.37C3181.18 2093.11 3160.38 2105.86 3135.2 2115.65C3110.38 2125.44 3086.08 2130.34 3062.31 2130.34C3028.04 2130.34 2997.45 2122.82 2970.53 2107.79C2943.61 2092.41 2922.63 2071.08 2907.59 2043.81C2892.56 2017.25 2885.04 1986.66 2885.04 1952.05V1707.06H2812.15V1563.44H2885.04V1368.06H3059.16V1563.44H3174.01V1707.06H3059.16V1918.49C3059.16 1936.32 3063.88 1950.83 3073.32 1962.01C3082.76 1973.2 3094.82 1978.79 3109.51 1978.79C3119.99 1978.79 3129.78 1977.22 3138.87 1974.07C3147.96 1970.93 3155.48 1966.38 3161.43 1960.44Z",
    fill: "#0C831F",
  },
  { d: "M2594.84 1368.06H2776.9V1510.14H2594.84V1368.06Z", fill: "#0C831F" },
];

export const BLINKIT_YELLOW = "#F8CB46";

/** The Blinkit logo as SVG children in a 3500 × 3500 box (yellow rounded square + wordmark). */
export const BlinkitMark: React.FC = () => (
  <g>
    <rect width={3500} height={3500} rx={740} fill={BLINKIT_YELLOW} />
    {BLINKIT_PATHS.map((p, i) => (
      <path key={i} d={p.d} fill={p.fill} />
    ))}
  </g>
);

/** The wordmark band only, as SVG children in a 3500 × 1100 box (for wide shop signs). */
export const BlinkitBand: React.FC<{ rx?: number }> = ({ rx = 120 }) => (
  <g>
    <rect width={3500} height={1100} rx={rx} fill={BLINKIT_YELLOW} />
    <g transform="translate(0,-1200)">
      {BLINKIT_PATHS.map((p, i) => (
        <path key={i} d={p.d} fill={p.fill} />
      ))}
    </g>
  </g>
);

/** The square app-icon logo, `size` px. */
export const BlinkitLogo: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => (
  <svg width={size} height={size} viewBox="0 0 3500 3500" style={{ display: "block", flexShrink: 0, ...style }}>
    <BlinkitMark />
  </svg>
);

/** The wordmark on a yellow pill, `height` px tall (kickers, tags). */
export const BlinkitWordmark: React.FC<{ height: number; style?: React.CSSProperties }> = ({ height, style }) => (
  <svg width={(height * 3500) / 1100} height={height} viewBox="0 0 3500 1100" style={{ display: "block", flexShrink: 0, ...style }}>
    <BlinkitBand rx={550} />
  </svg>
);

/**
 * Google Maps: Wikimedia Commons "Google_Maps_icon_(2020).svg" (PD-textlogo; trademark of Google). viewBox 92.3 × 132.3.
 * DeepMind: Wikimedia Commons "DeepMind_new_logo.svg" (PD-textlogo; trademark of Google DeepMind). viewBox 512.052 × 118.668, all #0053d6.
 * shortcut: both load from upload.wikimedia.org at render time (Remotion's <Img> waits for them) because the
 * unattended run couldn't download them. Copy them into public/logos/ and switch to staticFile() when convenient.
 */
export const GOOGLE_MAPS_LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/a/aa/Google_Maps_icon_%282020%29.svg";
export const DEEPMIND_LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/6/6a/DeepMind_new_logo.svg";
const GMAPS_RATIO = 92.3 / 132.3;
const DEEPMIND_RATIO = 512.052 / 118.668;

/** The Google Maps pin, `height` px tall, as SVG children (top-left at 0,0). Use inside an <svg>. */
export const GoogleMapsPin: React.FC<{ height: number }> = ({ height }) => (
  <foreignObject width={height * GMAPS_RATIO} height={height} style={{ overflow: "visible" }}>
    <Img src={GOOGLE_MAPS_LOGO_URL} style={{ width: height * GMAPS_RATIO, height, display: "block" }} />
  </foreignObject>
);

/** The Google Maps pin as an HTML element. */
export const GoogleMapsLogo: React.FC<{ height: number; style?: React.CSSProperties }> = ({ height, style }) => (
  <Img src={GOOGLE_MAPS_LOGO_URL} style={{ width: height * GMAPS_RATIO, height, display: "block", flexShrink: 0, ...style }} />
);

/** The DeepMind wordmark on a white pill (its blue doesn't read on our dark background), `height` px tall. */
export const DeepMindWordmark: React.FC<{ height: number; style?: React.CSSProperties }> = ({ height, style }) => {
  const inner = height * 0.56;
  return (
    <div style={{ height, padding: `0 ${height * 0.42}px`, borderRadius: 999, background: "#FFFFFF", display: "flex", alignItems: "center", flexShrink: 0, ...style }}>
      <Img src={DEEPMIND_LOGO_URL} style={{ width: inner * DEEPMIND_RATIO, height: inner, display: "block" }} />
    </div>
  );
};

/**
 * Alphabet: Wikimedia Commons "Alphabet_Inc_Logo_2015.svg" (public domain, text logo below the threshold of
 * originality; trademark of Alphabet Inc.). 512 × 124, red wordmark, shown on a white pill like DeepMind.
 * shortcut: loaded from upload.wikimedia.org at render time like the others; copy into public/logos/ when convenient.
 */
export const ALPHABET_LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/7/7a/Alphabet_Inc_Logo_2015.svg";
const ALPHABET_RATIO = 512 / 124;

/** The Alphabet wordmark on a white pill, `height` px tall. */
export const AlphabetWordmark: React.FC<{ height: number; style?: React.CSSProperties }> = ({ height, style }) => {
  const inner = height * 0.5;
  return (
    <div style={{ height, padding: `0 ${height * 0.42}px`, borderRadius: 999, background: "#FFFFFF", display: "flex", alignItems: "center", flexShrink: 0, ...style }}>
      <Img src={ALPHABET_LOGO_URL} style={{ width: inner * ALPHABET_RATIO, height: inner, display: "block" }} />
    </div>
  );
};

/**
 * Claude: Wikimedia Commons "Claude_AI_symbol.svg" (CC0 1.0; source anthropic.com; trademark of Anthropic). 512 × 512, orange.
 * Anthropic: Wikimedia Commons "Anthropic_logo.svg" (PD-textlogo; trademark of Anthropic). 1024 × 115, near-black #1F1F1E,
 * shown inverted to near-white on our dark background.
 * shortcut: loaded from upload.wikimedia.org at render time like Google Maps / DeepMind above; copy into public/logos/ when convenient.
 */
export const CLAUDE_LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/b/b0/Claude_AI_symbol.svg";
export const ANTHROPIC_LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg";
const ANTHROPIC_RATIO = 1024 / 115;

/** The Claude starburst mark, `size` px square. */
export const ClaudeLogo: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => (
  <Img src={CLAUDE_LOGO_URL} style={{ width: size, height: size, display: "block", flexShrink: 0, ...style }} />
);

/** The Anthropic wordmark in near-white, `height` px tall. */
export const AnthropicWordmark: React.FC<{ height: number; style?: React.CSSProperties }> = ({ height, style }) => (
  <Img src={ANTHROPIC_LOGO_URL} style={{ width: height * ANTHROPIC_RATIO, height, display: "block", flexShrink: 0, filter: "invert(1)", ...style }} />
);

/**
 * Claude Lab's lesson kicker: Claude mark + "LESSON 1 · WHAT CLAUDE IS". `anthropic` (0→1) slides the Anthropic
 * wordmark in at the end, on the word "Anthropic".
 */
/** `mark={false}` drops the Claude starburst (the Claude Lab playbook: never the Claude logo). Lesson 1 keeps the default. */
export const LessonKicker: React.FC<{ text: string; anthropic?: number; mark?: boolean }> = ({ text, anthropic = 0, mark = true }) => {
  const aw = 22 * ANTHROPIC_RATIO + 34;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: mark ? "10px 24px 10px 14px" : "14px 24px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.05)",
        border: `1px solid ${C.stroke}`,
        fontFamily: F.mono,
        fontWeight: 700,
        fontSize: 26,
        letterSpacing: 3,
        color: C.text,
      }}
    >
      {mark && <ClaudeLogo size={38} style={{ marginRight: 16 }} />}
      {text}
      <div style={{ width: aw * Math.min(1, Math.max(0, anthropic)), overflow: "hidden", display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", opacity: Math.min(1, anthropic * 1.5), transform: `translateX(${(1 - Math.min(1, anthropic)) * 30}px)` }}>
          <div style={{ width: 2, height: 30, background: C.stroke, margin: "0 16px" }} />
          <AnthropicWordmark height={22} />
        </div>
      </div>
    </div>
  );
};

/**
 * Indian Railways: Wikimedia Commons "Indian railways 18 star logo.jpg" (CC0; the logo used in the en.wikipedia
 * "Indian Railways" infobox; a user upload, trademark of Indian Railways). 1200 × 1201, shown on a white disc.
 * shortcut: loaded from upload.wikimedia.org at render time like the others; copy into public/logos/ when convenient.
 * IRCTC: no freely licensed logo exists (en.wikipedia's IRCTC_Logo.svg is non-free), so IRCTC is shown as its name
 * in a plain wordmark pill, per the "name as text" fallback.
 */
export const INDIAN_RAILWAYS_LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/d/de/Indian_railways_18_star_logo.jpg";
export const IRCTC_BLUE = "#1F3F8F";

/** The Indian Railways roundel on a white disc, `size` px. */
export const IndianRailwaysLogo: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => (
  <div style={{ width: size, height: size, borderRadius: 999, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, ...style }}>
    <Img src={INDIAN_RAILWAYS_LOGO_URL} style={{ width: size * 0.9, height: size * 0.9, display: "block", borderRadius: 999 }} />
  </div>
);

/** IRCTC as a text wordmark on a white pill, `height` px tall (no free logo exists). */
export const IrctcWordmark: React.FC<{ height: number; style?: React.CSSProperties }> = ({ height, style }) => (
  <div
    style={{
      height,
      padding: `0 ${height * 0.38}px`,
      borderRadius: 999,
      background: "#FFFFFF",
      display: "flex",
      alignItems: "center",
      flexShrink: 0,
      fontFamily: F.sans,
      fontWeight: 900,
      fontSize: height * 0.56,
      letterSpacing: height * 0.02,
      color: IRCTC_BLUE,
      ...style,
    }}
  >
    IRCTC
  </div>
);

type KickerLogoKey = "blinkit" | "googlemaps" | "deepmind" | "irctc" | "indianrailways";

const KickerLogo: React.FC<{ logo: KickerLogoKey }> = ({ logo }) =>
  logo === "irctc" ? (
    <IrctcWordmark height={40} />
  ) : logo === "indianrailways" ? (
    <IndianRailwaysLogo size={40} />
  ) : logo === "googlemaps" ? (
    <div style={{ width: 40, height: 40, borderRadius: 999, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <GoogleMapsLogo height={28} />
    </div>
  ) : logo === "deepmind" ? (
    <DeepMindWordmark height={40} />
  ) : (
    <BlinkitWordmark height={40} style={{ borderRadius: 999 }} />
  );

/** A kicker pill (same look as the kit's Kicker) that leads with a company logo instead of its name. */
export const LogoKicker: React.FC<{ text: string; logo?: KickerLogoKey }> = ({ text, logo = "blinkit" }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 16,
      padding: "9px 24px 9px 10px",
      borderRadius: 999,
      background: "rgba(255,255,255,0.05)",
      border: `1px solid ${C.stroke}`,
      fontFamily: F.mono,
      fontWeight: 700,
      fontSize: 26,
      letterSpacing: 3,
      color: C.text,
    }}
  >
    <KickerLogo logo={logo} />
    {text}
  </div>
);

/**
 * Remotion: the mark Remotion ships as Remotion Studio's favicon (`@remotion/studio-server/web/favicon.png`,
 * 100 × 100, the blue rounded play shape), imported unchanged from the installed package. Trademark of Remotion AG.
 * 100 px source: keep it at 100 px or smaller on screen.
 */

export const RemotionLogo: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => (
  <Img src={REMOTION_MARK} style={{ width: size, height: size, display: "block", flexShrink: 0, ...style }} />
);

/** Every logo by key, for templates that pick one from data (e.g. a carousel slide's `"logo": "blinkit"`). Add new companies here. */
export const LOGOS: Record<string, React.FC<{ size: number }>> = {
  blinkit: ({ size }) => <BlinkitLogo size={size} style={{ borderRadius: size * 0.22 }} />,
  googlemaps: ({ size }) => (
    <div style={{ width: size, height: size, borderRadius: size * 0.22, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <GoogleMapsLogo height={size * 0.72} />
    </div>
  ),
  deepmind: ({ size }) => (
    <div style={{ width: size, height: size, borderRadius: size * 0.22, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <Img src={DEEPMIND_LOGO_URL} style={{ width: size * 0.9, height: (size * 0.9) / DEEPMIND_RATIO, display: "block" }} />
    </div>
  ),
  alphabet: ({ size }) => (
    <div style={{ width: size, height: size, borderRadius: size * 0.22, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <Img src={ALPHABET_LOGO_URL} style={{ width: size * 0.86, height: (size * 0.86) / ALPHABET_RATIO, display: "block" }} />
    </div>
  ),
  claude: ({ size }) => <ClaudeLogo size={size} />,
  remotion: ({ size }) => <RemotionLogo size={size} />,
  indianrailways: ({ size }) => <IndianRailwaysLogo size={size} />,
  irctc: ({ size }) => (
    <div style={{ width: size, height: size, borderRadius: size * 0.22, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.sans, fontWeight: 900, fontSize: size * 0.27, color: IRCTC_BLUE }}>
      IRCTC
    </div>
  ),
  anthropic: ({ size }) => (
    <div style={{ width: size, height: size, borderRadius: size * 0.22, background: "#F0EEE6", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <Img src={ANTHROPIC_LOGO_URL} style={{ width: size * 0.86, height: (size * 0.86) / ANTHROPIC_RATIO, display: "block" }} />
    </div>
  ),
};

/** A company's square logo by key, or nothing if it isn't in `LOGOS` yet. */
export const CompanyLogo: React.FC<{ name: string; size: number }> = ({ name, size }) => {
  const L = LOGOS[name.toLowerCase()];
  return L ? <L size={size} /> : null;
};
