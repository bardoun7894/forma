'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BentoGrid, BentoGridItem } from '@/components/ui/BentoGrid';
import { cn } from '@/lib/utils';
import {
    IconVideo,
    IconPhoto,
    IconUserCircle,
    IconMessageChatbot,
    IconFolder,
    IconArrowRight,
    IconSparkles,
    IconPlayerPlay,
    IconClock,
    IconAlertCircle,
    IconRefresh,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/Button';
import { BackgroundBeams } from '@/components/ui/BackgroundBeams';
import { motion } from 'framer-motion';

// Custom hooks
import { useDashboardData } from '@/hooks/useDashboardData';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';

// Dashboard components
import {
    StatsCard,
    ProcessingQueue,
    AnalyticsWidget,
    OnboardingOverlay,
} from '@/components/dashboard';

export default function DashboardPage() {
    const t = useTranslations('dashboard');
    const { userData } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const params = useParams();
    const locale = params.locale as string;

    const isNewUser = userData?.credits === 10 && !localStorage.getItem('formAI_onboarding_complete');

    // Use cached dashboard data
    const {
        data: dashboardData,
        isLoading,
        error,
        refetch,
    } = useDashboardData(userData?.uid, locale);

    // Real-time updates for processing items (notifications handled in global header)
    const {
        processingItems,
        processingCount,
    } = useRealTimeUpdates(userData?.uid);

    // Quick actions config - icons sized for mobile
    const quickActions = [
        {
            key: 'video',
            href: `/${locale}/video`,
            icon: <IconVideo className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />,
            title: t('createVideo'),
            description: t('videoDescription'),
            className: "col-span-1 md:col-span-2",
        },
        {
            key: 'image',
            href: `/${locale}/image`,
            icon: <IconPhoto className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />,
            title: t('createImage'),
            description: t('imageDescription'),
            className: "col-span-1",
        },
        {
            key: 'avatar',
            href: `/${locale}/avatar`,
            icon: <IconUserCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />,
            title: t('createAvatar'),
            description: t('avatarDescription'),
            className: "col-span-1",
        },
        {
            key: 'chat',
            href: `/${locale}/chat`,
            icon: <IconMessageChatbot className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />,
            title: t('startChat'),
            description: t('chatDescription'),
            className: "col-span-1 md:col-span-2",
        },
    ];

    // Stats config with sparkline data
    const statsConfig = [
        {
            label: t('videosGenerated'),
            value: dashboardData?.stats.videos || 0,
            previousValue: dashboardData?.sparklineData.videos[0] || 0,
            icon: IconVideo,
            color: 'from-cyan-500 to-blue-500',
            bgColor: 'bg-cyan-500/10',
            iconColor: 'text-cyan-400',
            sparklineData: dashboardData?.sparklineData.videos || [],
        },
        {
            label: t('imagesGenerated'),
            value: dashboardData?.stats.images || 0,
            previousValue: dashboardData?.sparklineData.images[0] || 0,
            icon: IconPhoto,
            color: 'from-purple-500 to-pink-500',
            bgColor: 'bg-purple-500/10',
            iconColor: 'text-purple-400',
            sparklineData: dashboardData?.sparklineData.images || [],
        },
        {
            label: t('avatarsCreated'),
            value: dashboardData?.stats.avatars || 0,
            previousValue: dashboardData?.sparklineData.avatars[0] || 0,
            icon: IconUserCircle,
            color: 'from-green-500 to-emerald-500',
            bgColor: 'bg-green-500/10',
            iconColor: 'text-green-400',
            sparklineData: dashboardData?.sparklineData.avatars || [],
        },
    ];

    const formatTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 60) return t('justNow');
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return t('minutesAgo', { minutes });
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return t('hoursAgo', { hours });
        const days = Math.floor(hours / 24);
        return t('daysAgo', { days });
    };

    // Skeleton loader for recent items
    const RecentItemSkeleton = () => (
        <div className={cn(
            "relative aspect-square rounded-2xl overflow-hidden animate-pulse border",
            isDark
                ? "bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10"
                : "bg-gradient-to-br from-gray-100 to-gray-50 border-gray-200"
        )}>
            <div className={cn("w-full h-full", isDark ? "bg-gradient-to-br from-white/10 to-white/5" : "bg-gray-100")} />
            <div className="absolute top-2 left-2">
                <div className={cn("w-14 h-5 rounded-lg", isDark ? "bg-white/20" : "bg-gray-300")} />
            </div>
            <div className="absolute top-2 right-2">
                <div className={cn("w-10 h-5 rounded-lg", isDark ? "bg-white/20" : "bg-gray-300")} />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                <div className={cn("h-3 w-3/4 rounded mb-1", isDark ? "bg-white/20" : "bg-gray-300")} />
                <div className={cn("h-3 w-1/2 rounded", isDark ? "bg-white/10" : "bg-gray-200")} />
            </div>
        </div>
    );

    return (
        <div className="space-y-6 sm:space-y-8 relative min-h-screen pb-10">
            {/* Background Beams */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-50">
                <BackgroundBeams />
            </div>

            {/* Onboarding for new users */}
            <OnboardingOverlay
                isNewUser={isNewUser}
                onComplete={() => {}}
                locale={locale}
            />

            {/* Welcome Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10"
            >
                <div className="space-y-1 sm:space-y-2">
                    <h1 className={cn("text-2xl sm:text-3xl font-bold flex flex-wrap items-center gap-2 sm:gap-3", isDark ? "text-white" : "text-gray-900")}>
                        <span>{t('welcome')},</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-400 to-secondary">
                            {userData?.displayName?.split(' ')[0] || 'Creator'}
                        </span>
                        <IconSparkles className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-400 animate-pulse" />
                    </h1>
                    <p className={cn("text-base sm:text-lg", isDark ? "text-gray-400" : "text-gray-600")}>{t('heroGreeting')}</p>
                </div>
            </motion.div>

            {/* Stats Cards with Sparklines */}
            <div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 relative z-10"
                role="region"
                aria-label="Generation statistics"
            >
                {statsConfig.map((stat, index) => (
                    <StatsCard
                        key={stat.label}
                        label={stat.label}
                        value={stat.value}
                        previousValue={stat.previousValue}
                        icon={stat.icon}
                        color={stat.color}
                        bgColor={stat.bgColor}
                        iconColor={stat.iconColor}
                        sparklineData={stat.sparklineData}
                        isLoading={isLoading}
                        index={index}
                    />
                ))}
            </div>

            {/* Processing Queue (only show if items are processing) */}
            {processingCount > 0 && (
                <ProcessingQueue items={processingItems} locale={locale} />
            )}

            {/* Quick Actions - Bento Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative z-10"
                role="region"
                aria-label="Quick actions"
            >
                <h2 className={cn("text-lg sm:text-xl font-bold mb-4 sm:mb-5 flex items-center gap-2", isDark ? "text-white" : "text-gray-900")}>
                    <IconSparkles className="w-5 h-5 text-primary" />
                    {t('quickActions')}
                </h2>
                <BentoGrid>
                    {quickActions.map((item, i) => (
                        <BentoGridItem
                            key={item.key}
                            title={item.title}
                            description={item.description}
                            icon={item.icon}
                            className={item.className}
                            href={item.href}
                        />
                    ))}
                </BentoGrid>
            </motion.div>

            {/* Analytics Widget */}
            {dashboardData && (dashboardData.stats.videos > 0 || dashboardData.stats.images > 0 || dashboardData.stats.avatars > 0) && (
                <AnalyticsWidget
                    weeklyData={dashboardData.weeklyData}
                    stats={dashboardData.stats}
                    isLoading={isLoading}
                />
            )}

            {/* Recent Activity */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="relative z-10"
                role="region"
                aria-label="Recent activity"
            >
                <div className="flex items-center justify-between mb-4 sm:mb-5 gap-2">
                    <h2 className={cn("text-lg sm:text-xl font-bold flex items-center gap-2", isDark ? "text-white" : "text-gray-900")}>
                        <IconClock className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="truncate">{t('recentActivity')}</span>
                    </h2>
                    <Link href={`/${locale}/library`} className="text-primary hover:text-cyan-300 text-xs sm:text-sm font-medium flex items-center gap-1 transition-colors whitespace-nowrap">
                        {t('viewAll')} <IconArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Error state */}
                {error ? (
                    <div className={cn(
                        "rounded-2xl p-12 border",
                        isDark
                            ? "bg-gradient-to-br from-red-500/5 to-red-500/[0.02] border-red-500/20"
                            : "bg-red-50 border-red-200"
                    )}>
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center", isDark ? "bg-red-500/10" : "bg-red-100")}>
                                <IconAlertCircle className="w-8 h-8 text-red-400" />
                            </div>
                            <p className={cn("text-center", isDark ? "text-gray-300" : "text-gray-600")}>Failed to load your creations. Please try again.</p>
                            <Button
                                onClick={() => refetch()}
                                className={cn(
                                    "border",
                                    isDark
                                        ? "bg-red-500/20 hover:bg-red-500/30 border-red-500/30 text-red-300"
                                        : "bg-red-100 hover:bg-red-200 border-red-300 text-red-600"
                                )}
                            >
                                <IconRefresh className="w-4 h-4 mr-2" /> Try Again
                            </Button>
                        </div>
                    </div>
                ) : isLoading ? (
                    /* Skeleton loaders */
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                        {[...Array(6)].map((_, i) => (
                            <RecentItemSkeleton key={i} />
                        ))}
                    </div>
                ) : dashboardData && dashboardData.recentItems.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                        {dashboardData.recentItems.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 * index }}
                            >
                                <Link
                                    href={`/${locale}/library`}
                                    className={cn(
                                        "group relative aspect-square rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 block border",
                                        isDark
                                            ? "bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10"
                                            : "bg-white border-gray-200 shadow-sm"
                                    )}
                                >
                                    {item.type === 'video' ? (
                                        <>
                                            <video
                                                src={item.url}
                                                className="w-full h-full object-cover"
                                                muted
                                                playsInline
                                                onMouseOver={(e) => e.currentTarget.play()}
                                                onMouseOut={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                                                    <IconPlayerPlay className="w-6 h-6 text-white ml-1" />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <img
                                            src={item.url}
                                            alt={item.prompt}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            loading="lazy"
                                        />
                                    )}

                                    {/* Type badge */}
                                    <div className="absolute top-2 left-2">
                                        <div className={`px-2 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-md text-[10px] font-medium ${
                                            item.type === 'video' ? 'bg-cyan-500/80 text-white' :
                                            item.type === 'image' ? 'bg-purple-500/80 text-white' : 'bg-green-500/80 text-white'
                                        }`}>
                                            {item.type === 'video' ? <IconVideo className="w-3 h-3" /> :
                                             item.type === 'image' ? <IconPhoto className="w-3 h-3" /> :
                                             <IconUserCircle className="w-3 h-3" />}
                                            {item.type}
                                        </div>
                                    </div>

                                    {/* Time badge */}
                                    <div className="absolute top-2 right-2">
                                        <div className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-medium text-gray-300">
                                            {formatTimeAgo(item.createdAt)}
                                        </div>
                                    </div>

                                    {/* Hover overlay with prompt */}
                                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                                        <p className="text-xs text-white/90 line-clamp-2 font-medium">{item.prompt}</p>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    /* Empty state */
                    <div className={cn(
                        "border-dashed rounded-2xl p-8 sm:p-12 border",
                        isDark
                            ? "bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10"
                            : "bg-gray-50 border-gray-300"
                    )}>
                        <div className="text-center">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/10 flex items-center justify-center">
                                <IconFolder className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                            </div>
                            <h3 className={cn("text-lg sm:text-xl font-bold mb-2", isDark ? "text-white" : "text-gray-900")}>{t('emptyLibraryTitle')}</h3>
                            <p className={cn("mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base", isDark ? "text-gray-400" : "text-gray-600")}>{t('emptyLibrarySubtitle')}</p>
                            <Link href={`/${locale}/video`}>
                                <Button className="bg-gradient-to-r from-primary via-cyan-400 to-secondary hover:opacity-90 text-black font-bold px-6 sm:px-10 py-3 sm:py-4 rounded-xl shadow-xl shadow-primary/40 text-sm sm:text-base">
                                    <IconSparkles className="w-5 h-5 sm:w-6 sm:h-6 mr-2" /> {t('startNow')}
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
