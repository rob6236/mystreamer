"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// If this alias ever errors in your setup, change to: import { auth } from "../../lib/firebase";
import { auth } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  type User,
} from "firebase/auth";

export default function AuthButtons() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  async function doSignIn() {
    try {
      setBusy(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/home"); // ✅ go to personalized home
    } catch (err: any) {
      alert(readableAuthError(err?.code, err?.message));
    } finally {
      setBusy(false);
    }
  }

  async function doSignUp() {
    try {
      setBusy(true);
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/home"); // ✅ new users land on home too
    } catch (err: any) {
      alert(readableAuthError(err?.code, err?.message));
    } finally {
      setBusy(false);
    }
  }

  async function doReset() {
    try {
      if (!email.trim()) {
        alert("Enter your email first, then click Reset password.");
        return;
      }
      setBusy(true);
      await sendPasswordResetEmail(auth, email.trim());
      alert("Password reset email sent.");
    } catch (err: any) {
      alert(readableAuthError(err?.code, err?.message));
    } finally {
      setBusy(false);
    }
  }

  async function doSignOut() {
    try {
      setBusy(true);
      await signOut(auth);
      router.replace("/"); // ✅ send signed-out users to landing
    } catch (err: any) {
      alert(readableAuthError(err?.code, err?.message));
    } finally {
      setBusy(false);
    }
  }

  const btn =
    "rounded-2xl px-3 py-2 text-sm border border-white/20 hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed";
  const input =
    "w-56 rounded-xl px-3 py-2 text-sm bg-transparent outline-none border border-white/20 focus:border-white/40";

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <button onClick={doSignOut} className={btn} disabled={busy} aria-label="Sign out">
          {busy ? "Signing out…" : "Sign out"}
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={btn}
        disabled={busy}
        aria-expanded={open}
        aria-controls="auth-panel"
      >
        {busy ? "Please wait…" : "Sign in"}
      </button>

      {open && (
        <div
          id="auth-panel"
          className="absolute right-0 mt-2 w-[300px] rounded-2xl border border-white/20 bg-black/40 p-3 backdrop-blur-md shadow-lg dark:bg-black/70"
        >
          <div className="mb-2 flex gap-2">
            <button
              type="button"
              className={`${btn} ${mode === "signin" ? "bg-white/10" : ""}`}
              onClick={() => setMode("signin")}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`${btn} ${mode === "signup" ? "bg-white/10" : ""}`}
              onClick={() => setMode("signup")}
            >
              Create account
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs opacity-80">Email</label>
            <input
              type="email"
              className={input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <label className="mt-2 text-xs opacity-80">Password</label>
            <input
              type="password"
              className={input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />

            {mode === "signin" ? (
              <>
                <button type="button" onClick={doSignIn} className={`${btn} mt-3`} disabled={busy}>
                  {busy ? "Signing in…" : "Sign in"}
                </button>
                <button
                  type="button"
                  onClick={doReset}
                  className="mt-2 text-xs underline opacity-80 hover:opacity-100 text-left"
                  disabled={busy}
                >
                  Forgot password?
                </button>
              </>
            ) : (
              <button type="button" onClick={doSignUp} className={`${btn} mt-3`} disabled={busy}>
                {busy ? "Creating…" : "Create account"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function readableAuthError(code?: string, fallback?: string) {
  switch (code) {
    case "auth/invalid-email":
      return "That email looks invalid.";
    case "auth/missing-password":
      return "Please enter a password.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/user-not-found":
      return "No account with that email.";
    case "auth/wrong-password":
      return "Incorrect password.";
    case "auth/email-already-in-use":
      return "There’s already an account with this email.";
    case "auth/operation-not-allowed":
      return "This sign-in method isn’t enabled in Firebase.";
    default:
      return fallback || "Authentication error.";
  }
}
