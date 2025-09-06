// app/watch/[id]/page.tsx
"use client";

import { use, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getProgress, upsertProgress } from "@/lib/watchHistory";

export default function WatchPage({
  params,
}: {
  // Next 15: params is a Promise — unwrap with React.use()'s `use`
  params: Promise<{ id: string }>;
}) {
  const { id: videoId } = use(params);
  const [user, setUser] = useState<User | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastWriteRef = useRef<number>(0);

  // Track auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  // Resume from last position (if any)
  useEffect(() => {
    (async () => {
      if (!user?.uid || !videoRef.current) return;
      try {
        const rec = await getProgress({ uid: user.uid, videoId });
        if (rec?.lastPositionSec && Number.isFinite(rec.lastPositionSec)) {
          videoRef.current.currentTime = rec.lastPositionSec;
        }
      } catch {
        // ignore resume errors
      }
    })();
  }, [user?.uid, videoId]);

  // Throttled writer (~every 2s while playing)
  async function writeThrottled() {
    if (!user?.uid || !videoRef.current) return;
    const now = Date.now();
    if (now - lastWriteRef.current < 2000) return;
    lastWriteRef.current = now;

    const el = videoRef.current;
    await upsertProgress({
      uid: user.uid,
      videoId,
      currentTimeSec: el.currentTime || 0,
      durationSec: el.duration || 0,
    });
  }

  // Immediate write on pause/end (no throttle)
  async function writeNow() {
    if (!user?.uid || !videoRef.current) return;
    const el = videoRef.current;
    await upsertProgress({
      uid: user.uid,
      videoId,
      currentTimeSec: el.currentTime || 0,
      durationSec: el.duration || 0,
    });
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Watching: {videoId}</h1>

      <div className="relative w-full overflow-hidden rounded-2xl border border-yellow-500/30">
        {/* Demo source — replace with your own stream/Storage URL later */}
        <video
          ref={videoRef}
          className="w-full h-auto"
          controls
          onTimeUpdate={writeThrottled}
          onPause={writeNow}
          onEnded={writeNow}
          src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
        />
      </div>

      {!user && (
        <p className="mt-3 text-sm opacity-80">
          Sign in to save and resume your watch progress.
        </p>
      )}
    </main>
  );
}
