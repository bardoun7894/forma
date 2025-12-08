import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, handleAdminAuthError } from '@/lib/admin/adminAuth';
import { flagContent, unflagContent, deleteContent } from '@/lib/admin/adminQueries';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ contentId: string }> }
) {
    try {
        const admin = await verifyAdmin(request);

        const { contentId } = await params;
        const body = await request.json();

        const { type, flagged, reason } = body;

        if (!['video', 'image', 'avatar'].includes(type)) {
            return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
        }

        if (flagged) {
            if (!reason || typeof reason !== 'string') {
                return NextResponse.json({ error: 'Reason is required for flagging' }, { status: 400 });
            }
            await flagContent(contentId, type, admin.uid, reason);
        } else {
            await unflagContent(contentId, type);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleAdminAuthError(error);
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ contentId: string }> }
) {
    try {
        await verifyAdmin(request);

        const { contentId } = await params;
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get('type') as 'video' | 'image' | 'avatar';

        if (!['video', 'image', 'avatar'].includes(type)) {
            return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
        }

        await deleteContent(contentId, type);

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleAdminAuthError(error);
    }
}
