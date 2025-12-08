export interface GenerationResult {
    id: string;
    type: 'video' | 'image' | 'text';
    prompt: string;
    // For video/image: URL of the generated asset
    url?: string;
    // For text: generated content
    content?: string;
    // Original fields (kept for backward compatibility)
    result?: string;
    model?: string;
    timestamp?: number;
    // Additional fields used in library
    createdAt: Date;
    status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface User {
    id: string;
    email: string;
    name: string;
    credits: number;
}

// Kie.ai Model Types
export enum ModelType {
    // Video models - Veo 3.1
    VEO_FAST = 'veo3_fast',
    VEO_HD = 'veo3',

    // Video models - Sora 2
    SORA_TEXT = 'sora-2-text-to-video',
    SORA_IMAGE = 'sora-2-image-to-video',
    SORA_PRO_720 = 'sora-2-pro-720p',
    SORA_PRO_1080 = 'sora-2-pro-1080p',

    // Video models - Other
    RUNWAY_GEN3 = 'runway-gen3',
    KLING_2_6 = 'kling-2.6',
    HAILUO_2_3 = 'hailuo-2.3',

    // Image models - Nano Banana
    NANO_BANANA = 'nano-banana',
    NANO_BANANA_PRO = 'nano-banana-pro',

    // Image models - Other
    GPT4O_IMAGE = 'gpt4o-image',
    FLUX_KONTEXT = 'flux-kontext-pro',
    MIDJOURNEY = 'midjourney',
    DALLE3 = 'dalle3',

    // Avatar video
    KLING_AVATAR = 'kling-avatar',

    // Gemini models
    GEMINI_FLASH = 'gemini-2.0-flash-exp',
    GEMINI_FLASH_IMAGE = 'gemini-2.0-flash-exp-image-generation',
    GEMINI_IMAGE = 'gemini-3.0-pro-image-preview',
}

// Credit costs per model (for profitable pricing)
export const CREDIT_COSTS: Record<ModelType, number> = {
    // Video - Veo
    [ModelType.VEO_FAST]: 10,
    [ModelType.VEO_HD]: 50,
    // Video - Sora
    [ModelType.SORA_TEXT]: 8,
    [ModelType.SORA_IMAGE]: 8,
    [ModelType.SORA_PRO_720]: 15,
    [ModelType.SORA_PRO_1080]: 30,
    // Video - Other
    [ModelType.RUNWAY_GEN3]: 20,
    [ModelType.KLING_2_6]: 12,
    [ModelType.HAILUO_2_3]: 10,
    // Image - Nano Banana
    [ModelType.NANO_BANANA]: 3,
    [ModelType.NANO_BANANA_PRO]: 5,
    // Image - Other
    [ModelType.GPT4O_IMAGE]: 2,
    [ModelType.FLUX_KONTEXT]: 2,
    [ModelType.MIDJOURNEY]: 3,
    [ModelType.DALLE3]: 3,
    // Avatar
    [ModelType.KLING_AVATAR]: 15,
    // Gemini (free/included)
    [ModelType.GEMINI_FLASH]: 1,
    [ModelType.GEMINI_FLASH_IMAGE]: 2,
    [ModelType.GEMINI_IMAGE]: 2,
};