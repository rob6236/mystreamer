'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import {
  doc, getDoc, collection, addDoc, serverTimestamp,
  onSnapshot, query, orderBy, setDoc, deleteDoc
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

type Post = {
  id: string;
  content: string;
  createdAt?: any;
  visibility: 'public' | 'private';
  channelUid: string;
  authorUid: string;
  likeCount?: number;
  commentCount?: number;
};
type Comment = { id: string; content: string; authorUid: string; createdAt?: any; };

export default function PostPermalink() {
  const router = useRouter();
  const { postId } = useParams<{ postId: string }>(); // ✅ Next.js 15-safe
  const auth = getAuth();

  const [uid, setUid] = useState<string | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);

  // auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUid(u?.uid ?? null));
    return () => unsub();
  }, [auth]);

  // load post + live comments
  useEffect(() => {
    if (!postId) return;
    let unsubComments: undefined | (() => void);

    (async () => {
      const postRef = doc(db, 'posts', postId);
      const snap = await getDoc(postRef);
      if (!snap.exists()) {
        alert('Post not found');
        router.push('/home');
        return;
      }
      setPost({ id: snap.id, ...(snap.data() as any) });

      const commentsCol = collection(postRef, 'comments');
      const q = query(commentsCol, orderBy('createdAt', 'desc'));
      unsubComments = onSnapshot(q, qs => {
        const list: Comment[] = [];
        qs.forEach(d => list.push({ id: d.id, ...(d.data() as any) }));
        setComments(list);
      });
    })();

    return () => { if (unsubComments) unsubComments(); };
  }, [postId, router]);

  async function handleAddComment() {
    if (!uid) { alert('Sign in to comment'); return; }
    if (!postId) return;

    const text = comment.trim();
    if (!text) return;

    const postRef = doc(db, 'posts', postId);
    const commentsCol = collection(postRef, 'comments');

    // Only the comment doc; counters are NOT updated client-side
    await addDoc(commentsCol, {
      content: text,
      authorUid: uid,
      createdAt: serverTimestamp(),
    });

    setComment('');
  }

  async function toggleLike() {
    if (!uid) { alert('Sign in to like'); return; }
    if (!postId) return;

    const likeRef = doc(collection(doc(db, 'posts', postId), 'likes'), uid);
    const existing = await getDoc(likeRef);
    if (existing.exists()) {
      await deleteDoc(likeRef);        // unlike
    } else {
      await setDoc(likeRef, { createdAt: serverTimestamp() }); // like
    }
  }

  if (!post) return null;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <section className="rounded-xl border border-yellow-900/40 bg-[#6b0f1a]/60 p-6">
        <h1 className="text-2xl font-semibold mb-4">Post</h1>

        <article className="rounded-lg border border-yellow-900/40 p-4 mb-4">
          <p className="mb-2">{post.content}</p>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-md px-4 py-2 bg-yellow-500/90 hover:bg-yellow-500">Share on X/Twitter</button>
            <button className="rounded-md px-4 py-2 bg-yellow-500/90 hover:bg-yellow-500">Share on Facebook</button>
            <button className="rounded-md px-4 py-2 bg-yellow-500/90 hover:bg-yellow-500">Copy link</button>
            <button onClick={toggleLike} className="rounded-md px-4 py-2 bg-yellow-500/90 hover:bg-yellow-500">❤️ Like</button>
          </div>
        </article>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Comments</h2>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full rounded-md border border-yellow-900/40 bg-[#6b0f1a]/60 p-3"
            placeholder="Write a comment..."
          />
          <div className="mt-2">
            <button onClick={handleAddComment} className="rounded-md px-4 py-2 bg-yellow-500/90 hover:bg-yellow-500">
              Comment
            </button>
          </div>

          <ul className="mt-4 space-y-3">
            {comments.map(c => (
              <li key={c.id} className="rounded-md border border-yellow-900/30 p-3">
                <p className="text-sm">{c.content}</p>
              </li>
            ))}
            {comments.length === 0 && <li className="text-sm opacity-70">No comments yet.</li>}
          </ul>
        </div>
      </section>
    </main>
  );
}
