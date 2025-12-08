import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
    variant?: 'default' | 'circular' | 'text' | 'rectangular';
    animation?: 'pulse' | 'wave' | 'none';
    width?: string | number;
    height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className,
    variant = 'default',
    animation = 'pulse',
    width,
    height,
}) => {
    const baseClasses = 'bg-white/10';

    const variantClasses = {
        default: 'rounded-md',
        circular: 'rounded-full',
        text: 'rounded h-4 w-full',
        rectangular: 'rounded-lg',
    };

    const animationClasses = {
        pulse: 'animate-pulse',
        wave: 'animate-shimmer bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%]',
        none: '',
    };

    const style: React.CSSProperties = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
    };

    return (
        <div
            className={cn(
                baseClasses,
                variantClasses[variant],
                animationClasses[animation],
                className
            )}
            style={style}
        />
    );
};

// Preset skeleton components for common use cases
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
    lines = 3,
    className,
}) => (
    <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
                key={i}
                variant="text"
                className={i === lines - 1 ? 'w-3/4' : 'w-full'}
            />
        ))}
    </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
    <div className={cn('p-4 rounded-xl bg-white/5 border border-white/10 space-y-4', className)}>
        <Skeleton variant="rectangular" className="w-full aspect-video" />
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2" />
    </div>
);

export const SkeletonAvatar: React.FC<{ size?: number; className?: string }> = ({
    size = 40,
    className,
}) => (
    <Skeleton
        variant="circular"
        width={size}
        height={size}
        className={className}
    />
);
