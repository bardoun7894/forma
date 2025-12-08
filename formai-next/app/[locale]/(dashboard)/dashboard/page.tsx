'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useParams, useRouter, usePathname } from 'next/navigation';
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
} from '@tabler/icons-react';
import { Button } from '@/components/ui/Button';
import { BackgroundBeams } from '@/components/ui/BackgroundBeams';
import { TextGenerateEffect } from '@/components/ui/TextGenerateEffect';

export default function DashboardPage() {
    const t = useTranslations('dashboard');
    const { userData } = useAuth();
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const locale = params.locale as string;

    const credits = userData?.credits || 0;

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

    const stats = [
        {
            label: t('videosGenerated'),
            value: '0',
            icon: IconVideo,
        },
        {
            label: t('imagesGenerated'),
            value: '0',
            icon: IconPhoto,
        },
        {
            label: t('avatarsCreated'),
            value: '0',
            icon: IconUserCircle,
        },
    ];

    return (
        <div className="space-y-6 relative min-h-screen">
            {/* Background Beams - positioned absolutely to cover the page */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <BackgroundBeams />
            </div>

            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
                {/* Welcome */}
                <div>
                    <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
                        <TextGenerateEffect words={`${t('welcome')},`} />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-neon-cyan to-secondary animate-gradient-x">
                            {userData?.displayName?.split(' ')[0] || 'Creator'}
                        </span>
                    </h1>
                    <p className="text-muted mt-1">{t('heroGreeting')}</p>
                </div>

                {/* Credit Balance */}
                <div className="flex items-center gap-4 bg-panel border border-white/5 rounded-xl px-5 py-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <IconCreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs text-muted uppercase tracking-wider">{t('creditBalance')}</p>
                        <p className="text-xl font-semibold text-white">{credits} <span className="text-sm text-muted font-normal">credits</span></p>
                    </div>
                    <Link href={`/${locale}/credits`}>
                        <Button size="sm" variant="secondary" className="ml-4">
                            <IconPlus className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={index}
                            className="bg-panel border border-white/5 rounded-xl p-5 flex items-center gap-4"
                        >
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Icon className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold text-white">{stat.value}</p>
                                <p className="text-sm text-muted">{stat.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions - Bento Grid */}
            <div className="relative z-10">
                <h2 className="text-lg font-semibold text-white mb-4">{t('quickActions')}</h2>
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
            </div>

            {/* Recent Activity */}
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">{t('recentActivity')}</h2>
                    <Link href={`/${locale}/library`} className="text-primary hover:text-primary-hover text-sm font-medium flex items-center gap-1">
                        {t('viewAll')} <IconArrowRight className="w-3 h-3" />
                    </Link>
                </div>
                <div className="bg-panel border border-white/5 border-dashed rounded-xl p-10">
                    <div className="text-center">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-white/5 flex items-center justify-center">
                            <IconFolder className="w-7 h-7 text-muted" />
                        </div>
                        <h3 className="font-medium text-white mb-2">{t('emptyLibraryTitle')}</h3>
                        <p className="text-sm text-muted mb-6 max-w-sm mx-auto">{t('emptyLibrarySubtitle')}</p>
                        <Link href={`/${locale}/video`}>
                            <Button>
                                <IconSparkles className="w-4 h-4 mr-2" /> {t('startNow')}
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
