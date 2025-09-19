'use client';

import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// If these imports don't match your paths, change them to:
//   import UploadForm from './UploadForm'
//   import MyVideosGrid from './MyVideosGrid'
import UploadForm from '@/components/studio/UploadForm';
import MyVideosGrid from '@/components/studio/MyVideosGrid';

export default function StudioPageClient() {
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid ?? null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
      {/* New big heading with white outline/glow for burgundy background */}
      <h1
        style={{
          margin: '0 0 24px 0',
          fontSize: 32,
          fontWeight: 900,
          color: '#1035AC', // brand blue
          textShadow:
            '0 0 3px rgba(255,255,255,.95), 0 0 8px rgba(255,255,255,.55), 0 2px 2px rgba(0,0,0,.45), 1px 0 0 #fff, -1px 0 0 #fff, 0 1px 0 #fff, 0 -1px 0 #fff',
        }}
      >
        Integrity Streaming Studio
      </h1>

      {/* Upload section */}
      <section style={{ marginBottom: 28 }}>
        {!loading && !uid && (
          <p style={{ margin: '0 0 12px 0' }}>
            You’re not signed in. Please sign in to upload and manage your videos.
          </p>
        )}
        {/* If your UploadForm expects props, pass them here. Many apps don’t need any. */}
        <UploadForm />
      </section>

      {/* My Videos section */}
      <section>
        <h2
          style={{
            margin: '0 0 12px 0',
            fontSize: 24,
            fontWeight: 800,
            textShadow: '0 1px 1px rgba(0,0,0,.35)',
          }}
        >
          My Videos
        </h2>

        {!loading && !uid ? (
          <p>Please sign in to view your uploads.</p>
        ) : (
          // If your grid needs props, pass them here (e.g., uid).
          <MyVideosGrid />
        )}
      </section>
    </div>
  );
}
