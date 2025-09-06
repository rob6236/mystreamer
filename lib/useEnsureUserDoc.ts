'use client';

import { useEffect, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Ensures a Firestore doc exists at users/<uid>.
 * - Never uses addDoc (no random IDs).
 * - Safe to call from any client page; does nothing if not signed in.
 * - Swallows errors (logs to console) so it won't break your UI.
 */
export default function useEnsureUserDoc() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          await setDoc(
            ref,
            {
              uid: user.uid,
              email: user.email ?? null,
              displayName:
                user.displayName ?? user.email?.split('@')[0] ?? null,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } else {
          // keep it fresh without overwriting user fields
          await setDoc(
            ref,
            { uid: user.uid, email: user.email ?? null, updatedAt: serverTimestamp() },
            { merge: true }
          );
        }
      } catch (err) {
        console.warn('ensureUserDoc error', err);
      }
    });

    return () => unsub();
  }, []);
}
