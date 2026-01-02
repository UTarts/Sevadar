import { getPosters } from "@/lib/posters"; // We fetch ALL posters now
import HomeContent from "@/components/HomeContent";

// This is a Server Component that runs at Build Time
export default async function Home() {
  // Fetch ALL data (unfiltered)
  const allPosters = await getPosters();

  // Pass everything to the Client Component
  return (
    <HomeContent 
      allPosters={allPosters} 
    />
  );
}