'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const locale = params.locale as string;
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            router.push(`/${locale}`);
        }
    }, [user, loading, router, locale]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-page">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen flex bg-page">
            <Sidebar />
            <main className="flex-1 lg:ml-72 rtl:lg:ml-0 rtl:lg:mr-72 min-h-screen p-4 lg:p-8">
                {children}
            </main>
        </div>
    );
}