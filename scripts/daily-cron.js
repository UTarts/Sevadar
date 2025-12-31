const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Setup Environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Must be Service Role to see all tokens
const FIREBASE_KEY = process.env.FIREBASE_SERVICE_PRIVATE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !FIREBASE_KEY) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

// 2. Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 3. Initialize Firebase
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(FIREBASE_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (e) {
    console.error("Firebase Init Error:", e);
    process.exit(1);
  }
}

// 4. Helper for IST Time
function getISTDate() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (5.5 * 60 * 60 * 1000));
}

async function run() {
  console.log("Starting Daily Cron...");
  
  const today = getISTDate();
  const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
  const dbDateStr = today.toISOString().split('T')[0];
  
  console.log(`Checking for Date: ${dateStr} (DB: ${dbDateStr})`);

  let notificationTitle = "";
  let notificationBody = "";

  // A. Check Posters
  try {
    const filePath = path.join(__dirname, '../public/data/posters.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const posters = JSON.parse(fileContents);
    const todaysPoster = posters.find(p => p.date === dateStr);
    
    if (todaysPoster) {
        notificationTitle = `🇮🇳 आज ${todaysPoster.title} है!`;
        notificationBody = "Sevadar ऐप से अभी अपना पोस्टर बनाएं और शेयर करें।";
    }
  } catch (e) {
    console.log("Could not read posters.json:", e.message);
  }

  // B. Check Quiz (if no poster found yet)
  if (!notificationTitle) {
      const { data: quiz } = await supabase
        .from('daily_quizzes')
        .select('*')
        .eq('date', dbDateStr)
        .single();
        
      if (quiz) {
          notificationTitle = "🧠 आज का सवाल लाइव है!";
          notificationBody = "सही जवाब दें और 5 पॉइंट्स जीतें। अभी खेलें!";
      }
  }

  if (!notificationTitle) {
      console.log("Nothing to notify today.");
      process.exit(0);
  }

  // C. Fetch Tokens
  const { data: tokens, error } = await supabase.from('fcm_tokens').select('token');
  if (error || !tokens || tokens.length === 0) {
      console.log("No tokens found or error fetching tokens.");
      process.exit(0);
  }

  console.log(`Sending to ${tokens.length} devices...`);

  // D. Send Messages
  const messages = tokens.map(t => ({
      token: t.token,
      notification: { title: notificationTitle, body: notificationBody },
      webpush: { fcmOptions: { link: 'https://brijeshtiwari.in' } }
  }));

  const response = await admin.messaging().sendEach(messages);
  console.log(`Success: ${response.successCount}, Failed: ${response.failureCount}`);
}

run();