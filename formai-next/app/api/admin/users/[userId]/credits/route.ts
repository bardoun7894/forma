import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, handleAdminAuthError } from '@/lib/admin/adminAuth';
import { adjustUserCredits } from '@/lib/admin/adminQueries';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const admin = await verifyAdmin(request);

        const { userId } = await params;
        const body = await request.json();

        const { amount, reason, type } = body;

        if (typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        if (!reason || typeof reason !== 'string') {
            return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
        }

        if (!['add', 'deduct'].includes(type)) {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        const adjustedAmount = type === 'add' ? amount : -amount;

        const newCredits = await adjustUserCredits(
            userId,
            adjustedAmount,
            admin.uid,
            reason,
            'adjustment'
        );

        return NextResponse.json({ success: true, newCredits });
    } catch (error) {
        if (error instanceof Error && error.message === 'User not found') {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        return handleAdminAuthError(error);
    }
}
