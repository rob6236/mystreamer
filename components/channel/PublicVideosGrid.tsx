"use client";

import React from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  limit,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

type VideoDoc = {
  ownerUid: string;
  title: string;
  type: "long";
  visibility: "public" | "private";
  storagePath: string;
  downloadURL: string;
  thumbnailURL: string;
  createdAt?: any;
  updatedAt?: any;
};
type VideoRow = VideoDoc & { id: string };

function normalize(s?: string) {
  return (s || "").toLowerCase().trim().replace(/\s+/g, " ");
}

function dedupe(rows: VideoRow[]) {
  const seenTitle = new Set<string>();
  const seenPath = new Set<string>();
  const out: VideoRow[] = [];
  for (const v of rows) {
    const t = normalize(v.title) || v.id;
    const p = v.storagePath || "";
    if (seenTitle.has(t)) continue;
    if (p && seenPath.has(p)) continue;
    seenTitle.add(t);
    if (p) seenPath.add(p);
    out.push(v);
  }
  return out;
}

export default function PublicVideosGrid({ uid }: { uid: string }) {
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<VideoRow[]>([]);

  React.useEffect(() => {
    async function run() {
      setErr(null);
      setRows([]);
      setLoading(true);
      try {
        const qRef = query(
          collection(db, "videos"),
          where("ownerUid", "==", uid),
          where("visibility", "==", "public"),
          orderBy("createdAt", "desc"),
          limit(60)
        );
        const snap: QuerySnapshot<DocumentData> = await getDocs(qRef);
        const all: VideoRow[] = [];
        snap.forEach((d) => all.push({ id: d.id, ...(d.data() as VideoDoc) }));

        const notPlaceholder = (v: VideoRow) =>
          v.thumbnailURL && v.thumbnailURL !== "/mystreamer.png";
        setRows(dedupe(all.filter(notPlaceholder)));
      } catch (e: any) {
        setErr(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [uid]);

  if (loading) {
    return <div className="rounded-lg border p-3 text-sm dark:border-gray-700">Loading…</div>;
  }

  if (err) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800/50 dark:bg-red-900/30 dark:text-red-100">
        {err}
      </div>
    );
  }

  if (rows.length === 0) {
    return <p className="text-sm">No public videos yet.</p>;
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((v) => (
        <li key={v.id} className="overflow-hidden rounded-xl border dark:border-gray-700">
          <Link href={`/watch/${v.id}`} className="block">
            <div className="aspect-video w-full overflow-hidden bg-black/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={v.title}
                src={v.thumbnailURL || "/mystreamer.png"}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-3">
              <div className="truncate text-sm font-semibold text-white">{v.title}</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {v.type}
                </span>
                <span className="inline-flex items-center rounded-full bg-green-500/20 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {v.visibility}
                </span>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
