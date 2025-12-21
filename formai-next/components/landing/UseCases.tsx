'use client';

import { motion } from 'framer-motion';
import { Megaphone, ShoppingBag, Palette, GraduationCap, Video, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface UseCase {
    icon: React.ElementType;
    titleKey: string;
    descriptionKey: string;
    color: string;
    gradient: string;
}

const useCases: UseCase[] = [
    {
        icon: Megaphone,
        titleKey: 'marketing',
        descriptionKey: 'marketingDesc',
        color: 'text-orange-400',
        gradient: 'from-orange-500/20 to-orange-500/5',
    },
    {
        icon: ShoppingBag,
        titleKey: 'ecommerce',
        descriptionKey: 'ecommerceDesc',
        color: 'text-green-400',
        gradient: 'from-green-500/20 to-green-500/5',
    },
    {
        icon: Palette,
        titleKey: 'creative',
        descriptionKey: 'creativeDesc',
        color: 'text-purple-400',
        gradient: 'from-purple-500/20 to-purple-500/5',
    },
    {
        icon: GraduationCap,
        titleKey: 'education',
        descriptionKey: 'educationDesc',
        color: 'text-blue-400',
        gradient: 'from-blue-500/20 to-blue-500/5',
    },
    {
        icon: Video,
        titleKey: 'social',
        descriptionKey: 'socialDesc',
        color: 'text-pink-400',
        gradient: 'from-pink-500/20 to-pink-500/5',
    },
    {
        icon: Users,
        titleKey: 'personal',
        descriptionKey: 'personalDesc',
        color: 'text-cyan-400',
        gradient: 'from-cyan-500/20 to-cyan-500/5',
    },
];

interface UseCasesProps {
    title: string;
    subtitle: string;
    translations: {
        marketing: string;
        marketingDesc: string;
        ecommerce: string;
        ecommerceDesc: string;
        creative: string;
        creativeDesc: string;
        education: string;
        educationDesc: string;
        social: string;
        socialDesc: string;
        personal: string;
        personalDesc: string;
    };
}

export function UseCases({ title, subtitle, translations }: UseCasesProps) {
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

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {useCases.map((useCase, index) => {
                    const Icon = useCase.icon;
                    return (
                        <motion.div
                            key={useCase.titleKey}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -4 }}
                            className="group relative"
                        >
                            <div className={cn(
                                "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity blur-xl",
                                useCase.gradient
                            )} />
                            <div className={cn(
                                "relative p-5 sm:p-6 rounded-2xl transition-all h-full",
                                isDark
                                    ? "bg-white/[0.02] border border-white/10 hover:border-white/20"
                                    : "bg-white border border-gray-200 hover:border-primary/30 shadow-sm hover:shadow-md"
                            )}>
                                <div className={cn(
                                    "w-10 sm:w-12 h-10 sm:h-12 rounded-xl mb-3 sm:mb-4 flex items-center justify-center bg-gradient-to-br",
                                    useCase.gradient
                                )}>
                                    <Icon className={cn("w-5 sm:w-6 h-5 sm:h-6", useCase.color)} />
                                </div>
                                <h3 className={`text-base sm:text-lg font-semibold mb-1 sm:mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {translations[useCase.titleKey as keyof typeof translations]}
                                </h3>
                                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {translations[useCase.descriptionKey as keyof typeof translations]}
                                </p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
