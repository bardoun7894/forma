"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export function GlassCard({
    children,
    className,
    hoverEffect = false,
    ...props
}: GlassCardProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div
            className={cn(
                "backdrop-blur-xl rounded-2xl overflow-hidden border",
                isDark
                    ? "bg-panel border-white/10"
                    : "bg-white border-gray-200 shadow-sm",
                hoverEffect && "transition-all duration-300 hover:border-primary/30 hover:scale-[1.02]",
                hoverEffect && (isDark ? "hover:bg-panel-hover" : "hover:bg-gray-50"),
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}