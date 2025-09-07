// mystreamer-app/lib/posts.ts
import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  Timestamp,
  DocumentData,
} from "firebase/firestore";
import { auth, db } from "./firebase";

export type Post = {
  id: string;
  channelUid: string;     // the owner of the channel
  authorUid: string;      // who created the post (must match channelUid for now)
  content: string;
  visibility: "public" | "private";
  createdAt: Timestamp | null;
};

const POSTS = collection(db, "posts");

function toPost(d: DocumentData): Post {
  return {
    id: d.id,
    channelUid: d.data().channelUid,
    authorUid: d.data().authorUid,
    content: d.data().content ?? "",
    visibility: (d.data().visibility ?? "public") as "public" | "private",
    createdAt: d.data().createdAt ?? null,
  };
}

/** Create a post on *your own* channel. */
export async function createPost(opts: {
  channelUid: string;
  content: string;
  visibility: "public" | "private";
}) {
  const user = auth.currentUser;
  if (!user) throw new Error("auth-required");
  if (!opts.channelUid) throw new Error("channelUid-required");
  // Only allow posting to your own channel for now
  if (user.uid !== opts.channelUid) {
    throw new Error("cannot-post-to-another-channel");
  }

  const doc = {
    channelUid: opts.channelUid,
    authorUid: user.uid,
    content: (opts.content ?? "").trim(),
    visibility: (opts.visibility ?? "public").toLowerCase() as "public" | "private",
    createdAt: serverTimestamp(),
    // (optional counters you might add later)
    likeCount: 0,
    commentCount: 0,
  };

  await addDoc(POSTS, doc);
}

/** Public view: list only this user’s *public* posts. */
export async function listPublicPostsByUser(channelUid: string, take = 25) {
  const q = query(
    POSTS,
    where("channelUid", "==", channelUid),
    where("visibility", "==", "public"),
    orderBy("createdAt", "desc"),
    limit(take)
  );
  const snap = await getDocs(q);
  return snap.docs.map(toPost);
}

/** Owner view: list all your posts (public + private). */
export async function listMyPosts(channelUid: string, take = 50) {
  const user = auth.currentUser;
  if (!user || user.uid !== channelUid) return [];
  const q = query(
    POSTS,
    where("channelUid", "==", channelUid),
    orderBy("createdAt", "desc"),
    limit(take)
  );
  const snap = await getDocs(q);
  return snap.docs.map(toPost);
}
