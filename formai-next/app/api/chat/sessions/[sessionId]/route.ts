import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';

// GET - Get messages for a specific session
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const { sessionId } = await params;
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const auth = getAdminAuth();
        const decodedToken = await auth.verifyIdToken(token);
        const userId = decodedToken.uid;

        const db = getAdminDb();

        // Verify session ownership
        const sessionDoc = await db.collection('chatSessions').doc(sessionId).get();
        if (!sessionDoc.exists || sessionDoc.data()?.userId !== userId) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // Get messages
        const messagesRef = db.collection('chats');
        const snapshot = await messagesRef
            .where('userId', '==', userId)
            .where('sessionId', '==', sessionId)
            .orderBy('createdAt', 'asc')
            .get();

        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

// PATCH - Update session title
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const { sessionId } = await params;
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const auth = getAdminAuth();
        const decodedToken = await auth.verifyIdToken(token);
        const userId = decodedToken.uid;

        const { title } = await request.json();

        const db = getAdminDb();
        const sessionRef = db.collection('chatSessions').doc(sessionId);
        const sessionDoc = await sessionRef.get();

        if (!sessionDoc.exists || sessionDoc.data()?.userId !== userId) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        await sessionRef.update({
            title,
            updatedAt: new Date().toISOString(),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating session:', error);
        return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }
}

// DELETE - Delete session and all its messages
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const { sessionId } = await params;
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const auth = getAdminAuth();
        const decodedToken = await auth.verifyIdToken(token);
        const userId = decodedToken.uid;

        const db = getAdminDb();
        const sessionRef = db.collection('chatSessions').doc(sessionId);
        const sessionDoc = await sessionRef.get();

        if (!sessionDoc.exists || sessionDoc.data()?.userId !== userId) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // Delete all messages in the session
        const messagesSnapshot = await db.collection('chats')
            .where('sessionId', '==', sessionId)
            .get();

        const batch = db.batch();
        messagesSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        batch.delete(sessionRef);
        await batch.commit();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting session:', error);
        return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
    }
}
