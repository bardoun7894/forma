import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';

// POST - Save a chat message
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

        const { sessionId, role, content } = await request.json();

        if (!sessionId || !role || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = getAdminDb();

        // Verify session ownership
        const sessionDoc = await db.collection('chatSessions').doc(sessionId).get();
        if (!sessionDoc.exists || sessionDoc.data()?.userId !== userId) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        const now = new Date().toISOString();

        // Save message
        const messageRef = await db.collection('chats').add({
            userId,
            sessionId,
            role,
            content,
            createdAt: now,
        });

        // Update session's updatedAt
        await db.collection('chatSessions').doc(sessionId).update({
            updatedAt: now,
        });

        return NextResponse.json({
            messageId: messageRef.id,
            message: {
                id: messageRef.id,
                userId,
                sessionId,
                role,
                content,
                createdAt: now,
            }
        });
    } catch (error) {
        console.error('Error saving message:', error);
        return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
    }
}
