'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Pagination } from '@/components/admin/Pagination';
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';
import {
    Video,
    Image as ImageIcon,
    User,
    Trash2,
    Flag,
    FlagOff,
    Loader2,
    FileVideo,
    ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ContentItem {
    id: string;
    type: 'video' | 'image' | 'avatar';
    userId: string;
    prompt: string;
    url: string;
    status: string;
    createdAt: string;
    flagged?: boolean;
    flagReason?: string;
}

export default function AdminContentPage() {
    const t = useTranslations('admin');
    const { user } = useAuth();
    const [items, setItems] = useState<ContentItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [typeFilter, setTypeFilter] = useState<'all' | 'video' | 'image' | 'avatar'>('all');
    const [flaggedFilter, setFlaggedFilter] = useState<'all' | 'flagged' | 'unflagged'>('all');
    const [loading, setLoading] = useState(true);

    const [deleteModal, setDeleteModal] = useState<{ open: boolean; item: ContentItem | null }>({ open: false, item: null });
    const [flagModal, setFlagModal] = useState<{ open: boolean; item: ContentItem | null; action: 'flag' | 'unflag' }>({ open: false, item: null, action: 'flag' });
    const [actionLoading, setActionLoading] = useState(false);

    const pageSize = 20;

    const fetchContent = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        try {
            const token = await user.getIdToken();
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pageSize.toString(),
            });

            if (typeFilter !== 'all') params.set('type', typeFilter);
            if (flaggedFilter !== 'all') params.set('flagged', flaggedFilter === 'flagged' ? 'true' : 'false');

            const response = await fetch(`/api/admin/content?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setItems(data.items);
                setTotal(data.total);
            }
        } catch (error) {
            console.error('Failed to fetch content:', error);
            toast.error(t('fetchError'));
        } finally {
            setLoading(false);
        }
    }, [user, page, typeFilter, flaggedFilter, t]);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    const handleDelete = async () => {
        if (!deleteModal.item || !user) return;

        setActionLoading(true);
        try {
            const token = await user.getIdToken();
            const response = await fetch(`/api/admin/content/${deleteModal.item.id}?type=${deleteModal.item.type}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                toast.success(t('contentDeleted'));
                fetchContent();
            } else {
                toast.error(t('deleteError'));
            }
        } catch (error) {
            toast.error(t('deleteError'));
        } finally {
            setActionLoading(false);
            setDeleteModal({ open: false, item: null });
        }
    };

    const handleFlag = async () => {
        if (!flagModal.item || !user) return;

        setActionLoading(true);
        try {
            const token = await user.getIdToken();
            const response = await fetch(`/api/admin/content/${flagModal.item.id}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: flagModal.item.type,
                    flagged: flagModal.action === 'flag',
                    reason: flagModal.action === 'flag' ? 'Flagged by admin' : undefined,
                }),
            });

            if (response.ok) {
                toast.success(flagModal.action === 'flag' ? t('contentFlagged') : t('contentUnflagged'));
                fetchContent();
            } else {
                toast.error(t('actionError'));
            }
        } catch (error) {
            toast.error(t('actionError'));
        } finally {
            setActionLoading(false);
            setFlagModal({ open: false, item: null, action: 'flag' });
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video className="w-5 h-5" />;
            case 'image': return <ImageIcon className="w-5 h-5" />;
            case 'avatar': return <User className="w-5 h-5" />;
            default: return <FileVideo className="w-5 h-5" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'video': return 'bg-blue-500/10 text-blue-400';
            case 'image': return 'bg-purple-500/10 text-purple-400';
            case 'avatar': return 'bg-green-500/10 text-green-400';
            default: return 'bg-gray-500/10 text-gray-400';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">{t('content')}</h1>
                <p className="text-gray-400 mt-1">{t('contentSubtitle')}</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <select
                    value={typeFilter}
                    onChange={(e) => {
                        setTypeFilter(e.target.value as typeof typeFilter);
                        setPage(1);
                    }}
                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary/50"
                >
                    <option value="all">{t('allTypes')}</option>
                    <option value="video">{t('videos')}</option>
                    <option value="image">{t('images')}</option>
                    <option value="avatar">{t('avatars')}</option>
                </select>
                <select
                    value={flaggedFilter}
                    onChange={(e) => {
                        setFlaggedFilter(e.target.value as typeof flaggedFilter);
                        setPage(1);
                    }}
                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary/50"
                >
                    <option value="all">{t('allContent')}</option>
                    <option value="flagged">{t('flaggedOnly')}</option>
                    <option value="unflagged">{t('unflaggedOnly')}</option>
                </select>
            </div>

            {/* Content Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : items.length === 0 ? (
                <GlassCard className="p-12 text-center">
                    <FileVideo className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">{t('noContent')}</p>
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {items.map((item) => (
                        <GlassCard key={item.id} className={`overflow-hidden ${item.flagged ? 'border-red-500/50' : ''}`}>
                            {/* Preview */}
                            <div className="relative aspect-video bg-black/50">
                                {item.type === 'video' ? (
                                    <video
                                        src={item.url}
                                        className="w-full h-full object-cover"
                                        muted
                                    />
                                ) : (
                                    <img
                                        src={item.url}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/placeholder.png';
                                        }}
                                    />
                                )}
                                {item.flagged && (
                                    <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2 px-2 py-1 bg-red-500/80 text-white text-xs font-medium rounded">
                                        {t('flagged')}
                                    </div>
                                )}
                                <div className={`absolute top-2 right-2 rtl:right-auto rtl:left-2 p-1.5 rounded-lg ${getTypeColor(item.type)}`}>
                                    {getTypeIcon(item.type)}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                <p className="text-white text-sm line-clamp-2 mb-2">{item.prompt || 'No prompt'}</p>
                                <p className="text-gray-500 text-xs mb-3">
                                    {new Date(item.createdAt).toLocaleDateString()}
                                </p>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                        title={t('openInNewTab')}
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                    <button
                                        onClick={() => setFlagModal({
                                            open: true,
                                            item,
                                            action: item.flagged ? 'unflag' : 'flag'
                                        })}
                                        className={`p-2 rounded-lg transition-colors ${item.flagged
                                                ? 'text-gray-400 hover:text-green-400 hover:bg-green-500/10'
                                                : 'text-gray-400 hover:text-orange-400 hover:bg-orange-500/10'
                                            }`}
                                        title={item.flagged ? t('unflag') : t('flag')}
                                    >
                                        {item.flagged ? <FlagOff className="w-4 h-4" /> : <Flag className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => setDeleteModal({ open: true, item })}
                                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title={t('delete')}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {Math.ceil(total / pageSize) > 1 && (
                <div className="flex justify-center">
                    <Pagination
                        currentPage={page}
                        totalPages={Math.ceil(total / pageSize)}
                        onPageChange={setPage}
                    />
                </div>
            )}

            {/* Delete Modal */}
            <ConfirmationModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, item: null })}
                onConfirm={handleDelete}
                title={t('confirmDeleteContent')}
                message={t('deleteContentMessage')}
                confirmText={t('delete')}
                cancelText={t('cancel')}
                variant="danger"
                isLoading={actionLoading}
            />

            {/* Flag Modal */}
            <ConfirmationModal
                isOpen={flagModal.open}
                onClose={() => setFlagModal({ open: false, item: null, action: 'flag' })}
                onConfirm={handleFlag}
                title={flagModal.action === 'flag' ? t('confirmFlagContent') : t('confirmUnflagContent')}
                message={flagModal.action === 'flag' ? t('flagContentMessage') : t('unflagContentMessage')}
                confirmText={flagModal.action === 'flag' ? t('flag') : t('unflag')}
                cancelText={t('cancel')}
                variant={flagModal.action === 'flag' ? 'danger' : 'primary'}
                isLoading={actionLoading}
            />
        </div>
    );
}
