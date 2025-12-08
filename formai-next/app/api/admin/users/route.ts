import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, handleAdminAuthError } from '@/lib/admin/adminAuth';
import { getAllUsers } from '@/lib/admin/adminQueries';

export async function GET(request: NextRequest) {
    try {
        await verifyAdmin(request);

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const search = searchParams.get('search') || undefined;
        const role = searchParams.get('role') as 'admin' | 'user' | undefined;
        const suspendedParam = searchParams.get('suspended');
        const suspended = suspendedParam === 'true' ? true : suspendedParam === 'false' ? false : undefined;

        const { users, total } = await getAllUsers({
            page,
            limit,
            search,
            role,
            suspended,
        });

        return NextResponse.json({
            users,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        return handleAdminAuthError(error);
    }
}
