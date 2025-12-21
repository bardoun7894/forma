'use client';

import { motion } from 'framer-motion';
import { Play, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface HeroVisualProps {
    imageUrl?: string;
    videoUrl?: string;
    alt?: string;
}

export function HeroVisual({ imageUrl = '/images/landing/hero-mockup.png', videoUrl, alt = 'Product Preview' }: HeroVisualProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            className="relative"
        >
            {/* Glow effect behind */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-purple-500/20 to-cyan-500/20 rounded-3xl blur-3xl opacity-50" />

            {/* Main container */}
            <div className={`relative rounded-2xl overflow-hidden backdrop-blur-sm p-1 ${isDark ? 'border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02]' : 'border border-gray-200 bg-white shadow-xl'}`}>
                {/* Browser-like header */}
                <div className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-b ${isDark ? 'bg-black/40 border-white/5' : 'bg-gray-100 border-gray-200'}`}>
                    <div className="flex gap-1.5">
                        <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-red-500/80" />
                        <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-yellow-500/80" />
                        <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="flex-1 flex justify-center">
                        <div className={`px-3 sm:px-4 py-1 rounded-full text-[10px] sm:text-xs flex items-center gap-1.5 sm:gap-2 ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                            <Sparkles className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-primary" />
                            formai.app
                        </div>
                    </div>
                </div>

                {/* Content area */}
                <div className={`relative aspect-[16/10] ${isDark ? 'bg-black/60' : 'bg-gray-50'}`}>
                    <Image
                        src={imageUrl}
                        alt={alt}
                        fill
                        className="object-cover"
                        priority
                    />

                    {/* Animated overlay elements */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Floating UI elements for visual interest */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1, duration: 0.5 }}
                        className="absolute top-3 sm:top-4 left-3 sm:left-4 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10"
                    >
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] sm:text-xs text-white/80">AI Ready</span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.2, duration: 0.5 }}
                        className="absolute top-3 sm:top-4 right-3 sm:right-4 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-primary/20 backdrop-blur-sm border border-primary/30"
                    >
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <Sparkles className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-primary" />
                            <span className="text-[10px] sm:text-xs text-primary">Generating...</span>
                        </div>
                    </motion.div>

                    {/* Play button for video */}
                    {videoUrl && (
                        <button
                            onClick={() => setIsPlaying(true)}
                            className="absolute inset-0 flex items-center justify-center group"
                        >
                            <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-12 sm:w-16 h-12 sm:h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors"
                            >
                                <Play className="w-5 sm:w-6 h-5 sm:h-6 text-white ml-1" />
                            </motion.div>
                        </button>
                    )}

                    {/* Bottom stats bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.4, duration: 0.5 }}
                        className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10"
                    >
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-lg bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
                                <Sparkles className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-black" />
                            </div>
                            <div>
                                <p className="text-[10px] sm:text-xs text-white/60">Creating</p>
                                <p className="text-xs sm:text-sm text-white font-medium">Cinematic Video</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="h-1 sm:h-1.5 w-16 sm:w-24 rounded-full bg-white/10 overflow-hidden">
                                <motion.div
                                    initial={{ width: '0%' }}
                                    animate={{ width: '75%' }}
                                    transition={{ delay: 1.5, duration: 2, ease: 'easeOut' }}
                                    className="h-full bg-gradient-to-r from-primary to-cyan-500 rounded-full"
                                />
                            </div>
                            <span className="text-[10px] sm:text-xs text-white/60">75%</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Decorative elements */}
            <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-4 sm:-top-6 -right-4 sm:-right-6 w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20 backdrop-blur-sm flex items-center justify-center"
            >
                <Sparkles className="w-4 sm:w-5 h-4 sm:h-5 text-purple-400" />
            </motion.div>

            <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -bottom-3 sm:-bottom-4 -left-3 sm:-left-4 w-8 sm:w-10 h-8 sm:h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/20 backdrop-blur-sm"
            />
        </motion.div>
    );
}
