// app/home/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";

// If the alias errors in your setup, change both to "../../lib/firebase"
import { auth } from "@/lib/firebase";
import { db } from "@/lib/firebase";

type HistoryItem = {
  videoId: string;
  progress?: number;
  lastPositionSec?: number;
};

type Video = {
  id: string;
  title?: string;
  type?: "long" | "short";
  thumbnailURL?: string;
};

function shuffle<T>(arr: T[]): T[] {
  // Fisher–Yates
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [picks, setPicks] = useState<Video[]>([]);
  const [loadingPicks, setLoadingPicks] = useState(true);

  // auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingUser(false);
    });
    return unsub;
  }, []);

  // Continue Watching
  useEffect(() => {
    if (!user?.uid) {
      setHistory([]);
      return;
    }
    (async () => {
      try {
        const q = query(
          collection(db, "watchHistory", user.uid, "items"),
          orderBy("watchedAt", "desc"),
          limit(12)
        );
        const snap = await getDocs(q);
        setHistory(
          snap.docs.map((d) => ({
            videoId: (d.data().videoId as string) || d.id,
            progress: (d.data().progress as number) ?? 0,
            lastPositionSec: (d.data().lastPositionSec as number) ?? 0,
          }))
        );
      } catch (e) {
        console.error(e);
      }
    })();
  }, [user?.uid]);

  // Random Picks (public videos)
  useEffect(() => {
    (async () => {
      setLoadingPicks(true);
      try {
        const q = query(
          collection(db, "videos"),
          where("visibility", "==", "public"),
          orderBy("createdAt", "desc"),
          limit(40)
        );
        const snap = await getDocs(q);
        const vids: Video[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            title: data.title || "Untitled",
            type: (data.type as "long" | "short") || "long",
            thumbnailURL: data.thumbnailURL || "/mystreamer.png",
          };
        });
        setPicks(shuffle(vids).slice(0, 12));
      } catch (e) {
        console.error(e);
        setPicks([]);
      } finally {
        setLoadingPicks(false);
      }
    })();
  }, []);

  if (loadingUser) {
    return <main className="mx-auto max-w-6xl p-6">Loading…</main>;
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <h1 className="text-2xl font-semibold mb-2">You’re signed out</h1>
        <p>Please use the <span className="font-medium">Sign in</span> button in the header.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-semibold mb-6">Your Home</h1>

      {/* Continue Watching */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">Continue Watching</h2>

        {history.length === 0 ? (
          <div className="rounded-2xl border border-yellow-500/30 p-4 text-sm opacity-80">
            Nothing here yet. Start a video and your progress will show up.
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {history.map((h) => (
              <Link
                key={h.videoId}
                href={`/watch/${h.videoId}`}
                className="min-w-[220px] rounded-2xl border border-yellow-500/30 p-3 hover:bg-white/5 transition"
              >
                <div className="mb-2 text-sm font-medium">Video {h.videoId}</div>
                <div className="h-2 w-full overflow-hidden rounded bg-white/10">
                  <div
                    className="h-full bg-yellow-400"
                    style={{ width: `${Math.round((h.progress ?? 0) * 100)}%` }}
                  />
                </div>
                <div className="mt-1 text-xs opacity-70">
                  {Math.round((h.progress ?? 0) * 100)}% watched
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Random Picks */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">Random Picks</h2>

        {loadingPicks ? (
          <div className="rounded-2xl border border-yellow-500/30 p-4 text-sm opacity-80">
            Loading picks…
          </div>
        ) : picks.length === 0 ? (
          <div className="rounded-2xl border border-yellow-500/30 p-4 text-sm opacity-80">
            No public videos yet. Add one in Firestore (see steps below) or wire Studio Upload next.
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {picks.map((v) => {
              const href = v.type === "short" ? `/shorts/${v.id}` : `/watch/${v.id}`;
              return (
                <Link
                  key={v.id}
                  href={href}
                  className="min-w-[220px] rounded-2xl border border-yellow-500/30 p-3 hover:bg-white/5 transition"
                >
                  <div className="mb-2 aspect-video w-full overflow-hidden rounded-lg bg-white/5">
                    {/* Using a div for now; we can switch to next/image with remotePatterns later */}
                    <div
                      className="h-full w-full"
                      style={{
                        backgroundImage: `url(${v.thumbnailURL})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                  </div>
                  <div className="text-sm font-medium truncate">{v.title}</div>
                  <div className="mt-1 text-xs opacity-70 uppercase">{v.type}</div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Your Uploads — placeholders for now */}
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Your Uploads</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-yellow-500/30 p-4">Long videos (soon)</div>
          <div className="rounded-2xl border border-yellow-500/30 p-4">Shorts (soon)</div>
        </div>
      </section>
    </main>
  );
}
