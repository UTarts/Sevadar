import CreatePosterClient from '@/components/CreatePosterClient';
import { getPosters } from '@/lib/posters';

// 1. Tell Next.js which IDs to pre-build (For Cloudflare Static Export)
export async function generateStaticParams() {
  const posters = await getPosters();
  return posters.map((poster) => ({
    id: poster.id,
  }));
}

// 2. The Page Component (Server Side)
// It accepts 'params' as a Promise (Next.js 15+ requirement)
export default async function CreatePosterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // Await the promise to get the ID

  // Fetch data on the server
  const posters = await getPosters();
  const posterData = posters.find((p) => p.id === id);

  if (!posterData) {
    return <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">Poster not found</div>;
  }

  // Pass data to the Client Component
  return <CreatePosterClient posterData={posterData} />;
}