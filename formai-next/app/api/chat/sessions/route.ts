import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';

// GET - Get all chat sessions for a user
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const auth = getAdminAuth();
        const decodedToken = await auth.verifyIdToken(token);
        const userId = decodedToken.uid;

        const db = getAdminDb();
        const sessionsRef = db.collection('chatSessions');
        const snapshot = await sessionsRef
            .where('userId', '==', userId)
            .orderBy('updatedAt', 'desc')
            .get();

        const sessions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ sessions });
    } catch (error) {
        console.error('Error fetching chat sessions:', error);
        return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }
}

// POST - Create a new chat session
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const auth = getAdminAuth();
        const decodedToken = await auth.verifyIdToken(token);
        const userId = decodedToken.uid;

        const { title = 'New Chat' } = await request.json();

        const db = getAdminDb();
        const now = new Date().toISOString();
        const docRef = await db.collection('chatSessions').add({
            userId,
            title,
            createdAt: now,
            updatedAt: now,
        });

        return NextResponse.json({
            sessionId: docRef.id,
            session: {
                id: docRef.id,
                userId,
                title,
                createdAt: now,
                updatedAt: now,
            }
        });
    } catch (error) {
        console.error('Error creating chat session:', error);
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }
}
