// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: {
    default: 'Integrity Streaming',
    template: '%s | Integrity Streaming',
  },
  description: 'Watch and share videos on Integrity Streaming.',
  metadataBase: new URL('http://localhost:3000'),
  icons: {
    // We are NOT using app/icon.* anymore; point to files in /public
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Integrity Streaming',
    description: 'Watch and share videos on Integrity Streaming.',
    url: 'http://localhost:3000',
    siteName: 'Integrity Streaming',
    images: ['/og-image.png'],
    type: 'website',
  },
  themeColor: '#7b0f24',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          backgroundColor: '#7b0f24',  // burgundy
          color: '#ffffff',
          minHeight: '100vh',
        }}
      >
        {children}
      </body>
    </html>
  );
}
