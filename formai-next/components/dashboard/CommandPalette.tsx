'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { getUserVideos, getUserImages, getUserAvatars } from '@/lib/database';
import {
    IconVideo,
    IconPhoto,
    IconUserCircle,
    IconMessageChatbot,
    IconFolder,
    IconCreditCard,
    IconSettings,
    IconSearch,
    IconCommand,
    IconHome,
    IconSparkles,
    IconFileText,
    IconPlayerPlay,
    IconPhotoFilled,
} from '@tabler/icons-react';

interface CommandPaletteProps {
    locale: string;
}

interface LibraryItem {
    id: string;
    type: 'video' | 'image' | 'avatar';
    prompt: string;
    url?: string;
    createdAt: any;
}

export function CommandPalette({ locale }: CommandPaletteProps) {
    const t = useTranslations('commandPalette');
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
    const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { userData } = useAuth();

    // Toggle the menu when ⌘K is pressed
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
            // Also close on Escape
            if (e.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (open) {
            // Small delay to ensure modal is rendered
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        } else {
            setSearch('');
        }
    }, [open]);

    // Load library items when opened
    useEffect(() => {
        const loadLibraryItems = async () => {
            if (open && userData?.uid && libraryItems.length === 0) {
                setIsLoadingLibrary(true);
                try {
                    // Fetch all content types in parallel
                    const [videos, images, avatars] = await Promise.all([
                        getUserVideos(userData.uid),
                        getUserImages(userData.uid),
                        getUserAvatars(userData.uid),
                    ]);

                    // Combine and format all items
                    const allItems: LibraryItem[] = [
                        ...videos
                            .filter(v => v.status === 'completed')
                            .map(v => ({
                                id: v.id!,
                                type: 'video' as const,
                                prompt: v.prompt,
                                url: v.videoUrl,
                                createdAt: v.createdAt,
                            })),
                        ...images
                            .filter(i => i.status === 'completed')
                            .map(i => ({
                                id: i.id!,
                                type: 'image' as const,
                                prompt: i.prompt,
                                url: i.imageUrl,
                                createdAt: i.createdAt,
                            })),
                        ...avatars
                            .filter(a => a.status === 'completed')
                            .map(a => ({
                                id: a.id!,
                                type: 'avatar' as const,
                                prompt: a.prompt,
                                url: a.avatarUrl,
                                createdAt: a.createdAt,
                            })),
                    ];

                    // Sort by date and limit
                    allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    setLibraryItems(allItems.slice(0, 20));
                } catch (error) {
                    console.error('Failed to load library items:', error);
                } finally {
                    setIsLoadingLibrary(false);
                }
            }
        };
        loadLibraryItems();
    }, [open, userData?.uid]);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    const getLibraryItemIcon = (type: string) => {
        switch (type) {
            case 'video':
                return IconPlayerPlay;
            case 'image':
                return IconPhotoFilled;
            case 'avatar':
                return IconUserCircle;
            default:
                return IconFileText;
        }
    };

    const getLibraryItemColor = (type: string) => {
        switch (type) {
            case 'video':
                return 'text-cyan-400';
            case 'image':
                return 'text-purple-400';
            case 'avatar':
                return 'text-green-400';
            default:
                return 'text-gray-400';
        }
    };

    const commands = [
        {
            group: t('groupCreate'),
            items: [
                {
                    icon: IconVideo,
                    label: t('newVideo'),
                    shortcut: 'V',
                    action: () => router.push(`/${locale}/video`),
                },
                {
                    icon: IconPhoto,
                    label: t('newImage'),
                    shortcut: 'I',
                    action: () => router.push(`/${locale}/image`),
                },
                {
                    icon: IconUserCircle,
                    label: t('newAvatar'),
                    shortcut: 'A',
                    action: () => router.push(`/${locale}/avatar`),
                },
                {
                    icon: IconMessageChatbot,
                    label: t('newChat'),
                    shortcut: 'C',
                    action: () => router.push(`/${locale}/chat`),
                },
            ],
        },
        {
            group: t('groupNavigate'),
            items: [
                {
                    icon: IconHome,
                    label: t('dashboard'),
                    shortcut: 'D',
                    action: () => router.push(`/${locale}/dashboard`),
                },
                {
                    icon: IconFolder,
                    label: t('myLibrary'),
                    shortcut: 'L',
                    action: () => router.push(`/${locale}/library`),
                },
                {
                    icon: IconCreditCard,
                    label: t('buyCredits'),
                    shortcut: 'B',
                    action: () => router.push(`/${locale}/credits`),
                },
                {
                    icon: IconSettings,
                    label: t('settings'),
                    shortcut: 'S',
                    action: () => router.push(`/${locale}/settings`),
                },
            ],
        },
    ];

    return (
        <>
            {/* Trigger button (optional, keyboard shortcut is primary) */}
            <button
                onClick={() => setOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-gray-400 text-sm"
                aria-label={t('openPalette')}
            >
                <IconSearch className="w-4 h-4" />
                <span className="hidden md:inline">{t('quickActions')}</span>
                <kbd className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/10 text-xs text-gray-500">
                    <IconCommand className="w-3 h-3" />K
                </kbd>
            </button>

            {/* Command palette modal */}
            <AnimatePresence>
                {open && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
                        />

                        {/* Dialog */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            transition={{ duration: 0.15 }}
                            className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-lg z-[201] px-4"
                        >
                            <Command className="bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden ring-1 ring-white/5">
                                {/* Search input */}
                                <div className="flex items-center gap-3 px-4 border-b border-white/10">
                                    <IconSearch className="w-5 h-5 text-gray-400" />
                                    <Command.Input
                                        ref={inputRef}
                                        value={search}
                                        onValueChange={setSearch}
                                        placeholder={t('searchPlaceholder')}
                                        className="flex-1 py-4 bg-transparent text-white placeholder-gray-500 outline-none"
                                        autoFocus
                                    />
                                    <kbd className="px-2 py-1 rounded bg-white/10 text-xs text-gray-500">ESC</kbd>
                                </div>

                                {/* Results */}
                                <Command.List className="max-h-80 overflow-y-auto p-2">
                                    <Command.Empty className="py-8 text-center text-gray-400 text-sm">
                                        {t('noResults')}
                                    </Command.Empty>

                                    {commands.map((group) => (
                                        <Command.Group
                                            key={group.group}
                                            heading={group.group}
                                            className="mb-2"
                                        >
                                            <div className="px-2 py-1.5 text-xs text-gray-500 font-medium">
                                                {group.group}
                                            </div>
                                            {group.items.map((item) => {
                                                const Icon = item.icon;
                                                return (
                                                    <Command.Item
                                                        key={item.label}
                                                        onSelect={() => runCommand(item.action)}
                                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-gray-300 hover:text-white hover:bg-white/10 transition-colors data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                                            <Icon className="w-4 h-4 text-primary" />
                                                        </div>
                                                        <span className="flex-1">{item.label}</span>
                                                        {item.shortcut && (
                                                            <kbd className="px-2 py-1 rounded bg-white/5 text-xs text-gray-500">
                                                                {item.shortcut}
                                                            </kbd>
                                                        )}
                                                    </Command.Item>
                                                );
                                            })}
                                        </Command.Group>
                                    ))}

                                    {/* Library Items - only show when searching */}
                                    {search.length > 0 && libraryItems.length > 0 && (
                                        <Command.Group heading={t('groupLibrary')} className="mb-2">
                                            <div className="px-2 py-1.5 text-xs text-gray-500 font-medium">
                                                {t('groupLibrary')}
                                            </div>
                                            {libraryItems
                                                .filter(item =>
                                                    item.prompt.toLowerCase().includes(search.toLowerCase()) ||
                                                    item.type.toLowerCase().includes(search.toLowerCase())
                                                )
                                                .slice(0, 5)
                                                .map((item) => {
                                                    const Icon = getLibraryItemIcon(item.type);
                                                    const iconColor = getLibraryItemColor(item.type);
                                                    return (
                                                        <Command.Item
                                                            key={item.id}
                                                            value={`${item.type} ${item.prompt}`}
                                                            onSelect={() => runCommand(() => {
                                                                if (item.url) {
                                                                    window.open(item.url, '_blank');
                                                                } else {
                                                                    router.push(`/${locale}/library`);
                                                                }
                                                            })}
                                                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-gray-300 hover:text-white hover:bg-white/10 transition-colors data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                                                <Icon className={`w-4 h-4 ${iconColor}`} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="truncate text-sm">
                                                                    {item.prompt.length > 40
                                                                        ? `${item.prompt.slice(0, 40)}...`
                                                                        : item.prompt}
                                                                </p>
                                                                <p className="text-xs text-gray-500 capitalize">{item.type}</p>
                                                            </div>
                                                        </Command.Item>
                                                    );
                                                })}
                                            {isLoadingLibrary && (
                                                <div className="px-3 py-2 text-xs text-gray-500">
                                                    {t('loadingLibrary')}
                                                </div>
                                            )}
                                        </Command.Group>
                                    )}
                                </Command.List>

                                {/* Footer */}
                                <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 text-xs text-gray-500">
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1">
                                            <kbd className="px-1.5 py-0.5 rounded bg-white/10">↑↓</kbd>
                                            {t('navigate')}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <kbd className="px-1.5 py-0.5 rounded bg-white/10">↵</kbd>
                                            {t('select')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <IconSparkles className="w-3 h-3 text-primary" />
                                        FormAI
                                    </div>
                                </div>
                            </Command>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
