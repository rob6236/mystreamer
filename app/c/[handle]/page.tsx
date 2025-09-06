// app/c/[handle]/page.tsx
"use client";

import { use } from "react";

export default function ChannelPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = use(params);
  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-semibold">@{handle}</h1>

      <div className="mt-6 grid gap-4">
        <section className="rounded-2xl border border-yellow-500/30 p-4">
          <h2 className="font-semibold mb-2">Videos</h2>
          <div className="opacity-80 text-sm">Grid coming soon…</div>
        </section>
        <section className="rounded-2xl border border-yellow-500/30 p-4">
          <h2 className="font-semibold mb-2">Shorts</h2>
          <div className="opacity-80 text-sm">Grid coming soon…</div>
        </section>
        <section className="rounded-2xl border border-yellow-500/30 p-4">
          <h2 className="font-semibold mb-2">Posts</h2>
          <div className="opacity-80 text-sm">Channel updates feed coming soon…</div>
        </section>
      </div>
    </main>
  );
}
