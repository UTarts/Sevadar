import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// 1. Initialize Firebase Admin (The Sender)
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_PRIVATE_KEY || '{}');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (e) {
        console.error("Firebase Admin Init Error:", e);
    }
}

// 2. Helper to get IST Date
function getISTDate(): Date {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (5.5 * 60 * 60 * 1000));
}

export async function GET(request: Request) {
    // A. Security Check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const today = getISTDate();
        const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
        
        let notificationTitle = "";
        let notificationBody = "";
        
        // B. Check for POSTERS (from JSON file)
        const filePath = path.join(process.cwd(), 'public', 'data', 'posters.json');
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const posters = JSON.parse(fileContents);
        const todaysPoster = posters.find((p: any) => p.date === dateStr);

        // C. Check for QUIZ (from Supabase DB)
        // Note: Supabase stores dates as YYYY-MM-DD
        const dbDateStr = today.toISOString().split('T')[0];
        const { data: quiz } = await supabase
            .from('daily_quizzes')
            .select('*')
            .eq('date', dbDateStr)
            .single();

        // D. Decide Message Priority
        if (todaysPoster) {
            notificationTitle = `🇮🇳 आज ${todaysPoster.title} है!`;
            notificationBody = "Sevadar ऐप से अभी अपना पोस्टर बनाएं और शेयर करें।";
        } else if (quiz) {
            notificationTitle = "🧠 आज का सवाल लाइव है!";
            notificationBody = "सही जवाब दें और 5 पॉइंट्स जीतें। अभी खेलें!";
        } else {
            return NextResponse.json({ message: 'Nothing special to notify today.' });
        }

        // E. Fetch All User Tokens
        const { data: tokens } = await supabase.from('fcm_tokens').select('token');
        
        if (!tokens || tokens.length === 0) {
            return NextResponse.json({ message: 'No users to notify.' });
        }

        // F. Send Messages in Batches
        const messages = tokens.map(t => ({
            token: t.token,
            notification: {
                title: notificationTitle,
                body: notificationBody,
            },
            webpush: {
                fcmOptions: {
                    link: 'https://brijeshtiwari.in'
                }
            }
        }));

        // Send (using sendEach because it handles partial failures gracefully)
        const response = await admin.messaging().sendEach(messages as any);
        
        return NextResponse.json({ 
            success: true, 
            sent: response.successCount, 
            failed: response.failureCount 
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}