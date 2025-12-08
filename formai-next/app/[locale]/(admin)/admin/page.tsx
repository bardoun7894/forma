'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { StatsCard } from '@/components/admin/StatsCard';
import { GlassCard } from '@/components/ui/GlassCard';
import {
    Users,
    Video,
    Image as ImageIcon,
    User,
    DollarSign,
    AlertTriangle,
    Shield,
    UserX,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';

interface DashboardStats {
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    adminUsers: number;
    totalVideos: number;
    totalImages: number;
    totalAvatars: number;
    totalRevenue: number;
    flaggedContent: number;
}

export default function AdminDashboard() {
    const t = useTranslations('admin');
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            if (!user) return;

            try {
                const token = await user.getIdToken();
                const response = await fetch('/api/admin/stats', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, [user]);

    const quickActions = [
        { icon: Users, label: t('viewAllUsers'), href: '/admin/users', color: 'primary' },
        { icon: Video, label: t('manageContent'), href: '/admin/content', color: 'secondary' },
        { icon: DollarSign, label: t('viewPayments'), href: '/admin/payments', color: 'primary' },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
                <p className="text-gray-400 mt-1">{t('subtitle')}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title={t('totalUsers')}
                    value={loading ? '...' : stats?.totalUsers || 0}
                    icon={Users}
                    variant="primary"
                />
                <StatsCard
                    title={t('activeUsers')}
                    value={loading ? '...' : stats?.activeUsers || 0}
                    icon={User}
                    variant="default"
                />
                <StatsCard
                    title={t('suspendedUsers')}
                    value={loading ? '...' : stats?.suspendedUsers || 0}
                    icon={UserX}
                    variant="danger"
                />
                <StatsCard
                    title={t('adminUsers')}
                    value={loading ? '...' : stats?.adminUsers || 0}
                    icon={Shield}
                    variant="warning"
                />
            </div>

            {/* Content & Revenue Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title={t('totalVideos')}
                    value={loading ? '...' : stats?.totalVideos || 0}
                    icon={Video}
                    variant="primary"
                />
                <StatsCard
                    title={t('totalImages')}
                    value={loading ? '...' : stats?.totalImages || 0}
                    icon={ImageIcon}
                    variant="default"
                />
                <StatsCard
                    title={t('totalRevenue')}
                    value={loading ? '...' : `${(stats?.totalRevenue || 0).toLocaleString()} EGP`}
                    icon={DollarSign}
                    variant="primary"
                />
                <StatsCard
                    title={t('flaggedContent')}
                    value={loading ? '...' : stats?.flaggedContent || 0}
                    icon={AlertTriangle}
                    variant="danger"
                />
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4">{t('quickActions')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {quickActions.map((action) => (
                        <Link key={action.href} href={action.href}>
                            <GlassCard hoverEffect className="p-6 cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${action.color === 'primary' ? 'bg-primary/10' : 'bg-secondary/10'
                                        }`}>
                                        <action.icon className={`w-6 h-6 ${action.color === 'primary' ? 'text-primary' : 'text-secondary'
                                            }`} />
                                    </div>
                                    <span className="text-white font-medium">{action.label}</span>
                                </div>
                            </GlassCard>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Admin Info */}
            <GlassCard className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">{t('systemInfo')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-gray-400">{t('totalContent')}</span>
                        <span className="text-white font-medium">
                            {loading ? '...' : (stats?.totalVideos || 0) + (stats?.totalImages || 0) + (stats?.totalAvatars || 0)}
                        </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-gray-400">{t('totalAvatars')}</span>
                        <span className="text-white font-medium">
                            {loading ? '...' : stats?.totalAvatars || 0}
                        </span>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
