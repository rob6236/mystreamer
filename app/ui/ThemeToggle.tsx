"use client";

export default function ThemeToggle() {
  return (
    <button
      type="button"
      className="rounded-2xl px-3 py-2 text-sm border border-white/20 hover:bg-white/10 transition"
      onClick={() => {
        const html = document.documentElement;
        const next = html.classList.contains("dark") ? "light" : "dark";
        html.classList.toggle("dark");
        localStorage.setItem("theme", next);
      }}
    >
      Dark mode
    </button>
  );
}
