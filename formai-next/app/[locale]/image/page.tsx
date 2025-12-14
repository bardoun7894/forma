"use client";

import React, { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Sidebar } from "@/components/Sidebar";
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { GlassCard } from '@/components/ui/GlassCard';
import { FreeTrialBanner, TrialExhaustedModal } from '@/components/ui/FreeTrialBanner';
import { useFreeTrial, FREE_TRIAL_CONFIG } from '@/hooks/useFreeTrial';
import { ModelType, CREDIT_COSTS } from '@/types';
import { generateImageUnified, getModelCreditCost, enhancePrompt } from '@/services/aiService';
import { Sparkles, Image as ImageIcon, Download, AlertCircle, Maximize2, Upload, X, Wand2, Layers } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { deductCredits as deductCreditsFirebase, saveImageGeneration } from '@/lib/database';

export default function ImagePage() {
    const { userData, refreshUserData } = useAuth();
    const params = useParams();
    const locale = (params?.locale as string) || 'en';
    const freeTrial = useFreeTrial();
    const isLoggedIn = !!userData?.uid;

    const handleGenerateComplete = async (url: string, prompt: string, model: string, creditsUsed: number) => {
        // Save to library (only for logged-in users)
        if (userData?.uid) {
            try {
                const now = new Date().toISOString();
                await saveImageGeneration({
                    userId: userData.uid,
                    prompt,
                    model,
                    imageUrl: url,
                    status: 'completed',
                    creditsUsed,
                    createdAt: now,
                    completedAt: now, // Required for notifications to trigger
                });
            } catch (error) {
                console.error('Failed to save image to library:', error);
            }
        }
    };

    const deductCredits = async (amount: number): Promise<boolean> => {
        if (!userData?.uid) return false;
        if (userData.credits < amount) return false;
        try {
            await deductCreditsFirebase(userData.uid, amount);
            await refreshUserData(); // Update UI
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
                <ImageGen
                    onGenerateComplete={handleGenerateComplete}
                    deductCredits={deductCredits}
                    locale={locale}
                    isLoggedIn={isLoggedIn}
                    freeTrial={freeTrial}
                />
            </main>
        </div>
    );
}

interface ImageGenProps {
    onGenerateComplete: (url: string, prompt: string, model: string, creditsUsed: number) => void;
    deductCredits: (amount: number) => Promise<boolean>;
    locale: string;
    isLoggedIn: boolean;
    freeTrial: ReturnType<typeof useFreeTrial>;
}

const STYLE_PRESETS = [
    { key: 'cyberpunk', prompt: 'Futuristic cyberpunk style, neon lights, high tech clothing, cybernetic enhancements, night city background' },
    { key: '3dCharacter', prompt: '3D animated movie character style, Pixar/Disney aesthetic, cute, expressive, soft lighting, 4k render' },
    { key: 'professionalHeadshot', prompt: 'High-end professional headshot, studio lighting, business attire, neutral blurred office background, 8k photography, realistic skin texture' },
    { key: 'anime', prompt: 'High quality japanese anime style, Studio Ghibli inspired, vibrant colors, detailed line work' },
    { key: 'oilPainting', prompt: 'Classic oil painting style, visible brushstrokes, textured canvas, dramatic lighting, renaissance aesthetic' },
    { key: 'pencilSketch', prompt: 'Detailed charcoal and pencil sketch on textured paper, artistic shading, monochrome' },
    { key: 'watercolor', prompt: 'Soft watercolor painting, bleeding colors, artistic splash, dreamy atmosphere, paper texture' },
    { key: 'vectorArt', prompt: 'Flat vector art illustration, clean lines, bold colors, minimal shading, corporate art style' },
];

// Image model options with hints
const IMAGE_MODELS = [
    { value: ModelType.NANO_BANANA, labelKey: 'modelNanoBanana', hintKey: 'hintNanoBanana' },
    { value: ModelType.NANO_BANANA_PRO, labelKey: 'modelNanoBananaPro', hintKey: 'hintNanoBananaPro' },
    { value: ModelType.GPT4O_IMAGE, labelKey: 'model4oImage', hintKey: 'hint4oImage' },
    { value: ModelType.FLUX_KONTEXT, labelKey: 'modelFluxKontext', hintKey: 'hintFluxKontext' },
    { value: ModelType.MIDJOURNEY, labelKey: 'modelMidjourney', hintKey: 'hintMidjourney' },
    { value: ModelType.DALLE3, labelKey: 'modelDalle3', hintKey: 'hintDalle3' },
];

const ImageGen: React.FC<ImageGenProps> = ({ onGenerateComplete, deductCredits, locale, isLoggedIn, freeTrial }) => {
    const t = useTranslations('image');
    const tTrial = useTranslations('freeTrial');
    const [mode, setMode] = useState<'text' | 'img2img'>('text');
    const [showExhaustedModal, setShowExhaustedModal] = useState(false);

    // Shared State
    const [prompt, setPrompt] = useState('');
    const [model, setModel] = useState<ModelType>(ModelType.NANO_BANANA);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);

    // Get current credit cost
    const creditCost = getModelCreditCost(model);
    const img2imgCreditCost = creditCost + 2; // Extra credits for image-to-image

    // Get current model hint
    const currentModelConfig = IMAGE_MODELS.find(m => m.value === model);

    // Free trial state
    const { canGenerateImage, imagesRemaining, useImageTrial, isLoading: isTrialLoading } = freeTrial;
    const canUseTrial = !isLoggedIn && canGenerateImage;

    const [isGenerating, setIsGenerating] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [isTrialGeneration, setIsTrialGeneration] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Handlers ---

    // AI Enhance prompt handler
    const handleEnhancePrompt = async () => {
        if (!prompt.trim() || isEnhancing) return;

        setIsEnhancing(true);
        setError(null);

        try {
            const enhanced = await enhancePrompt(prompt, 'image');
            setPrompt(enhanced);
        } catch (err: any) {
            console.error('Failed to enhance prompt:', err);
            setError(err.message || 'Failed to enhance prompt');
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleGenerate = async () => {
        setError(null);
        setResultUrl(null);

        if (!prompt.trim()) {
            setError(t('errorPromptRequired'));
            return;
        }

        // Check if this is a free trial generation or logged-in user generation
        const usingTrial = !isLoggedIn && canUseTrial;

        if (mode === 'text') {
            if (usingTrial) {
                // Use free trial
                const trialUsed = useImageTrial();
                if (!trialUsed) {
                    setShowExhaustedModal(true);
                    return;
                }
                setIsTrialGeneration(true);
            } else if (isLoggedIn) {
                // Deduct credits for logged-in user
                if (!(await deductCredits(creditCost))) {
                    setError(t('errorInsufficientCredits'));
                    return;
                }
                setIsTrialGeneration(false);
            } else {
                // Not logged in and no trial available
                setShowExhaustedModal(true);
                return;
            }

            setIsGenerating(true);
            try {
                // Use unified generator for all models
                const url = await generateImageUnified(prompt, model);
                setResultUrl(url);
                onGenerateComplete(url, prompt, model, usingTrial ? 0 : creditCost);
            } catch (err: any) {
                setError(err.message || t('errorFailedGenerate'));
            } finally {
                setIsGenerating(false);
            }
        } else {
            // Image to Image Mode - only for logged-in users (no free trial for img2img)
            if (!uploadedImage) {
                setError(t('errorUploadRequired'));
                return;
            }

            if (!isLoggedIn) {
                setShowExhaustedModal(true);
                return;
            }

            if (!(await deductCredits(img2imgCreditCost))) {
                setError(t('errorInsufficientCreditsImg2Img'));
                return;
            }
            setIsGenerating(true);
            try {
                // Use unified generator with input image
                const url = await generateImageUnified(prompt, model, '1:1', { inputImage: uploadedImage });
                setResultUrl(url);
                onGenerateComplete(url, prompt, model, img2imgCreditCost);
            } catch (err: any) {
                setError(err.message || t('errorFailedTransform'));
            } finally {
                setIsGenerating(false);
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    const processFile = (file: File) => {
        if (file.size > 5 * 1024 * 1024) {
            setError(t('errorFileSize'));
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            if (typeof e.target?.result === 'string') {
                setUploadedImage(e.target.result);
                setError(null);
            }
        };
        reader.readAsDataURL(file);
    };

    const applyPreset = (presetPrompt: string) => {
        setPrompt(prev => {
            const separator = prev.trim() ? ', ' : '';
            return prev + separator + presetPrompt;
        });
    };

    // Get translated style name
    const getStyleName = (key: string) => {
        switch (key) {
            case 'cyberpunk': return t('styleCyberpunk');
            case '3dCharacter': return t('style3DCharacter');
            case 'professionalHeadshot': return t('styleProfessionalHeadshot');
            case 'anime': return t('styleAnime');
            case 'oilPainting': return t('styleOilPainting');
            case 'pencilSketch': return t('stylePencilSketch');
            case 'watercolor': return t('styleWatercolor');
            case 'vectorArt': return t('styleVectorArt');
            default: return key;
        }
    };

    return (
        <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500">
            {/* Trial Exhausted Modal */}
            <TrialExhaustedModal
                locale={locale}
                type="image"
                isOpen={showExhaustedModal}
                onClose={() => setShowExhaustedModal(false)}
            />

            {/* Input Panel */}
            <div className="lg:w-1/3 flex flex-col gap-4">
                {/* Free Trial Banner - show for non-logged-in users */}
                {!isLoggedIn && !isTrialLoading && (
                    <FreeTrialBanner
                        locale={locale}
                        type="image"
                        remaining={imagesRemaining}
                        total={FREE_TRIAL_CONFIG.maxImages}
                        isLoggedIn={isLoggedIn}
                    />
                )}

                <div>
                    <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
                        <ImageIcon className="w-6 h-6 text-primary" /> {t('title')}
                    </h1>
                    <p className="text-gray-400 text-sm">{t('subtitle')}</p>
                </div>

                {/* Mode Switcher */}
                <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                    <button
                        onClick={() => setMode('text')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${mode === 'text' ? 'bg-primary text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Wand2 className="w-4 h-4" /> {t('modeText')}
                    </button>
                    <button
                        onClick={() => setMode('img2img')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${mode === 'img2img' ? 'bg-primary text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Layers className="w-4 h-4" /> {t('modeImg2Img')}
                    </button>
                </div>

                <GlassCard className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">

                    {mode === 'img2img' && (
                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                            <label className="block text-sm font-medium text-gray-400">{t('referenceImageLabel')}</label>
                            <div
                                className={`relative w-full aspect-[3/2] rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden group ${uploadedImage ? 'border-primary/50 bg-black/40' : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                                    }`}
                                onClick={() => !uploadedImage && fileInputRef.current?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                            >
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

                                {uploadedImage ? (
                                    <>
                                        <img src={uploadedImage} className="w-full h-full object-contain p-2" alt="Uploaded" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); setUploadedImage(null); }}>
                                                <X className="w-4 h-4 mr-2" /> {t('removeButton')}
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-4">
                                        <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                                        <p className="text-xs text-gray-500">{t('dropImageText')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-gray-400">
                                {mode === 'text' ? t('promptLabel') : t('transformationPromptLabel')}
                            </label>
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
                            placeholder={mode === 'text' ? t('promptPlaceholderText') : t('promptPlaceholderImg2Img')}
                            rows={mode === 'text' ? 5 : 4}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>

                    {/* Presets (Available in both modes, but contextually useful) */}
                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">{t('quickStylesLabel')}</label>
                        <div className="flex flex-wrap gap-2">
                            {STYLE_PRESETS.map((style) => (
                                <button
                                    key={style.key}
                                    onClick={() => applyPreset(style.prompt)}
                                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
                                >
                                    + {getStyleName(style.key)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Select
                            label={t('modelQualityLabel')}
                            value={model}
                            onChange={(e) => setModel(e.target.value as ModelType)}
                            options={IMAGE_MODELS.map(m => ({
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

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}

                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || (mode === 'img2img' && !uploadedImage) || (mode === 'img2img' && !isLoggedIn)}
                        isLoading={isGenerating}
                        size="lg"
                        className="mt-auto w-full shadow-lg shadow-primary/20"
                    >
                        {mode === 'text' && canUseTrial && !isLoggedIn
                            ? tTrial('trialGeneration')
                            : (mode === 'text' ? t('generateButtonText') : t('transformButtonText'))}
                        <span className="ml-2 opacity-60 text-xs border border-black/20 px-1.5 rounded">
                            {mode === 'text' && canUseTrial && !isLoggedIn
                                ? tTrial('noCreditsNeeded')
                                : `${mode === 'text' ? creditCost : img2imgCreditCost} ${t('credits') || 'credits'}`}
                        </span>
                    </Button>
                </GlassCard>
            </div>

            {/* Output Panel */}
            <div className="lg:w-2/3">
                <GlassCard className="h-full relative overflow-hidden flex items-center justify-center bg-black/20 p-4 lg:p-0 border-primary/10">
                    {isGenerating ? (
                        <div className="text-center">
                            <div className="relative w-16 h-16 mx-auto mb-6">
                                <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
                                <div className="absolute inset-2 rounded-full border-r-2 border-purple-500 animate-spin animation-delay-200" />
                                <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-white animate-pulse" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{t('loadingTitle')}</h3>
                            <p className="text-gray-400 animate-pulse text-sm">
                                {mode === 'text' ? t('loadingDescriptionText') : t('loadingDescriptionImg2Img')}
                            </p>
                        </div>
                    ) : resultUrl ? (
                        <div className="relative w-full h-full group">
                            <img src={resultUrl} alt="Result" className="w-full h-full object-contain" />
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                                <div className="flex items-center justify-between">
                                    <p className="text-white/80 text-sm line-clamp-1 max-w-[70%]">
                                        {prompt}
                                    </p>
                                    <div className="flex gap-2">
                                        <a href={resultUrl} download={`forma-${mode}-${Date.now()}.png`}>
                                            <Button size="sm" variant="secondary"><Download className="w-4 h-4" /></Button>
                                        </a>
                                        <Button size="sm" variant="primary"><Maximize2 className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-600">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
                                {mode === 'text' ? <ImageIcon className="w-8 h-8 opacity-30" /> : <Layers className="w-8 h-8 opacity-30" />}
                            </div>
                            <p className="text-lg font-medium text-gray-500">{t('emptyStateTitle')}</p>
                            <p className="text-sm max-w-xs mx-auto mt-2 opacity-60">
                                {mode === 'text' ? t('emptyStateDescriptionText') : t('emptyStateDescriptionImg2Img')}
                            </p>
                        </div>
                    )}
                </GlassCard>
            </div>
        </div>
    );
};