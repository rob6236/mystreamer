// mystreamer-app/app/u/[uid]/page.tsx
import PublicVideosGrid from "@/components/channel/PublicVideosGrid";
import ChannelFeed from "@/components/channel/ChannelFeed";

export default async function ChannelPage({
  params,
}: {
  params: { uid: string };
}) {
  const { uid } = params;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-4">Channel</h1>

      {/* Public video library for this channel */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-3">Videos</h2>
        <PublicVideosGrid uid={uid} />
      </section>

      {/* Feed / posts (owner can post; everyone can read public) */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-3">Channel Updates</h2>
        <ChannelFeed channelUid={uid} />
      </section>
    </main>
  );
}
