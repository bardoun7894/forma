'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { QueryProvider } from '@/providers/QueryProvider';
import { DashboardHeader } from '@/components/dashboard';

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
        <QueryProvider>
            <div className="min-h-screen bg-page">
                <Sidebar />
                {/* Global header with search and notifications */}
                <DashboardHeader />
                {/* Main content - pt-20 on mobile (sidebar toggle), pt-16 on desktop (header height) */}
                <main className="lg:ml-72 rtl:lg:ml-0 rtl:lg:mr-72 min-h-screen pt-20 lg:pt-20 px-4 pb-4 lg:px-8 lg:pb-8 relative z-0">
                    {children}
                </main>
            </div>
        </QueryProvider>
    );
}