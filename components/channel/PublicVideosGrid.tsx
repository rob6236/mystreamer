'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Video = {
  id: string;
  title?: string;
  ownerUid?: string;
  visibility?: 'public' | 'private' | string;
  createdAt?: Timestamp | null;
  storagePath?: string;
  filePath?: string;
  fileUrl?: string;
};

function normalizeTitle(t?: string) {
  return (t ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' '); // collapse extra spaces
}

function pickMostRecent(a: Video, b: Video) {
  const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
  const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
  return bTime - aTime; // descending
}

function groupByTitleMostRecent(items: Video[], take = 12): Video[] {
  const byTitle = new Map<string, Video[]>();

  for (const v of items) {
    const key = normalizeTitle(v.title) || '(untitled)';
    if (!byTitle.has(key)) byTitle.set(key, []);
    byTitle.get(key)!.push(v);
  }

  // For each title, keep the most recent video
  const uniques: Video[] = [];
  for (const [, arr] of byTitle) {
    arr.sort(pickMostRecent);
    uniques.push(arr[0]);
  }

  // light shuffle for "random picks" feel
  for (let i = uniques.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [uniques[i], uniques[j]] = [uniques[j], uniques[i]];
  }

  return uniques.slice(0, take);
}

export default function PublicVideosGrid() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'videos'),
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc'),
      limit(100) // fetch more so grouping can choose latest
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: Video[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setVideos(groupByTitleMostRecent(items, 12));
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error('PublicVideosGrid error:', err);
        setError(err.message || 'Failed to load videos');
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  if (loading) return <p>Loading…</p>;
  if (error) return <p style={{ color: '#ffd2d2' }}>Error: {error}</p>;
  if (!videos.length) return <p>No public videos yet.</p>;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 16,
      }}
    >
      {videos.map((v) => (
        <article
          key={v.id}
          style={{
            border: '1px solid rgba(255,255,255,.18)',
            background: 'rgba(0,0,0,.15)',
            borderRadius: 12,
            padding: 12,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 8 }}>
            {v.title || 'Untitled'}
          </div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>
            {v.createdAt?.toDate
              ? v.createdAt.toDate().toLocaleString()
              : '—'}
          </div>
          {/* TODO: thumbnail/player/link to detail page */}
        </article>
      ))}
    </div>
  );
}
