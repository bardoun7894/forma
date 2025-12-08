import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, handleAdminAuthError } from '@/lib/admin/adminAuth';
import { getAllPayments } from '@/lib/admin/adminQueries';

export async function GET(request: NextRequest) {
    try {
        await verifyAdmin(request);

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const status = searchParams.get('status') as 'pending' | 'completed' | 'failed' | 'refunded' | undefined;
        const userId = searchParams.get('userId') || undefined;

        const { payments, total, analytics } = await getAllPayments({
            page,
            limit,
            status,
            userId,
        });

        return NextResponse.json({
            payments,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            analytics,
        });
    } catch (error) {
        return handleAdminAuthError(error);
    }
}
