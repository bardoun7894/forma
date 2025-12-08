"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
    return (
        <div
            className={cn(
                "bg-panel backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden",
                hoverEffect && "transition-all duration-300 hover:border-primary/30 hover:scale-[1.02] hover:bg-panel-hover",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}