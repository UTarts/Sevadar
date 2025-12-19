import CreatePosterClient from '@/components/CreatePosterClient';
import { getPosters } from '@/lib/posters';

// 1. Tell Next.js which IDs to pre-build (Fixes the Export Error)
export async function generateStaticParams() {
  const posters = await getPosters();
  return posters.map((poster) => ({
    id: poster.id,
  }));
}

// 2. The Page Component (Server Side)
export default async function CreatePosterPage({ params }: { params: { id: string } }) {
  // Just render the client component and pass the ID
  return <CreatePosterClient params={params} />;
}