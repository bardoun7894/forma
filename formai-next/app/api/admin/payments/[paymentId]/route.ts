import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, handleAdminAuthError } from '@/lib/admin/adminAuth';
import { refundPayment } from '@/lib/admin/adminQueries';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ paymentId: string }> }
) {
    try {
        const admin = await verifyAdmin(request);

        const { paymentId } = await params;
        const body = await request.json();

        const { action, reason } = body;

        if (action !== 'refund') {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        if (!reason || typeof reason !== 'string') {
            return NextResponse.json({ error: 'Reason is required for refund' }, { status: 400 });
        }

        await refundPayment(paymentId, admin.uid, reason);

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'Payment not found') {
                return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
            }
            if (error.message === 'Payment already refunded') {
                return NextResponse.json({ error: 'Payment already refunded' }, { status: 400 });
            }
        }
        return handleAdminAuthError(error);
    }
}
