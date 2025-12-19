import CreatePosterClient from '@/components/CreatePosterClient';
import { getPosters } from '@/lib/posters';

// 1. Tell Next.js which IDs to pre-build
export async function generateStaticParams() {
  const posters = await getPosters();
  return posters.map((poster) => ({
    id: poster.id,
  }));
}

// 2. The Page Component (Server Side)
// Note: 'params' is a Promise in Next.js 15+, so we type it as Promise<{ id: string }>
export default async function CreatePosterPage({ params }: { params: Promise<{ id: string }> }) {
  // FIX: Await the params before using them
  const { id } = await params;

  // Fetch data on the server
  const posters = await getPosters();
  const posterData = posters.find((p) => p.id === id);

  if (!posterData) {
    return <div className="min-h-screen flex items-center justify-center text-white bg-neutral-900">Poster not found</div>;
  }

  // Pass data to client component
  return <CreatePosterClient posterData={posterData} />;
}