import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, handleAdminAuthError } from '@/lib/admin/adminAuth';
import { getAllContent } from '@/lib/admin/adminQueries';

export async function GET(request: NextRequest) {
    try {
        await verifyAdmin(request);

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const type = searchParams.get('type') as 'video' | 'image' | 'avatar' | undefined;
        const userId = searchParams.get('userId') || undefined;
        const flaggedParam = searchParams.get('flagged');
        const flagged = flaggedParam === 'true' ? true : flaggedParam === 'false' ? false : undefined;
        const status = searchParams.get('status') as 'completed' | 'processing' | 'failed' | 'pending' | undefined;

        const { items, total } = await getAllContent({
            page,
            limit,
            type,
            userId,
            flagged,
            status,
        });

        return NextResponse.json({
            items,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        return handleAdminAuthError(error);
    }
}
