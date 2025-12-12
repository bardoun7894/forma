"use client";

import React, { useState, useRef } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { GlassCard } from '@/components/ui/GlassCard';
import { generateAvatarPortrait, generateTalkingAvatarFromText, enhancePrompt } from '@/services/aiService';
import { ModelType, CREDIT_COSTS } from '@/types';
import { Sparkles, User, Upload, Image as ImageIcon, Download, AlertCircle, RefreshCw, X, Video, Mic, Wand2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { deductCredits as deductCreditsFirebase, saveAvatarGeneration } from '@/lib/database';

const STYLES = [
    { id: 'cyberpunk', nameKey: 'styleCyberpunk', prompt: 'Futuristic cyberpunk style, neon lights, high tech clothing, cybernetic enhancements, night city background' },
    { id: 'pixar', nameKey: 'style3DCharacter', prompt: '3D animated movie character style, Pixar/Disney aesthetic, cute, expressive, soft lighting, 4k render' },
    { id: 'oil', nameKey: 'styleOilPainting', prompt: 'Classic oil painting style, visible brushstrokes, textured canvas, dramatic lighting, renaissance aesthetic' },
    { id: 'gta', nameKey: 'styleGTAStyle', prompt: 'Grand Theft Auto game loading screen art style, cel-shaded, high contrast, vibrant colors, vector illustration' },
    { id: 'professional', nameKey: 'styleProfessional', prompt: 'High-end LinkedIn headshot, studio lighting, business attire, neutral blurred office background, 8k photography' },
    { id: 'anime', nameKey: 'styleAnime', prompt: 'High quality japanese anime style, Studio Ghibli inspired, vibrant colors, detailed line work' },
    { id: 'viking', nameKey: 'styleViking', prompt: 'Rugged viking warrior, fur armor, war paint, cinematic northern landscape background, dramatic lighting' },
    { id: 'sketch', nameKey: 'stylePencilSketch', prompt: 'Detailed charcoal and pencil sketch on textured paper, artistic shading, monochrome' },
];

export default function AvatarPage() {
    const { userData, refreshUserData } = useAuth();
    const t = useTranslations('avatar');
    const [mode, setMode] = useState<'image' | 'video'>('image');

    const handleGenerateComplete = async (url: string, prompt: string, type: 'image' | 'video', creditsUsed: number) => {
        // Save to library
        if (userData?.uid) {
            try {
                await saveAvatarGeneration({
                    userId: userData.uid,
                    prompt,
                    avatarUrl: url,
                    type, // 'image' for portraits, 'video' for talking avatars
                    status: 'completed',
                    creditsUsed,
                    createdAt: new Date().toISOString(),
                });
            } catch (error) {
                console.error('Failed to save avatar to library:', error);
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
                <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                            <User className="w-8 h-8 text-primary" /> {t('title')}
                        </h1>
                        <p className="text-gray-400">{t('subtitle')}</p>
                    </div>

                    {/* Mode Tabs */}
                    <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 max-w-md">
                        <button
                            onClick={() => setMode('image')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${mode === 'image' ? 'bg-primary text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            <ImageIcon className="w-4 h-4" /> {t('modeImage') || 'Image Avatar'}
                        </button>
                        <button
                            onClick={() => setMode('video')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${mode === 'video' ? 'bg-primary text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Video className="w-4 h-4" /> {t('modeVideo') || 'Talking Avatar'}
                        </button>
                    </div>

                    {/* Content based on mode */}
                    {mode === 'image' ? (
                        <AvatarImageGen onGenerateComplete={(url, prompt, credits) => handleGenerateComplete(url, prompt, 'image', credits)} deductCredits={deductCredits} />
                    ) : (
                        <AvatarVideoGen onGenerateComplete={(url, prompt, credits) => handleGenerateComplete(url, prompt, 'video', credits)} deductCredits={deductCredits} />
                    )}
                </div>
            </main>
        </div>
    );
}

interface AvatarGenProps {
    onGenerateComplete: (url: string, prompt: string, creditsUsed: number) => void;
    deductCredits: (amount: number) => Promise<boolean>;
}

// Image Avatar Component
const AvatarImageGen: React.FC<AvatarGenProps> = ({ onGenerateComplete, deductCredits }) => {
    const t = useTranslations('avatar');
    const [selectedStyleId, setSelectedStyleId] = useState<string>(STYLES[1].id);
    const [customStyle, setCustomStyle] = useState('');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeStyle = STYLES.find(s => s.id === selectedStyleId);

    // AI Enhance custom style handler
    const handleEnhanceStyle = async () => {
        if (!customStyle.trim() || isEnhancing) return;

        setIsEnhancing(true);
        setError(null);

        try {
            const enhanced = await enhancePrompt(customStyle, 'avatar');
            setCustomStyle(enhanced);
        } catch (err: any) {
            console.error('Failed to enhance style:', err);
            setError(err.message || 'Failed to enhance style');
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError(t('errorFileSize'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            if (typeof event.target?.result === 'string') {
                setUploadedImage(event.target.result);
                setError(null);
                setResultUrl(null);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (typeof event.target?.result === 'string') {
                    setUploadedImage(event.target.result);
                    setError(null);
                    setResultUrl(null);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!uploadedImage) {
            setError(t('errorUploadRequired'));
            return;
        }

        const stylePrompt = selectedStyleId === 'custom' ? customStyle : activeStyle?.prompt;
        if (!stylePrompt) {
            setError(t('errorStyleRequired'));
            return;
        }

        if (!(await deductCredits(5))) {
            setError(t('errorInsufficientCredits'));
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const url = await generateAvatarPortrait(uploadedImage, stylePrompt);
            setResultUrl(url);

            const fullPrompt = `AI Portrait: ${selectedStyleId === 'custom' ? customStyle : activeStyle?.nameKey}`;
            onGenerateComplete(url, fullPrompt, 5); // 5 credits for image avatar
        } catch (err: any) {
            console.error(err);
            setError(err.message || t('errorFailed'));
        } finally {
            setIsGenerating(false);
        }
    };

    const clearImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setUploadedImage(null);
        setResultUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="grid lg:grid-cols-2 gap-8 h-full pb-10">

                {/* LEFT: Upload & Config */}
                <div className="space-y-6">

                    {/* 1. Upload Section */}
                    <GlassCard className="p-6">
                        <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">{t('uploadSectionTitle')}</h3>

                        <div
                            className={`relative w-full aspect-[4/3] rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden group ${uploadedImage ? 'border-primary/50 bg-black/40' : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                                }`}
                            onClick={() => !uploadedImage && fileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />

                            {uploadedImage ? (
                                <>
                                    <img src={uploadedImage} className="w-full h-full object-contain" alt="Uploaded" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button variant="secondary" onClick={clearImage}>
                                            <X className="w-4 h-4 mr-2" /> {t('removeImage')}
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-6">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-gray-400 group-hover:text-white transition-colors">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <p className="font-medium text-white mb-1">{t('clickOrDrag')}</p>
                                    <p className="text-xs text-gray-500">{t('supportedFormats')}</p>
                                </div>
                            )}
                        </div>
                    </GlassCard>

                    {/* 2. Style Section */}
                    <GlassCard className="p-6">
                        <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">{t('styleSectionTitle')}</h3>

                        <div className="grid grid-cols-4 gap-3 mb-4">
                            {STYLES.map((style) => (
                                <button
                                    key={style.id}
                                    onClick={() => setSelectedStyleId(style.id)}
                                    className={`px-2 py-3 rounded-lg text-xs font-medium transition-all ${selectedStyleId === style.id
                                        ? 'bg-primary text-black shadow-[0_0_15px_-3px_rgba(0,196,204,0.4)]'
                                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    {t(style.nameKey)}
                                </button>
                            ))}
                            <button
                                onClick={() => setSelectedStyleId('custom')}
                                className={`px-2 py-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${selectedStyleId === 'custom'
                                    ? 'bg-primary text-black shadow-glow'
                                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                <Sparkles className="w-3 h-3" /> {t('styleCustom')}
                            </button>
                        </div>

                        {selectedStyleId === 'custom' && (
                            <div className="animate-in slide-in-from-top-2 space-y-2">
                                <div className="flex items-center justify-end">
                                    <button
                                        onClick={handleEnhanceStyle}
                                        disabled={!customStyle.trim() || isEnhancing}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-purple-500/20 to-primary/20 border border-purple-500/30 text-purple-300 hover:from-purple-500/30 hover:to-primary/30 hover:text-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        title={t('enhancePromptTooltip') || 'Enhance with AI'}
                                    >
                                        <Wand2 className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin' : ''}`} />
                                        {isEnhancing ? (t('enhancing') || 'Enhancing...') : (t('enhancePrompt') || 'AI Enhance')}
                                    </button>
                                </div>
                                <TextArea
                                    placeholder={t('customPlaceholder')}
                                    value={customStyle}
                                    onChange={(e) => setCustomStyle(e.target.value)}
                                    rows={3}
                                    className="text-sm"
                                />
                            </div>
                        )}

                        {error && (
                            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                {error}
                            </div>
                        )}

                        <Button
                            size="lg"
                            className="w-full mt-6 shadow-xl shadow-primary/10"
                            onClick={handleGenerate}
                            disabled={!uploadedImage || isGenerating || (selectedStyleId === 'custom' && !customStyle)}
                            isLoading={isGenerating}
                        >
                            {isGenerating ? t('buttonTransforming') : t('buttonGenerate')}
                            {!isGenerating && <span className="ml-2 text-[10px] bg-black/20 px-1.5 py-0.5 rounded border border-black/10">{t('creditsCost')}</span>}
                        </Button>
                    </GlassCard>

                </div>

                {/* RIGHT: Result Preview */}
                <div className="h-full">
                    <GlassCard className="h-full min-h-[500px] flex flex-col p-0 overflow-hidden relative border-primary/20">
                        <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-medium text-white border border-white/10">
                            {resultUrl ? t('previewGenerated') : t('previewArea')}
                        </div>

                        {isGenerating ? (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-8 text-center">
                                <div className="relative w-20 h-20 mb-6">
                                    <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin" />
                                    <div className="absolute inset-3 border-r-2 border-purple-500 rounded-full animate-spin animation-delay-500" />
                                    <Sparkles className="absolute inset-0 m-auto text-primary w-6 h-6 animate-pulse" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{t('loadingTitle')}</h3>
                                <p className="text-gray-400 text-sm max-w-xs">{t('loadingDescription')}</p>
                            </div>
                        ) : resultUrl ? (
                            <div className="relative w-full h-full group bg-black">
                                <img
                                    src={resultUrl}
                                    className="w-full h-full object-contain"
                                    alt="Result"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                                    <div className="flex gap-3">
                                        <a href={resultUrl} download="forma-portrait.png" className="flex-1">
                                            <Button variant="primary" className="w-full shadow-lg">
                                                <Download className="w-4 h-4 mr-2" /> {t('downloadButton')}
                                            </Button>
                                        </a>
                                        <Button variant="secondary" onClick={() => setResultUrl(null)}>
                                            <RefreshCw className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 p-8 bg-black/20">
                                <div className="w-24 h-24 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mb-6">
                                    <ImageIcon className="w-10 h-10 opacity-30" />
                                </div>
                                <p className="text-lg font-medium text-gray-500">{t('emptyTitle')}</p>
                                <p className="text-sm text-gray-600 mt-2 max-w-xs text-center">{t('emptyDescription')}</p>
                            </div>
                        )}
                    </GlassCard>
                </div>
        </div>
    );
};

// Voice options for ElevenLabs TTS
const VOICE_OPTIONS = [
    { id: 'Rachel', nameKey: 'voiceRachel', gender: 'female' },
    { id: 'Aria', nameKey: 'voiceAria', gender: 'female' },
    { id: 'Sarah', nameKey: 'voiceSarah', gender: 'female' },
    { id: 'Laura', nameKey: 'voiceLaura', gender: 'female' },
    { id: 'Charlotte', nameKey: 'voiceCharlotte', gender: 'female' },
    { id: 'Alice', nameKey: 'voiceAlice', gender: 'female' },
    { id: 'Roger', nameKey: 'voiceRoger', gender: 'male' },
    { id: 'Charlie', nameKey: 'voiceCharlie', gender: 'male' },
    { id: 'George', nameKey: 'voiceGeorge', gender: 'male' },
    { id: 'Liam', nameKey: 'voiceLiam', gender: 'male' },
    { id: 'Daniel', nameKey: 'voiceDaniel', gender: 'male' },
    { id: 'Brian', nameKey: 'voiceBrian', gender: 'male' },
] as const;

type VoiceId = typeof VOICE_OPTIONS[number]['id'];

// Video Avatar Component (Talking Heads)
const AvatarVideoGen: React.FC<AvatarGenProps> = ({ onGenerateComplete, deductCredits }) => {
    const t = useTranslations('avatar');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [speechText, setSpeechText] = useState('');
    const [selectedVoice, setSelectedVoice] = useState<VoiceId>('Rachel');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStep, setGenerationStep] = useState<string>('');
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const creditCost = CREDIT_COSTS[ModelType.KLING_AVATAR];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError(t('errorFileSize'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            if (typeof event.target?.result === 'string') {
                setUploadedImage(event.target.result);
                setError(null);
                setResultUrl(null);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (typeof event.target?.result === 'string') {
                    setUploadedImage(event.target.result);
                    setError(null);
                    setResultUrl(null);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!uploadedImage) {
            setError(t('errorUploadRequired'));
            return;
        }

        if (!speechText.trim()) {
            setError(t('errorTextRequired') || 'Please enter text for the avatar to speak');
            return;
        }

        if (!(await deductCredits(creditCost))) {
            setError(t('errorInsufficientCredits'));
            return;
        }

        setIsGenerating(true);
        setError(null);
        setGenerationStep(t('stepUploadingImage') || 'Uploading image...');

        try {
            // Use the new unified function that handles:
            // 1. Image upload to get URL
            // 2. Text-to-speech conversion
            // 3. Kling Avatar video generation
            setGenerationStep(t('stepGeneratingAudio') || 'Generating speech audio...');

            const url = await generateTalkingAvatarFromText(
                uploadedImage,
                speechText,
                selectedVoice,
                'kling/v1-avatar-standard'
            );

            setResultUrl(url);
            onGenerateComplete(url, `Talking Avatar: ${speechText.substring(0, 50)}...`, creditCost);
        } catch (err: any) {
            console.error(err);
            setError(err.message || t('errorFailed'));
        } finally {
            setIsGenerating(false);
            setGenerationStep('');
        }
    };

    const clearImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setUploadedImage(null);
        setResultUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="grid lg:grid-cols-2 gap-8 h-full pb-10">
            {/* LEFT: Upload & Config */}
            <div className="space-y-6">
                {/* Upload Section */}
                <GlassCard className="p-6">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">{t('uploadSectionTitle')}</h3>

                    <div
                        className={`relative w-full aspect-[4/3] rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden group ${uploadedImage ? 'border-primary/50 bg-black/40' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}
                        onClick={() => !uploadedImage && fileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />

                        {uploadedImage ? (
                            <>
                                <img src={uploadedImage} className="w-full h-full object-contain" alt="Uploaded" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button variant="secondary" onClick={clearImage}>
                                        <X className="w-4 h-4 mr-2" /> {t('removeImage')}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center p-6">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-gray-400 group-hover:text-white transition-colors">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <p className="font-medium text-white mb-1">{t('clickOrDrag')}</p>
                                <p className="text-xs text-gray-500">{t('videoPortraitTip') || 'Upload a clear portrait photo'}</p>
                            </div>
                        )}
                    </div>
                </GlassCard>

                {/* Speech Text Section */}
                <GlassCard className="p-6">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider flex items-center gap-2">
                        <Mic className="w-4 h-4" /> {t('speechSectionTitle') || 'What should they say?'}
                    </h3>

                    <TextArea
                        placeholder={t('speechPlaceholder') || 'Enter the text you want the avatar to speak...'}
                        value={speechText}
                        onChange={(e) => setSpeechText(e.target.value)}
                        rows={4}
                        className="text-sm"
                    />

                    {/* Voice Selection */}
                    <div className="mt-4">
                        <label className="text-xs text-gray-400 mb-2 block">{t('voiceLabel') || 'Select Voice'}</label>
                        <div className="grid grid-cols-4 gap-2">
                            {VOICE_OPTIONS.map((voice) => (
                                <button
                                    key={voice.id}
                                    onClick={() => setSelectedVoice(voice.id)}
                                    className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                                        selectedVoice === voice.id
                                            ? 'bg-primary text-black shadow-[0_0_10px_-3px_rgba(0,196,204,0.4)]'
                                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    <span className="block">{voice.id}</span>
                                    <span className={`text-[10px] ${selectedVoice === voice.id ? 'text-black/60' : 'text-gray-500'}`}>
                                        {voice.gender === 'female' ? '♀' : '♂'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-3">
                        {t('speechTip') || 'The AI will animate the portrait to speak this text naturally.'}
                    </p>

                    {error && (
                        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}

                    <Button
                        size="lg"
                        className="w-full mt-6 shadow-xl shadow-primary/10"
                        onClick={handleGenerate}
                        disabled={!uploadedImage || !speechText.trim() || isGenerating}
                        isLoading={isGenerating}
                    >
                        {isGenerating ? (t('buttonGeneratingVideo') || 'Generating Video...') : (t('buttonGenerateVideo') || 'Generate Talking Avatar')}
                        {!isGenerating && <span className="ml-2 text-[10px] bg-black/20 px-1.5 py-0.5 rounded border border-black/10">{creditCost} {t('credits') || 'credits'}</span>}
                    </Button>
                </GlassCard>
            </div>

            {/* RIGHT: Result Preview */}
            <div className="h-full">
                <GlassCard className="h-full min-h-[500px] flex flex-col p-0 overflow-hidden relative border-primary/20">
                    <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-medium text-white border border-white/10 flex items-center gap-2">
                        <Video className="w-3 h-3" />
                        {resultUrl ? (t('previewGeneratedVideo') || 'Generated Video') : (t('previewAreaVideo') || 'Video Preview')}
                    </div>

                    {isGenerating ? (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-8 text-center">
                            <div className="relative w-20 h-20 mb-6">
                                <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin" />
                                <div className="absolute inset-3 border-r-2 border-purple-500 rounded-full animate-spin animation-delay-500" />
                                <Video className="absolute inset-0 m-auto text-primary w-6 h-6 animate-pulse" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{t('loadingTitleVideo') || 'Creating Your Talking Avatar'}</h3>
                            <p className="text-gray-400 text-sm max-w-xs mb-2">{t('loadingDescriptionVideo') || 'This may take 2-3 minutes...'}</p>
                            {generationStep && (
                                <p className="text-primary text-xs font-medium">{generationStep}</p>
                            )}
                        </div>
                    ) : resultUrl ? (
                        <div className="relative w-full h-full group bg-black">
                            <video
                                src={resultUrl}
                                className="w-full h-full object-contain"
                                controls
                                autoPlay
                                loop
                            />
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex gap-3">
                                    <a href={resultUrl} download="forma-talking-avatar.mp4" className="flex-1">
                                        <Button variant="primary" className="w-full shadow-lg">
                                            <Download className="w-4 h-4 mr-2" /> {t('downloadButton')}
                                        </Button>
                                    </a>
                                    <Button variant="secondary" onClick={() => setResultUrl(null)}>
                                        <RefreshCw className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-600 p-8 bg-black/20">
                            <div className="w-24 h-24 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mb-6">
                                <Video className="w-10 h-10 opacity-30" />
                            </div>
                            <p className="text-lg font-medium text-gray-500">{t('emptyTitleVideo') || 'Video Preview'}</p>
                            <p className="text-sm text-gray-600 mt-2 max-w-xs text-center">{t('emptyDescriptionVideo') || 'Upload a portrait and enter text to generate a talking avatar video'}</p>
                        </div>
                    )}
                </GlassCard>
            </div>
        </div>
    );
};