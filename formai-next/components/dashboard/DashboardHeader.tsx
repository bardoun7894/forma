'use client';

import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import { NotificationBell } from './NotificationBell';
import { CommandPalette } from './CommandPalette';
import Link from 'next/link';
import { IconCreditCard } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

export function DashboardHeader() {
    const params = useParams();
    const locale = params.locale as string;
    const { userData } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const credits = userData?.credits || 0;

    // Real-time notifications
    const {
        notifications,
        clearNotification,
        markAsRead,
        markAllAsRead,
    } = useRealTimeUpdates(userData?.uid);

    return (
        <div className={cn(
            "fixed top-0 right-0 left-0 lg:left-72 rtl:lg:left-0 rtl:lg:right-72 z-[90] backdrop-blur-xl border-b transition-colors",
            isDark ? "bg-[#0a0a0f]/80 border-white/5" : "bg-white/80 border-gray-200"
        )}>
            <div className="flex items-center justify-end gap-2 sm:gap-3 px-4 lg:px-8 py-3">
                {/* Command Palette trigger */}
                <CommandPalette locale={locale} />

                {/* Notifications */}
                <NotificationBell
                    notifications={notifications}
                    onClearNotification={clearNotification}
                    onMarkAsRead={markAsRead}
                    onMarkAllAsRead={markAllAsRead}
                />

                {/* Compact Credit Balance */}
                <Link href={`/${locale}/credits`}>
                    <div
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-primary/10 to-cyan-500/10 border border-primary/20 hover:border-primary/40 transition-all cursor-pointer"
                        title={`${credits} credits`}
                    >
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center">
                            <IconCreditCard className="w-4 h-4 text-black" />
                        </div>
                        <span className={cn("text-sm font-bold", isDark ? "text-white" : "text-gray-900")}>{credits}</span>
                    </div>
                </Link>
            </div>
        </div>
    );
}
