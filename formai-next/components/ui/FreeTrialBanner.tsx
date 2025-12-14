'use client';

import { motion } from 'framer-motion';
import { IconSparkles, IconGift, IconLogin, IconX } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';

interface FreeTrialBannerProps {
    locale: string;
    type: 'video' | 'image';
    remaining: number;
    total: number;
    isLoggedIn: boolean;
}

export function FreeTrialBanner({ locale, type, remaining, total, isLoggedIn }: FreeTrialBannerProps) {
    const t = useTranslations('freeTrial');
    const [dismissed, setDismissed] = useState(false);

    if (dismissed || isLoggedIn) return null;

    const used = total - remaining;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-gradient-to-r from-primary/20 via-cyan-500/20 to-secondary/20 border border-primary/30 rounded-2xl p-4 mb-6"
        >
            <button
                onClick={() => setDismissed(true)}
                className="absolute top-2 end-2 p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
                <IconX className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center flex-shrink-0">
                    <IconGift className="w-5 h-5 text-black" />
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        {t('title')}
                        <IconSparkles className="w-4 h-4 text-yellow-400" />
                    </h3>
                    <p className="text-gray-300 text-sm mt-1">
                        {type === 'video'
                            ? t('videoDescription', { remaining, total })
                            : t('imageDescription', { remaining, total })
                        }
                    </p>

                    {/* Progress bar */}
                    <div className="mt-3 flex items-center gap-3">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(used / total) * 100}%` }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="h-full bg-gradient-to-r from-primary to-cyan-400 rounded-full"
                            />
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                            {used}/{total} {t('used')}
                        </span>
                    </div>

                    {/* Sign up prompt */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-gray-400">{t('signUpPrompt')}</span>
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
                className="bg-[#0d1117] border border-white/10 rounded-2xl p-6 max-w-md w-full"
            >
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/10 flex items-center justify-center">
                        <IconGift className="w-8 h-8 text-primary" />
                    </div>

                    <h2 className="text-xl font-bold text-white mb-2">
                        {t('exhaustedTitle')}
                    </h2>
                    <p className="text-gray-400 mb-6">
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
                            className="block w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors"
                        >
                            {t('alreadyHaveAccount')}
                        </Link>
                        <button
                            onClick={onClose}
                            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                        >
                            {t('maybeLater')}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
