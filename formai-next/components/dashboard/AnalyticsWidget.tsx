'use client';

import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { IconChartBar, IconChartPie } from '@tabler/icons-react';
import { WeeklyData } from '@/hooks/useDashboardData';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface AnalyticsWidgetProps {
    weeklyData: WeeklyData[];
    stats: {
        videos: number;
        images: number;
        avatars: number;
    };
    isLoading?: boolean;
}

const COLORS = ['#06b6d4', '#a855f7', '#22c55e']; // cyan, purple, green

export function AnalyticsWidget({ weeklyData, stats, isLoading = false }: AnalyticsWidgetProps) {
    const t = useTranslations('dashboard');
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Pie chart data
    const pieData = [
        { name: t('videos'), value: stats.videos, color: COLORS[0] },
        { name: t('images'), value: stats.images, color: COLORS[1] },
        { name: t('avatars'), value: stats.avatars, color: COLORS[2] },
    ].filter(item => item.value > 0);

    const totalGenerations = stats.videos + stats.images + stats.avatars;

    // Custom tooltip for bar chart
    const CustomBarTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className={cn(
                    "backdrop-blur-sm rounded-lg p-3 shadow-xl border",
                    isDark ? "bg-gray-900/95 border-white/10" : "bg-white border-gray-200"
                )}>
                    <p className={cn("font-medium mb-2", isDark ? "text-white" : "text-gray-900")}>{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-xs" style={{ color: entry.color }}>
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className={cn(
                    "rounded-2xl p-6 h-64 animate-pulse border",
                    isDark ? "bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10" : "bg-gray-100 border-gray-200"
                )} />
                <div className={cn(
                    "rounded-2xl p-6 h-64 animate-pulse border",
                    isDark ? "bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10" : "bg-gray-100 border-gray-200"
                )} />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10"
        >
            <h2 className={cn("text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2", isDark ? "text-white" : "text-gray-900")}>
                <IconChartBar className="w-5 h-5 text-primary" />
                {t('analyticsOverview')}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                {/* Weekly Activity Bar Chart */}
                <div className={cn(
                    "rounded-xl sm:rounded-2xl p-3 sm:p-5 border",
                    isDark ? "bg-[#0d1117] border-white/10" : "bg-white border-gray-200 shadow-sm"
                )}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
                        <h3 className={cn("text-xs sm:text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>{t('weeklyActivity')}</h3>
                        <div className={cn("flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                                {t('videos')}
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-purple-500" />
                                {t('images')}
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                {t('avatars')}
                            </span>
                        </div>
                    </div>

                    <div className="h-36 sm:h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyData} barCategoryGap="20%">
                                <XAxis
                                    dataKey="day"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 10 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 10 }}
                                    allowDecimals={false}
                                    width={25}
                                />
                                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
                                <Bar dataKey="videos" stackId="a" fill={COLORS[0]} radius={[0, 0, 0, 0]} />
                                <Bar dataKey="images" stackId="a" fill={COLORS[1]} radius={[0, 0, 0, 0]} />
                                <Bar dataKey="avatars" stackId="a" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Content Distribution Pie Chart */}
                <div className={cn(
                    "rounded-xl sm:rounded-2xl p-3 sm:p-5 border",
                    isDark ? "bg-[#0d1117] border-white/10" : "bg-white border-gray-200 shadow-sm"
                )}>
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <h3 className={cn("text-xs sm:text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>{t('contentDistribution')}</h3>
                        <IconChartPie className={cn("w-4 h-4", isDark ? "text-gray-500" : "text-gray-400")} />
                    </div>

                    {totalGenerations === 0 ? (
                        <div className="h-36 sm:h-48 flex items-center justify-center">
                            <p className={cn("text-xs sm:text-sm", isDark ? "text-gray-500" : "text-gray-400")}>{t('noContentYet')}</p>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="h-32 sm:h-48 flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={35}
                                            outerRadius={50}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Legend */}
                            <div className="space-y-2 sm:space-y-3">
                                {pieData.map((item) => {
                                    const percentage = Math.round((item.value / totalGenerations) * 100);
                                    return (
                                        <div key={item.name} className="flex items-center gap-2">
                                            <span
                                                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <div className="min-w-0">
                                                <p className={cn("text-xs sm:text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>{item.name}</p>
                                                <p className={cn("text-[10px] sm:text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                                                    {item.value} ({percentage}%)
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}

                                <div className={cn("pt-2 border-t", isDark ? "border-white/10" : "border-gray-200")}>
                                    <p className={cn("text-[10px] sm:text-xs", isDark ? "text-gray-500" : "text-gray-400")}>{t('total')}</p>
                                    <p className={cn("text-base sm:text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>{totalGenerations}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
