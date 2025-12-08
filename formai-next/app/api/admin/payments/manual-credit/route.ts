import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, handleAdminAuthError } from '@/lib/admin/adminAuth';
import { addManualCredits, getUserById } from '@/lib/admin/adminQueries';

export async function POST(request: NextRequest) {
    try {
        const admin = await verifyAdmin(request);

        const body = await request.json();
        const { userId, credits, reason } = body;

        if (!userId || typeof userId !== 'string') {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        if (typeof credits !== 'number' || credits <= 0) {
            return NextResponse.json({ error: 'Invalid credits amount' }, { status: 400 });
        }

        if (!reason || typeof reason !== 'string') {
            return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
        }

        // Check if user exists
        const user = await getUserById(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        await addManualCredits(userId, credits, admin.uid, reason);

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleAdminAuthError(error);
    }
}
