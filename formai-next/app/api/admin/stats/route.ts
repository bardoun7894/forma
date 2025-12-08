import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, handleAdminAuthError } from '@/lib/admin/adminAuth';
import { getDashboardStats } from '@/lib/admin/adminQueries';

export async function GET(request: NextRequest) {
    try {
        await verifyAdmin(request);

        const stats = await getDashboardStats();

        return NextResponse.json(stats);
    } catch (error) {
        return handleAdminAuthError(error);
    }
}
