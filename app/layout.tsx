// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Integrity Streaming',
  description: 'Create, go live, and grow—on Integrity Streaming.',
  themeColor: '#1035AC',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const BLUE = '#1035AC';     // wordmark color
  const BURGUNDY = '#800020'; // page background

  // ⬅️ bumped from 56 → 72
  const LOGO_SIZE = 72;  // px
  const TITLE_SIZE = 36; // px

  return (
    <html lang="en">
      <body
        style={{
          background: BURGUNDY,
          color: '#FFFFFF',
          minHeight: '100dvh',
          margin: 0,
        }}
      >
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: 'transparent',
            borderBottom: '1px solid rgba(255,255,255,0.10)',
          }}
        >
          <div
            style={{
              maxWidth: 1080,
              margin: '0 auto',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <Link href="/home" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Image
                src="/logo.svg"
                alt="Integrity Streaming logo"
                width={LOGO_SIZE}
                height={LOGO_SIZE}
                style={{
                  filter:
                    'drop-shadow(0 0 3px rgba(255,255,255,.95)) drop-shadow(0 0 8px rgba(255,255,255,.55)) drop-shadow(0 2px 2px rgba(0,0,0,.45))',
                }}
              />
              <span
                style={{
                  color: BLUE,
                  fontWeight: 900,
                  fontSize: TITLE_SIZE,
                  lineHeight: 1,
                  textShadow:
                    '0 0 3px rgba(255,255,255,.95), 0 0 8px rgba(255,255,255,.55), 0 2px 2px rgba(0,0,0,.45), 1px 0 0 #fff, -1px 0 0 #fff, 0 1px 0 #fff, 0 -1px 0 #fff',
                }}
              >
                Integrity Streaming
              </span>
            </Link>

            <nav style={{ marginLeft: 'auto', display: 'flex', gap: 18, alignItems: 'center' }}>
              {[
                { href: '/home', label: 'Home' },
                { href: '/studio', label: 'Studio' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 10,
                    textDecoration: 'none',
                    color: '#FFFFFF',
                    textShadow: '0 0 4px rgba(255,255,255,.55), 0 1px 1px rgba(0,0,0,.45)',
                    border: '1px solid rgba(255,255,255,.18)',
                    background: 'rgba(0,0,0,.15)',
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <div style={{ maxWidth: 1080, margin: '0 auto', padding: 18 }}>{children}</div>
      </body>
    </html>
  );
}
