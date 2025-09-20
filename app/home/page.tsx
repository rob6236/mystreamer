// app/home/page.tsx
import type { Metadata } from 'next';
import PublicVideosGrid from '@/components/channel/PublicVideosGrid';
// If that path errors, use the relative path instead:
// import PublicVideosGrid from '../../components/channel/PublicVideosGrid';

export const metadata: Metadata = {
  title: 'Home',
};

export default function HomePage() {
  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 16px' }}>
      {/* Big page heading */}
      <h1
        style={{
          margin: '0 0 16px 0',
          fontSize: 32,
          fontWeight: 900,
          color: '#FFFFFF',
          textShadow:
            '0 0 3px rgba(255,255,255,.35), 0 0 8px rgba(255,255,255,.35), 0 2px 2px rgba(0,0,0,.6)',
        }}
      >
        Welcome to{' '}
        <span
          style={{
            color: '#1035AC',
            textShadow: '0 0 3px #fff, 0 2px 2px rgba(0,0,0,.45)',
          }}
        >
          Integrity Streaming
        </span>
      </h1>

      <p style={{ margin: '0 0 24px 0' }}>
        Sign in to see your personalized home.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2
          style={{
            margin: '0 0 12px 0',
            fontSize: 22,
            fontWeight: 800,
            textShadow: '0 1px 1px rgba(0,0,0,.35)',
          }}
        >
          Random Picks
        </h2>

        {/* Render your client component directly */}
        <PublicVideosGrid />
      </section>
    </main>
  );
}
