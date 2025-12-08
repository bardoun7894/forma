'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export const GlowingBorder = ({
    children,
    className,
    containerClassName,
    borderWidth = 1.5,
    gradient = 'linear-gradient(var(--border-angle), var(--tw-gradient-stops))',
    duration = 4,
    rx = '30%',
    ry = '30%',
}: {
    children?: React.ReactNode;
    className?: string;
    containerClassName?: string;
    borderWidth?: number;
    gradient?: string;
    duration?: number;
    rx?: string;
    ry?: string;
}) => {
    return (
        <div
            className={cn(
                'relative flex items-center justify-center rounded-[inherit] overflow-hidden',
                containerClassName
            )}
        >
            <div
                className="absolute inset-0 animate-spin-slow [animation-duration:4s]"
                style={{
                    background: 'conic-gradient(from 0deg at 50% 50%, transparent 0%, #00C4CC 25%, transparent 50%, #8B5CF6 75%, transparent 100%)',
                }}
            />
            <div className={cn('relative bg-page rounded-[inherit] h-[calc(100%-2px)] w-[calc(100%-2px)] p-1', className)}>
                {children}
            </div>
        </div>
    );
};
