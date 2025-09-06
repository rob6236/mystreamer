// app/studio/page.tsx
"use client";

import Link from "next/link";

export default function StudioPage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-semibold mb-6">Creator Studio</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/studio/upload" className="rounded-2xl border border-yellow-500/30 p-4 hover:bg-white/5 transition">
          <div className="text-lg font-medium">Upload</div>
          <p className="opacity-80 text-sm">Upload long or short form videos.</p>
        </Link>
        <Link href="/studio/shorts" className="rounded-2xl border border-yellow-500/30 p-4 hover:bg-white/5 transition">
          <div className="text-lg font-medium">Make Shorts</div>
          <p className="opacity-80 text-sm">Cut highlights from long videos.</p>
        </Link>
        <Link href="/studio/thumbnail" className="rounded-2xl border border-yellow-500/30 p-4 hover:bg-white/5 transition">
          <div className="text-lg font-medium">Thumbnails</div>
          <p className="opacity-80 text-sm">Pick a frame or generate with AI.</p>
        </Link>
        <Link href="/studio/videos" className="rounded-2xl border border-yellow-500/30 p-4 hover:bg-white/5 transition">
          <div className="text-lg font-medium">Manage Videos</div>
          <p className="opacity-80 text-sm">Edit titles, tags, visibility.</p>
        </Link>
        <Link href="/studio/posts" className="rounded-2xl border border-yellow-500/30 p-4 hover:bg-white/5 transition">
          <div className="text-lg font-medium">Channel Posts</div>
          <p className="opacity-80 text-sm">Create Facebook-style updates.</p>
        </Link>
        <Link href="/settings/channel" className="rounded-2xl border border-yellow-500/30 p-4 hover:bg-white/5 transition">
          <div className="text-lg font-medium">Channel Settings</div>
          <p className="opacity-80 text-sm">Handle, avatar, banner, bio.</p>
        </Link>
      </div>
    </main>
  );
}
