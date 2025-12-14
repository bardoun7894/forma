import { cn } from "@/lib/utils";
import Link from 'next/link';
import { motion } from 'framer-motion';
import { IconArrowRight } from '@tabler/icons-react';

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
    const Content = () => (
        <div
            className={cn(
                "rounded-xl sm:rounded-2xl group/bento transition-all duration-300",
                "relative overflow-hidden",
                "bg-[#0d1117] border border-white/10",
                "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10",
                "flex flex-col h-full min-h-[120px] sm:min-h-[140px]",
                className?.includes("col-span") ? "" : className
            )}
        >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover/bento:opacity-100 transition-opacity duration-300" />

            {/* Content */}
            <div className="relative z-10 p-3 sm:p-4 flex flex-col h-full">
                {/* Icon and Arrow */}
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center group-hover/bento:scale-110 group-hover/bento:border-primary/40 transition-all duration-300">
                        {icon}
                    </div>
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-white/5 flex items-center justify-center opacity-0 group-hover/bento:opacity-100 translate-x-2 group-hover/bento:translate-x-0 transition-all duration-300">
                        <IconArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                    </div>
                </div>

                {/* Title & Description */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-white mb-1 group-hover/bento:text-primary transition-colors duration-300 truncate">
                        {title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed line-clamp-2">
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
