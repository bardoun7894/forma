'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useQueryClient } from '@tanstack/react-query';
import { Notification } from '@/components/dashboard/NotificationBell';

export interface ProcessingUpdate {
    id: string;
    type: 'video' | 'image' | 'avatar';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    prompt: string;
    progress?: number;
    createdAt: Date;
}

export function useRealTimeUpdates(userId: string | undefined) {
    const [processingItems, setProcessingItems] = useState<ProcessingUpdate[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const queryClient = useQueryClient();

    // Track IDs we've already notified about to prevent duplicates
    const notifiedIds = useRef<Set<string>>(new Set());

    // Add notification helper
    const addNotification = useCallback((
        type: 'completion' | 'failure',
        contentType: 'video' | 'image' | 'avatar',
        prompt: string
    ) => {
        const notification: Notification = {
            id: Date.now().toString(),
            type,
            contentType,
            title: type === 'completion'
                ? `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} Ready!`
                : `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} Failed`,
            message: type === 'completion'
                ? `Your ${contentType} "${prompt.slice(0, 30)}${prompt.length > 30 ? '...' : ''}" is ready to view`
                : `Failed to generate ${contentType}. Please try again.`,
            timestamp: new Date(),
            read: false,
        };

        setNotifications(prev => [notification, ...prev.slice(0, 19)]); // Keep last 20
    }, []);

    // Clear notification
    const clearNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Mark as read
    const markAsRead = useCallback((id: string) => {
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
    }, []);

    // Mark all as read
    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    useEffect(() => {
        if (!userId) return;

        const unsubscribers: (() => void)[] = [];

        // Helper to handle status changes
        const handleStatusChange = (
            docId: string,
            type: 'video' | 'image' | 'avatar',
            status: string,
            prompt: string
        ) => {
            const notifyKey = `${docId}-${status}`;

            if (status === 'completed' && !notifiedIds.current.has(notifyKey)) {
                notifiedIds.current.add(notifyKey);
                addNotification('completion', type, prompt);
                // Invalidate dashboard cache to refresh data
                queryClient.invalidateQueries({ queryKey: ['dashboard', userId] });
            } else if (status === 'failed' && !notifiedIds.current.has(notifyKey)) {
                notifiedIds.current.add(notifyKey);
                addNotification('failure', type, prompt);
            }
        };

        // Listen to videos - processing items
        const videosProcessingQuery = query(
            collection(db, 'videos'),
            where('userId', '==', userId),
            where('status', 'in', ['pending', 'processing'])
        );

        const videosProcessingUnsub = onSnapshot(videosProcessingQuery, (snapshot) => {
            const videos: ProcessingUpdate[] = snapshot.docs.map(doc => ({
                id: doc.id,
                type: 'video',
                status: doc.data().status,
                prompt: doc.data().prompt,
                createdAt: new Date(doc.data().createdAt),
            }));

            setProcessingItems(prev => {
                const filtered = prev.filter(item => item.type !== 'video');
                return [...filtered, ...videos].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            });
        });
        unsubscribers.push(videosProcessingUnsub);

        // Listen to videos - completed/failed (recent ones)
        const videosCompletedQuery = query(
            collection(db, 'videos'),
            where('userId', '==', userId),
            where('status', 'in', ['completed', 'failed']),
            orderBy('createdAt', 'desc'),
            limit(10)
        );

        const videosCompletedUnsub = onSnapshot(videosCompletedQuery, (snapshot) => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added' || change.type === 'modified') {
                    const data = change.doc.data();
                    const completedAt = data.completedAt;

                    // Only notify for recently completed items (within last 30 seconds)
                    if (completedAt) {
                        const completedTime = new Date(completedAt).getTime();
                        const now = Date.now();
                        if (now - completedTime < 30000) {
                            handleStatusChange(change.doc.id, 'video', data.status, data.prompt);
                        }
                    }
                }
            });
        }, (error) => {
            console.warn('Videos completion listener error:', error);
        });
        unsubscribers.push(videosCompletedUnsub);

        // Listen to images - processing items
        const imagesProcessingQuery = query(
            collection(db, 'images'),
            where('userId', '==', userId),
            where('status', 'in', ['pending', 'processing'])
        );

        const imagesProcessingUnsub = onSnapshot(imagesProcessingQuery, (snapshot) => {
            const images: ProcessingUpdate[] = snapshot.docs.map(doc => ({
                id: doc.id,
                type: 'image',
                status: doc.data().status,
                prompt: doc.data().prompt,
                createdAt: new Date(doc.data().createdAt),
            }));

            setProcessingItems(prev => {
                const filtered = prev.filter(item => item.type !== 'image');
                return [...filtered, ...images].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            });
        });
        unsubscribers.push(imagesProcessingUnsub);

        // Listen to images - completed/failed
        const imagesCompletedQuery = query(
            collection(db, 'images'),
            where('userId', '==', userId),
            where('status', 'in', ['completed', 'failed']),
            orderBy('createdAt', 'desc'),
            limit(10)
        );

        const imagesCompletedUnsub = onSnapshot(imagesCompletedQuery, (snapshot) => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added' || change.type === 'modified') {
                    const data = change.doc.data();
                    const completedAt = data.completedAt;

                    if (completedAt) {
                        const completedTime = new Date(completedAt).getTime();
                        const now = Date.now();
                        if (now - completedTime < 30000) {
                            handleStatusChange(change.doc.id, 'image', data.status, data.prompt);
                        }
                    }
                }
            });
        }, (error) => {
            console.warn('Images completion listener error:', error);
        });
        unsubscribers.push(imagesCompletedUnsub);

        // Listen to avatars - processing items
        const avatarsProcessingQuery = query(
            collection(db, 'avatars'),
            where('userId', '==', userId),
            where('status', 'in', ['pending', 'processing'])
        );

        const avatarsProcessingUnsub = onSnapshot(avatarsProcessingQuery, (snapshot) => {
            const avatars: ProcessingUpdate[] = snapshot.docs.map(doc => ({
                id: doc.id,
                type: 'avatar',
                status: doc.data().status,
                prompt: doc.data().prompt,
                createdAt: new Date(doc.data().createdAt),
            }));

            setProcessingItems(prev => {
                const filtered = prev.filter(item => item.type !== 'avatar');
                return [...filtered, ...avatars].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            });
        });
        unsubscribers.push(avatarsProcessingUnsub);

        // Listen to avatars - completed/failed
        const avatarsCompletedQuery = query(
            collection(db, 'avatars'),
            where('userId', '==', userId),
            where('status', 'in', ['completed', 'failed']),
            orderBy('createdAt', 'desc'),
            limit(10)
        );

        const avatarsCompletedUnsub = onSnapshot(avatarsCompletedQuery, (snapshot) => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added' || change.type === 'modified') {
                    const data = change.doc.data();
                    const completedAt = data.completedAt;

                    if (completedAt) {
                        const completedTime = new Date(completedAt).getTime();
                        const now = Date.now();
                        if (now - completedTime < 30000) {
                            handleStatusChange(change.doc.id, 'avatar', data.status, data.prompt);
                        }
                    }
                }
            });
        }, (error) => {
            console.warn('Avatars completion listener error:', error);
        });
        unsubscribers.push(avatarsCompletedUnsub);

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [userId, queryClient, addNotification]);

    return {
        processingItems,
        notifications,
        clearNotification,
        markAsRead,
        markAllAsRead,
        processingCount: processingItems.length,
        unreadCount: notifications.filter(n => !n.read).length,
    };
}
