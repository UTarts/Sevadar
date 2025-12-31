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

// --- NEW HELPER: FORCE IST TIME (UTC + 5:30) ---
function getISTDate(): Date {
  const now = new Date();
  // Get UTC time in milliseconds
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  // Add 5.5 hours (IST Offset)
  const istOffset = 5.5 * 60 * 60 * 1000; 
  return new Date(utc + istOffset);
}

export async function getTodaysPosters() {
  const allPosters = await getPosters();
  
  // FIX: Use IST Time, not Server Time
  const todayObj = getISTDate();
  const todayStr = `${String(todayObj.getDate()).padStart(2, '0')}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${todayObj.getFullYear()}`;
  
  return allPosters.filter(p => p.date === todayStr);
}

export async function getUpcomingPosters() {
  const allPosters = await getPosters();
  
  // FIX: Use IST Time here too, so upcoming logic matches reality
  const todayObj = getISTDate(); 
  
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

export async function getPosterById(id: string) {
  const allPosters = await getPosters();
  return allPosters.find(p => p.id === id);
}