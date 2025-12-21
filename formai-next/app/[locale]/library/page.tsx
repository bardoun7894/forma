"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { GenerationResult } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { getUserVideos, getUserImages, getUserAvatars, updateVideoGeneration, deleteVideo, deleteImage, deleteAvatar, type VideoGeneration, type ImageGeneration, type AvatarGeneration } from '@/lib/database';
import { pollVideoStatus } from '@/services/aiService';
import {
    Search,
    Grid as GridIcon,
    List as ListIcon,
    Download,
    Trash2,
    Copy,
    Filter,
    X,
    FileType,
    Check,
    Film,
    Image as ImageIcon,
    MessageSquare,
    Loader2
} from 'lucide-react';

export default function LibraryPage() {
    const { userData } = useAuth();
    const [generations, setGenerations] = useState<GenerationResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch user's generations from Firebase
    useEffect(() => {
        const fetchGenerations = async () => {
            if (!userData?.uid) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);

                // Fetch videos, images, and avatars in parallel
                const [videos, images, avatars] = await Promise.all([
                    getUserVideos(userData.uid),
                    getUserImages(userData.uid),
                    getUserAvatars(userData.uid),
                ]);

                console.log('Library fetch results:', {
                    videos: videos.length,
                    images: images.length,
                    avatars: avatars.length,
                    videoDetails: videos.map(v => ({ id: v.id, status: v.status, hasUrl: !!v.videoUrl })),
                    imageDetails: images.map(i => ({ id: i.id, status: i.status, hasUrl: !!i.imageUrl })),
                    avatarDetails: avatars.map(a => ({ id: a.id, status: a.status, hasUrl: !!a.avatarUrl })),
                });

                // For videos with taskId but no videoUrl, try to fetch the URL
                const videosWithUrls = await Promise.all(
                    videos.map(async (v) => {
                        // If completed but missing URL, try to refetch
                        if (v.status === 'completed' && !v.videoUrl && v.taskId) {
                            try {
                                const result = await pollVideoStatus(v.taskId);
                                if (result.videoUrl && v.id) {
                                    // Update Firebase with the URL
                                    await updateVideoGeneration(v.id, { videoUrl: result.videoUrl });
                                    return { ...v, videoUrl: result.videoUrl };
                                }
                            } catch (err) {
                                console.error('Failed to refetch video URL:', err);
                            }
                        }
                        return v;
                    })
                );

                // Convert to GenerationResult format
                const videoResults: GenerationResult[] = videosWithUrls
                    .filter(v => v.status === 'completed' && v.videoUrl)
                    .map(v => ({
                        id: v.id || '',
                        type: 'video' as const,
                        url: v.videoUrl,
                        prompt: v.prompt,
                        model: v.model,
                        createdAt: new Date(v.createdAt),
                        status: 'completed' as const,
                        source: 'videos' as const,
                    }));

                const imageResults: GenerationResult[] = images
                    .filter(i => i.status === 'completed' && i.imageUrl)
                    .map(i => ({
                        id: i.id || '',
                        type: 'image' as const,
                        url: i.imageUrl,
                        prompt: i.prompt,
                        model: i.model,
                        createdAt: new Date(i.createdAt),
                        status: 'completed' as const,
                        source: 'images' as const,
                    }));

                const avatarResults: GenerationResult[] = avatars
                    .filter(a => a.status === 'completed' && a.avatarUrl)
                    .map(a => ({
                        id: a.id || '',
                        type: (a.type === 'video' ? 'video' : 'image') as 'video' | 'image', // Use actual type from avatar
                        url: a.avatarUrl,
                        prompt: a.prompt,
                        createdAt: new Date(a.createdAt),
                        status: 'completed' as const,
                        source: 'avatars' as const,
                    }));

                // Combine and sort by date (newest first)
                const allGenerations = [...videoResults, ...imageResults, ...avatarResults]
                    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

                setGenerations(allGenerations);
            } catch (error) {
                console.error('Failed to fetch library:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGenerations();
    }, [userData?.uid]);

    const handleDelete = async (id: string, source?: 'videos' | 'images' | 'avatars') => {
        try {
            // Delete from database based on source
            if (source === 'videos') {
                await deleteVideo(id);
            } else if (source === 'images') {
                await deleteImage(id);
            } else if (source === 'avatars') {
                await deleteAvatar(id);
            }
            // Remove from local state
            setGenerations(prev => prev.filter(g => g.id !== id));
        } catch (error) {
            console.error('Failed to delete item:', error);
        }
    };

    return (
        <div className="min-h-screen bg-page">
            <Sidebar />

            <main className="lg:ml-72 rtl:lg:ml-0 rtl:lg:mr-72 min-h-screen pt-20 lg:pt-6 px-4 pb-4 lg:px-8 lg:pb-8">
                <LibraryContent
                    generations={generations}
                    onDelete={handleDelete}
                    isLoading={isLoading}
                />
            </main>
        </div>
    );
}

interface LibraryContentProps {
    generations: GenerationResult[];
    onDelete: (id: string, source?: 'videos' | 'images' | 'avatars') => void;
    isLoading?: boolean;
}

const LibraryContent: React.FC<LibraryContentProps> = ({ generations, onDelete, isLoading = false }) => {
    const t = useTranslations('library');
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filterType, setFilterType] = useState<'all' | 'video' | 'image' | 'text'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState<GenerationResult | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Filter & Search Logic
    const filteredItems = useMemo(() => {
        return generations.filter(item => {
            const matchesType = filterType === 'all' || item.type === filterType;
            const matchesSearch = item.prompt.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesType && matchesSearch;
        });
    }, [generations, filterType, searchQuery]);

    // Helper Functions
    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    };

    const handleCopyPrompt = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return <Film className="w-4 h-4 text-primary" />;
            case 'image': return <ImageIcon className="w-4 h-4 text-purple-400" />;
            case 'text': return <MessageSquare className="w-4 h-4 text-blue-400" />;
            default: return <FileType className="w-4 h-4 text-gray-400" />;
        }
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col gap-6 animate-in fade-in duration-500">

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className={cn("text-3xl font-bold tracking-tight mb-1", isDark ? "text-white" : "text-gray-900")}>{t('title')}</h1>
                    <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>{t('subtitle')}</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative w-full md:w-64">
                        <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isDark ? "text-gray-500" : "text-gray-400")} />
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={cn(
                                "w-full rounded-lg pl-9 pr-4 py-2.5 text-sm border focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all",
                                isDark
                                    ? "bg-white/5 border-white/10 text-white"
                                    : "bg-white border-gray-300 text-gray-900"
                            )}
                        />
                    </div>

                    {/* Type Filter */}
                    <div className={cn("hidden md:flex rounded-lg p-1 border", isDark ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-200")}>
                        {['all', 'video', 'image', 'text'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type as any)}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all",
                                    filterType === type
                                        ? (isDark ? 'bg-white/10 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm')
                                        : (isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
                                )}
                            >
                                {type === 'all' ? t('filterAll') : type === 'video' ? t('filterVideo') : type === 'image' ? t('filterImage') : t('filterText')}
                            </button>
                        ))}
                    </div>

                    {/* View Toggle */}
                    <div className={cn("flex rounded-lg p-1 border", isDark ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-200")}>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "p-2 rounded-md transition-all",
                                viewMode === 'grid'
                                    ? (isDark ? 'bg-white/10 text-primary' : 'bg-white text-primary shadow-sm')
                                    : (isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700')
                            )}
                        >
                            <GridIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "p-2 rounded-md transition-all",
                                viewMode === 'list'
                                    ? (isDark ? 'bg-white/10 text-primary' : 'bg-white text-primary shadow-sm')
                                    : (isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700')
                            )}
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-2 -mr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">

                {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                        <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>{t('loading') || 'Loading your creations...'}</p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className={cn("h-full flex flex-col items-center justify-center text-center border-2 border-dashed rounded-2xl p-10", isDark ? "border-white/5" : "border-gray-200")}>
                        <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-4", isDark ? "bg-white/5" : "bg-gray-100")}>
                            <Filter className={cn("w-6 h-6", isDark ? "text-gray-600" : "text-gray-400")} />
                        </div>
                        <h3 className={cn("text-xl font-semibold mb-2", isDark ? "text-white" : "text-gray-900")}>{t('noAssets')}</h3>
                        <p className={cn("max-w-sm", isDark ? "text-gray-500" : "text-gray-600")}>
                            {generations.length === 0
                                ? t('emptyLibrary')
                                : t('noMatches')}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* GRID VIEW */}
                        {viewMode === 'grid' && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-10">
                                {filteredItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "group relative aspect-square rounded-xl border overflow-hidden cursor-pointer hover:border-primary/50 transition-all duration-300",
                                            isDark ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-200"
                                        )}
                                        onClick={() => setSelectedItem(item)}
                                    >
                                        {/* Thumbnail */}
                                        {item.type === 'video' && item.url ? (
                                            <video src={item.url} className="w-full h-full object-cover" muted loop onMouseOver={e => e.currentTarget.play()} onMouseOut={e => e.currentTarget.pause()} />
                                        ) : item.type === 'image' && item.url ? (
                                            <img src={item.url} alt="thumbnail" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        ) : (
                                            <div className={cn("w-full h-full p-4 flex flex-col", isDark ? "bg-gradient-to-br from-gray-900 to-black" : "bg-gray-100")}>
                                                <MessageSquare className="w-8 h-8 text-blue-400 mb-2" />
                                                <p className={cn("text-[10px] line-clamp-6 font-mono leading-relaxed", isDark ? "text-gray-500" : "text-gray-600")}>{item.content}</p>
                                            </div>
                                        )}

                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                                            <div className="flex justify-between items-start">
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-black/50 backdrop-blur-sm border border-white/10">
                                                    {getTypeIcon(item.type)}
                                                </span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDelete(item.id, item.source); }}
                                                    className="p-1.5 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <div>
                                                <p className="text-xs text-white line-clamp-2 mb-2 font-medium">{item.prompt}</p>
                                                <div className="flex gap-2">
                                                    {item.url && (
                                                        <a href={item.url} download onClick={e => e.stopPropagation()} className="flex-1">
                                                            <Button variant="secondary" size="sm" className="w-full h-7 text-[10px] px-0">{t('download')}</Button>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* LIST VIEW */}
                        {viewMode === 'list' && (
                            <div className={cn("rounded-xl overflow-hidden border", isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200")}>
                                <table className="w-full text-left text-sm">
                                    <thead className={cn("font-medium", isDark ? "bg-black/20 text-gray-400" : "bg-gray-50 text-gray-600")}>
                                        <tr>
                                            <th className="px-6 py-4 w-20">{t('preview')}</th>
                                            <th className="px-6 py-4">{t('prompt')}</th>
                                            <th className="px-6 py-4 w-32">{t('type')}</th>
                                            <th className="px-6 py-4 w-48">{t('date')}</th>
                                            <th className="px-6 py-4 w-24 text-right">{t('actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className={cn("divide-y", isDark ? "divide-white/5" : "divide-gray-100")}>
                                        {filteredItems.map((item) => (
                                            <tr key={item.id} className={cn("transition-colors group cursor-pointer", isDark ? "hover:bg-white/5" : "hover:bg-gray-50")} onClick={() => setSelectedItem(item)}>
                                                <td className="px-6 py-3">
                                                    <div className={cn("w-10 h-10 rounded overflow-hidden flex items-center justify-center border", isDark ? "bg-black/50 border-white/10" : "bg-gray-100 border-gray-200")}>
                                                        {item.type === 'image' ? (
                                                            <img src={item.url} className="w-full h-full object-cover" />
                                                        ) : item.type === 'video' ? (
                                                            <Film className="w-4 h-4 text-primary" />
                                                        ) : (
                                                            <MessageSquare className="w-4 h-4 text-blue-400" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <p className={cn("line-clamp-1 max-w-md", isDark ? "text-white" : "text-gray-900")}>{item.prompt}</p>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                                ${item.type === 'video' ? 'bg-primary/10 text-primary border-primary/20' :
                                                            item.type === 'image' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                                'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                                        {getTypeIcon(item.type)}
                                                        <span className="capitalize">{item.type}</span>
                                                    </span>
                                                </td>
                                                <td className={cn("px-6 py-3 font-mono text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                                                    {formatDate(new Date(item.createdAt))}
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            className={cn("p-2 rounded-md", isDark ? "text-gray-400 hover:text-white hover:bg-white/10" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100")}
                                                            onClick={(e) => { e.stopPropagation(); handleCopyPrompt(item.prompt, item.id); }}
                                                        >
                                                            {copiedId === item.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md"
                                                            onClick={(e) => { e.stopPropagation(); onDelete(item.id, item.source); }}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Detail Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-200">
                    {/* Backdrop */}
                    <div
                        className={cn("absolute inset-0 backdrop-blur-sm", isDark ? "bg-black/80" : "bg-black/60")}
                        onClick={() => setSelectedItem(null)}
                    />

                    {/* Modal Content */}
                    <GlassCard className={cn("relative w-full max-w-6xl max-h-full overflow-hidden flex flex-col md:flex-row shadow-2xl", isDark ? "border-white/10 bg-[#0a0a0a]" : "border-gray-200 bg-white")}>

                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedItem(null)}
                            className={cn("absolute top-4 right-4 z-10 p-2 rounded-full transition-colors", isDark ? "bg-black/50 text-white hover:bg-white/20" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Media Preview (Left/Top) */}
                        <div className={cn("flex-1 flex items-center justify-center min-h-[300px] md:min-h-0 relative group", isDark ? "bg-black/50" : "bg-gray-100")}>
                            {selectedItem.type === 'image' && selectedItem.url && (
                                <img src={selectedItem.url} className="max-w-full max-h-full object-contain" />
                            )}
                            {selectedItem.type === 'video' && selectedItem.url && (
                                <video src={selectedItem.url} controls autoPlay className="max-w-full max-h-full" />
                            )}
                            {selectedItem.type === 'text' && (
                                <div className="p-8 max-w-2xl w-full h-full overflow-y-auto">
                                    <div className={cn("rounded-xl p-6 border whitespace-pre-wrap leading-relaxed font-mono text-sm", isDark ? "bg-white/5 border-white/10 text-gray-200" : "bg-white border-gray-200 text-gray-700")}>
                                        {selectedItem.content}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar (Right/Bottom) */}
                        <div className={cn("w-full md:w-96 p-6 flex flex-col gap-6 overflow-y-auto border-l", isDark ? "border-white/10 bg-page/95" : "border-gray-200 bg-gray-50")}>

                            <div>
                                <h3 className={cn("text-sm font-medium mb-2 uppercase tracking-wider", isDark ? "text-gray-400" : "text-gray-600")}>{t('modalPrompt')}</h3>
                                <div className={cn("rounded-lg p-4 border group relative", isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200")}>
                                    <p className={cn("text-sm leading-relaxed", isDark ? "text-gray-200" : "text-gray-700")}>{selectedItem.prompt}</p>
                                    <button
                                        className={cn("absolute top-2 right-2 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity", isDark ? "bg-black/50 text-gray-400 hover:text-white" : "bg-gray-100 text-gray-500 hover:text-gray-700")}
                                        onClick={() => handleCopyPrompt(selectedItem.prompt, selectedItem.id)}
                                    >
                                        {copiedId === selectedItem.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className={cn("flex items-center justify-between py-3 border-b", isDark ? "border-white/5" : "border-gray-200")}>
                                    <span className={cn("text-sm", isDark ? "text-gray-500" : "text-gray-600")}>{t('modalCreated')}</span>
                                    <span className={cn("text-sm font-mono", isDark ? "text-white" : "text-gray-900")}>{formatDate(new Date(selectedItem.createdAt))}</span>
                                </div>
                                <div className={cn("flex items-center justify-between py-3 border-b", isDark ? "border-white/5" : "border-gray-200")}>
                                    <span className={cn("text-sm", isDark ? "text-gray-500" : "text-gray-600")}>{t('modalType')}</span>
                                    <span className={cn("text-sm capitalize flex items-center gap-2", isDark ? "text-white" : "text-gray-900")}>
                                        {getTypeIcon(selectedItem.type)} {selectedItem.type}
                                    </span>
                                </div>
                                <div className={cn("flex items-center justify-between py-3 border-b", isDark ? "border-white/5" : "border-gray-200")}>
                                    <span className={cn("text-sm", isDark ? "text-gray-500" : "text-gray-600")}>{t('modalDimensions')}</span>
                                    <span className={cn("text-sm font-mono", isDark ? "text-white" : "text-gray-900")}>
                                        {selectedItem.type === 'video' ? '1280x720' : selectedItem.type === 'image' ? '1024x1024' : 'N/A'}
                                    </span>
                                </div>
                                <div className={cn("flex items-center justify-between py-3 border-b", isDark ? "border-white/5" : "border-gray-200")}>
                                    <span className={cn("text-sm", isDark ? "text-gray-500" : "text-gray-600")}>{t('modalStatus')}</span>
                                    <span className="text-green-400 text-sm flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> {t('modalCompleted')}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-auto pt-6 flex gap-3">
                                {selectedItem.url && (
                                    <a href={selectedItem.url} download className="flex-1">
                                        <Button className="w-full">{t('modalDownloadAsset')}</Button>
                                    </a>
                                )}
                                <Button
                                    variant="danger"
                                    className="flex-none px-3"
                                    onClick={() => { onDelete(selectedItem.id, selectedItem.source); setSelectedItem(null); }}
                                >
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}

        </div>
    );
};
