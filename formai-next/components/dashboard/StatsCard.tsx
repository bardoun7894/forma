'use client';

import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { IconTrendingUp, IconTrendingDown, IconMinus } from '@tabler/icons-react';
import { ComponentType } from 'react';

interface StatsCardProps {
    label: string;
    value: number;
    previousValue?: number;
    icon: ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    iconColor: string;
    sparklineData?: number[];
    isLoading?: boolean;
    index?: number;
}

export function StatsCard({
    label,
    value,
    previousValue,
    icon: Icon,
    color,
    bgColor,
    iconColor,
    sparklineData = [],
    isLoading = false,
    index = 0,
}: StatsCardProps) {
    // Calculate trend
    const trend = previousValue !== undefined ? value - previousValue : 0;
    const trendPercentage = previousValue && previousValue > 0
        ? Math.round((trend / previousValue) * 100)
        : 0;

    // Format sparkline data for recharts
    const chartData = sparklineData.map((val, i) => ({ value: val, index: i }));

    // Get trend icon and color
    const getTrendDisplay = () => {
        if (trend > 0) {
            return {
                icon: IconTrendingUp,
                color: 'text-green-400',
                bgColor: 'bg-green-400/10',
                text: `+${trendPercentage}%`,
            };
        } else if (trend < 0) {
            return {
                icon: IconTrendingDown,
                color: 'text-red-400',
                bgColor: 'bg-red-400/10',
                text: `${trendPercentage}%`,
            };
        }
        return {
            icon: IconMinus,
            color: 'text-gray-400',
            bgColor: 'bg-gray-400/10',
            text: 'No change',
        };
    };

    const trendDisplay = getTrendDisplay();
    const TrendIcon = trendDisplay.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.1 }}
            className="group relative bg-[#0d1117] border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 hover:border-white/20 transition-all duration-300 overflow-hidden"
            role="region"
            aria-label={`${label} statistics`}
        >
            {/* Gradient glow on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

            <div className="relative">
                {/* Header with icon */}
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <p className="text-gray-400 text-xs sm:text-sm font-medium truncate pr-2">{label}</p>
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor}`} />
                    </div>
                </div>

                {/* Value */}
                <div className="flex items-end justify-between gap-2">
                    <div className="min-w-0">
                        {isLoading ? (
                            <div className="h-8 sm:h-10 w-12 sm:w-16 rounded bg-white/10 animate-pulse" />
                        ) : (
                            <motion.p
                                className="text-2xl sm:text-3xl font-bold text-white"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2 + index * 0.1, type: 'spring' }}
                            >
                                {value.toLocaleString()}
                            </motion.p>
                        )}

                        {/* Trend indicator */}
                        <div className={`mt-1.5 sm:mt-2 inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg ${trendDisplay.bgColor}`}>
                            <TrendIcon className={`w-3 h-3 ${trendDisplay.color}`} />
                            <span className={`text-[10px] sm:text-xs font-medium ${trendDisplay.color}`}>
                                {trendDisplay.text}
                            </span>
                        </div>
                    </div>

                    {/* Sparkline chart - hidden on mobile */}
                    {sparklineData.length > 0 && (
                        <div className="hidden sm:block w-16 sm:w-20 h-10 sm:h-12 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={iconColor.includes('cyan') ? '#06b6d4' : iconColor.includes('purple') ? '#a855f7' : '#22c55e'} stopOpacity={0.4} />
                                            <stop offset="100%" stopColor={iconColor.includes('cyan') ? '#06b6d4' : iconColor.includes('purple') ? '#a855f7' : '#22c55e'} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke={iconColor.includes('cyan') ? '#06b6d4' : iconColor.includes('purple') ? '#a855f7' : '#22c55e'}
                                        strokeWidth={2}
                                        fill={`url(#gradient-${index})`}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
