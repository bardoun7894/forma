"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    variant?: 'default' | 'primary' | 'danger' | 'warning';
}

export function StatsCard({ title, value, icon: Icon, trend, variant = 'default' }: StatsCardProps) {
    const variants = {
        default: {
            iconBg: 'bg-white/10',
            iconColor: 'text-white',
        },
        primary: {
            iconBg: 'bg-primary/10',
            iconColor: 'text-primary',
        },
        danger: {
            iconBg: 'bg-red-500/10',
            iconColor: 'text-red-400',
        },
        warning: {
            iconBg: 'bg-yellow-500/10',
            iconColor: 'text-yellow-400',
        },
    };

    const { iconBg, iconColor } = variants[variant];

    return (
        <GlassCard className="p-6">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-400 mb-1">{title}</p>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    {trend && (
                        <p className={cn(
                            "text-xs mt-2",
                            trend.isPositive ? "text-green-400" : "text-red-400"
                        )}>
                            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                        </p>
                    )}
                </div>
                <div className={cn("p-3 rounded-xl", iconBg)}>
                    <Icon className={cn("w-6 h-6", iconColor)} />
                </div>
            </div>
        </GlassCard>
    );
}
