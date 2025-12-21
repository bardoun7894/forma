'use client';

import { motion } from 'framer-motion';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeContext';

interface PricingPreviewProps {
    locale: string;
    title: string;
    subtitle: string;
    starterTitle: string;
    starterPrice: string;
    starterFeatures: string[];
    proTitle: string;
    proPrice: string;
    proFeatures: string[];
    proBadge: string;
    ctaText: string;
    viewAllText: string;
}

export function PricingPreview({
    locale,
    title,
    subtitle,
    starterTitle,
    starterPrice,
    starterFeatures,
    proTitle,
    proPrice,
    proFeatures,
    proBadge,
    ctaText,
    viewAllText,
}: PricingPreviewProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className="relative">
            <div className="text-center mb-10 sm:mb-12">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}
                >
                    {title}
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className={`text-base sm:text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                >
                    {subtitle}
                </motion.p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
                {/* Starter Plan */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className={`relative p-5 sm:p-6 rounded-2xl transition-all ${isDark ? 'bg-white/[0.02] border border-white/10 hover:border-white/20' : 'bg-white border border-gray-200 hover:border-primary/30 shadow-sm hover:shadow-md'}`}
                >
                    <h3 className={`text-lg sm:text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{starterTitle}</h3>
                    <div className="flex items-baseline gap-1 mb-5 sm:mb-6">
                        <span className={`text-3xl sm:text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{starterPrice}</span>
                    </div>
                    <ul className="space-y-2.5 sm:space-y-3 mb-5 sm:mb-6">
                        {starterFeatures.map((feature, i) => (
                            <li key={i} className={`flex items-center gap-3 text-xs sm:text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                                {feature}
                            </li>
                        ))}
                    </ul>
                    <Button variant="secondary" className="w-full">
                        {ctaText}
                    </Button>
                </motion.div>

                {/* Pro Plan */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className={`relative p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 border transition-all ${isDark ? 'border-primary/30 hover:border-primary/50' : 'border-primary/40 hover:border-primary/60 shadow-md hover:shadow-lg'}`}
                >
                    <div className="absolute -top-3 end-4">
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-primary to-cyan-400 text-black">
                            {proBadge}
                        </span>
                    </div>
                    <h3 className={`text-lg sm:text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{proTitle}</h3>
                    <div className="flex items-baseline gap-1 mb-5 sm:mb-6">
                        <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">{proPrice}</span>
                    </div>
                    <ul className="space-y-2.5 sm:space-y-3 mb-5 sm:mb-6">
                        {proFeatures.map((feature, i) => (
                            <li key={i} className={`flex items-center gap-3 text-xs sm:text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                                {feature}
                            </li>
                        ))}
                    </ul>
                    <Button className="w-full">
                        <Sparkles className="w-4 h-4 mr-2" />
                        {ctaText}
                    </Button>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-center mt-6 sm:mt-8"
            >
                <Link
                    href={`/${locale}/pricing`}
                    className="inline-flex items-center gap-2 text-primary hover:text-cyan-300 transition-colors text-sm sm:text-base"
                >
                    {viewAllText}
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </motion.div>
        </div>
    );
}
