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
        <div className="min-h-screen bg-page">
            <Sidebar />
            <main className="lg:ml-72 rtl:lg:ml-0 rtl:lg:mr-72 min-h-screen pt-20 lg:pt-6 px-4 pb-4 lg:px-8 lg:pb-8">
                {children}
            </main>
        </div>
    );
}