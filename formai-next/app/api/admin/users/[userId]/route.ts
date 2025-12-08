import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, handleAdminAuthError } from '@/lib/admin/adminAuth';
import { getUserById, updateUser, deleteUser, getUserTransactions } from '@/lib/admin/adminQueries';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        await verifyAdmin(request);

        const { userId } = await params;
        const user = await getUserById(userId);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get recent transactions
        const transactions = await getUserTransactions(userId);

        return NextResponse.json({ user, transactions });
    } catch (error) {
        return handleAdminAuthError(error);
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        await verifyAdmin(request);

        const { userId } = await params;
        const body = await request.json();

        const allowedFields = ['displayName', 'email', 'suspended', 'suspendedReason'];
        const updates: Record<string, unknown> = {};

        for (const field of allowedFields) {
            if (field in body) {
                updates[field] = body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        await updateUser(userId, updates);

        const updatedUser = await getUserById(userId);
        return NextResponse.json({ user: updatedUser });
    } catch (error) {
        return handleAdminAuthError(error);
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        await verifyAdmin(request);

        const { userId } = await params;

        await deleteUser(userId);

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleAdminAuthError(error);
    }
}
