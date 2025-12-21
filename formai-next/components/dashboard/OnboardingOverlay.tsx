'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IconSparkles,
    IconVideo,
    IconFolder,
    IconCreditCard,
    IconArrowRight,
    IconX,
    IconCheck,
} from '@tabler/icons-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    icon: typeof IconSparkles;
    color: string;
}

interface OnboardingOverlayProps {
    isNewUser: boolean;
    onComplete: () => void;
    locale: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
    {
        id: 'welcome',
        title: 'Welcome to FormAI!',
        description: 'Create stunning AI-powered videos, images, and avatars in seconds. Let\'s show you around.',
        icon: IconSparkles,
        color: 'from-primary to-cyan-400',
    },
    {
        id: 'create',
        title: 'Create Content',
        description: 'Use Quick Actions to generate videos, images, avatars, or start an AI chat. Just describe what you want!',
        icon: IconVideo,
        color: 'from-cyan-500 to-blue-500',
    },
    {
        id: 'library',
        title: 'Your Library',
        description: 'All your generated content is saved in your library. Access it anytime from the sidebar or Recent Activity.',
        icon: IconFolder,
        color: 'from-purple-500 to-pink-500',
    },
    {
        id: 'credits',
        title: 'Credits System',
        description: 'Each generation uses credits. You start with 10 free credits. Need more? Visit the Credits page.',
        icon: IconCreditCard,
        color: 'from-green-500 to-emerald-500',
    },
];

export function OnboardingOverlay({ isNewUser, onComplete, locale }: OnboardingOverlayProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    useEffect(() => {
        // Check localStorage to see if user has completed onboarding
        const seen = localStorage.getItem('formAI_onboarding_complete');
        setHasSeenOnboarding(!!seen);

        // Show onboarding for new users who haven't seen it
        if (isNewUser && !seen) {
            // Delay to let the dashboard load first
            const timer = setTimeout(() => setIsOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [isNewUser]);

    const handleNext = () => {
        if (currentStep < ONBOARDING_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    const handleComplete = () => {
        setIsOpen(false);
        localStorage.setItem('formAI_onboarding_complete', 'true');
        onComplete();
    };

    // Don't render if user has already seen onboarding
    if (hasSeenOnboarding && !isOpen) return null;

    const currentStepData = ONBOARDING_STEPS[currentStep];
    const Icon = currentStepData.icon;
    const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn("fixed inset-0 backdrop-blur-sm z-50", isDark ? "bg-black/80" : "bg-black/60")}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-50 p-4"
                    >
                        <div className={cn(
                            "backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border",
                            isDark ? "bg-gray-900/95 border-white/10" : "bg-white border-gray-200"
                        )}>
                            {/* Close button */}
                            <button
                                onClick={handleSkip}
                                className={cn(
                                    "absolute top-4 right-4 p-2 rounded-full transition-colors",
                                    isDark ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                                )}
                            >
                                <IconX className="w-5 h-5" />
                            </button>

                            {/* Progress dots */}
                            <div className="flex items-center justify-center gap-2 pt-6">
                                {ONBOARDING_STEPS.map((_, index) => (
                                    <motion.div
                                        key={index}
                                        className={cn(
                                            "h-1.5 rounded-full transition-all duration-300",
                                            index === currentStep
                                                ? 'w-8 bg-primary'
                                                : index < currentStep
                                                ? 'w-4 bg-primary/50'
                                                : isDark ? 'w-4 bg-white/20' : 'w-4 bg-gray-200'
                                        )}
                                    />
                                ))}
                            </div>

                            {/* Content */}
                            <div className="p-8">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentStep}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="text-center"
                                    >
                                        {/* Icon */}
                                        <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${currentStepData.color} flex items-center justify-center shadow-lg`}>
                                            <Icon className="w-10 h-10 text-white" />
                                        </div>

                                        {/* Title */}
                                        <h2 className={cn("text-2xl font-bold mb-3", isDark ? "text-white" : "text-gray-900")}>
                                            {currentStepData.title}
                                        </h2>

                                        {/* Description */}
                                        <p className={cn("leading-relaxed", isDark ? "text-gray-400" : "text-gray-600")}>
                                            {currentStepData.description}
                                        </p>
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Actions */}
                            <div className={cn(
                                "flex items-center justify-between p-6 border-t",
                                isDark ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
                            )}>
                                <button
                                    onClick={handleSkip}
                                    className={cn("text-sm transition-colors", isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-700")}
                                >
                                    Skip tour
                                </button>

                                <button
                                    onClick={handleNext}
                                    className={cn(
                                        "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all",
                                        isLastStep
                                            ? 'bg-gradient-to-r from-primary to-cyan-400 text-black hover:opacity-90'
                                            : isDark
                                                ? 'bg-white/10 text-white hover:bg-white/20'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    )}
                                >
                                    {isLastStep ? (
                                        <>
                                            <IconCheck className="w-5 h-5" />
                                            Get Started
                                        </>
                                    ) : (
                                        <>
                                            Next
                                            <IconArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Hook to manually trigger onboarding
export function useOnboarding() {
    const [showOnboarding, setShowOnboarding] = useState(false);

    const resetOnboarding = () => {
        localStorage.removeItem('formAI_onboarding_complete');
        setShowOnboarding(true);
    };

    return { showOnboarding, setShowOnboarding, resetOnboarding };
}
