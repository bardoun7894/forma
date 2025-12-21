'use client';

import { cn } from "@/lib/utils";
import Link from 'next/link';
import { motion } from 'framer-motion';
import { IconArrowRight } from '@tabler/icons-react';
import { useTheme } from '@/contexts/ThemeContext';

export const BentoGrid = ({
    className,
    children,
}: {
    className?: string;
    children?: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                "grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 max-w-7xl mx-auto",
                className
            )}
        >
            {children}
        </div>
    );
};

export const BentoGridItem = ({
    className,
    title,
    description,
    header,
    icon,
    href,
}: {
    className?: string;
    title?: string | React.ReactNode;
    description?: string | React.ReactNode;
    header?: React.ReactNode;
    icon?: React.ReactNode;
    href?: string;
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const Content = () => (
        <div
            className={cn(
                "rounded-xl sm:rounded-2xl group/bento transition-all duration-300",
                "relative overflow-hidden",
                "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10",
                "flex flex-col h-full min-h-[120px] sm:min-h-[140px]",
                isDark
                    ? "bg-[#0d1117] border border-white/10"
                    : "bg-white border border-gray-200 shadow-sm",
                className?.includes("col-span") ? "" : className
            )}
        >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover/bento:opacity-100 transition-opacity duration-300" />

            {/* Content */}
            <div className="relative z-10 p-3 sm:p-4 flex flex-col h-full">
                {/* Icon and Arrow */}
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className={cn(
                        "w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center group-hover/bento:scale-110 group-hover/bento:border-primary/40 transition-all duration-300 border",
                        isDark
                            ? "bg-gradient-to-br from-white/10 to-white/5 border-white/10"
                            : "bg-gray-100 border-gray-200"
                    )}>
                        {icon}
                    </div>
                    <div className={cn(
                        "w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg flex items-center justify-center opacity-0 group-hover/bento:opacity-100 translate-x-2 group-hover/bento:translate-x-0 transition-all duration-300",
                        isDark ? "bg-white/5" : "bg-gray-100"
                    )}>
                        <IconArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                    </div>
                </div>

                {/* Title & Description */}
                <div className="flex-1 min-w-0">
                    <h3 className={cn(
                        "text-sm sm:text-base font-bold mb-1 group-hover/bento:text-primary transition-colors duration-300 truncate",
                        isDark ? "text-white" : "text-gray-900"
                    )}>
                        {title}
                    </h3>
                    <p className={cn("text-xs sm:text-sm leading-relaxed line-clamp-2", isDark ? "text-gray-400" : "text-gray-600")}>
                        {description}
                    </p>
                </div>

                {/* Bottom gradient bar */}
                <div className="mt-2 sm:mt-3 h-0.5 sm:h-1 w-0 group-hover/bento:w-full bg-gradient-to-r from-primary via-cyan-400 to-secondary rounded-full transition-all duration-500" />
            </div>
        </div>
    );

    if (href) {
        return (
            <Link
                href={href}
                className={cn(
                    "block h-full focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-xl sm:rounded-2xl",
                    className?.includes("col-span") ? className : ""
                )}
            >
                <Content />
            </Link>
        )
    }

    return <Content />;
};
