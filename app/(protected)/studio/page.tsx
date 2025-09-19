// app/(protected)/studio/page.tsx
import type { Metadata } from 'next';

// Tab title for this page:
export const metadata: Metadata = {
  title: 'Integrity Streaming Studio',
};

// If your client file is at components/studio/StudioPageClient.tsx use this:
import StudioPageClient from '@/components/studio/StudioPageClient';

// If instead your client lives at app/studio/pageclient.tsx, use this import instead:
// import StudioPageClient from '../../studio/pageclient';

export const dynamic = 'force-dynamic';

export default function StudioPage() {
  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
      <StudioPageClient />
    </main>
  );
}
