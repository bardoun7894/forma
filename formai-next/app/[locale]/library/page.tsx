"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { GenerationResult } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
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
                    <h1 className="text-3xl font-bold tracking-tight mb-1">{t('title')}</h1>
                    <p className="text-gray-400 text-sm">{t('subtitle')}</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                        />
                    </div>

                    {/* Type Filter */}
                    <div className="hidden md:flex bg-white/5 border border-white/10 rounded-lg p-1">
                        {['all', 'video', 'image', 'text'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type as any)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${filterType === type
                                        ? 'bg-white/10 text-white shadow-sm'
                                        : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {type === 'all' ? t('filterAll') : type === 'video' ? t('filterVideo') : type === 'image' ? t('filterImage') : t('filterText')}
                            </button>
                        ))}
                    </div>

                    {/* View Toggle */}
                    <div className="flex bg-white/5 border border-white/10 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white/10 text-primary' : 'text-gray-400 hover:text-white'}`}
                        >
                            <GridIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white/10 text-primary' : 'text-gray-400 hover:text-white'}`}
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
                        <p className="text-gray-400 text-sm">{t('loading') || 'Loading your creations...'}</p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center border-2 border-dashed border-white/5 rounded-2xl p-10">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <Filter className="w-6 h-6 text-gray-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{t('noAssets')}</h3>
                        <p className="text-gray-500 max-w-sm">
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
                                        className="group relative aspect-square bg-white/5 rounded-xl border border-white/10 overflow-hidden cursor-pointer hover:border-primary/50 transition-all duration-300"
                                        onClick={() => setSelectedItem(item)}
                                    >
                                        {/* Thumbnail */}
                                        {item.type === 'video' && item.url ? (
                                            <video src={item.url} className="w-full h-full object-cover" muted loop onMouseOver={e => e.currentTarget.play()} onMouseOut={e => e.currentTarget.pause()} />
                                        ) : item.type === 'image' && item.url ? (
                                            <img src={item.url} alt="thumbnail" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        ) : (
                                            <div className="w-full h-full p-4 flex flex-col bg-gradient-to-br from-gray-900 to-black">
                                                <MessageSquare className="w-8 h-8 text-blue-400 mb-2" />
                                                <p className="text-[10px] text-gray-500 line-clamp-6 font-mono leading-relaxed">{item.content}</p>
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
                            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-black/20 text-gray-400 font-medium">
                                        <tr>
                                            <th className="px-6 py-4 w-20">{t('preview')}</th>
                                            <th className="px-6 py-4">{t('prompt')}</th>
                                            <th className="px-6 py-4 w-32">{t('type')}</th>
                                            <th className="px-6 py-4 w-48">{t('date')}</th>
                                            <th className="px-6 py-4 w-24 text-right">{t('actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setSelectedItem(item)}>
                                                <td className="px-6 py-3">
                                                    <div className="w-10 h-10 rounded bg-black/50 border border-white/10 overflow-hidden flex items-center justify-center">
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
                                                    <p className="text-white line-clamp-1 max-w-md">{item.prompt}</p>
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
                                                <td className="px-6 py-3 text-gray-400 font-mono text-xs">
                                                    {formatDate(new Date(item.createdAt))}
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"
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
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => setSelectedItem(null)}
                    />

                    {/* Modal Content */}
                    <GlassCard className="relative w-full max-w-6xl max-h-full overflow-hidden flex flex-col md:flex-row shadow-2xl border-white/10 bg-[#0a0a0a]">

                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedItem(null)}
                            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-white/20 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Media Preview (Left/Top) */}
                        <div className="flex-1 bg-black/50 flex items-center justify-center min-h-[300px] md:min-h-0 relative group">
                            {selectedItem.type === 'image' && selectedItem.url && (
                                <img src={selectedItem.url} className="max-w-full max-h-full object-contain" />
                            )}
                            {selectedItem.type === 'video' && selectedItem.url && (
                                <video src={selectedItem.url} controls autoPlay className="max-w-full max-h-full" />
                            )}
                            {selectedItem.type === 'text' && (
                                <div className="p-8 max-w-2xl w-full h-full overflow-y-auto">
                                    <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-gray-200 whitespace-pre-wrap leading-relaxed font-mono text-sm">
                                        {selectedItem.content}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar (Right/Bottom) */}
                        <div className="w-full md:w-96 border-l border-white/10 bg-page/95 p-6 flex flex-col gap-6 overflow-y-auto">

                            <div>
                                <h3 className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">{t('modalPrompt')}</h3>
                                <div className="bg-white/5 rounded-lg p-4 border border-white/10 group relative">
                                    <p className="text-sm text-gray-200 leading-relaxed">{selectedItem.prompt}</p>
                                    <button
                                        className="absolute top-2 right-2 p-1.5 rounded bg-black/50 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleCopyPrompt(selectedItem.prompt, selectedItem.id)}
                                    >
                                        {copiedId === selectedItem.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-3 border-b border-white/5">
                                    <span className="text-gray-500 text-sm">{t('modalCreated')}</span>
                                    <span className="text-white text-sm font-mono">{formatDate(new Date(selectedItem.createdAt))}</span>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-white/5">
                                    <span className="text-gray-500 text-sm">{t('modalType')}</span>
                                    <span className="text-white text-sm capitalize flex items-center gap-2">
                                        {getTypeIcon(selectedItem.type)} {selectedItem.type}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-white/5">
                                    <span className="text-gray-500 text-sm">{t('modalDimensions')}</span>
                                    <span className="text-white text-sm font-mono">
                                        {selectedItem.type === 'video' ? '1280x720' : selectedItem.type === 'image' ? '1024x1024' : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-white/5">
                                    <span className="text-gray-500 text-sm">{t('modalStatus')}</span>
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
