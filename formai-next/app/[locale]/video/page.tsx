"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Sidebar } from "@/components/Sidebar";
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { GlassCard } from '@/components/ui/GlassCard';
import { VideoGenerationProgress } from '@/components/VideoGenerationProgress';
import { FreeTrialBanner, TrialExhaustedModal } from '@/components/ui/FreeTrialBanner';
import { useFreeTrial, FREE_TRIAL_CONFIG } from '@/hooks/useFreeTrial';
import { ModelType, CREDIT_COSTS } from '@/types';
import { pollVideoStatus, AIServiceError, generateVideoUnified, getModelCreditCost, enhancePrompt } from '@/services/aiService';
import { Sparkles, Video, Settings2, Download, AlertCircle, RefreshCw, Wand2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { deductCredits as deductCreditsFirebase, getPendingVideos, saveVideoGeneration, updateVideoGeneration, type VideoGeneration } from '@/lib/database';

type GenerationStatus = 'idle' | 'starting' | 'processing' | 'completed' | 'failed';

export default function VideoPage() {
    const { userData, refreshUserData } = useAuth();
    const params = useParams();
    const locale = (params?.locale as string) || 'en';
    const freeTrial = useFreeTrial();
    const isLoggedIn = !!userData?.uid;

    const handleGenerateComplete = (url: string, prompt: string, type: 'video') => {
        console.log("Generated:", { url, prompt, type });
    };

    const deductCredits = async (amount: number): Promise<boolean> => {
        if (!userData?.uid) return false;
        if (userData.credits < amount) return false;
        try {
            await deductCreditsFirebase(userData.uid, amount);
            await refreshUserData();
            return true;
        } catch (error) {
            console.error('Failed to deduct credits:', error);
            return false;
        }
    };

    return (
        <div className="min-h-screen bg-page">
            <Sidebar />

            <main className="lg:ml-72 rtl:lg:ml-0 rtl:lg:mr-72 min-h-screen pt-20 lg:pt-6 px-4 pb-4 lg:px-8 lg:pb-8">
                <VideoGen
                    onGenerateComplete={handleGenerateComplete}
                    deductCredits={deductCredits}
                    userId={userData?.uid}
                    locale={locale}
                    isLoggedIn={isLoggedIn}
                    freeTrial={freeTrial}
                />
            </main>
        </div>
    );
}

interface VideoGenProps {
    onGenerateComplete: (url: string, prompt: string, type: 'video') => void;
    deductCredits: (amount: number) => Promise<boolean>;
    userId?: string;
    locale: string;
    isLoggedIn: boolean;
    freeTrial: ReturnType<typeof useFreeTrial>;
}

// Video model options with hints - ordered by price (cheapest first)
const VIDEO_MODELS_STANDARD = [
    { value: ModelType.SORA_TEXT, labelKey: 'modelSora2', hintKey: 'hintSora2' },
    { value: ModelType.SORA_PRO, labelKey: 'modelSoraPro', hintKey: 'hintSoraPro' },
    { value: ModelType.KLING_STANDARD, labelKey: 'modelKlingStandard', hintKey: 'hintKlingStandard' },
    { value: ModelType.HAILUO_PRO, labelKey: 'modelHailuo', hintKey: 'hintHailuo' },
    { value: ModelType.KLING_PRO, labelKey: 'modelKlingPro', hintKey: 'hintKlingPro' },
];

// Premium/Expensive models (shown below separator)
const VIDEO_MODELS_PREMIUM = [
    { value: ModelType.VEO_FAST, labelKey: 'modelVeoFast', hintKey: 'hintVeoFast' },
    { value: ModelType.RUNWAY_GEN3, labelKey: 'modelRunway', hintKey: 'hintRunway' },
    { value: ModelType.VEO_HD, labelKey: 'modelVeoHD', hintKey: 'hintVeoHD' },
];

// Combined list for backwards compatibility
const VIDEO_MODELS = [...VIDEO_MODELS_STANDARD, ...VIDEO_MODELS_PREMIUM];

const VideoGen: React.FC<VideoGenProps> = ({ onGenerateComplete, deductCredits, userId, locale, isLoggedIn, freeTrial }) => {
    const t = useTranslations('video');
    const tTrial = useTranslations('freeTrial');
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [prompt, setPrompt] = useState('');
    const [model, setModel] = useState<ModelType>(ModelType.SORA_TEXT); // Default to cheapest model
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [showExhaustedModal, setShowExhaustedModal] = useState(false);

    // Get current credit cost
    const creditCost = getModelCreditCost(model);

    // Get current model hint
    const currentModelConfig = VIDEO_MODELS.find(m => m.value === model);

    // Free trial state
    const { canGenerateVideo, videosRemaining, useVideoTrial, isLoading: isTrialLoading } = freeTrial;
    const canUseTrial = !isLoggedIn && canGenerateVideo;

    // Generation state
    const [status, setStatus] = useState<GenerationStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentPrompt, setCurrentPrompt] = useState<string>('');
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [isTrialGeneration, setIsTrialGeneration] = useState(false);

    // AI Enhance prompt handler
    const handleEnhancePrompt = async () => {
        if (!prompt.trim() || isEnhancing) return;

        setIsEnhancing(true);
        setError(null);

        try {
            const enhanced = await enhancePrompt(prompt, 'video');
            setPrompt(enhanced);
        } catch (err: any) {
            console.error('Failed to enhance prompt:', err);
            setError(err.message || 'Failed to enhance prompt');
        } finally {
            setIsEnhancing(false);
        }
    };

    // Check for pending videos on mount
    useEffect(() => {
        if (userId) {
            checkPendingVideos();
        }
    }, [userId]);

    const checkPendingVideos = async () => {
        if (!userId) return;

        try {
            const pending = await getPendingVideos(userId);
            if (pending.length > 0) {
                const latest = pending[0];
                if (latest.taskId) {
                    setCurrentTaskId(latest.taskId);
                    setCurrentPrompt(latest.prompt);
                    setStatus('processing');
                    startPolling(latest.taskId);
                }
            }
        } catch (err) {
            console.error('Failed to check pending videos:', err);
        }
    };

    const startPolling = useCallback((taskId: string) => {
        let pollCount = 0;
        const maxPolls = 60;
        const pollInterval = 10000; // 10 seconds

        const poll = async () => {
            try {
                pollCount++;
                // Simulate progress (video gen typically takes 2-5 minutes)
                const estimatedProgress = Math.min((pollCount / maxPolls) * 100, 95);
                setProgress(estimatedProgress);

                const result = await pollVideoStatus(taskId);

                if (result.status === 'completed' && result.videoUrl) {
                    setStatus('completed');
                    setResultUrl(result.videoUrl);
                    setProgress(100);
                    onGenerateComplete(result.videoUrl, currentPrompt, 'video');
                    return;
                } else if (result.status === 'failed') {
                    setStatus('failed');
                    setError(result.error || 'Video generation failed');
                    return;
                }

                // Still processing, continue polling
                if (pollCount < maxPolls) {
                    setTimeout(poll, pollInterval);
                } else {
                    setStatus('failed');
                    setError('Generation timeout: Please try again');
                }
            } catch (err) {
                console.error('Polling error:', err);
                if (pollCount < maxPolls) {
                    // Retry on transient errors
                    setTimeout(poll, pollInterval);
                } else {
                    setStatus('failed');
                    setError('Failed to check generation status');
                }
            }
        };

        poll();
    }, [currentPrompt, onGenerateComplete]);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        // Check if this is a free trial generation or logged-in user generation
        const usingTrial = !isLoggedIn && canUseTrial;

        if (!usingTrial && !userId) {
            // Not logged in and no trial available - show exhausted modal
            setShowExhaustedModal(true);
            return;
        }

        // Debug: Log selected model
        console.log('Generating video with model:', model, 'Credit cost:', creditCost, 'Using trial:', usingTrial);

        if (usingTrial) {
            // Use free trial
            const trialUsed = useVideoTrial();
            if (!trialUsed) {
                setShowExhaustedModal(true);
                return;
            }
            setIsTrialGeneration(true);
        } else {
            // Deduct credits for logged-in user
            const success = await deductCredits(creditCost);
            if (!success) {
                setError(t('errorInsufficientCredits'));
                return;
            }
            setIsTrialGeneration(false);
        }

        setStatus('starting');
        setError(null);
        setResultUrl(null);
        setProgress(0);
        setCurrentPrompt(prompt);

        // Create a Firebase record to track the generation (only for logged-in users)
        let docId: string | null = null;

        try {
            if (userId) {
                // Save to Firebase with processing status (for all models)
                docId = await saveVideoGeneration({
                    userId,
                    prompt,
                    videoUrl: '',
                    status: 'processing',
                    model: model, // Uses the actual ModelType value (e.g., 'sora-2-text-to-video')
                    aspectRatio,
                    duration: 8,
                    creditsUsed: usingTrial ? 0 : creditCost,
                    createdAt: new Date().toISOString(),
                });
            }

            setStatus('processing');
            setProgress(10);

            // Use unified generator for ALL models
            const videoUrl = await generateVideoUnified(prompt, model, aspectRatio);

            // Update Firebase with completed status (only for logged-in users)
            if (docId) {
                await updateVideoGeneration(docId, {
                    videoUrl,
                    status: 'completed',
                    completedAt: new Date().toISOString(),
                });
            }

            setResultUrl(videoUrl);
            setStatus('completed');
            setProgress(100);
            onGenerateComplete(videoUrl, prompt, 'video');

        } catch (err) {
            console.error('Generation error:', err);
            setStatus('failed');

            // Update Firebase with failed status if we have a doc
            if (docId) {
                try {
                    await updateVideoGeneration(docId, {
                        status: 'failed',
                        errorMessage: err instanceof Error ? err.message : 'Unknown error',
                    });
                } catch (updateErr) {
                    console.error('Failed to update video status:', updateErr);
                }
            }

            if (err instanceof AIServiceError) {
                switch (err.code) {
                    case 'NETWORK_ERROR':
                        setError('Network error: Please check your connection and try again');
                        break;
                    case 'AUTH_ERROR':
                        setError('Authentication error: Please contact support');
                        break;
                    case 'RATE_LIMIT':
                        setError('Too many requests: Please wait a moment and try again');
                        break;
                    default:
                        setError(err.message);
                }
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError(t('errorFailed'));
            }
        }
    };

    const handleReset = () => {
        setStatus('idle');
        setProgress(0);
        setCurrentTaskId(null);
        setResultUrl(null);
        setError(null);
        setCurrentPrompt('');
    };

    // Show progress component when generating
    if (status !== 'idle') {
        return (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className={cn("text-2xl sm:text-3xl font-bold mb-2", isDark ? "text-white" : "text-gray-900")}>{t('title')}</h1>
                        <p className={cn(isDark ? "text-gray-400" : "text-gray-600")}>{t('subtitle')}</p>
                    </div>
                    {(status === 'completed' || status === 'failed') && (
                        <Button onClick={handleReset} variant="secondary" size="sm">
                            <RefreshCw className="w-4 h-4 mr-2" /> {t('newVideo') || 'New Video'}
                        </Button>
                    )}
                </div>

                <VideoGenerationProgress
                    status={status}
                    progress={progress}
                    prompt={currentPrompt}
                    error={error || undefined}
                    videoUrl={resultUrl || undefined}
                    estimatedTime={status === 'processing' ? Math.max(0, Math.round((100 - progress) * 3)) : undefined}
                />

                {(status === 'starting' || status === 'processing') && (
                    <div className={cn(
                        "p-4 rounded-lg text-sm text-center border",
                        isDark
                            ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                            : "bg-blue-50 border-blue-200 text-blue-700"
                    )}>
                        {t('canLeaveMessage')}
                    </div>
                )}

                {status === 'completed' && resultUrl && (
                    <div className="flex gap-3">
                        <a href={resultUrl} download className="flex-1">
                            <Button variant="secondary" className="w-full">
                                <Download className="w-4 h-4 mr-2" /> {t('downloadButton')}
                            </Button>
                        </a>
                        <Button onClick={handleReset} variant="primary" className="flex-1">
                            <Sparkles className="w-4 h-4 mr-2" /> {t('generateAnother') || 'Generate Another'}
                        </Button>
                    </div>
                )}

                {status === 'failed' && (
                    <div className="flex gap-3">
                        <Button onClick={handleReset} variant="secondary" className="flex-1">
                            {t('tryAgain') || 'Try Again'}
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    // Default idle state - show form
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Free Trial Banner - show for non-logged-in users */}
            {!isLoggedIn && !isTrialLoading && (
                <FreeTrialBanner
                    locale={locale}
                    type="video"
                    remaining={videosRemaining}
                    total={FREE_TRIAL_CONFIG.maxVideos}
                    isLoggedIn={isLoggedIn}
                />
            )}

            {/* Trial Exhausted Modal */}
            <TrialExhaustedModal
                locale={locale}
                type="video"
                isOpen={showExhaustedModal}
                onClose={() => setShowExhaustedModal(false)}
            />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className={cn("text-2xl sm:text-3xl font-bold mb-2", isDark ? "text-white" : "text-gray-900")}>{t('title')}</h1>
                    <p className={cn(isDark ? "text-gray-400" : "text-gray-600")}>{t('subtitle')}</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left: Controls */}
                <div className="lg:col-span-2 space-y-6">
                    <GlassCard className="p-6 space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>{t('promptLabel')}</label>
                                <button
                                    onClick={handleEnhancePrompt}
                                    disabled={!prompt.trim() || isEnhancing}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed transition-all",
                                        isDark
                                            ? "bg-gradient-to-r from-purple-500/20 to-primary/20 border-purple-500/30 text-purple-300 hover:from-purple-500/30 hover:to-primary/30 hover:text-purple-200"
                                            : "bg-gradient-to-r from-purple-100 to-primary/10 border-purple-300 text-purple-700 hover:from-purple-200 hover:to-primary/20 hover:text-purple-800"
                                    )}
                                    title={t('enhancePromptTooltip') || 'Enhance prompt with AI'}
                                >
                                    <Wand2 className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin' : ''}`} />
                                    {isEnhancing ? (t('enhancing') || 'Enhancing...') : (t('enhancePrompt') || 'AI Enhance')}
                                </button>
                            </div>
                            <TextArea
                                placeholder={t('promptPlaceholder')}
                                rows={5}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="text-lg font-light"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>{t('modelLabel')}</label>
                                <select
                                    value={model}
                                    onChange={(e) => {
                                        const newModel = e.target.value as ModelType;
                                        console.log('Model changed to:', newModel);
                                        setModel(newModel);
                                    }}
                                    className={cn(
                                        "w-full rounded-xl px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all",
                                        isDark
                                            ? "bg-white/5 border-white/10 text-white"
                                            : "bg-white border-gray-300 text-gray-900"
                                    )}
                                >
                                    <optgroup label={t('standardModels') || 'Standard Models'}>
                                        {VIDEO_MODELS_STANDARD.map(m => (
                                            <option key={m.value} value={m.value} className={isDark ? "bg-[#1a1a1a]" : "bg-white"}>
                                                {t(m.labelKey)} ({CREDIT_COSTS[m.value]} {t('credits') || 'credits'})
                                            </option>
                                        ))}
                                    </optgroup>
                                    <optgroup label={t('premiumModels') || '⭐ Premium Models'}>
                                        {VIDEO_MODELS_PREMIUM.map(m => (
                                            <option key={m.value} value={m.value} className={isDark ? "bg-[#1a1a1a]" : "bg-white"}>
                                                {t(m.labelKey)} ({CREDIT_COSTS[m.value]} {t('credits') || 'credits'})
                                            </option>
                                        ))}
                                    </optgroup>
                                </select>
                                {currentModelConfig && (
                                    <p className={cn("text-xs px-1", isDark ? "text-primary/80" : "text-primary")}>
                                        {t(currentModelConfig.hintKey)}
                                    </p>
                                )}
                            </div>
                            <Select
                                label={t('aspectRatioLabel')}
                                value={aspectRatio}
                                onChange={(e) => setAspectRatio(e.target.value as '16:9' | '9:16')}
                                options={[
                                    { label: t('aspectRatioLandscape'), value: '16:9' },
                                    { label: t('aspectRatioPortrait'), value: '9:16' },
                                ]}
                            />
                        </div>

                        {error && (
                            <div className={cn(
                                "p-4 rounded-lg flex items-start gap-3 border",
                                isDark
                                    ? "bg-red-500/10 border-red-500/20 text-red-400"
                                    : "bg-red-50 border-red-200 text-red-700"
                            )}>
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        <div className={cn("pt-4 flex items-center justify-between border-t", isDark ? "border-white/10" : "border-gray-200")}>
                            <div className={cn("text-sm flex items-center gap-2", isDark ? "text-gray-500" : "text-gray-600")}>
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                {t('systemOnline')}
                            </div>
                            <Button
                                onClick={handleGenerate}
                                disabled={!prompt || (!userId && !canUseTrial)}
                                size="lg"
                                className="w-full sm:w-auto shadow-lg shadow-primary/20"
                            >
                                {canUseTrial && !isLoggedIn ? tTrial('trialGeneration') : t('generateButton')}
                                <span className="ml-2 px-2 py-0.5 rounded bg-black/20 text-xs">
                                    {canUseTrial && !isLoggedIn ? tTrial('noCreditsNeeded') : `${creditCost} ${t('credits') || 'credits'}`}
                                </span>
                            </Button>
                        </div>
                    </GlassCard>

                    <div className={cn("flex items-center justify-center gap-2 text-sm", isDark ? "text-gray-500" : "text-gray-600")}>
                        <Settings2 className="w-4 h-4" /> {t('advancedSettings')}
                    </div>
                </div>

                {/* Right: Preview / Info */}
                <div className="lg:col-span-1">
                    <GlassCard className="p-8 text-center h-full flex flex-col items-center justify-center min-h-[300px] border-dashed">
                        <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-4", isDark ? "bg-white/5" : "bg-gray-100")}>
                            <Video className={cn("w-6 h-6", isDark ? "text-gray-600" : "text-gray-500")} />
                        </div>
                        <p className={cn("text-sm mb-4", isDark ? "text-gray-500" : "text-gray-600")}>{t('emptyState')}</p>
                        <div className={cn("text-xs space-y-1", isDark ? "text-gray-600" : "text-gray-500")}>
                            <p>~2-5 min generation time</p>
                            <p>8 second video clips</p>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
};
