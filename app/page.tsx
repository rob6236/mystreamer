// app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) router.replace(`/u/${u.uid}`);
    });
    return unsub;
  }, [router]);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold text-yellow-200">MyStreamer</h1>
      <p className="mt-2 text-yellow-100/80">
        Redirecting to your profile once signed in…
      </p>
    </main>
  );
}
