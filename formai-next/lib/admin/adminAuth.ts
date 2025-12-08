import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export interface AdminUser {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string | null;
    credits: number;
    role: 'admin' | 'user';
    createdAt: string;
    suspended?: boolean;
}

/**
 * Verify that the request is from an authenticated admin user.
 * Throws an error if not authenticated or not an admin.
 */
export async function verifyAdmin(request: NextRequest): Promise<AdminUser> {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
        throw new Error('Unauthorized');
    }

    try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();

        if (!userDoc.exists) {
            throw new Error('Forbidden');
        }

        const userData = userDoc.data() as AdminUser;

        if (userData.role !== 'admin') {
            throw new Error('Forbidden');
        }

        return userData;
    } catch (error) {
        if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
            throw error;
        }
        throw new Error('Unauthorized');
    }
}

/**
 * Handle admin auth errors and return appropriate response
 */
export function handleAdminAuthError(error: unknown): Response {
    if (error instanceof Error) {
        if (error.message === 'Unauthorized') {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        if (error.message === 'Forbidden') {
            return new Response(JSON.stringify({ error: 'Forbidden' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    }
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
    });
}
