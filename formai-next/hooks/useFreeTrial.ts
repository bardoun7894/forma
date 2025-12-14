'use client';

import { useState, useEffect, useCallback } from 'react';

// Free trial configuration
export const FREE_TRIAL_CONFIG = {
    maxVideos: 1,
    maxImages: 2,
    storageKey: 'formAI_free_trial',
};

export interface FreeTrialState {
    videosUsed: number;
    imagesUsed: number;
    createdAt: string;
}

export interface UseFreeTrial {
    // State
    trialState: FreeTrialState;
    isLoading: boolean;

    // Video trials
    canGenerateVideo: boolean;
    videosRemaining: number;
    useVideoTrial: () => boolean;

    // Image trials
    canGenerateImage: boolean;
    imagesRemaining: number;
    useImageTrial: () => boolean;

    // Utils
    resetTrial: () => void;
    hasUsedAnyTrial: boolean;
}

const getDefaultState = (): FreeTrialState => ({
    videosUsed: 0,
    imagesUsed: 0,
    createdAt: new Date().toISOString(),
});

export function useFreeTrial(): UseFreeTrial {
    const [trialState, setTrialState] = useState<FreeTrialState>(getDefaultState());
    const [isLoading, setIsLoading] = useState(true);

    // Load trial state from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(FREE_TRIAL_CONFIG.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored) as FreeTrialState;
                setTrialState(parsed);
            }
        } catch (error) {
            console.error('Failed to load free trial state:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Save trial state to localStorage
    const saveState = useCallback((newState: FreeTrialState) => {
        try {
            localStorage.setItem(FREE_TRIAL_CONFIG.storageKey, JSON.stringify(newState));
            setTrialState(newState);
        } catch (error) {
            console.error('Failed to save free trial state:', error);
        }
    }, []);

    // Video trial
    const canGenerateVideo = trialState.videosUsed < FREE_TRIAL_CONFIG.maxVideos;
    const videosRemaining = Math.max(0, FREE_TRIAL_CONFIG.maxVideos - trialState.videosUsed);

    const useVideoTrial = useCallback((): boolean => {
        if (!canGenerateVideo) return false;

        const newState: FreeTrialState = {
            ...trialState,
            videosUsed: trialState.videosUsed + 1,
        };
        saveState(newState);
        return true;
    }, [canGenerateVideo, trialState, saveState]);

    // Image trial
    const canGenerateImage = trialState.imagesUsed < FREE_TRIAL_CONFIG.maxImages;
    const imagesRemaining = Math.max(0, FREE_TRIAL_CONFIG.maxImages - trialState.imagesUsed);

    const useImageTrial = useCallback((): boolean => {
        if (!canGenerateImage) return false;

        const newState: FreeTrialState = {
            ...trialState,
            imagesUsed: trialState.imagesUsed + 1,
        };
        saveState(newState);
        return true;
    }, [canGenerateImage, trialState, saveState]);

    // Reset trial (for testing)
    const resetTrial = useCallback(() => {
        localStorage.removeItem(FREE_TRIAL_CONFIG.storageKey);
        setTrialState(getDefaultState());
    }, []);

    // Check if user has used any trial
    const hasUsedAnyTrial = trialState.videosUsed > 0 || trialState.imagesUsed > 0;

    return {
        trialState,
        isLoading,
        canGenerateVideo,
        videosRemaining,
        useVideoTrial,
        canGenerateImage,
        imagesRemaining,
        useImageTrial,
        resetTrial,
        hasUsedAnyTrial,
    };
}
