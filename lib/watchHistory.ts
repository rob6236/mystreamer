// lib/watchHistory.ts
import { db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

export type WatchHistoryItem = {
  videoId: string;
  progress: number;           // 0..1
  lastPositionSec: number;    // seconds
  watchedAt: Timestamp;       // when last updated
};

export async function upsertProgress(opts: {
  uid: string;
  videoId: string;
  currentTimeSec: number;
  durationSec: number;
}) {
  const { uid, videoId, currentTimeSec, durationSec } = opts;
  if (!uid || !videoId || !Number.isFinite(durationSec) || durationSec <= 0) return;

  const progress = Math.max(0, Math.min(1, currentTimeSec / durationSec));

  const ref = doc(db, "watchHistory", uid, "items", videoId);
  await setDoc(
    ref,
    {
      videoId,
      progress,
      lastPositionSec: Math.floor(currentTimeSec),
      watchedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getProgress(opts: {
  uid: string;
  videoId: string;
}): Promise<WatchHistoryItem | null> {
  const { uid, videoId } = opts;
  const ref = doc(db, "watchHistory", uid, "items", videoId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as WatchHistoryItem) : null;
}
