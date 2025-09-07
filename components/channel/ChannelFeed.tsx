// mystreamer-app/components/channel/ChannelFeed.tsx
"use client";

import React from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { Post } from "@/lib/posts";
import {
  createPost,
  listMyPosts,
  listPublicPostsByUser,
  // optional: uncomment if you already implemented it in lib/posts.ts
  // deletePost,
} from "@/lib/posts";

type Props = {
  channelUid: string;
};

export default function ChannelFeed({ channelUid }: Props) {
  const [me, setMe] = React.useState<User | null>(auth.currentUser);
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // form state (owner only)
  const [draft, setDraft] = React.useState("");
  const [visibility, setVisibility] = React.useState<"public" | "private">(
    "public",
  );

  const isOwner = !!me && me.uid === channelUid;

  // keep auth in sync
  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setMe(u));
    return () => unsub();
  }, []);

  // load feed (owner sees all; visitors see only public)
  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = isOwner
        ? await listMyPosts(channelUid, 50)
        : await listPublicPostsByUser(channelUid, 50);
      setPosts(rows);
    } catch (e: any) {
      const msg =
        e?.code === "permission-denied"
          ? "Missing or insufficient permissions."
          : e?.message || "Failed to load posts.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [channelUid, isOwner]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleCreate() {
    if (!isOwner) {
      alert("Only the channel owner can post updates.");
      return;
    }
    const content = draft.trim();
    if (!content) return;

    try {
      await createPost({
        channelUid,
        content,
        visibility, // already "public" | "private"
      });
      setDraft("");
      await load();
    } catch (e: any) {
      alert(e?.message ?? "Failed to create post");
    }
  }

  // optional delete button if you implemented deletePost in lib/posts.ts
  // async function handleDelete(id: string) {
  //   if (!isOwner) return;
  //   if (!confirm("Delete this post?")) return;
  //   try {
  //     await deletePost({ channelUid, postId: id });
  //     await load();
  //   } catch (e: any) {
  //     alert(e?.message ?? "Failed to delete post");
  //   }
  // }

  return (
    <section className="mt-8">
      {/* Composer (owner only) */}
      {isOwner && (
        <div className="mb-6 rounded-xl border border-white/15 bg-white/5 p-4 backdrop-blur">
          <h3 className="mb-3 text-lg font-semibold text-white">
            Create a new post
          </h3>

          <textarea
            className="mb-3 h-28 w-full rounded-lg border border-white/10 bg-black/20 p-3 text-white placeholder-white/60 outline-none"
            placeholder="What would you like to share?"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />

          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-semibold text-white/90">
              Visibility
            </label>
            <select
              className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
              value={visibility}
              onChange={(e) =>
                setVisibility(
                  (e.target.value.toLowerCase() as "public" | "private") ||
                    "public",
                )
              }
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>

            <button
              onClick={handleCreate}
              className="ml-auto rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
              disabled={!draft.trim()}
            >
              Post
            </button>
          </div>
        </div>
      )}

      {/* Errors */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-white">
          {error}
        </div>
      )}

      {/* Feed */}
      <div className="space-y-4">
        {loading && (
          <div className="rounded-lg border border-white/10 p-4 text-white/80">
            Loading…
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="rounded-lg border border-white/10 p-4 text-white/80">
            No posts yet.
          </div>
        )}

        {!loading &&
          posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              isOwner={isOwner}
              // onDelete={() => handleDelete(p.id)}
            />
          ))}
      </div>
    </section>
  );
}

/* -------------------- UI bits -------------------- */

function PostCard({
  post,
  isOwner,
  // onDelete,
}: {
  post: Post;
  isOwner: boolean;
  // onDelete?: () => void;
}) {
  const dateStr = post.createdAt
    ? new Date(post.createdAt.toDate()).toLocaleString()
    : "pending…";

  return (
    <article className="rounded-xl border border-white/10 bg-white/5 p-4 text-white">
      <div className="mb-2 flex items-center gap-2 text-xs">
        <Badge>{post.visibility}</Badge>
        {isOwner && post.visibility === "private" && (
          <Badge tone="yellow">owner only</Badge>
        )}
        <span className="ml-auto text-white/60">{dateStr}</span>
      </div>

      <p className="whitespace-pre-wrap text-base leading-relaxed">
        {post.content}
      </p>

      {/* Uncomment if you added deletePost in lib/posts.ts
      {isOwner && (
        <div className="mt-3">
          <button
            onClick={onDelete}
            className="rounded-md border border-white/20 px-3 py-1 text-sm text-white/90 hover:bg-white/10"
          >
            Delete
          </button>
        </div>
      )} */}
    </article>
  );
}

function Badge({
  children,
  tone = "indigo",
}: {
  children: React.ReactNode;
  tone?: "indigo" | "yellow" | "slate";
}) {
  const tones: Record<string, string> = {
    indigo: "bg-indigo-600/30 border-indigo-400/40 text-white",
    yellow: "bg-amber-500/30 border-amber-400/40 text-white",
    slate: "bg-slate-500/30 border-slate-400/40 text-white",
  };
  return (
    <span
      className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
