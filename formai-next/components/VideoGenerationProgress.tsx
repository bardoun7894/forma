"use client";

import React, { useEffect, useState } from 'react';
import { Video, Sparkles, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface VideoGenerationProgressProps {
    status: 'starting' | 'processing' | 'completed' | 'failed';
    progress?: number; // 0-100
    estimatedTime?: number; // seconds remaining
    prompt?: string;
    error?: string;
    videoUrl?: string;
    className?: string;
}

const GENERATION_STEPS = [
    { key: 'queued', label: 'Request queued' },
    { key: 'analyzing', label: 'Analyzing prompt' },
    { key: 'generating', label: 'Generating frames' },
    { key: 'rendering', label: 'Rendering video' },
    { key: 'finalizing', label: 'Finalizing' },
];

export const VideoGenerationProgress: React.FC<VideoGenerationProgressProps> = ({
    status,
    progress = 0,
    estimatedTime,
    prompt,
    error,
    videoUrl,
    className,
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [currentStep, setCurrentStep] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);

    // Simulate step progression based on progress
    useEffect(() => {
        if (status === 'processing') {
            const step = Math.min(Math.floor(progress / 20), 4);
            setCurrentStep(step);
        } else if (status === 'completed') {
            setCurrentStep(GENERATION_STEPS.length);
        }
    }, [progress, status]);

    // Track elapsed time
    useEffect(() => {
        if (status === 'processing' || status === 'starting') {
            const interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [status]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (status === 'completed' && videoUrl) {
        return (
            <GlassCard className={cn('p-6', isDark ? 'border-green-500/30' : 'border-green-300', className)}>
                <div className="flex items-center gap-3 mb-4">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", isDark ? "bg-green-500/20" : "bg-green-100")}>
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                        <h3 className={cn("font-semibold", isDark ? "text-green-400" : "text-green-700")}>Video Ready!</h3>
                        <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>Generated in {formatTime(elapsedTime)}</p>
                    </div>
                </div>
                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                    <video src={videoUrl} controls autoPlay loop className="w-full h-full object-cover" />
                </div>
            </GlassCard>
        );
    }

    if (status === 'failed') {
        return (
            <GlassCard className={cn('p-6', isDark ? 'border-red-500/30' : 'border-red-300', className)}>
                <div className="flex items-center gap-3 mb-4">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", isDark ? "bg-red-500/20" : "bg-red-100")}>
                        <XCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <h3 className={cn("font-semibold", isDark ? "text-red-400" : "text-red-700")}>Generation Failed</h3>
                        <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>{error || 'An unexpected error occurred'}</p>
                    </div>
                </div>
            </GlassCard>
        );
    }

    return (
        <GlassCard className={cn('p-6 border-primary/30', className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12">
                        <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
                        <div className="absolute inset-2 rounded-full border-r-2 border-purple-500 animate-spin animation-delay-200" />
                        <Video className="absolute inset-0 m-auto w-5 h-5 text-primary animate-pulse" />
                    </div>
                    <div>
                        <h3 className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>Generating Video</h3>
                        <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                            {status === 'starting' ? 'Starting...' : GENERATION_STEPS[currentStep]?.label || 'Processing...'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-1 text-primary text-sm font-medium">
                        <Clock className="w-4 h-4" />
                        {formatTime(elapsedTime)}
                    </div>
                    {estimatedTime && (
                        <p className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-600")}>~{formatTime(estimatedTime)} remaining</p>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
                <div className={cn("flex justify-between text-xs mb-2", isDark ? "text-gray-400" : "text-gray-600")}>
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className={cn("h-2 rounded-full overflow-hidden", isDark ? "bg-white/10" : "bg-gray-200")}>
                    <div
                        className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-500 animate-progress-pulse"
                        style={{ width: `${Math.max(progress, 5)}%` }}
                    />
                </div>
            </div>

            {/* Steps Progress */}
            <div className="space-y-3 mb-6">
                {GENERATION_STEPS.map((step, index) => (
                    <div
                        key={step.key}
                        className={cn(
                            'flex items-center gap-3 text-sm transition-all duration-300',
                            index < currentStep ? (isDark ? 'text-green-400' : 'text-green-600') :
                                index === currentStep ? 'text-primary' : (isDark ? 'text-gray-600' : 'text-gray-400')
                        )}
                    >
                        <div className={cn(
                            'w-5 h-5 rounded-full flex items-center justify-center transition-all',
                            index < currentStep ? (isDark ? 'bg-green-500/20' : 'bg-green-100') :
                                index === currentStep ? (isDark ? 'bg-primary/20' : 'bg-primary/10') : (isDark ? 'bg-white/5' : 'bg-gray-100')
                        )}>
                            {index < currentStep ? (
                                <CheckCircle2 className="w-3 h-3" />
                            ) : index === currentStep ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                            )}
                        </div>
                        <span>{step.label}</span>
                    </div>
                ))}
            </div>

            {/* Video Preview Skeleton */}
            <div className={cn("aspect-video rounded-lg overflow-hidden relative", isDark ? "bg-black/50" : "bg-gray-100")}>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Skeleton variant="rectangular" className="w-full h-full absolute inset-0" animation="wave" />
                    <div className="relative z-10 text-center">
                        <Sparkles className="w-8 h-8 text-primary/50 mx-auto mb-2 animate-pulse" />
                        <p className={cn("text-sm", isDark ? "text-gray-500" : "text-gray-600")}>Your video is being created...</p>
                    </div>
                </div>
            </div>

            {/* Prompt Preview */}
            {prompt && (
                <div className={cn("mt-4 p-3 rounded-lg border", isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200")}>
                    <p className={cn("text-xs mb-1", isDark ? "text-gray-500" : "text-gray-500")}>Prompt</p>
                    <p className={cn("text-sm line-clamp-2", isDark ? "text-gray-300" : "text-gray-700")}>{prompt}</p>
                </div>
            )}
        </GlassCard>
    );
};

// Simple inline loading state for when you just need a basic indicator
export const VideoGeneratingIndicator: React.FC<{ className?: string }> = ({ className }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className={cn('flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20', className)}>
            <div className="relative w-8 h-8">
                <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
                <Video className="absolute inset-0 m-auto w-4 h-4 text-primary" />
            </div>
            <div>
                <p className={cn("text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>Video generating...</p>
                <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-600")}>This may take 2-5 minutes</p>
            </div>
        </div>
    );
};
