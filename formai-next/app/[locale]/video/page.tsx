"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { GlassCard } from '@/components/ui/GlassCard';
import { VideoGenerationProgress } from '@/components/VideoGenerationProgress';
import { ModelType, CREDIT_COSTS } from '@/types';
import { pollVideoStatus, AIServiceError, generateVideoUnified, getModelCreditCost, enhancePrompt } from '@/services/aiService';
import { Sparkles, Video, Settings2, Download, AlertCircle, RefreshCw, Wand2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { deductCredits as deductCreditsFirebase, getPendingVideos, saveVideoGeneration, updateVideoGeneration, type VideoGeneration } from '@/lib/database';

type GenerationStatus = 'idle' | 'starting' | 'processing' | 'completed' | 'failed';

export default function VideoPage() {
    const { userData, refreshUserData } = useAuth();

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
        <div className="min-h-screen flex bg-page">
            <Sidebar />

            <main className="flex-1 lg:ml-72 rtl:lg:ml-0 rtl:lg:mr-72 min-h-screen p-4 lg:p-8">
                <VideoGen
                    onGenerateComplete={handleGenerateComplete}
                    deductCredits={deductCredits}
                    userId={userData?.uid}
                />
            </main>
        </div>
    );
}

interface VideoGenProps {
    onGenerateComplete: (url: string, prompt: string, type: 'video') => void;
    deductCredits: (amount: number) => Promise<boolean>;
    userId?: string;
}

// Video model options with hints
const VIDEO_MODELS = [
    { value: ModelType.VEO_FAST, labelKey: 'modelVeoFast', hintKey: 'hintVeoFast' },
    { value: ModelType.VEO_HD, labelKey: 'modelVeoHD', hintKey: 'hintVeoHD' },
    { value: ModelType.SORA_TEXT, labelKey: 'modelSora2', hintKey: 'hintSora2' },
    { value: ModelType.SORA_PRO_720, labelKey: 'modelSoraPro720', hintKey: 'hintSoraPro720' },
    { value: ModelType.SORA_PRO_1080, labelKey: 'modelSoraPro1080', hintKey: 'hintSoraPro1080' },
    { value: ModelType.RUNWAY_GEN3, labelKey: 'modelRunway', hintKey: 'hintRunway' },
    { value: ModelType.KLING_2_6, labelKey: 'modelKling', hintKey: 'hintKling' },
    { value: ModelType.HAILUO_2_3, labelKey: 'modelHailuo', hintKey: 'hintHailuo' },
];

const VideoGen: React.FC<VideoGenProps> = ({ onGenerateComplete, deductCredits, userId }) => {
    const t = useTranslations('video');
    const [prompt, setPrompt] = useState('');
    const [model, setModel] = useState<ModelType>(ModelType.VEO_FAST);
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');

    // Get current credit cost
    const creditCost = getModelCreditCost(model);

    // Get current model hint
    const currentModelConfig = VIDEO_MODELS.find(m => m.value === model);

    // Generation state
    const [status, setStatus] = useState<GenerationStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentPrompt, setCurrentPrompt] = useState<string>('');
    const [isEnhancing, setIsEnhancing] = useState(false);

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
        if (!prompt.trim() || !userId) return;

        // Debug: Log selected model
        console.log('Generating video with model:', model, 'Credit cost:', creditCost);

        const success = await deductCredits(creditCost);
        if (!success) {
            setError(t('errorInsufficientCredits'));
            return;
        }

        setStatus('starting');
        setError(null);
        setResultUrl(null);
        setProgress(0);
        setCurrentPrompt(prompt);

        // Create a Firebase record to track the generation
        let docId: string | null = null;

        try {
            // Save to Firebase with processing status (for all models)
            docId = await saveVideoGeneration({
                userId,
                prompt,
                videoUrl: '',
                status: 'processing',
                model: model, // Uses the actual ModelType value (e.g., 'sora-2-text-to-video')
                aspectRatio,
                duration: 8,
                creditsUsed: creditCost,
                createdAt: new Date().toISOString(),
            });

            setStatus('processing');
            setProgress(10);

            // Use unified generator for ALL models
            const videoUrl = await generateVideoUnified(prompt, model, aspectRatio);

            // Update Firebase with completed status
            await updateVideoGeneration(docId, {
                videoUrl,
                status: 'completed',
                completedAt: new Date().toISOString(),
            });

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
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t('title')}</h1>
                        <p className="text-gray-400">{t('subtitle')}</p>
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
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm text-center">
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t('title')}</h1>
                    <p className="text-gray-400">{t('subtitle')}</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left: Controls */}
                <div className="lg:col-span-2 space-y-6">
                    <GlassCard className="p-6 space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-300">{t('promptLabel')}</label>
                                <button
                                    onClick={handleEnhancePrompt}
                                    disabled={!prompt.trim() || isEnhancing}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-purple-500/20 to-primary/20 border border-purple-500/30 text-purple-300 hover:from-purple-500/30 hover:to-primary/30 hover:text-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                                <Select
                                    label={t('modelLabel')}
                                    value={model}
                                    onChange={(e) => {
                                        const newModel = e.target.value as ModelType;
                                        console.log('Model changed to:', newModel);
                                        setModel(newModel);
                                    }}
                                    options={VIDEO_MODELS.map(m => ({
                                        label: `${t(m.labelKey)} (${CREDIT_COSTS[m.value]} ${t('credits') || 'credits'})`,
                                        value: m.value,
                                    }))}
                                />
                                {currentModelConfig && (
                                    <p className="text-xs text-primary/80 px-1">
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
                            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        <div className="pt-4 flex items-center justify-between border-t border-white/10">
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                {t('systemOnline')}
                            </div>
                            <Button
                                onClick={handleGenerate}
                                disabled={!prompt || !userId}
                                size="lg"
                                className="w-full sm:w-auto shadow-lg shadow-primary/20"
                            >
                                {t('generateButton')}
                                <span className="ml-2 px-2 py-0.5 rounded bg-black/20 text-xs">
                                    {creditCost} {t('credits') || 'credits'}
                                </span>
                            </Button>
                        </div>
                    </GlassCard>

                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <Settings2 className="w-4 h-4" /> {t('advancedSettings')}
                    </div>
                </div>

                {/* Right: Preview / Info */}
                <div className="lg:col-span-1">
                    <GlassCard className="p-8 text-center h-full flex flex-col items-center justify-center min-h-[300px] border-dashed">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <Video className="w-6 h-6 text-gray-600" />
                        </div>
                        <p className="text-gray-500 text-sm mb-4">{t('emptyState')}</p>
                        <div className="text-xs text-gray-600 space-y-1">
                            <p>~2-5 min generation time</p>
                            <p>8 second video clips</p>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
};
