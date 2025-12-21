'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { IconVideo, IconPhoto, IconUserCircle, IconLoader2, IconClock } from '@tabler/icons-react';
import { ProcessingUpdate } from '@/hooks/useRealTimeUpdates';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface ProcessingQueueProps {
    items: ProcessingUpdate[];
    locale: string;
}

export function ProcessingQueue({ items, locale }: ProcessingQueueProps) {
    const t = useTranslations('dashboard');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    if (items.length === 0) return null;

    const getIcon = (type: string) => {
        switch (type) {
            case 'video':
                return <IconVideo className="w-4 h-4" />;
            case 'image':
                return <IconPhoto className="w-4 h-4" />;
            case 'avatar':
                return <IconUserCircle className="w-4 h-4" />;
            default:
                return <IconLoader2 className="w-4 h-4" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'video':
                return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
            case 'image':
                return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'avatar':
                return 'bg-green-500/20 text-green-400 border-green-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending':
                return t('queued');
            case 'processing':
                return t('generating');
            default:
                return status;
        }
    };

    const formatTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 60) return t('justNow');
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return t('minutesAgo', { minutes });
        const hours = Math.floor(minutes / 60);
        return t('hoursAgo', { hours });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10"
        >
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="relative">
                    <IconLoader2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary animate-spin" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-primary rounded-full animate-ping" />
                </div>
                <h2 className={cn("text-base sm:text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>
                    {t('processing')}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] sm:text-xs font-medium">
                    {items.length}
                </span>
            </div>

            <div className={cn(
                "rounded-xl sm:rounded-2xl p-3 sm:p-4 overflow-hidden border",
                isDark ? "bg-[#0d1117] border-white/10" : "bg-white border-gray-200 shadow-sm"
            )}>
                <div className="space-y-2 sm:space-y-3">
                    <AnimatePresence mode="popLayout">
                        {items.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20, height: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={cn(
                                    "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-colors",
                                    isDark
                                        ? "bg-white/5 border-white/5 hover:border-white/10"
                                        : "bg-gray-50 border-gray-100 hover:border-gray-200"
                                )}
                            >
                                {/* Type badge */}
                                <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg border flex-shrink-0 ${getTypeColor(item.type)}`}>
                                    {getIcon(item.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className={cn("text-xs sm:text-sm font-medium truncate", isDark ? "text-white" : "text-gray-900")}>
                                        {item.prompt.length > 30 ? `${item.prompt.slice(0, 30)}...` : item.prompt}
                                    </p>
                                    <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                                        <span className={cn("text-[10px] sm:text-xs capitalize", item.status === 'processing' ? 'text-primary' : isDark ? 'text-gray-400' : 'text-gray-500')}>
                                            {getStatusText(item.status)}
                                        </span>
                                        <span className={cn("hidden sm:inline", isDark ? "text-gray-600" : "text-gray-400")}>•</span>
                                        <span className={cn("text-[10px] sm:text-xs hidden sm:flex items-center gap-1", isDark ? "text-gray-500" : "text-gray-400")}>
                                            <IconClock className="w-3 h-3" />
                                            {formatTimeAgo(item.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                {/* Status indicator */}
                                <div className="flex-shrink-0">
                                    {item.status === 'processing' ? (
                                        <div className="relative w-6 h-6 sm:w-8 sm:h-8">
                                            <IconLoader2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary animate-spin" />
                                        </div>
                                    ) : (
                                        <div className={cn("w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center", isDark ? "bg-gray-500/20" : "bg-gray-100")}>
                                            <IconClock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Hint */}
                <p className={cn("text-[10px] sm:text-xs mt-3 sm:mt-4 text-center", isDark ? "text-gray-500" : "text-gray-400")}>
                    {t('queueHint')}
                </p>
            </div>
        </motion.div>
    );
}
