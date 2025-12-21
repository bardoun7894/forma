'use client';

import { motion } from 'framer-motion';
import { IconSparkles, IconGift, IconLogin, IconX } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface FreeTrialBannerProps {
    locale: string;
    type: 'video' | 'image';
    remaining: number;
    total: number;
    isLoggedIn: boolean;
}

export function FreeTrialBanner({ locale, type, remaining, total, isLoggedIn }: FreeTrialBannerProps) {
    const t = useTranslations('freeTrial');
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [dismissed, setDismissed] = useState(false);

    if (dismissed || isLoggedIn) return null;

    const used = total - remaining;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "relative border rounded-2xl p-4 mb-6",
                isDark
                    ? "bg-gradient-to-r from-primary/20 via-cyan-500/20 to-secondary/20 border-primary/30"
                    : "bg-gradient-to-r from-primary/10 via-cyan-500/10 to-secondary/10 border-primary/20"
            )}
        >
            <button
                onClick={() => setDismissed(true)}
                className={cn(
                    "absolute top-2 end-2 p-1 rounded-lg transition-colors",
                    isDark ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                )}
            >
                <IconX className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center flex-shrink-0">
                    <IconGift className="w-5 h-5 text-black" />
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className={cn("font-semibold flex items-center gap-2", isDark ? "text-white" : "text-gray-900")}>
                        {t('title')}
                        <IconSparkles className="w-4 h-4 text-yellow-400" />
                    </h3>
                    <p className={cn("text-sm mt-1", isDark ? "text-gray-300" : "text-gray-600")}>
                        {type === 'video'
                            ? t('videoDescription', { remaining, total })
                            : t('imageDescription', { remaining, total })
                        }
                    </p>

                    {/* Progress bar */}
                    <div className="mt-3 flex items-center gap-3">
                        <div className={cn("flex-1 h-2 rounded-full overflow-hidden", isDark ? "bg-white/10" : "bg-gray-200")}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(used / total) * 100}%` }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="h-full bg-gradient-to-r from-primary to-cyan-400 rounded-full"
                            />
                        </div>
                        <span className={cn("text-xs whitespace-nowrap", isDark ? "text-gray-400" : "text-gray-500")}>
                            {used}/{total} {t('used')}
                        </span>
                    </div>

                    {/* Sign up prompt */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>{t('signUpPrompt')}</span>
                        <Link
                            href={`/${locale}/login`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-cyan-300 transition-colors"
                        >
                            <IconLogin className="w-3 h-3" />
                            {t('signUpButton')}
                        </Link>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

interface TrialExhaustedModalProps {
    locale: string;
    type: 'video' | 'image';
    isOpen: boolean;
    onClose: () => void;
}

export function TrialExhaustedModal({ locale, type, isOpen, onClose }: TrialExhaustedModalProps) {
    const t = useTranslations('freeTrial');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                    "border rounded-2xl p-6 max-w-md w-full",
                    isDark ? "bg-[#0d1117] border-white/10" : "bg-white border-gray-200"
                )}
            >
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/10 flex items-center justify-center">
                        <IconGift className="w-8 h-8 text-primary" />
                    </div>

                    <h2 className={cn("text-xl font-bold mb-2", isDark ? "text-white" : "text-gray-900")}>
                        {t('exhaustedTitle')}
                    </h2>
                    <p className={cn("mb-6", isDark ? "text-gray-400" : "text-gray-500")}>
                        {type === 'video' ? t('exhaustedVideoMessage') : t('exhaustedImageMessage')}
                    </p>

                    <div className="space-y-3">
                        <Link
                            href={`/${locale}/register`}
                            className="block w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary via-cyan-400 to-secondary text-black font-bold hover:opacity-90 transition-opacity"
                        >
                            {t('createAccount')}
                        </Link>
                        <Link
                            href={`/${locale}/login`}
                            className={cn(
                                "block w-full py-3 px-4 rounded-xl border font-medium transition-colors",
                                isDark
                                    ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                                    : "bg-gray-50 border-gray-200 text-gray-900 hover:bg-gray-100"
                            )}
                        >
                            {t('alreadyHaveAccount')}
                        </Link>
                        <button
                            onClick={onClose}
                            className={cn("text-sm transition-colors", isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600")}
                        >
                            {t('maybeLater')}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
