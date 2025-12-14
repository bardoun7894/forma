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
    // Source collection for delete operations
    source?: 'videos' | 'images' | 'avatars';
}

export interface User {
    id: string;
    email: string;
    name: string;
    credits: number;
}

// Kie.ai Model Types
export enum ModelType {
    // Video models - Sora 2 (cheapest, default)
    SORA_TEXT = 'sora-2-text-to-video',
    SORA_PRO = 'sora-2-pro-text-to-video',

    // Video models - Kling
    KLING_PRO = 'kling/v2-1-pro',
    KLING_STANDARD = 'kling/v2-1-standard',

    // Video models - Hailuo
    HAILUO_PRO = 'hailuo/2-3-text-to-video-pro',

    // Video models - Veo 3.1 (expensive)
    VEO_FAST = 'veo3_fast',
    VEO_HD = 'veo3',

    // Video models - Runway (expensive)
    RUNWAY_GEN3 = 'runway-gen3',

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
    // Video - Sora (cheapest)
    [ModelType.SORA_TEXT]: 5,
    [ModelType.SORA_PRO]: 8,
    // Video - Kling
    [ModelType.KLING_PRO]: 12,
    [ModelType.KLING_STANDARD]: 8,
    // Video - Hailuo
    [ModelType.HAILUO_PRO]: 10,
    // Video - Veo (expensive)
    [ModelType.VEO_FAST]: 15,
    [ModelType.VEO_HD]: 50,
    // Video - Runway (expensive)
    [ModelType.RUNWAY_GEN3]: 25,
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