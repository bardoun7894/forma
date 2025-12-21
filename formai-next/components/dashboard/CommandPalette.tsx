'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getUserVideos, getUserImages, getUserAvatars } from '@/lib/database';
import { cn } from '@/lib/utils';
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
    const { theme } = useTheme();
    const isDark = theme === 'dark';

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
                className={cn(
                    "hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-sm",
                    isDark
                        ? "bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-gray-400"
                        : "bg-gray-100 hover:bg-gray-200 border-gray-200 hover:border-gray-300 text-gray-600"
                )}
                aria-label={t('openPalette')}
            >
                <IconSearch className="w-4 h-4" />
                <span className="hidden md:inline">{t('quickActions')}</span>
                <kbd className={cn(
                    "hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs",
                    isDark ? "bg-white/10 text-gray-500" : "bg-gray-200 text-gray-500"
                )}>
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
                            <Command className={cn(
                                "rounded-2xl shadow-2xl overflow-hidden ring-1 border",
                                isDark
                                    ? "bg-[#0d1117] border-white/10 shadow-black/50 ring-white/5"
                                    : "bg-white border-gray-200 shadow-gray-200/50 ring-gray-200"
                            )}>
                                {/* Search input */}
                                <div className={cn("flex items-center gap-3 px-4 border-b", isDark ? "border-white/10" : "border-gray-200")}>
                                    <IconSearch className={cn("w-5 h-5", isDark ? "text-gray-400" : "text-gray-500")} />
                                    <Command.Input
                                        ref={inputRef}
                                        value={search}
                                        onValueChange={setSearch}
                                        placeholder={t('searchPlaceholder')}
                                        className={cn(
                                            "flex-1 py-4 bg-transparent outline-none",
                                            isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"
                                        )}
                                        autoFocus
                                    />
                                    <kbd className={cn("px-2 py-1 rounded text-xs", isDark ? "bg-white/10 text-gray-500" : "bg-gray-100 text-gray-500")}>ESC</kbd>
                                </div>

                                {/* Results */}
                                <Command.List className="max-h-80 overflow-y-auto p-2">
                                    <Command.Empty className={cn("py-8 text-center text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                                        {t('noResults')}
                                    </Command.Empty>

                                    {commands.map((group) => (
                                        <Command.Group
                                            key={group.group}
                                            heading={group.group}
                                            className="mb-2"
                                        >
                                            <div className={cn("px-2 py-1.5 text-xs font-medium", isDark ? "text-gray-500" : "text-gray-400")}>
                                                {group.group}
                                            </div>
                                            {group.items.map((item) => {
                                                const Icon = item.icon;
                                                return (
                                                    <Command.Item
                                                        key={item.label}
                                                        onSelect={() => runCommand(item.action)}
                                                        className={cn(
                                                            "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors",
                                                            isDark
                                                                ? "text-gray-300 hover:text-white hover:bg-white/10 data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                                                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 data-[selected=true]:bg-gray-100 data-[selected=true]:text-gray-900"
                                                        )}
                                                    >
                                                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isDark ? "bg-white/5" : "bg-gray-100")}>
                                                            <Icon className="w-4 h-4 text-primary" />
                                                        </div>
                                                        <span className="flex-1">{item.label}</span>
                                                        {item.shortcut && (
                                                            <kbd className={cn("px-2 py-1 rounded text-xs", isDark ? "bg-white/5 text-gray-500" : "bg-gray-100 text-gray-400")}>
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
                                            <div className={cn("px-2 py-1.5 text-xs font-medium", isDark ? "text-gray-500" : "text-gray-400")}>
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
                                                            className={cn(
                                                                "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors",
                                                                isDark
                                                                    ? "text-gray-300 hover:text-white hover:bg-white/10 data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                                                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 data-[selected=true]:bg-gray-100 data-[selected=true]:text-gray-900"
                                                            )}
                                                        >
                                                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isDark ? "bg-white/5" : "bg-gray-100")}>
                                                                <Icon className={`w-4 h-4 ${iconColor}`} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={cn("truncate text-sm", isDark ? "text-gray-300" : "text-gray-700")}>
                                                                    {item.prompt.length > 40
                                                                        ? `${item.prompt.slice(0, 40)}...`
                                                                        : item.prompt}
                                                                </p>
                                                                <p className={cn("text-xs capitalize", isDark ? "text-gray-500" : "text-gray-400")}>{item.type}</p>
                                                            </div>
                                                        </Command.Item>
                                                    );
                                                })}
                                            {isLoadingLibrary && (
                                                <div className={cn("px-3 py-2 text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
                                                    {t('loadingLibrary')}
                                                </div>
                                            )}
                                        </Command.Group>
                                    )}
                                </Command.List>

                                {/* Footer */}
                                <div className={cn("flex items-center justify-between px-4 py-3 border-t text-xs", isDark ? "border-white/10 text-gray-500" : "border-gray-200 text-gray-400")}>
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1">
                                            <kbd className={cn("px-1.5 py-0.5 rounded", isDark ? "bg-white/10" : "bg-gray-100")}>↑↓</kbd>
                                            {t('navigate')}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <kbd className={cn("px-1.5 py-0.5 rounded", isDark ? "bg-white/10" : "bg-gray-100")}>↵</kbd>
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
