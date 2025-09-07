"use client";

import React from "react";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  getDocs,
  orderBy,
  where,
  query,
  limit,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

/* ---------- Types ---------- */
type WatchItem = {
  videoId: string;
  title?: string;
  currentTime?: number;
  duration?: number | null;
  updatedAt?: any;
};

type VideoDoc = {
  ownerUid: string;
  title: string;
  type: "long";
  visibility: "public" | "private";
  storagePath: string;
  downloadURL: string;
  thumbnailURL: string;
  createdAt?: any;
  updatedAt?: any;
};
type VideoRow = VideoDoc & { id: string };

/* Utility: bound any awaited request so the UI never spins forever */
function withTimeout<T>(p: Promise<T>, ms = 8000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

/* ---------- Page ---------- */
export default function HomePage() {
  const [user, setUser] = React.useState<User | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);

  const [watch, setWatch] = React.useState<WatchItem[]>([]);
  const [watchLoading, setWatchLoading] = React.useState(true);

  const [randomPicks, setRandomPicks] = React.useState<VideoRow[]>([]);
  const [randomLoading, setRandomLoading] = React.useState(true);
  const [randomErr, setRandomErr] = React.useState<string | null>(null);

  const [yourUploads, setYourUploads] = React.useState<VideoRow[]>([]);
  const [uploadsLoading, setUploadsLoading] = React.useState(true);

  /* --- Auth state --- */
  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  /* --- Continue Watching (dedupe by title; newest first) --- */
  React.useEffect(() => {
    async function loadWatch() {
      if (!user) {
        setWatch([]);
        setWatchLoading(false);
        return;
      }
      setWatchLoading(true);
      try {
        const qRef = query(
          collection(db, "watchHistory", user.uid, "items"),
          orderBy("updatedAt", "desc"),
          limit(25)
        );
        const snap = await getDocs(qRef);
        const rows: WatchItem[] = [];
        snap.forEach((d) => rows.push(d.data() as WatchItem));

        const seen = new Set<string>();
        const unique: WatchItem[] = [];
        for (const r of rows) {
          const key = (r.title?.toLowerCase().trim() || r.videoId);
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(r);
          }
        }
        setWatch(unique.slice(0, 12));
      } finally {
        setWatchLoading(false);
      }
    }
    if (!authLoading) loadWatch();
  }, [authLoading, user]);

  /* --- Random Picks (public videos, prefer others, dedupe by title + storagePath) --- */
  React.useEffect(() => {
    async function loadRandom() {
      setRandomLoading(true);
      setRandomErr(null);
      try {
        const qRef = query(
          collection(db, "videos"),
          where("visibility", "==", "public"),
          orderBy("createdAt", "desc"),
          limit(50)
        );
        const snap = await withTimeout<QuerySnapshot<DocumentData>>(getDocs(qRef), 8000);

        const all: VideoRow[] = [];
        snap.forEach((d) => all.push({ id: d.id, ...(d.data() as VideoDoc) }));

        const notPlaceholder = (v: VideoRow) =>
          v.thumbnailURL && v.thumbnailURL !== "/mystreamer.png";

        // Prefer others' uploads first
        let rows = all.filter(notPlaceholder).filter((v) => !user || v.ownerUid !== user?.uid);
        if (rows.length === 0) rows = all.filter(notPlaceholder); // fallback: include mine

        // De-dupe by normalized title + storagePath
        const normalize = (s?: string) =>
          (s || "").toLowerCase().trim().replace(/\s+/g, " ");
        const seenTitle = new Set<string>();
        const seenPath = new Set<string>();
        const unique: VideoRow[] = [];
        for (const v of rows) {
          const tKey = normalize(v.title) || v.id;
          const pKey = v.storagePath || "";
          if (seenTitle.has(tKey)) continue;
          if (pKey && seenPath.has(pKey)) continue;
          seenTitle.add(tKey);
          if (pKey) seenPath.add(pKey);
          unique.push(v);
        }

        setRandomPicks(unique.slice(0, 12));
      } catch (e: any) {
        const msg = String(e?.message || e);
        setRandomErr(msg);
        setRandomPicks([]);
      } finally {
        setRandomLoading(false);
      }
    }
    loadRandom();
  }, [user]);

  /* --- Your Uploads (mine only, newest first, dedupe by title + storagePath) --- */
  React.useEffect(() => {
    async function loadUploads() {
      if (!user) {
        setYourUploads([]);
        setUploadsLoading(false);
        return;
      }
      setUploadsLoading(true);
      try {
        const qRef = query(
          collection(db, "videos"),
          where("ownerUid", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(50)
        );
        const snap = await getDocs(qRef);
        const rows: VideoRow[] = [];
        snap.forEach((d) => rows.push({ id: d.id, ...(d.data() as VideoDoc) }));

        const notPlaceholder = (v: VideoRow) =>
          v.thumbnailURL && v.thumbnailURL !== "/mystreamer.png";

        const normalize = (s?: string) =>
          (s || "").toLowerCase().trim().replace(/\s+/g, " ");
        const seenTitle = new Set<string>();
        const seenPath = new Set<string>();
        const unique: VideoRow[] = [];
        for (const v of rows.filter(notPlaceholder)) {
          const tKey = normalize(v.title) || v.id;
          const pKey = v.storagePath || "";
          if (seenTitle.has(tKey)) continue;
          if (pKey && seenPath.has(pKey)) continue;
          seenTitle.add(tKey);
          if (pKey) seenPath.add(pKey);
          unique.push(v);
        }

        setYourUploads(unique);
      } finally {
        setUploadsLoading(false);
      }
    }
    if (!authLoading) loadUploads();
  }, [authLoading, user]);

  /* --- Helpers --- */
  function formatPct(current?: number, duration?: number | null) {
    if (!current || !duration || !isFinite(duration) || duration <= 0) return null;
    const pct = Math.round((current / duration) * 100);
    return `${Math.min(Math.max(pct, 0), 100)}%`;
  }

  /* ---------- UI ---------- */
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      {/* Signed-out prompt */}
      {!authLoading && !user && (
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border p-6">
            <h1 className="text-2xl font-semibold">Welcome to MyStreamer</h1>
            <p className="mt-2 text-sm text-slate-800 dark:text-slate-100">
              Sign in to see your personalized home.
            </p>
            <div className="mt-4">
              <Link
                href="/home"
                className="inline-flex items-center rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Go to Home to Sign In
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Continue Watching */}
      {user && (
        <section className="mt-2">
          <h2 className="mb-3 text-lg font-semibold">Continue Watching</h2>
          {watchLoading ? (
            <div className="rounded-lg border p-4 text-sm dark:border-gray-700">Loading…</div>
          ) : watch.length === 0 ? (
            <p className="text-sm text-slate-800 dark:text-slate-100">No watch history yet.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {watch.map((w) => (
                <li key={w.videoId} className="overflow-hidden rounded-xl border dark:border-gray-700">
                  <Link href={`/watch/${w.videoId}`} className="block p-4 hover:bg-black/5">
                    <div className="truncate font-semibold text-white">{w.title || w.videoId}</div>
                    <div className="mt-1 text-xs font-semibold text-white">
                      {formatPct(w.currentTime, w.duration) ?? "Tap to resume"}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Random Picks */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Random Picks</h2>

        {randomErr && (
          <div className="mb-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800/50 dark:bg-red-900/30 dark:text-red-100">
            {randomErr}
          </div>
        )}

        {randomLoading ? (
          <div className="rounded-lg border p-4 text-sm dark:border-gray-700">Loading…</div>
        ) : randomPicks.length === 0 ? (
          <p className="text-sm text-slate-800 dark:text-slate-100">No public videos yet.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {randomPicks.map((v) => (
              <li key={v.id} className="overflow-hidden rounded-xl border dark:border-gray-700">
                <Link href={`/watch/${v.id}`} className="block">
                  <div className="aspect-video w-full overflow-hidden bg-black/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={v.title}
                      src={v.thumbnailURL || "/mystreamer.png"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <div className="truncate text-sm font-semibold text-white">{v.title}</div>
                    <div className="mt-1 text-xs font-semibold text-white">
                      Public • {v.type}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Your Uploads */}
      {user && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Your Uploads</h2>
          {uploadsLoading ? (
            <div className="rounded-lg border p-4 text-sm dark:border-gray-700">Loading…</div>
          ) : yourUploads.length === 0 ? (
            <p className="text-sm text-slate-800 dark:text-slate-100">
              You haven’t uploaded any videos yet. Try the{" "}
              <Link href="/studio" className="underline">
                Studio
              </Link>
              .
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {yourUploads.map((v) => (
                <li key={v.id} className="overflow-hidden rounded-xl border dark:border-gray-700">
                  <Link href={`/watch/${v.id}`} className="block">
                    <div className="aspect-video w-full overflow-hidden bg-black/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={v.title}
                        src={v.thumbnailURL || "/mystreamer.png"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <div className="truncate text-sm font-semibold text-white">{v.title}</div>
                      <div className="mt-1 text-xs font-semibold text-white">
                        <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white">
                          {v.type}
                        </span>
                        {v.visibility === "private" && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white">
                            private
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
