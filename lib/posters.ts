import { promises as fs } from 'fs';
import path from 'path';

export interface Poster {
  id: string;
  title: string;
  date?: string;
  image: string;
  type: 'dated' | 'general';
  priority?: string;
}

export async function getPosters(): Promise<Poster[]> {
  const filePath = path.join(process.cwd(), 'public', 'data', 'posters.json');
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    return [];
  }
}

// Helper to parse "DD-MM-YYYY" to Date object
function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export async function getTodaysPosters() {
  const allPosters = await getPosters();
  
  // REAL DATE LOGIC
  const todayObj = new Date();
  const todayStr = `${String(todayObj.getDate()).padStart(2, '0')}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${todayObj.getFullYear()}`;
  
  // NOTE: For testing purposes, if you want to see the 26 Jan poster, uncomment the line below:
  // const todayStr = "26-01-2026"; 

  return allPosters.filter(p => p.date === todayStr);
}

export async function getUpcomingPosters() {
  const allPosters = await getPosters();
  const todayObj = new Date(); // Current Real Time
  
  // Filter for dates AFTER today
  return allPosters
    .filter(p => p.date && p.type === 'dated')
    .filter(p => parseDate(p.date!) > todayObj)
    .sort((a, b) => parseDate(a.date!).getTime() - parseDate(b.date!).getTime())
    .slice(0, 3); // LIMIT TO 3
}

export async function getGeneralPosters() {
  const allPosters = await getPosters();
  return allPosters.filter(p => p.type === 'general');
}

// ADDED THIS SO CREATE PAGE DOESN'T CRASH
export async function getPosterById(id: string) {
  const allPosters = await getPosters();
  return allPosters.find(p => p.id === id);
}