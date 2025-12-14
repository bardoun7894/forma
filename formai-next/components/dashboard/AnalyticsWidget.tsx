'use client';

import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { IconChartBar, IconChartPie } from '@tabler/icons-react';
import { WeeklyData } from '@/hooks/useDashboardData';
import { useTranslations } from 'next-intl';

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
                <div className="bg-gray-900/95 backdrop-blur-sm border border-white/10 rounded-lg p-3 shadow-xl">
                    <p className="text-white font-medium mb-2">{label}</p>
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
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 h-64 animate-pulse" />
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 h-64 animate-pulse" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10"
        >
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <IconChartBar className="w-5 h-5 text-primary" />
                {t('analyticsOverview')}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                {/* Weekly Activity Bar Chart */}
                <div className="bg-[#0d1117] border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
                        <h3 className="text-xs sm:text-sm font-medium text-gray-300">{t('weeklyActivity')}</h3>
                        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-400">
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
                                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                                    allowDecimals={false}
                                    width={25}
                                />
                                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                <Bar dataKey="videos" stackId="a" fill={COLORS[0]} radius={[0, 0, 0, 0]} />
                                <Bar dataKey="images" stackId="a" fill={COLORS[1]} radius={[0, 0, 0, 0]} />
                                <Bar dataKey="avatars" stackId="a" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Content Distribution Pie Chart */}
                <div className="bg-[#0d1117] border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-5">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <h3 className="text-xs sm:text-sm font-medium text-gray-300">{t('contentDistribution')}</h3>
                        <IconChartPie className="w-4 h-4 text-gray-500" />
                    </div>

                    {totalGenerations === 0 ? (
                        <div className="h-36 sm:h-48 flex items-center justify-center">
                            <p className="text-gray-500 text-xs sm:text-sm">{t('noContentYet')}</p>
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
                                                <p className="text-xs sm:text-sm text-white font-medium">{item.name}</p>
                                                <p className="text-[10px] sm:text-xs text-gray-400">
                                                    {item.value} ({percentage}%)
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}

                                <div className="pt-2 border-t border-white/10">
                                    <p className="text-[10px] sm:text-xs text-gray-500">{t('total')}</p>
                                    <p className="text-base sm:text-lg font-bold text-white">{totalGenerations}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
