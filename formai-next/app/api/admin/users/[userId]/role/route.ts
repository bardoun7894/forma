import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, handleAdminAuthError } from '@/lib/admin/adminAuth';
import { updateUserRole, getUserById } from '@/lib/admin/adminQueries';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const admin = await verifyAdmin(request);

        const { userId } = await params;
        const body = await request.json();

        const { role } = body;

        if (!['admin', 'user'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        // Prevent admin from demoting themselves
        if (admin.uid === userId && role === 'user') {
            return NextResponse.json({ error: 'Cannot demote yourself' }, { status: 400 });
        }

        await updateUserRole(userId, role);

        const updatedUser = await getUserById(userId);
        return NextResponse.json({ user: updatedUser });
    } catch (error) {
        return handleAdminAuthError(error);
    }
}
