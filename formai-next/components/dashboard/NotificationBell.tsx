'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconBell, IconCheck, IconVideo, IconPhoto, IconUserCircle, IconX, IconSparkles, IconAlertTriangle } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';

export interface Notification {
    id: string;
    type: 'completion' | 'failure' | 'credits' | 'announcement';
    contentType?: 'video' | 'image' | 'avatar';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
}

interface NotificationBellProps {
    notifications: Notification[];
    onAddNotification?: (notification: Notification) => void;
    onClearNotification?: (id: string) => void;
    onMarkAsRead?: (id: string) => void;
    onMarkAllAsRead?: () => void;
}

export function NotificationBell({
    notifications: externalNotifications,
    onClearNotification,
    onMarkAsRead,
    onMarkAllAsRead,
}: NotificationBellProps) {
    const t = useTranslations('header');
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>(externalNotifications);

    // Sync with external notifications
    useEffect(() => {
        setNotifications(externalNotifications);
    }, [externalNotifications]);

    const unreadCount = notifications.filter(n => !n.read).length;
    const hasNew = unreadCount > 0;

    const handleMarkAsRead = (id: string) => {
        if (onMarkAsRead) {
            onMarkAsRead(id);
        }
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
    };

    const handleMarkAllAsRead = () => {
        if (onMarkAllAsRead) {
            onMarkAllAsRead();
        }
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const handleClearNotification = (id: string) => {
        if (onClearNotification) {
            onClearNotification(id);
        }
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const getIcon = (notification: Notification) => {
        if (notification.type === 'failure') {
            return <IconAlertTriangle className="w-4 h-4 text-red-400" />;
        }
        if (notification.type === 'completion') {
            switch (notification.contentType) {
                case 'video':
                    return <IconVideo className="w-4 h-4 text-cyan-400" />;
                case 'image':
                    return <IconPhoto className="w-4 h-4 text-purple-400" />;
                case 'avatar':
                    return <IconUserCircle className="w-4 h-4 text-green-400" />;
            }
        }
        return <IconSparkles className="w-4 h-4 text-yellow-400" />;
    };

    const formatTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return t('justNow');
        if (minutes < 60) return t('minutesAgo', { minutes });
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return t('hoursAgo', { hours });
        return date.toLocaleDateString();
    };

    return (
        <div className="relative">
            {/* Bell button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
                aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            >
                <IconBell className={`w-5 h-5 ${hasNew ? 'text-primary animate-bounce' : 'text-gray-400'}`} />

                {/* Badge */}
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-1 -end-1 w-5 h-5 bg-primary text-black text-xs font-bold rounded-full flex items-center justify-center"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.span>
                    )}
                </AnimatePresence>
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-[200]"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute end-0 top-full mt-2 w-80 bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-[201] ring-1 ring-white/5"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-white/10">
                                <h3 className="text-white font-semibold">{t('notifications')}</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="text-xs text-primary hover:text-cyan-300 transition-colors"
                                    >
                                        {t('markAllRead')}
                                    </button>
                                )}
                            </div>

                            {/* List */}
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <IconBell className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                                        <p className="text-gray-400 text-sm">{t('noNotifications')}</p>
                                        <p className="text-gray-500 text-xs mt-1">{t('notificationsHint')}</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/5">
                                        {notifications.map(notification => (
                                            <motion.div
                                                key={notification.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className={`p-4 hover:bg-white/5 transition-colors ${!notification.read ? 'bg-primary/5' : ''}`}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                        notification.type === 'completion' ? 'bg-green-500/20' :
                                                        notification.type === 'failure' ? 'bg-red-500/20' : 'bg-primary/20'
                                                    }`}>
                                                        {notification.type === 'completion' ? (
                                                            <IconCheck className="w-4 h-4 text-green-400" />
                                                        ) : notification.type === 'failure' ? (
                                                            <IconAlertTriangle className="w-4 h-4 text-red-400" />
                                                        ) : (
                                                            getIcon(notification)
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className={`text-sm font-medium ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                                                                {notification.title}
                                                            </p>
                                                            <button
                                                                onClick={() => handleClearNotification(notification.id)}
                                                                className="text-gray-500 hover:text-gray-300 transition-colors"
                                                            >
                                                                <IconX className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-0.5">{notification.message}</p>
                                                        <p className="text-xs text-gray-500 mt-1">{formatTime(notification.timestamp)}</p>
                                                    </div>
                                                </div>
                                                {!notification.read && (
                                                    <button
                                                        onClick={() => handleMarkAsRead(notification.id)}
                                                        className="mt-2 text-xs text-primary hover:text-cyan-300"
                                                    >
                                                        {t('markAsRead')}
                                                    </button>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
