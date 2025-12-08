'use client';

import { useParams, useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const locale = params.locale as string;
    const router = useRouter();
    const { user, userData, loading } = useAuth();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const t = useTranslations('admin');

    useEffect(() => {
        if (!loading) {
            if (!user) {
                // Not logged in - show 404
                setIsAdmin(false);
            } else if (userData) {
                // Check if user is admin
                setIsAdmin(userData.role === 'admin');
            }
        }
    }, [user, userData, loading, router, locale]);

    // Loading state
    if (loading || isAdmin === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-page">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Not admin - show 404 page (hides admin existence)
    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-page">
                <div className="text-center">
                    <h1 className="text-6xl font-bold text-white mb-4">404</h1>
                    <p className="text-xl text-gray-400 mb-8">{t('pageNotFound')}</p>
                    <p className="text-gray-500 mb-8">{t('notFoundMessage')}</p>
                    <button
                        onClick={() => router.push(`/${locale}`)}
                        className="px-6 py-3 bg-primary text-black font-semibold rounded-lg hover:bg-primary-hover transition-colors"
                    >
                        {t('goHome')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-page">
            <AdminSidebar />
            <main className="flex-1 lg:ml-72 rtl:lg:ml-0 rtl:lg:mr-72 min-h-screen p-4 lg:p-8">
                {children}
            </main>
        </div>
    );
}
