import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, handleAdminAuthError } from '@/lib/admin/adminAuth';
import { suspendUser, unsuspendUser, getUserById } from '@/lib/admin/adminQueries';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const admin = await verifyAdmin(request);

        const { userId } = await params;
        const body = await request.json();

        const { action, reason } = body;

        // Prevent admin from suspending themselves
        if (admin.uid === userId) {
            return NextResponse.json({ error: 'Cannot suspend yourself' }, { status: 400 });
        }

        if (action === 'suspend') {
            if (!reason || typeof reason !== 'string') {
                return NextResponse.json({ error: 'Reason is required for suspension' }, { status: 400 });
            }
            await suspendUser(userId, reason);
        } else if (action === 'unsuspend') {
            await unsuspendUser(userId);
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const updatedUser = await getUserById(userId);
        return NextResponse.json({ user: updatedUser });
    } catch (error) {
        return handleAdminAuthError(error);
    }
}
