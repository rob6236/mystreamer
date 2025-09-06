"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { doc, getDoc, updateDoc } from "firebase/firestore";

// 👇 Step 2: use RELATIVE paths instead of "@/..."
import { auth, db } from "../../../lib/firebase";
import { uploadProfilePicture } from "../../../lib/uploadProfilePicture";

type UserDoc = {
  displayName?: string;
  email?: string;
  bio?: string;
  photoURL?: string | null;
};

export default function SettingsPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user doc on mount
  useEffect(() => {
    const u = auth.currentUser;
    if (!u) {
      setStatus("Not signed in");
      return;
    }
    setUid(u.uid);

    (async () => {
      const snap = await getDoc(doc(db, "users", u.uid));
      const data = (snap.exists() ? (snap.data() as UserDoc) : {}) as UserDoc;
      setUserDoc({ email: u.email ?? "", ...data });
      setDisplayName(data.displayName ?? "");
      setBio(data.bio ?? "");
      setStatus("");
    })();
  }, []);

  const saveProfile = async () => {
    if (!uid) return;
    try {
      setSaving(true);
      setStatus("Saving...");
      await updateDoc(doc(db, "users", uid), {
        displayName: displayName || "",
        bio: bio || "",
        updatedAt: new Date(),
      });
      setUserDoc((prev) => (prev ? { ...prev, displayName, bio } : prev));
      setStatus("Saved!");
      setEditing(false);
    } catch (err: any) {
      console.error(err);
      setStatus(`Error: ${err.code || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const triggerUpload = () => fileInputRef.current?.click();

  const onFileSelected: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadProfilePicture(file, setStatus, setSaving);
    if (!uid) return;
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) setUserDoc(snap.data() as UserDoc);
  };

  const avatarSrc = userDoc?.photoURL || "/mystreamer.png";

  return (
    <div className="mx-auto max-w-3xl p-6">
      <header className="mb-8 flex items-center gap-4">
        <div className="relative h-24 w-24 overflow-hidden rounded-full ring-2 ring-yellow-400">
          <Image src={avatarSrc} alt="Profile" fill className="object-cover" sizes="96px" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold text-yellow-200">
            {userDoc?.displayName || "Profile"}
          </h1>
          <p className="truncate text-sm text-yellow-100/80">{userDoc?.email || ""}</p>
          {userDoc?.bio ? (
            <p className="mt-1 line-clamp-2 text-sm text-yellow-100/90">{userDoc.bio}</p>
          ) : (
            <p className="mt-1 text-sm text-yellow-100/60">Add a short bio to your profile.</p>
          )}
        </div>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setEditing((e) => !e)}
          className="rounded-xl bg-yellow-400 px-4 py-2 font-medium text-[#5a0013] hover:brightness-95"
        >
          {editing ? "Cancel" : "Edit profile"}
        </button>

        <button
          onClick={triggerUpload}
          className="rounded-xl bg-yellow-400 px-4 py-2 font-medium text-[#5a0013] hover:brightness-95"
        >
          Upload profile picture
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileSelected}
        />

        <span
          className={`rounded-xl px-3 py-2 text-sm ${
            saving
              ? "bg-amber-600/70 text-white"
              : status.startsWith("Error")
              ? "bg-red-600/80 text-white"
              : status
              ? "bg-green-700/70 text-white"
              : "bg-amber-900/40 text-amber-200"
          }`}
        >
          {saving ? "Saving..." : status || "Status"}
        </span>
      </div>

      {editing && (
        <div className="rounded-2xl border border-yellow-400/30 bg-black/10 p-4">
          <div className="mb-4">
            <label className="mb-1 block text-sm text-yellow-200">Display name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border border-yellow-400/40 bg-white/90 px-3 py-2 text-[#240009] outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Your name"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm text-yellow-200">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-yellow-400/40 bg-white/90 px-3 py-2 text-[#240009] outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Tell people a little about you"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={saveProfile}
              disabled={saving}
              className="rounded-xl bg-yellow-400 px-4 py-2 font-medium text-[#5a0013] hover:brightness-95 disabled:opacity-60"
            >
              Save changes
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-xl border border-yellow-400/40 px-4 py-2 font-medium text-yellow-100 hover:bg-yellow-400/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
