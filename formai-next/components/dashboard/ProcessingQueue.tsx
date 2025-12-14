'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { IconVideo, IconPhoto, IconUserCircle, IconLoader2, IconClock } from '@tabler/icons-react';
import { ProcessingUpdate } from '@/hooks/useRealTimeUpdates';
import { useTranslations } from 'next-intl';

interface ProcessingQueueProps {
    items: ProcessingUpdate[];
    locale: string;
}

export function ProcessingQueue({ items, locale }: ProcessingQueueProps) {
    const t = useTranslations('dashboard');

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
                <h2 className="text-base sm:text-lg font-bold text-white">
                    {t('processing')}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] sm:text-xs font-medium">
                    {items.length}
                </span>
            </div>

            <div className="bg-[#0d1117] border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 overflow-hidden">
                <div className="space-y-2 sm:space-y-3">
                    <AnimatePresence mode="popLayout">
                        {items.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20, height: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                            >
                                {/* Type badge */}
                                <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg border flex-shrink-0 ${getTypeColor(item.type)}`}>
                                    {getIcon(item.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm text-white font-medium truncate">
                                        {item.prompt.length > 30 ? `${item.prompt.slice(0, 30)}...` : item.prompt}
                                    </p>
                                    <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                                        <span className={`text-[10px] sm:text-xs capitalize ${item.status === 'processing' ? 'text-primary' : 'text-gray-400'}`}>
                                            {getStatusText(item.status)}
                                        </span>
                                        <span className="text-gray-600 hidden sm:inline">•</span>
                                        <span className="text-[10px] sm:text-xs text-gray-500 hidden sm:flex items-center gap-1">
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
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-500/20 flex items-center justify-center">
                                            <IconClock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Hint */}
                <p className="text-[10px] sm:text-xs text-gray-500 mt-3 sm:mt-4 text-center">
                    {t('queueHint')}
                </p>
            </div>
        </motion.div>
    );
}
