// app/(protected)/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Integrity Streaming',
    template: '%s | Integrity Streaming',
  },
};

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
