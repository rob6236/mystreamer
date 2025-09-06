// app/u/[uid]/page.tsx
"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// NOTE: path from app/u/[uid]/ to /lib/* is ../../../lib/*
import { auth, db } from "../../../lib/firebase";
import { uploadProfilePicture } from "../../../lib/uploadProfilePicture";

type UserDoc = {
  displayName?: string;
  photoURL?: string;
};

export default function UserPage({
  params,
}: {
  // Next 15: params is a Promise — we unwrap with React.use()
  params: Promise<{ uid: string }>;
}) {
  const { uid } = use(params);

  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load the user document
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (!cancelled) {
          setUserDoc((snap.exists() ? (snap.data() as UserDoc) : {}) || {});
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  // Keep auth subscription (no-op)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => {});
    return unsub;
  }, []);

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const newURL = await uploadProfilePicture({ uid, file });
      setUserDoc((prev) => ({ ...(prev || {}), photoURL: newURL }));
    } catch (err) {
      console.error(err);
      alert("Upload failed. Check CORS and Storage rules.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      {/* Centered header: avatar above name */}
      <header className="mb-6 flex flex-col items-center text-center">
        <div className="relative h-24 w-24 overflow-hidden rounded-full ring-2 ring-yellow-400">
          <Image
            src={userDoc?.photoURL || "/mystreamer.png"}
            alt="Profile"
            fill
            sizes="96px"
            priority
          />
        </div>

        <h1 className="mt-3 truncate text-2xl font-semibold text-yellow-200">
          {userDoc?.displayName || "Profile"}
        </h1>
      </header>

      {/* ACTIONS — truly centered & responsive */}
      <div className="mt-6 w-full flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/settings"
          className="rounded-2xl border border-yellow-500/50 bg-yellow-400 px-4 py-2 text-sm font-medium text-[#5a0013] hover:brightness-95 transition"
        >
          Edit profile
        </Link>

        <label className="cursor-pointer rounded-2xl border border-yellow-500/50 bg-yellow-400 px-4 py-2 text-sm font-medium text-[#5a0013] hover:brightness-95 transition">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
          Upload profile picture
        </label>

        {loading && (
          <span className="rounded-2xl border border-yellow-500/30 bg-yellow-500/20 px-3 py-2 text-sm text-yellow-200">
            Working…
          </span>
        )}
      </div>
    </main>
  );
}
