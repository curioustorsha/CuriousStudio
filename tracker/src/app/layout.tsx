import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Macs render SF Pro natively; Inter is the closest match on Windows.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Curiously Studio",
  description: "Content pipeline for Curiously",
};

// Runs before paint so the page never flashes the wrong theme.
const themeScript = `(() => {
  const pref = localStorage.getItem("pb-theme") || "system";
  const dark = pref === "dark" || (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
