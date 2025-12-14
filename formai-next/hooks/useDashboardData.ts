'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserVideos, getUserImages, getUserAvatars, VideoGeneration, ImageGeneration, AvatarGeneration } from '@/lib/database';

// Types
export interface DashboardStats {
    videos: number;
    images: number;
    avatars: number;
    totalGenerations: number;
}

export interface RecentItem {
    id: string;
    type: 'video' | 'image' | 'avatar';
    url: string;
    prompt: string;
    status: string;
    createdAt: Date;
}

export interface ProcessingItem {
    id: string;
    type: 'video' | 'image' | 'avatar';
    prompt: string;
    status: 'pending' | 'processing';
    createdAt: Date;
}

export interface WeeklyData {
    day: string;
    videos: number;
    images: number;
    avatars: number;
}

export interface DashboardData {
    stats: DashboardStats;
    recentItems: RecentItem[];
    processingItems: ProcessingItem[];
    weeklyData: WeeklyData[];
    sparklineData: {
        videos: number[];
        images: number[];
        avatars: number[];
    };
}

// Helper to calculate weekly data
function calculateWeeklyData(
    videos: VideoGeneration[],
    images: ImageGeneration[],
    avatars: AvatarGeneration[],
    locale: string = 'en'
): WeeklyData[] {
    const today = new Date();
    const weekData: WeeklyData[] = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        // Use locale-aware short day name
        const dayName = date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'short' });
        const dateStr = date.toDateString();

        weekData.push({
            day: dayName,
            videos: videos.filter(v => new Date(v.createdAt).toDateString() === dateStr && v.status === 'completed').length,
            images: images.filter(img => new Date(img.createdAt).toDateString() === dateStr && img.status === 'completed').length,
            avatars: avatars.filter(a => new Date(a.createdAt).toDateString() === dateStr && a.status === 'completed').length,
        });
    }

    return weekData;
}

// Helper to calculate sparkline data (last 7 days cumulative)
function calculateSparklineData(
    videos: VideoGeneration[],
    images: ImageGeneration[],
    avatars: AvatarGeneration[]
): { videos: number[]; images: number[]; avatars: number[] } {
    const today = new Date();
    const sparkline = { videos: [] as number[], images: [] as number[], avatars: [] as number[] };

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(23, 59, 59, 999);

        sparkline.videos.push(
            videos.filter(v => new Date(v.createdAt) <= date && v.status === 'completed').length
        );
        sparkline.images.push(
            images.filter(img => new Date(img.createdAt) <= date && img.status === 'completed').length
        );
        sparkline.avatars.push(
            avatars.filter(a => new Date(a.createdAt) <= date && a.status === 'completed').length
        );
    }

    return sparkline;
}

// Main hook
export function useDashboardData(userId: string | undefined, locale: string = 'en') {
    const queryClient = useQueryClient();

    const { data, isLoading, error, refetch, isStale } = useQuery({
        queryKey: ['dashboard', userId, locale],
        queryFn: async (): Promise<DashboardData> => {
            if (!userId) throw new Error('User ID required');

            const [videos, images, avatars] = await Promise.all([
                getUserVideos(userId),
                getUserImages(userId),
                getUserAvatars(userId),
            ]);

            // Filter by status
            const completedVideos = videos.filter(v => v.status === 'completed' && v.videoUrl);
            const completedImages = images.filter(i => i.status === 'completed' && i.imageUrl);
            const completedAvatars = avatars.filter(a => a.status === 'completed' && a.avatarUrl);

            // Processing items
            const processingVideos = videos.filter(v => v.status === 'pending' || v.status === 'processing');
            const processingImages = images.filter(i => i.status === 'pending' || i.status === 'processing');
            const processingAvatars = avatars.filter(a => a.status === 'pending' || a.status === 'processing');

            // Stats
            const stats: DashboardStats = {
                videos: completedVideos.length,
                images: completedImages.length,
                avatars: completedAvatars.length,
                totalGenerations: completedVideos.length + completedImages.length + completedAvatars.length,
            };

            // Recent items (last 6 completed)
            const allCompleted: RecentItem[] = [
                ...completedVideos.map(v => ({
                    id: v.id || '',
                    type: 'video' as const,
                    url: v.videoUrl,
                    prompt: v.prompt,
                    status: v.status,
                    createdAt: new Date(v.createdAt),
                })),
                ...completedImages.map(i => ({
                    id: i.id || '',
                    type: 'image' as const,
                    url: i.imageUrl,
                    prompt: i.prompt,
                    status: i.status,
                    createdAt: new Date(i.createdAt),
                })),
                ...completedAvatars.map(a => ({
                    id: a.id || '',
                    type: 'avatar' as const,
                    url: a.avatarUrl,
                    prompt: a.prompt,
                    status: a.status,
                    createdAt: new Date(a.createdAt),
                })),
            ];
            allCompleted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            // Processing items
            const processingItems: ProcessingItem[] = [
                ...processingVideos.map(v => ({
                    id: v.id || '',
                    type: 'video' as const,
                    prompt: v.prompt,
                    status: v.status as 'pending' | 'processing',
                    createdAt: new Date(v.createdAt),
                })),
                ...processingImages.map(i => ({
                    id: i.id || '',
                    type: 'image' as const,
                    prompt: i.prompt,
                    status: i.status as 'pending' | 'processing',
                    createdAt: new Date(i.createdAt),
                })),
                ...processingAvatars.map(a => ({
                    id: a.id || '',
                    type: 'avatar' as const,
                    prompt: a.prompt,
                    status: a.status as 'pending' | 'processing',
                    createdAt: new Date(a.createdAt),
                })),
            ];
            processingItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            // Weekly and sparkline data
            const weeklyData = calculateWeeklyData(videos, images, avatars, locale);
            const sparklineData = calculateSparklineData(videos, images, avatars);

            return {
                stats,
                recentItems: allCompleted.slice(0, 6),
                processingItems,
                weeklyData,
                sparklineData,
            };
        },
        enabled: !!userId,
        staleTime: 2 * 60 * 1000, // 2 minutes for dashboard
        refetchInterval: 30 * 1000, // Refetch every 30 seconds
    });

    // Invalidate dashboard data (call after new generation)
    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard', userId] });
    };

    return {
        data,
        isLoading,
        error,
        refetch,
        isStale,
        invalidate,
    };
}
