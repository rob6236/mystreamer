import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import ThemeToggle from "./ui/ThemeToggle";
import AuthButtons from "./ui/AuthButtons";

export const metadata: Metadata = {
  title: "MyStreamer",
  description: "Your videos, your way.",
};

// Set theme early (light = burgundy, dark = black)
const themeInit = `
(function () {
  try {
    var ls = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = ls ? ls : (prefersDark ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-screen">
        {/* Global gold frame across ALL pages */}
        <div className="pointer-events-none fixed inset-0 z-50 border-8 border-yellow-500" />

        <header className="sticky top-0 z-40 border-b border-yellow-500/60 bg-black/5 backdrop-blur dark:bg-black/30">
          <div className="mx-auto flex max-w-6xl items-center justify-between p-3">
            <Link href="/" className="font-semibold tracking-wide">MyStreamer</Link>

            {/* Simple nav */}
            <nav className="hidden sm:flex items-center gap-4 text-sm">
              <Link href="/home" className="hover:underline">Home</Link>
              <Link href="/studio" className="hover:underline">Studio</Link>
            </nav>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <AuthButtons />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-6xl">{children}</div>
      </body>
    </html>
  );
}
