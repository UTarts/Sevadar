import { getTodaysPosters, getUpcomingPosters, getGeneralPosters } from "@/lib/posters";
import HomeContent from "@/components/HomeContent";

// This is a Server Component, so it can use fs!
export default async function Home() {
  const todaysPosters = await getTodaysPosters();
  const upcomingPosters = await getUpcomingPosters();
  const generalPosters = await getGeneralPosters();

  return (
    <HomeContent 
      todaysPosters={todaysPosters} 
      upcomingPosters={upcomingPosters} 
      generalPosters={generalPosters} 
    />
  );
}