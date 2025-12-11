'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BentoGrid, BentoGridItem } from '@/components/ui/BentoGrid';
import {
    IconVideo,
    IconPhoto,
    IconUserCircle,
    IconMessageChatbot,
    IconFolder,
    IconCreditCard,
    IconPlus,
    IconArrowRight,
    IconSparkles,
    IconLoader,
    IconPlayerPlay,
    IconClock,
    IconTrendingUp,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/Button';
import { BackgroundBeams } from '@/components/ui/BackgroundBeams';
import { getUserVideos, getUserImages, getUserAvatars } from '@/lib/database';
import { motion } from 'framer-motion';

// Type for recent items
type RecentItem = {
    id: string;
    type: 'video' | 'image' | 'avatar';
    url: string;
    prompt: string;
    createdAt: Date;
};

export default function DashboardPage() {
    const t = useTranslations('dashboard');
    const { userData } = useAuth();
    const params = useParams();
    const locale = params.locale as string;

    const credits = userData?.credits || 0;

    // Stats state
    const [stats, setStats] = useState({
        videos: 0,
        images: 0,
        avatars: 0,
    });
    const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch stats and recent items
    useEffect(() => {
        const fetchData = async () => {
            if (!userData?.uid) {
                setIsLoading(false);
                return;
            }

            try {
                const [videos, images, avatars] = await Promise.all([
                    getUserVideos(userData.uid),
                    getUserImages(userData.uid),
                    getUserAvatars(userData.uid),
                ]);

                // Filter completed items only
                const completedVideos = videos.filter(v => v.status === 'completed' && v.videoUrl);
                const completedImages = images.filter(i => i.status === 'completed' && i.imageUrl);
                const completedAvatars = avatars.filter(a => a.status === 'completed' && a.avatarUrl);

                setStats({
                    videos: completedVideos.length,
                    images: completedImages.length,
                    avatars: completedAvatars.length,
                });

                // Combine and get recent 6 items
                const allItems: RecentItem[] = [
                    ...completedVideos.map(v => ({
                        id: v.id || '',
                        type: 'video' as const,
                        url: v.videoUrl,
                        prompt: v.prompt,
                        createdAt: new Date(v.createdAt),
                    })),
                    ...completedImages.map(i => ({
                        id: i.id || '',
                        type: 'image' as const,
                        url: i.imageUrl,
                        prompt: i.prompt,
                        createdAt: new Date(i.createdAt),
                    })),
                    ...completedAvatars.map(a => ({
                        id: a.id || '',
                        type: 'avatar' as const,
                        url: a.avatarUrl,
                        prompt: a.prompt,
                        createdAt: new Date(a.createdAt),
                    })),
                ];

                // Sort by date and take recent 6
                allItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                setRecentItems(allItems.slice(0, 6));
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [userData?.uid]);

    const quickActions = [
        {
            key: 'video',
            href: `/${locale}/video`,
            icon: <IconVideo className="w-6 h-6 text-primary group-hover:text-secondary transition-colors" />,
            title: t('createVideo'),
            description: t('videoDescription'),
            className: "md:col-span-2",
            header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 animate-pulse-slow" />
        },
        {
            key: 'image',
            href: `/${locale}/image`,
            icon: <IconPhoto className="w-6 h-6 text-primary group-hover:text-secondary transition-colors" />,
            title: t('createImage'),
            description: t('imageDescription'),
            className: "md:col-span-1",
            header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neon-purple/20 to-neon-pink/20" />
        },
        {
            key: 'avatar',
            href: `/${locale}/avatar`,
            icon: <IconUserCircle className="w-6 h-6 text-primary group-hover:text-secondary transition-colors" />,
            title: t('createAvatar'),
            description: t('avatarDescription'),
            className: "md:col-span-1",
            header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neon-green/20 to-primary/20" />
        },
        {
            key: 'chat',
            href: `/${locale}/chat`,
            icon: <IconMessageChatbot className="w-6 h-6 text-primary group-hover:text-secondary transition-colors" />,
            title: t('startChat'),
            description: t('chatDescription'),
            className: "md:col-span-2",
            header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/10" />
        },
    ];

    const statsConfig = [
        {
            label: t('videosGenerated'),
            value: stats.videos,
            icon: IconVideo,
            color: 'from-cyan-500 to-blue-500',
            bgColor: 'bg-cyan-500/10',
            iconColor: 'text-cyan-400',
        },
        {
            label: t('imagesGenerated'),
            value: stats.images,
            icon: IconPhoto,
            color: 'from-purple-500 to-pink-500',
            bgColor: 'bg-purple-500/10',
            iconColor: 'text-purple-400',
        },
        {
            label: t('avatarsCreated'),
            value: stats.avatars,
            icon: IconUserCircle,
            color: 'from-green-500 to-emerald-500',
            bgColor: 'bg-green-500/10',
            iconColor: 'text-green-400',
        },
    ];

    const formatTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div className="space-y-8 relative min-h-screen pb-10">
            {/* Background Beams */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-50">
                <BackgroundBeams />
            </div>

            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10"
            >
                {/* Welcome */}
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        {t('welcome')},
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-400 to-secondary">
                            {userData?.displayName?.split(' ')[0] || 'Creator'}
                        </span>
                        <IconSparkles className="w-7 h-7 text-yellow-400 animate-pulse" />
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">{t('heroGreeting')}</p>
                </div>

                {/* Credit Balance Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-4 bg-gradient-to-r from-primary/10 via-cyan-500/5 to-secondary/10 border border-primary/20 rounded-2xl px-6 py-4 backdrop-blur-sm"
                >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center shadow-lg shadow-primary/30">
                        <IconCreditCard className="w-6 h-6 text-black" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">{t('creditBalance')}</p>
                        <p className="text-2xl font-bold text-white">{credits} <span className="text-sm text-gray-400 font-normal">credits</span></p>
                    </div>
                    <Link href={`/${locale}/credits`}>
                        <Button size="sm" className="ml-4 bg-primary/20 hover:bg-primary/30 border border-primary/30">
                            <IconPlus className="w-4 h-4 mr-1" /> Add
                        </Button>
                    </Link>
                </motion.div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
                {statsConfig.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + index * 0.1 }}
                            className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 overflow-hidden"
                        >
                            {/* Gradient glow on hover */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                            <div className="relative flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm font-medium mb-1">{stat.label}</p>
                                    <p className="text-4xl font-bold text-white">
                                        {isLoading ? (
                                            <span className="inline-block w-8 h-8 rounded bg-white/10 animate-pulse" />
                                        ) : (
                                            stat.value
                                        )}
                                    </p>
                                </div>
                                <div className={`w-14 h-14 rounded-2xl ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon className={`w-7 h-7 ${stat.iconColor}`} />
                                </div>
                            </div>

                            {/* Trend indicator */}
                            <div className="mt-4 flex items-center gap-2 text-xs">
                                <IconTrendingUp className="w-4 h-4 text-green-400" />
                                <span className="text-green-400 font-medium">Active</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Quick Actions - Bento Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative z-10"
            >
                <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                    <IconSparkles className="w-5 h-5 text-primary" />
                    {t('quickActions')}
                </h2>
                <BentoGrid>
                    {quickActions.map((item, i) => (
                        <BentoGridItem
                            key={i}
                            title={item.title}
                            description={item.description}
                            header={item.header}
                            icon={item.icon}
                            className={item.className}
                            href={item.href}
                        />
                    ))}
                </BentoGrid>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="relative z-10"
            >
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <IconClock className="w-5 h-5 text-primary" />
                        {t('recentActivity')}
                    </h2>
                    <Link href={`/${locale}/library`} className="text-primary hover:text-cyan-300 text-sm font-medium flex items-center gap-1 transition-colors">
                        {t('viewAll')} <IconArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {isLoading ? (
                    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-12">
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div className="relative">
                                <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            </div>
                            <p className="text-gray-400 text-sm">Loading your creations...</p>
                        </div>
                    </div>
                ) : recentItems.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {recentItems.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 * index }}
                            >
                                <Link
                                    href={`/${locale}/library`}
                                    className="group relative aspect-square bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 block"
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
                    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 border-dashed rounded-2xl p-12">
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/10 flex items-center justify-center">
                                <IconFolder className="w-10 h-10 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{t('emptyLibraryTitle')}</h3>
                            <p className="text-gray-400 mb-8 max-w-md mx-auto">{t('emptyLibrarySubtitle')}</p>
                            <Link href={`/${locale}/video`}>
                                <Button className="bg-gradient-to-r from-primary to-cyan-400 hover:opacity-90 text-black font-semibold px-8 py-3 rounded-xl shadow-lg shadow-primary/30">
                                    <IconSparkles className="w-5 h-5 mr-2" /> {t('startNow')}
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
