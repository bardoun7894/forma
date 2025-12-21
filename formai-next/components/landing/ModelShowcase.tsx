'use client';

import { motion } from 'framer-motion';
import { Video, Image as ImageIcon, Sparkles } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface Model {
    name: string;
    type: 'video' | 'image';
    description: string;
    badge?: string;
}

const models: Model[] = [
    { name: 'Veo 3.1', type: 'video', description: 'Google DeepMind', badge: 'NEW' },
    { name: 'Sora 2', type: 'video', description: 'OpenAI', badge: 'PRO' },
    { name: 'Kling Pro', type: 'video', description: 'Kuaishou' },
    { name: 'Runway Gen-3', type: 'video', description: 'Runway ML' },
    { name: 'Midjourney', type: 'image', description: 'V6.1', badge: 'POPULAR' },
    { name: 'DALL-E 3', type: 'image', description: 'OpenAI' },
    { name: 'GPT-4o', type: 'image', description: 'Image Gen' },
    { name: 'Flux Kontext', type: 'image', description: 'Black Forest' },
];

interface ModelShowcaseProps {
    title: string;
    subtitle: string;
}

export function ModelShowcase({ title, subtitle }: ModelShowcaseProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className="relative">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent rounded-3xl" />

            <div className="relative text-center mb-10 sm:mb-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 sm:mb-6 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-primary/5 border border-primary/20'}`}
                >
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Powered by Industry Leaders</span>
                </motion.div>
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}
                >
                    {title}
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className={`text-base sm:text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                >
                    {subtitle}
                </motion.p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {models.map((model, index) => (
                    <motion.div
                        key={model.name}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, y: -4 }}
                        className="relative group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                        <div className={`relative p-3 sm:p-4 rounded-2xl transition-all ${isDark ? 'bg-white/[0.03] border border-white/10 hover:border-white/20' : 'bg-white border border-gray-200 hover:border-primary/30 shadow-sm hover:shadow-md'}`}>
                            {model.badge && (
                                <span className={`absolute -top-2 -end-2 px-2 py-0.5 text-[10px] font-bold rounded-full ${model.badge === 'NEW' ? 'bg-green-500 text-white' :
                                        model.badge === 'PRO' ? 'bg-purple-500 text-white' :
                                            'bg-primary text-black'
                                    }`}>
                                    {model.badge}
                                </span>
                            )}
                            <div className={`w-9 sm:w-10 h-9 sm:h-10 rounded-xl mb-2 sm:mb-3 flex items-center justify-center ${model.type === 'video' ? 'bg-cyan-500/10' : 'bg-purple-500/10'
                                }`}>
                                {model.type === 'video' ? (
                                    <Video className="w-4 sm:w-5 h-4 sm:h-5 text-cyan-400" />
                                ) : (
                                    <ImageIcon className="w-4 sm:w-5 h-4 sm:h-5 text-purple-400" />
                                )}
                            </div>
                            <h3 className={`font-semibold text-sm sm:text-base mb-0.5 sm:mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{model.name}</h3>
                            <p className={`text-[10px] sm:text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{model.description}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
