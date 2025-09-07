"use client";

import React from "react";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../../lib/firebase";
import UploadForm from "./UploadForm";
import MyVideosGrid from "./MyVideosGrid";

export default function StudioPageClient() {
  const [user, setUser] = React.useState<User | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">MyStreamer Studio</h1>
        <p className="mt-2 text-sm text-slate-800 dark:text-slate-100">
          {authLoading ? "…" : user ? (
            <>
              Welcome, <span className="font-semibold">{user.email}</span>.
            </>
          ) : (
            <>
              You’re not signed in. Please{" "}
              <Link href="/home" className="underline">
                sign in
              </Link>{" "}
              to upload and manage your videos.
            </>
          )}
        </p>
      </header>

      {/* Upload card */}
      <section className="mb-8">
        <div className="rounded-xl border p-4">
          <UploadForm uid={user?.uid ?? null} />
        </div>
      </section>

      {/* My Videos */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">My Videos</h2>
        <div className="rounded-xl border p-4">
          <MyVideosGrid uid={user?.uid ?? null} />
        </div>
      </section>
    </div>
  );
}
