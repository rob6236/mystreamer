"use client";

import React from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";

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

export default function WatchPage() {
  // ✅ Get the dynamic segment in a client component
  const { id: videoId } = useParams<{ id: string }>();

  const [video, setVideo] = React.useState<VideoDoc | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  // Fetch the video doc by ID
  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const snap = await getDoc(doc(db, "videos", videoId));
        if (!snap.exists()) {
          setError("Video not found.");
          setVideo(null);
          return;
        }

        const data = snap.data() as VideoDoc;
        setVideo(data);
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Failed to load video.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (videoId) load();
    return () => {
      cancelled = true;
    };
  }, [videoId]);

  // Save basic watch progress
  React.useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const user = auth.currentUser;
    if (!user || !videoId) return;

    let ticking = false;

    const onTimeUpdate = () => {
      if (ticking) return;
      ticking = true;
      setTimeout(async () => {
        try {
          await setDoc(
            doc(db, "watchHistory", user.uid, "items", videoId),
            {
              videoId,
              title: video?.title ?? "",
              currentTime: el.currentTime,
              duration: el.duration || null,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (e) {
          console.warn("watchHistory write failed:", e);
        } finally {
          ticking = false;
        }
      }, 1000);
    };

    el.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      el.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [videoId, video?.title]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">
        Watching: <span className="font-mono">{videoId}</span>
      </h1>

      {loading && (
        <div className="rounded-xl border p-6">
          <div className="flex items-center gap-3">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
            <p className="text-sm text-gray-600 dark:text-gray-300">Loading video…</p>
          </div>
        </div>
      )}

      {!loading && error && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800/50 dark:bg-red-900/30 dark:text-red-200"
        >
          {error}
        </div>
      )}

      {!loading && !error && video && (
        <div className="rounded-2xl bg-black/10 p-2">
          <video
            ref={videoRef}
            className="mx-auto block w-full max-w-4xl rounded-2xl"
            src={video.downloadURL}
            poster={video.thumbnailURL || undefined}
            controls
            playsInline
            preload="metadata"
          />
          <div className="mt-3 text-sm text-gray-200">
            <div className="font-medium">{video.title}</div>
            <div className="opacity-70">
              {video.visibility === "private" ? "Private" : "Public"} • {video.type}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
