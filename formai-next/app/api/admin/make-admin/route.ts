import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// This is a one-time setup endpoint to make a user admin
// Should be removed or protected after initial setup
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, secretKey } = body;

        // Simple secret key protection - change this or remove after use
        if (secretKey !== 'SETUP_ADMIN_2024') {
            return NextResponse.json({ error: 'Invalid secret key' }, { status: 403 });
        }

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Find user by email
        const usersSnapshot = await adminDb.collection('users').where('email', '==', email).get();

        if (usersSnapshot.empty) {
            return NextResponse.json({ error: `User with email ${email} not found` }, { status: 404 });
        }

        const userDoc = usersSnapshot.docs[0];
        const userId = userDoc.id;

        // Update role to admin
        await adminDb.collection('users').doc(userId).update({
            role: 'admin',
        });

        return NextResponse.json({
            success: true,
            message: `Successfully made ${email} an admin!`,
            userId,
        });
    } catch (error) {
        console.error('Error making user admin:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
