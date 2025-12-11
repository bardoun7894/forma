// Kie.ai API Service for Video & Image Generation
// OpenAI Service for Chat/Text Generation

import {
    saveVideoGeneration,
    updateVideoGeneration,
    getVideoByTaskId,
} from '@/lib/database';

const KIE_API_BASE = 'https://api.kie.ai/api/v1';

// Get API keys from environment
const getKieApiKey = (): string => {
    const apiKey = process.env.NEXT_PUBLIC_KIE_API_KEY;
    if (!apiKey) {
        throw new Error("Kie.ai API key not configured. Add NEXT_PUBLIC_KIE_API_KEY to .env.local");
    }
    return apiKey;
};

const getOpenAiApiKey = (): string => {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("OpenAI API key not configured. Add NEXT_PUBLIC_OPENAI_API_KEY to .env.local");
    }
    return apiKey;
};

// Types & Interfaces
interface KieApiResponse<T = any> {
    code: number;
    msg: string;
    data: T;
}

interface CreateTaskResponse {
    taskId: string;
}

interface TaskStatusResponse {
    taskId: string;
    model: string;
    state: 'waiting' | 'success' | 'fail';
    param: string;
    resultJson?: string;
    failCode?: string;
    failMsg?: string;
    costTime?: number;
    completeTime?: number;
    createTime: number;
}

// Veo-specific response structure (different from generic jobs API)
interface VeoStatusResponse {
    taskId: string;
    successFlag: 0 | 1 | 2 | 3; // 0=generating, 1=success, 2=failed, 3=generation failed
    resultUrls?: string; // JSON string of URLs array
    msg?: string;
}

// 4o Image response structure
interface Image4oStatusResponse {
    taskId: string;
    successFlag: 0 | 1 | 2 | 3;
    resultUrls?: string;
    msg?: string;
}

// Flux Kontext response structure
interface FluxKontextStatusResponse {
    taskId: string;
    successFlag: 0 | 1 | 2 | 3;
    resultUrls?: string;
    msg?: string;
}

// Runway response structure
interface RunwayStatusResponse {
    taskId: string;
    successFlag: 0 | 1 | 2 | 3;
    resultUrls?: string;
    msg?: string;
}

// Kling Avatar response structure
interface KlingAvatarStatusResponse {
    taskId: string;
    successFlag: 0 | 1 | 2 | 3;
    resultUrls?: string;
    msg?: string;
}

// Custom error class for better error handling
export class AIServiceError extends Error {
    constructor(
        message: string,
        public code: 'NETWORK_ERROR' | 'API_ERROR' | 'TIMEOUT' | 'AUTH_ERROR' | 'RATE_LIMIT' | 'UNKNOWN',
        public statusCode?: number
    ) {
        super(message);
        this.name = 'AIServiceError';
    }
}

// Helper: Make authenticated Kie.ai requests with better error handling
const kieRequest = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<KieApiResponse<T>> => {
    let apiKey: string;
    try {
        apiKey = getKieApiKey();
    } catch {
        throw new AIServiceError('API key not configured', 'AUTH_ERROR');
    }

    let response: Response;
    try {
        response = await fetch(`${KIE_API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                ...options.headers,
            },
        });
    } catch (error) {
        // Network errors (no internet, DNS failure, etc.)
        throw new AIServiceError(
            'Network error: Please check your internet connection',
            'NETWORK_ERROR'
        );
    }

    // Handle HTTP errors
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            throw new AIServiceError('Authentication failed: Invalid API key', 'AUTH_ERROR', response.status);
        }
        if (response.status === 429) {
            throw new AIServiceError('Rate limit exceeded: Please try again later', 'RATE_LIMIT', response.status);
        }
        if (response.status >= 500) {
            throw new AIServiceError('Server error: The service is temporarily unavailable', 'API_ERROR', response.status);
        }
        throw new AIServiceError(
            `API error: ${response.status} ${response.statusText}`,
            'API_ERROR',
            response.status
        );
    }

    try {
        return await response.json();
    } catch {
        throw new AIServiceError('Invalid response from server', 'API_ERROR');
    }
};

// Helper: Poll for task completion (generic jobs API)
const pollTaskStatus = async (taskId: string, maxAttempts = 40, intervalMs = 15000): Promise<TaskStatusResponse> => { // Default: 40 attempts × 15s = 10 min max
    for (let i = 0; i < maxAttempts; i++) {
        const response = await kieRequest<TaskStatusResponse>(`/jobs/recordInfo?taskId=${taskId}`);

        if (response.data?.state === 'success') {
            return response.data;
        } else if (response.data?.state === 'fail') {
            throw new Error(`Task failed: ${response.data.failMsg || 'Unknown error'}`);
        }

        // Still waiting, poll again
        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error('Task timeout: Generation took too long');
};

// Helper: Poll for Veo video task completion (uses different endpoint and response structure)
const pollVeoTaskStatus = async (taskId: string, maxAttempts = 60, intervalMs = 30000): Promise<string[]> => {
    for (let i = 0; i < maxAttempts; i++) {
        const response = await kieRequest<VeoStatusResponse>(`/veo/record-info?taskId=${taskId}`);

        if (response.code !== 200) {
            throw new Error(`Veo status check failed: ${response.msg || 'Unknown error'}`);
        }

        const data = response.data;

        // successFlag: 0=generating, 1=success, 2=failed, 3=generation failed
        if (data.successFlag === 1) {
            // Success - parse the resultUrls JSON string
            if (data.resultUrls) {
                try {
                    return JSON.parse(data.resultUrls);
                } catch {
                    return [data.resultUrls]; // If not JSON, treat as single URL
                }
            }
            throw new Error('Video generated but no URLs returned');
        } else if (data.successFlag === 2 || data.successFlag === 3) {
            throw new Error(`Video generation failed: ${response.msg || 'Unknown error'}`);
        }

        // Still generating (successFlag === 0), poll again
        console.log(`Video generation in progress... (attempt ${i + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error('Task timeout: Video generation took too long');
};

// Helper: Extract result URLs
const extractResultUrls = (resultJson?: string): string[] => {
    if (!resultJson) return [];

    try {
        const parsed = JSON.parse(resultJson);
        return parsed.resultUrls || [];
    } catch (e) {
        console.error('Failed to parse resultJson:', e);
        return [];
    }
};

/**
 * VIDEO GENERATION - VEO 3.1
 * Uses Kie.ai Veo 3.1 API
 */
export const generateVideo = async (
    prompt: string,
    model: 'veo3' | 'veo3_fast' = 'veo3_fast',
    aspectRatio: '16:9' | '9:16' = '16:9'
): Promise<string> => {
    const createResponse = await kieRequest<CreateTaskResponse>('/veo/generate', {
        method: 'POST',
        body: JSON.stringify({
            prompt,
            model,
            aspectRatio,
        }),
    });

    if (createResponse.code !== 200) {
        throw new Error(`Failed to create video task: ${createResponse.msg}`);
    }

    // Use Veo-specific polling (different endpoint and response structure)
    const videoUrls = await pollVeoTaskStatus(createResponse.data.taskId);

    if (videoUrls.length === 0) {
        throw new Error('No video URL returned');
    }

    return videoUrls[0];
};

/**
 * VIDEO GENERATION WITH FIREBASE TRACKING
 * Creates a video task, saves to Firebase, and returns immediately with the document ID.
 * Use pollVideoStatus to check progress and get the final URL.
 */
export const startVideoGeneration = async (
    userId: string,
    prompt: string,
    model: 'veo3' | 'veo3_fast' = 'veo3_fast',
    aspectRatio: '16:9' | '9:16' = '16:9',
    creditsUsed: number = 1
): Promise<{ docId: string; taskId: string }> => {
    // Create the Veo task
    const createResponse = await kieRequest<CreateTaskResponse>('/veo/generate', {
        method: 'POST',
        body: JSON.stringify({
            prompt,
            model,
            aspectRatio,
        }),
    });

    if (createResponse.code !== 200) {
        throw new Error(`Failed to create video task: ${createResponse.msg}`);
    }

    const taskId = createResponse.data.taskId;

    // Save to Firebase with pending status
    const docId = await saveVideoGeneration({
        userId,
        prompt,
        taskId,
        videoUrl: '',
        status: 'processing',
        model,
        aspectRatio,
        duration: 8, // Veo videos are ~8 seconds
        creditsUsed,
        createdAt: new Date().toISOString(),
    });

    return { docId, taskId };
};

/**
 * POLL VIDEO STATUS
 * Check the status of a video generation task and update Firebase when complete.
 * Returns the current status and video URL if available.
 */
export const pollVideoStatus = async (
    taskId: string
): Promise<{ status: 'processing' | 'completed' | 'failed'; videoUrl?: string; error?: string }> => {
    try {
        const response = await kieRequest<VeoStatusResponse>(`/veo/record-info?taskId=${taskId}`);

        console.log('Poll video status response:', JSON.stringify(response, null, 2));

        if (response.code !== 200) {
            return { status: 'failed', error: response.msg || 'Unknown error' };
        }

        const data = response.data;

        // successFlag: 0=generating, 1=success, 2=failed, 3=generation failed
        if (data.successFlag === 1) {
            let videoUrl = '';

            // Try multiple possible field names for the result URL
            const resultData = data.resultUrls || (data as any).resultUrl || (data as any).videoUrl || (data as any).url;

            if (resultData) {
                try {
                    // Try parsing as JSON array first
                    const urls = JSON.parse(resultData);
                    if (Array.isArray(urls)) {
                        videoUrl = urls[0] || '';
                    } else if (typeof urls === 'string') {
                        videoUrl = urls;
                    } else if (urls.url) {
                        videoUrl = urls.url;
                    }
                } catch {
                    // Not JSON, use as-is
                    videoUrl = resultData;
                }
            }

            console.log('Extracted video URL:', videoUrl);

            // Update Firebase with completed status
            const video = await getVideoByTaskId(taskId);
            if (video?.id) {
                await updateVideoGeneration(video.id, {
                    status: 'completed',
                    videoUrl,
                    completedAt: new Date().toISOString(),
                });
            }

            return { status: 'completed', videoUrl };
        } else if (data.successFlag === 2 || data.successFlag === 3) {
            const errorMsg = response.msg || 'Video generation failed';

            // Update Firebase with failed status
            const video = await getVideoByTaskId(taskId);
            if (video?.id) {
                await updateVideoGeneration(video.id, {
                    status: 'failed',
                    errorMessage: errorMsg,
                });
            }

            return { status: 'failed', error: errorMsg };
        }

        // Still processing
        return { status: 'processing' };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('Poll video status error:', error);
        return { status: 'failed', error: errorMsg };
    }
};

/**
 * GENERATE VIDEO WITH FIREBASE (Full flow)
 * Starts generation, polls until complete, and returns the video URL.
 * Progress is saved to Firebase throughout.
 */
export const generateVideoWithTracking = async (
    userId: string,
    prompt: string,
    model: 'veo3' | 'veo3_fast' = 'veo3_fast',
    aspectRatio: '16:9' | '9:16' = '16:9',
    creditsUsed: number = 1,
    onProgress?: (attempt: number, maxAttempts: number) => void
): Promise<{ docId: string; videoUrl: string }> => {
    const { docId, taskId } = await startVideoGeneration(userId, prompt, model, aspectRatio, creditsUsed);

    const maxAttempts = 60;
    const intervalMs = 30000; // 30 seconds

    for (let i = 0; i < maxAttempts; i++) {
        onProgress?.(i + 1, maxAttempts);

        const result = await pollVideoStatus(taskId);

        if (result.status === 'completed' && result.videoUrl) {
            return { docId, videoUrl: result.videoUrl };
        } else if (result.status === 'failed') {
            throw new Error(result.error || 'Video generation failed');
        }

        // Still processing, wait and poll again
        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    // Timeout - update Firebase
    const video = await getVideoByTaskId(taskId);
    if (video?.id) {
        await updateVideoGeneration(video.id, {
            status: 'failed',
            errorMessage: 'Generation timeout',
        });
    }

    throw new Error('Video generation timeout');
};

/**
 * IMAGE GENERATION - NANO BANANA PRO
 * Uses Kie.ai Nano Banana Pro API
 */
export const generateImage = async (
    prompt: string,
    aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' = '1:1',
    resolution: '1K' | '2K' | '4K' = '1K'
): Promise<string> => {
    const createResponse = await kieRequest<CreateTaskResponse>('/jobs/createTask', {
        method: 'POST',
        body: JSON.stringify({
            model: 'nano-banana-pro',
            input: {
                prompt,
                aspect_ratio: aspectRatio,
                resolution,
                output_format: 'png',
            },
        }),
    });

    if (createResponse.code !== 200) {
        throw new Error(`Failed to create image task: ${createResponse.msg}`);
    }

    const taskResult = await pollTaskStatus(createResponse.data.taskId);
    const urls = extractResultUrls(taskResult.resultJson);

    if (urls.length === 0) {
        throw new Error('No image URL returned');
    }

    return urls[0];
};

/**
 * IMAGE-TO-IMAGE TRANSFORMATION
 * Uses Kie.ai Flux Kontext API for image editing
 * Docs: https://docs.kie.ai/flux-kontext-api/generate-or-edit-image
 */
export const generateImageToImage = async (
    base64Image: string,
    prompt: string,
    aspectRatio: '1:1' | '16:9' | '9:16' = '1:1'
): Promise<string> => {
    // Step 1: Upload the base64 image to get a URL
    let imageUrl: string;
    try {
        imageUrl = await uploadBase64Image(base64Image, `img2img-${Date.now()}.png`);
        console.log('Image uploaded successfully, URL:', imageUrl);
    } catch (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
    }

    // Map aspect ratio to Flux Kontext format
    const fluxAspectRatio = aspectRatio === '9:16' ? '9:16' : aspectRatio === '16:9' ? '16:9' : '1:1';

    // Step 2: Create the image editing task using Flux Kontext API
    const apiKey = getKieApiKey();
    const response = await fetch(`${KIE_API_BASE}/flux/kontext/generate`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt,
            inputImage: imageUrl,
            aspectRatio: fluxAspectRatio,
            outputFormat: 'png',
            model: 'flux-kontext-pro',
            enableTranslation: true,
        }),
    });

    const createResponse = await response.json();
    console.log('Flux Kontext create response:', JSON.stringify(createResponse, null, 2));

    if (createResponse.code !== 200) {
        throw new Error(`Failed to create image transformation task: ${createResponse.msg}`);
    }

    // Step 3: Poll for task completion using Flux Kontext status endpoint
    const taskId = createResponse.data.taskId;
    console.log('Task created, ID:', taskId);
    const maxAttempts = 60;
    const pollInterval = 5000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));

        const statusResponse = await fetch(`${KIE_API_BASE}/flux/kontext/record-info?taskId=${taskId}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        const statusResult = await statusResponse.json();

        if (statusResult.code !== 200) {
            throw new Error(`Failed to check task status: ${statusResult.msg}`);
        }

        const taskData = statusResult.data;
        console.log(`Poll attempt ${attempt + 1}, successFlag: ${taskData.successFlag}, response:`, JSON.stringify(taskData.response, null, 2));

        // Check completion status
        // 0: GENERATING, 1: SUCCESS, 2: CREATE_TASK_FAILED, 3: GENERATE_FAILED
        if (taskData.successFlag === 1) {
            // Success - extract image URL (Flux Kontext uses resultImageUrl)
            const resultUrl = taskData.response?.resultImageUrl;
            if (resultUrl) {
                return resultUrl;
            }
            throw new Error('No image URL in completed task');
        } else if (taskData.successFlag === 2 || taskData.successFlag === 3) {
            // Failed
            throw new Error(taskData.errorMessage || 'Image transformation failed');
        }
        // successFlag === 0 means still processing, continue polling
    }

    throw new Error('Image transformation timed out');
};

/**
 * AVATAR PORTRAIT GENERATION
 * Transform uploaded photo into different artistic styles
 */
export const generateAvatarPortrait = async (
    base64Image: string,
    stylePrompt: string
): Promise<string> => {
    return generateImageToImage(
        base64Image,
        `Transform this person into the following style: ${stylePrompt}. Maintain the facial structure and identity of the person, but drastically change the artistic style, clothing, and background to match the description. High quality, detailed.`
    );
};

// ============================================
// AI PROMPT ENHANCEMENT
// ============================================

type EnhancePromptType = 'video' | 'image' | 'avatar';

const ENHANCE_SYSTEM_PROMPTS: Record<EnhancePromptType, string> = {
    video: `You are an expert AI video prompt engineer. Your task is to enhance user prompts for AI video generation.
Rules:
- Keep the core idea but add cinematic details, camera movements, lighting, and atmosphere
- Add specific visual descriptors (colors, textures, mood)
- Include temporal elements (motion, transitions, pacing)
- Keep it under 200 words
- Return ONLY the enhanced prompt, no explanations or prefixes
- Do not use markdown formatting`,

    image: `You are an expert AI image prompt engineer. Your task is to enhance user prompts for AI image generation.
Rules:
- Keep the core subject but add artistic style, lighting, composition details
- Add specific visual descriptors (colors, textures, materials, mood)
- Include quality boosters (8k, detailed, professional, etc.)
- Keep it under 150 words
- Return ONLY the enhanced prompt, no explanations or prefixes
- Do not use markdown formatting`,

    avatar: `You are an expert AI avatar/portrait prompt engineer. Your task is to enhance user prompts for AI avatar style transfer.
Rules:
- Keep the style direction but add specific artistic details
- Add lighting, mood, and atmosphere descriptors
- Include character expression and pose details if relevant
- Keep it under 100 words
- Return ONLY the enhanced prompt, no explanations or prefixes
- Do not use markdown formatting`,
};

/**
 * Enhance a user prompt using AI for better generation results
 */
export const enhancePrompt = async (
    prompt: string,
    type: EnhancePromptType
): Promise<string> => {
    const apiKey = getOpenAiApiKey();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: ENHANCE_SYSTEM_PROMPTS[type],
                },
                {
                    role: 'user',
                    content: `Enhance this prompt: "${prompt}"`,
                },
            ],
            max_tokens: 500,
            temperature: 0.7,
        }),
    });

    if (!response.ok) {
        throw new AIServiceError(`Failed to enhance prompt: ${response.status}`, 'API_ERROR', response.status);
    }

    const data = await response.json();
    const enhancedPrompt = data.choices[0]?.message?.content?.trim() || prompt;

    return enhancedPrompt;
};

/**
 * CHAT SESSION - OPENAI GPT
 * Creates an OpenAI compatible chat interface
 */
export const getChatSession = (model: string = 'gpt-4o-mini') => {
    const apiKey = getOpenAiApiKey();

    return {
        async sendMessage(message: string): Promise<string> {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a professional, creative AI assistant within the FormaAI platform. Your goal is to help users generate content, refine ideas, and provide high-quality text outputs. Keep responses concise unless asked for detailed content.',
                        },
                        {
                            role: 'user',
                            content: message,
                        },
                    ],
                }),
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0]?.message?.content || '';
        },

        async *sendMessageStream(message: string): AsyncGenerator<string, void, unknown> {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a professional, creative AI assistant within the FormaAI platform.',
                        },
                        {
                            role: 'user',
                            content: message,
                        },
                    ],
                    stream: true,
                }),
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('No response body');
            }

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices[0]?.delta?.content;
                            if (content) {
                                yield content;
                            }
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }
            }
        },
    };
};

// ============================================
// SORA 2 VIDEO GENERATION
// ============================================

/**
 * Generate video using Sora 2 (text-to-video or image-to-video)
 */
export const generateSoraVideo = async (
    prompt: string,
    model: 'sora-2-text-to-video' | 'sora-2-image-to-video' | 'sora-2-pro-720p' | 'sora-2-pro-1080p' = 'sora-2-text-to-video',
    aspectRatio: '16:9' | '9:16' | '1:1' = '16:9',
    duration: number = 10,
    imageUrl?: string
): Promise<string> => {
    // Sora API expects 'landscape' or 'portrait' instead of '16:9' or '9:16'
    const soraAspectRatio = aspectRatio === '9:16' ? 'portrait' : 'landscape';

    const body: any = {
        model,
        input: {
            prompt,
            aspect_ratio: soraAspectRatio,
            duration,
        },
    };

    // For image-to-video, add the source image
    if (model === 'sora-2-image-to-video' && imageUrl) {
        body.input.image_url = imageUrl;
    }

    const createResponse = await kieRequest<CreateTaskResponse>('/jobs/createTask', {
        method: 'POST',
        body: JSON.stringify(body),
    });

    if (createResponse.code !== 200) {
        throw new Error(`Failed to create Sora video task: ${createResponse.msg}`);
    }

    const taskResult = await pollTaskStatus(createResponse.data.taskId, 40, 30000); // 40 attempts × 30s = 20 min max (per Kie.ai docs)
    const urls = extractResultUrls(taskResult.resultJson);

    if (urls.length === 0) {
        throw new Error('No video URL returned from Sora');
    }

    return urls[0];
};

// ============================================
// RUNWAY GEN-3 VIDEO GENERATION
// ============================================

/**
 * Poll Runway task status
 */
const pollRunwayTaskStatus = async (taskId: string, maxAttempts = 20, intervalMs = 30000): Promise<string[]> => { // 20 attempts × 30s = 10 min max (per Kie.ai docs)
    for (let i = 0; i < maxAttempts; i++) {
        const response = await kieRequest<RunwayStatusResponse>(`/runway/record-detail?taskId=${taskId}`);

        if (response.code !== 200) {
            throw new Error(`Runway status check failed: ${response.msg || 'Unknown error'}`);
        }

        const data = response.data;

        if (data.successFlag === 1) {
            if (data.resultUrls) {
                try {
                    return JSON.parse(data.resultUrls);
                } catch {
                    return [data.resultUrls];
                }
            }
            throw new Error('Video generated but no URLs returned');
        } else if (data.successFlag === 2 || data.successFlag === 3) {
            throw new Error(`Runway video generation failed: ${data.msg || 'Unknown error'}`);
        }

        console.log(`Runway generation in progress... (attempt ${i + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error('Runway task timeout');
};

/**
 * Generate video using Runway Gen-3
 */
export const generateRunwayVideo = async (
    prompt: string,
    aspectRatio: '16:9' | '9:16' = '16:9',
    duration: 5 | 10 = 5,
    imageUrl?: string
): Promise<string> => {
    const body: any = {
        prompt,
        aspectRatio,
        duration,
    };

    if (imageUrl) {
        body.imageUrl = imageUrl;
    }

    const createResponse = await kieRequest<CreateTaskResponse>('/runway/generate', {
        method: 'POST',
        body: JSON.stringify(body),
    });

    if (createResponse.code !== 200) {
        throw new Error(`Failed to create Runway video task: ${createResponse.msg}`);
    }

    const videoUrls = await pollRunwayTaskStatus(createResponse.data.taskId);

    if (videoUrls.length === 0) {
        throw new Error('No video URL returned from Runway');
    }

    return videoUrls[0];
};

// ============================================
// 4O IMAGE (GPT-4O) GENERATION
// ============================================

/**
 * Poll 4o Image task status
 */
const poll4oImageTaskStatus = async (taskId: string, maxAttempts = 60, intervalMs = 5000): Promise<string[]> => {
    for (let i = 0; i < maxAttempts; i++) {
        const response = await kieRequest<Image4oStatusResponse>(`/gpt4o-image/record-info?taskId=${taskId}`);

        if (response.code !== 200) {
            throw new Error(`4o Image status check failed: ${response.msg || 'Unknown error'}`);
        }

        const data = response.data;

        if (data.successFlag === 1) {
            if (data.resultUrls) {
                try {
                    return JSON.parse(data.resultUrls);
                } catch {
                    return [data.resultUrls];
                }
            }
            throw new Error('Image generated but no URLs returned');
        } else if (data.successFlag === 2 || data.successFlag === 3) {
            throw new Error(`4o Image generation failed: ${data.msg || 'Unknown error'}`);
        }

        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error('4o Image task timeout');
};

/**
 * Generate image using GPT-4o Image
 */
export const generate4oImage = async (
    prompt: string,
    size: '1024x1024' | '1792x1024' | '1024x1792' = '1024x1024',
    quality: 'standard' | 'hd' = 'standard'
): Promise<string> => {
    const createResponse = await kieRequest<CreateTaskResponse>('/gpt4o-image/generate', {
        method: 'POST',
        body: JSON.stringify({
            prompt,
            size,
            quality,
        }),
    });

    if (createResponse.code !== 200) {
        throw new Error(`Failed to create 4o Image task: ${createResponse.msg}`);
    }

    const imageUrls = await poll4oImageTaskStatus(createResponse.data.taskId);

    if (imageUrls.length === 0) {
        throw new Error('No image URL returned from 4o Image');
    }

    return imageUrls[0];
};

// ============================================
// FLUX KONTEXT PRO IMAGE GENERATION
// ============================================

/**
 * Poll Flux Kontext task status
 */
const pollFluxKontextTaskStatus = async (taskId: string, maxAttempts = 60, intervalMs = 5000): Promise<string[]> => {
    for (let i = 0; i < maxAttempts; i++) {
        const response = await kieRequest<FluxKontextStatusResponse>(`/flux/kontext/record-info?taskId=${taskId}`);

        if (response.code !== 200) {
            throw new Error(`Flux Kontext status check failed: ${response.msg || 'Unknown error'}`);
        }

        const data = response.data;

        if (data.successFlag === 1) {
            if (data.resultUrls) {
                try {
                    return JSON.parse(data.resultUrls);
                } catch {
                    return [data.resultUrls];
                }
            }
            throw new Error('Image generated but no URLs returned');
        } else if (data.successFlag === 2 || data.successFlag === 3) {
            throw new Error(`Flux Kontext generation failed: ${data.msg || 'Unknown error'}`);
        }

        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error('Flux Kontext task timeout');
};

/**
 * Generate image using Flux Kontext Pro
 */
export const generateFluxKontextImage = async (
    prompt: string,
    aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' = '1:1',
    inputImage?: string
): Promise<string> => {
    const body: any = {
        prompt,
        aspect_ratio: aspectRatio,
    };

    if (inputImage) {
        body.input_image = inputImage;
    }

    const createResponse = await kieRequest<CreateTaskResponse>('/flux/kontext/generate', {
        method: 'POST',
        body: JSON.stringify(body),
    });

    if (createResponse.code !== 200) {
        throw new Error(`Failed to create Flux Kontext task: ${createResponse.msg}`);
    }

    const imageUrls = await pollFluxKontextTaskStatus(createResponse.data.taskId);

    if (imageUrls.length === 0) {
        throw new Error('No image URL returned from Flux Kontext');
    }

    return imageUrls[0];
};

// ============================================
// MIDJOURNEY IMAGE GENERATION
// ============================================

/**
 * Generate image using Midjourney (via jobs API)
 */
export const generateMidjourneyImage = async (
    prompt: string,
    aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' = '1:1'
): Promise<string> => {
    const createResponse = await kieRequest<CreateTaskResponse>('/jobs/createTask', {
        method: 'POST',
        body: JSON.stringify({
            model: 'midjourney',
            input: {
                prompt,
                aspect_ratio: aspectRatio,
            },
        }),
    });

    if (createResponse.code !== 200) {
        throw new Error(`Failed to create Midjourney task: ${createResponse.msg}`);
    }

    const taskResult = await pollTaskStatus(createResponse.data.taskId);
    const urls = extractResultUrls(taskResult.resultJson);

    if (urls.length === 0) {
        throw new Error('No image URL returned from Midjourney');
    }

    return urls[0];
};

// ============================================
// KLING AVATAR VIDEO GENERATION (Talking Heads)
// ============================================

/**
 * Generate talking head avatar video using Kling Avatar
 * Uses the jobs API pattern - same as Sora and other models
 * Takes a portrait image and audio URL to generate a talking head video
 *
 * Model options:
 * - kling/v1-avatar-standard (720p, 8 credits/s)
 * - kling/v1-avatar-pro (1080p, 16 credits/s)
 */
export const generateKlingAvatarVideo = async (
    imageUrl: string,
    audioUrl: string,
    prompt: string = '',
    model: 'kling/v1-avatar-standard' | 'kling/v1-avatar-pro' = 'kling/v1-avatar-standard'
): Promise<string> => {
    const body = {
        model,
        input: {
            image_url: imageUrl,
            audio_url: audioUrl,
            prompt: prompt || 'Natural speaking expression',
        },
    };

    console.log('Creating Kling Avatar task with:', JSON.stringify(body, null, 2));

    const createResponse = await kieRequest<CreateTaskResponse>('/jobs/createTask', {
        method: 'POST',
        body: JSON.stringify(body),
    });

    if (createResponse.code !== 200) {
        throw new Error(`Failed to create Kling Avatar task: ${createResponse.msg}`);
    }

    // Use the generic pollTaskStatus function (same as Sora)
    const taskResult = await pollTaskStatus(createResponse.data.taskId, 120, 15000);
    const urls = extractResultUrls(taskResult.resultJson);

    if (urls.length === 0) {
        throw new Error('No video URL returned from Kling Avatar');
    }

    return urls[0];
};

// ============================================
// UNIFIED VIDEO GENERATION (Multiple Models)
// ============================================

import { ModelType, CREDIT_COSTS } from '@/types';

/**
 * Unified video generation function that routes to the appropriate API
 */
export const generateVideoUnified = async (
    prompt: string,
    model: ModelType,
    aspectRatio: '16:9' | '9:16' | '1:1' = '16:9',
    options?: {
        imageUrl?: string;
        duration?: number;
    }
): Promise<string> => {
    switch (model) {
        case ModelType.VEO_FAST:
            return generateVideo(prompt, 'veo3_fast', aspectRatio as '16:9' | '9:16');
        case ModelType.VEO_HD:
            return generateVideo(prompt, 'veo3', aspectRatio as '16:9' | '9:16');
        case ModelType.SORA_TEXT:
            return generateSoraVideo(prompt, 'sora-2-text-to-video', aspectRatio, options?.duration || 10);
        case ModelType.SORA_IMAGE:
            return generateSoraVideo(prompt, 'sora-2-image-to-video', aspectRatio, options?.duration || 10, options?.imageUrl);
        case ModelType.SORA_PRO_720:
            return generateSoraVideo(prompt, 'sora-2-pro-720p', aspectRatio, options?.duration || 10, options?.imageUrl);
        case ModelType.SORA_PRO_1080:
            return generateSoraVideo(prompt, 'sora-2-pro-1080p', aspectRatio, options?.duration || 10, options?.imageUrl);
        case ModelType.RUNWAY_GEN3:
            return generateRunwayVideo(prompt, aspectRatio as '16:9' | '9:16', (options?.duration || 5) as 5 | 10, options?.imageUrl);
        case ModelType.KLING_2_6:
        case ModelType.HAILUO_2_3:
            // Kling and Hailuo use jobs API pattern similar to Sora
            return generateSoraVideo(prompt, model as any, aspectRatio, options?.duration || 5);
        default:
            throw new Error(`Unsupported video model: ${model}`);
    }
};

/**
 * Unified image generation function that routes to the appropriate API
 */
export const generateImageUnified = async (
    prompt: string,
    model: ModelType,
    aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' = '1:1',
    options?: {
        inputImage?: string;
        resolution?: '1K' | '2K' | '4K';
        quality?: 'standard' | 'hd';
    }
): Promise<string> => {
    switch (model) {
        case ModelType.NANO_BANANA:
        case ModelType.NANO_BANANA_PRO:
            if (options?.inputImage) {
                return generateImageToImage(options.inputImage, prompt, aspectRatio as '1:1' | '16:9' | '9:16');
            }
            return generateImage(prompt, aspectRatio, options?.resolution || '1K');
        case ModelType.GPT4O_IMAGE:
            const size = aspectRatio === '16:9' ? '1792x1024' : aspectRatio === '9:16' ? '1024x1792' : '1024x1024';
            return generate4oImage(prompt, size, options?.quality || 'standard');
        case ModelType.FLUX_KONTEXT:
            return generateFluxKontextImage(prompt, aspectRatio, options?.inputImage);
        case ModelType.MIDJOURNEY:
            return generateMidjourneyImage(prompt, aspectRatio);
        case ModelType.DALLE3:
            // DALL-E 3 uses same endpoint as 4o Image
            return generate4oImage(prompt, aspectRatio === '16:9' ? '1792x1024' : '1024x1024', 'hd');
        default:
            throw new Error(`Unsupported image model: ${model}`);
    }
};

/**
 * Get credit cost for a model
 */
export const getModelCreditCost = (model: ModelType): number => {
    return CREDIT_COSTS[model] || 1;
};

// ============================================
// FILE UPLOAD API
// ============================================

const KIE_FILE_API_BASE = 'https://kieai.redpandaai.co';

/**
 * Upload a base64 image to Kie.ai and get a public URL
 * Required for Kling Avatar API which needs image_url instead of base64
 */
export const uploadBase64Image = async (base64Data: string, fileName?: string): Promise<string> => {
    const apiKey = getKieApiKey();

    // Ensure base64Data is in proper format (with or without data URL prefix)
    // The API might expect just the base64 string without the "data:image/..." prefix
    let cleanBase64 = base64Data;
    if (base64Data.includes(',')) {
        // Has data URL prefix like "data:image/jpeg;base64,..."
        // Keep it as-is since the API might support both formats
    }

    const requestBody = {
        base64Data: cleanBase64,
        uploadPath: 'avatars',
        fileName: fileName || `avatar-${Date.now()}.jpg`,
    };

    console.log('Uploading image to Kie.ai file API...');
    console.log('Request URL:', `${KIE_FILE_API_BASE}/api/file-base64-upload`);

    const response = await fetch(`${KIE_FILE_API_BASE}/api/file-base64-upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('File upload error response:', errorText);
        throw new AIServiceError(`File upload failed: ${response.status} ${response.statusText}`, 'API_ERROR', response.status);
    }

    const result = await response.json();
    console.log('File upload response:', JSON.stringify(result, null, 2));

    // Check various possible response formats
    const fileUrl = result.data?.downloadUrl || result.data?.fileUrl || result.data?.url || result.fileUrl || result.url;

    if (!fileUrl) {
        console.error('Unexpected API response structure:', result);
        throw new AIServiceError(`File upload failed: No URL in response. Response: ${JSON.stringify(result)}`, 'API_ERROR');
    }

    return fileUrl;
};

// ============================================
// ELEVENLABS TEXT-TO-SPEECH API
// ============================================

type ElevenLabsVoice = 'Rachel' | 'Aria' | 'Roger' | 'Sarah' | 'Laura' | 'Charlie' | 'George' | 'Callum' | 'River' | 'Liam' | 'Charlotte' | 'Alice' | 'Matilda' | 'Will' | 'Jessica' | 'Eric' | 'Chris' | 'Brian' | 'Daniel' | 'Lily' | 'Bill';

/**
 * Generate speech audio from text using ElevenLabs TTS API via Kie.ai
 * Returns an audio URL that can be used with Kling Avatar
 */
export const generateSpeechAudio = async (
    text: string,
    voice: ElevenLabsVoice = 'Rachel',
    options?: {
        stability?: number;
        similarity_boost?: number;
        speed?: number;
    }
): Promise<string> => {
    const body = {
        model: 'elevenlabs/text-to-speech-multilingual-v2',
        input: {
            text,
            voice,
            stability: options?.stability ?? 0.5,
            similarity_boost: options?.similarity_boost ?? 0.75,
            style: 0,
            speed: options?.speed ?? 1,
            timestamps: false,
        },
    };

    console.log('Creating TTS task with:', JSON.stringify(body, null, 2));

    const createResponse = await kieRequest<CreateTaskResponse>('/jobs/createTask', {
        method: 'POST',
        body: JSON.stringify(body),
    });

    if (createResponse.code !== 200) {
        throw new Error(`Failed to create TTS task: ${createResponse.msg}`);
    }

    // Poll for completion
    const taskResult = await pollTaskStatus(createResponse.data.taskId, 60, 3000);
    const urls = extractResultUrls(taskResult.resultJson);

    if (urls.length === 0) {
        throw new Error('No audio URL returned from TTS');
    }

    return urls[0];
};

/**
 * Generate talking avatar video with text input
 * This is a convenience function that:
 * 1. Uploads the base64 image to get a URL
 * 2. Converts text to speech audio
 * 3. Generates the avatar video
 */
export const generateTalkingAvatarFromText = async (
    base64Image: string,
    text: string,
    voice: ElevenLabsVoice = 'Rachel',
    model: 'kling/v1-avatar-standard' | 'kling/v1-avatar-pro' = 'kling/v1-avatar-standard'
): Promise<string> => {
    let imageUrl: string;
    let audioUrl: string;

    // Step 1: Upload image
    try {
        console.log('Step 1: Uploading image...');
        imageUrl = await uploadBase64Image(base64Image);
        console.log('Image uploaded:', imageUrl);
    } catch (error) {
        console.error('Image upload failed:', error);
        throw new AIServiceError(
            `Image upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'API_ERROR'
        );
    }

    // Step 2: Generate speech audio
    try {
        console.log('Step 2: Generating speech audio...');
        console.log('Text to speak:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
        audioUrl = await generateSpeechAudio(text, voice);
        console.log('Audio generated:', audioUrl);
    } catch (error) {
        console.error('TTS generation failed:', error);
        throw new AIServiceError(
            `Speech generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'API_ERROR'
        );
    }

    // Step 3: Generate avatar video
    try {
        console.log('Step 3: Generating avatar video...');
        const videoUrl = await generateKlingAvatarVideo(imageUrl, audioUrl, 'Natural speaking expression', model);
        console.log('Video generated:', videoUrl);
        return videoUrl;
    } catch (error) {
        console.error('Avatar video generation failed:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';

        // Check for insufficient credits error
        if (errorMsg.includes('insufficient') || errorMsg.includes('credits')) {
            throw new AIServiceError(
                'Insufficient Kie.ai credits. Please top up your Kie.ai account at https://kie.ai',
                'API_ERROR'
            );
        }

        throw new AIServiceError(
            `Avatar video generation failed: ${errorMsg}`,
            'API_ERROR'
        );
    }
};
