"use client";

import React, { useEffect, useState } from 'react';
import { Video, Sparkles, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

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
            <GlassCard className={cn('p-6 border-green-500/30', className)}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-green-400">Video Ready!</h3>
                        <p className="text-sm text-gray-400">Generated in {formatTime(elapsedTime)}</p>
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
            <GlassCard className={cn('p-6 border-red-500/30', className)}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-red-400">Generation Failed</h3>
                        <p className="text-sm text-gray-400">{error || 'An unexpected error occurred'}</p>
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
                        <h3 className="font-semibold text-white">Generating Video</h3>
                        <p className="text-sm text-gray-400">
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
                        <p className="text-xs text-gray-500">~{formatTime(estimatedTime)} remaining</p>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
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
                            index < currentStep ? 'text-green-400' :
                                index === currentStep ? 'text-primary' : 'text-gray-600'
                        )}
                    >
                        <div className={cn(
                            'w-5 h-5 rounded-full flex items-center justify-center transition-all',
                            index < currentStep ? 'bg-green-500/20' :
                                index === currentStep ? 'bg-primary/20' : 'bg-white/5'
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
            <div className="aspect-video rounded-lg overflow-hidden bg-black/50 relative">
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Skeleton variant="rectangular" className="w-full h-full absolute inset-0" animation="wave" />
                    <div className="relative z-10 text-center">
                        <Sparkles className="w-8 h-8 text-primary/50 mx-auto mb-2 animate-pulse" />
                        <p className="text-sm text-gray-500">Your video is being created...</p>
                    </div>
                </div>
            </div>

            {/* Prompt Preview */}
            {prompt && (
                <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-gray-500 mb-1">Prompt</p>
                    <p className="text-sm text-gray-300 line-clamp-2">{prompt}</p>
                </div>
            )}
        </GlassCard>
    );
};

// Simple inline loading state for when you just need a basic indicator
export const VideoGeneratingIndicator: React.FC<{ className?: string }> = ({ className }) => (
    <div className={cn('flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20', className)}>
        <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
            <Video className="absolute inset-0 m-auto w-4 h-4 text-primary" />
        </div>
        <div>
            <p className="text-sm font-medium text-white">Video generating...</p>
            <p className="text-xs text-gray-400">This may take 2-5 minutes</p>
        </div>
    </div>
);
