"use client";

import React from "react";
import Link from "next/link";
import {
  ref,
  uploadBytesResumable,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, storage } from "../../lib/firebase";

type Props = {
  uid: string;
};

// Generate a thumbnail (JPEG) from a local video File using <video>/<canvas>
async function generateThumbnail(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.playsInline = true;

    // Wait for metadata so we know duration and dimensions
    await new Promise<void>((resolve, reject) => {
      video.addEventListener("loadedmetadata", () => resolve(), { once: true });
      video.addEventListener(
        "error",
        () => reject(new Error("Failed to load video for thumbnail.")),
        { once: true }
      );
    });

    // Seek to ~25% of the video, fallback within range
    const target =
      video.duration && isFinite(video.duration)
        ? Math.min(Math.max(video.duration * 0.25, 0.1), Math.max(video.duration - 0.1, 0.1))
        : 0.5;

    video.currentTime = target;
    await new Promise<void>((resolve) => {
      video.addEventListener("seeked", () => resolve(), { once: true });
    });

    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0, w, h);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Failed to create thumbnail blob."))),
        "image/jpeg",
        0.86
      );
    });

    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function UploadForm({ uid }: Props) {
  const [title, setTitle] = React.useState("");
  const [visibility, setVisibility] = React.useState<"public" | "private">("public");
  const [file, setFile] = React.useState<File | null>(null);

  const [isUploading, setIsUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [successId, setSuccessId] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f || null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessId(null);

    if (!title.trim()) {
      setErrorMsg("Please enter a title.");
      return;
    }
    if (!file) {
      setErrorMsg("Please choose a video file.");
      return;
    }
    if (!file.type.startsWith("video/")) {
      setErrorMsg("That file is not a video. Choose a .mp4/.mov/.webm, etc.");
      return;
    }

    try {
      setIsUploading(true);
      setProgress(0);

      // 1) Reserve a Firestore ID
      const colRef = collection(db, "videos");
      const docRef = doc(colRef);
      const videoId = docRef.id;

      // 2) Upload video to Storage: videos/{uid}/{videoId}.{ext}
      const name = file.name || "video.mp4";
      const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "mp4";
      const storagePath = `videos/${uid}/${videoId}.${ext}`;
      const storageRef = ref(storage, storagePath);

      const task = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
        customMetadata: { ownerUid: uid, videoId },
      });

      await new Promise<void>((resolve, reject) => {
        task.on(
          "state_changed",
          (snap) => {
            const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
            setProgress(pct);
          },
          (err) => reject(err),
          () => resolve()
        );
      });

      const downloadURL = await getDownloadURL(storageRef);

      // 3) Generate + upload thumbnail to Storage: thumbnails/{uid}/{videoId}.jpg
      let thumbnailURL = "/mystreamer.png";
      try {
        const thumbBlob = await generateThumbnail(file);
        const thumbPath = `thumbnails/${uid}/${videoId}.jpg`;
        const thumbRef = ref(storage, thumbPath);
        await uploadBytes(thumbRef, thumbBlob, {
          contentType: "image/jpeg",
          customMetadata: { ownerUid: uid, videoId },
        });
        thumbnailURL = await getDownloadURL(thumbRef);
      } catch (thumbErr) {
        console.warn("Thumbnail generation failed, falling back to placeholder:", thumbErr);
      }

      // 4) Write Firestore doc
      const now = serverTimestamp();
      await setDoc(docRef, {
        ownerUid: uid,
        title: title.trim(),
        type: "long",
        visibility,
        storagePath,
        downloadURL,
        thumbnailURL,
        createdAt: now,
        updatedAt: now,
      });

      setSuccessId(videoId);
      setTitle("");
      setVisibility("public");
      setFile(null);
      setProgress(0);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="mt-6">
      {/* Toasts */}
      {errorMsg && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800/50 dark:bg-red-900/30 dark:text-red-200"
        >
          {errorMsg}
        </div>
      )}
      {successId && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-900/30 dark:text-emerald-200"
        >
          Upload complete! Video ID: <span className="font-mono">{successId}</span>.{" "}
          <Link className="underline" href={`/watch/${successId}`}>
            Open watch page
          </Link>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            type="text"
            name="title"
            autoComplete="off"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            placeholder="My awesome video"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Visibility</label>
          <select
            name="visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as "public" | "private")}
            className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Video file</label>
          <input
            type="file"
            accept="video/*"
            onChange={onFileChange}
            className="mt-1 w-full text-sm file:mr-4 file:rounded-lg file:border file:bg-gray-50 file:px-4 file:py-2 file:text-sm hover:file:bg-gray-100 dark:file:border-gray-700 dark:file:bg-gray-900 dark:hover:file:bg-gray-800"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Accepted: any <code>video/*</code> (mp4, mov, webm, etc.).
          </p>
        </div>

        {isUploading && (
          <div className="rounded-lg border p-3 dark:border-gray-700">
            <div className="mb-2 flex justify-between text-xs text-gray-600 dark:text-gray-300">
              <span>Uploading…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded bg-gray-200 dark:bg-gray-800">
              <div
                className="h-2 rounded bg-blue-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={isUploading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </form>
    </div>
  );
}
