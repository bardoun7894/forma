import { GoogleGenAI } from "@google/genai";
import { ModelType } from '@/types';

// Lazy initialization - only create when needed to avoid crash when no API key
let ai: GoogleGenAI | null = null;

const getAI = () => {
    if (!ai) {
        const apiKey = process.env.NEXT_PUBLIC_API_KEY || process.env.API_KEY;
        if (!apiKey) {
            throw new Error("API key not configured. Please add NEXT_PUBLIC_API_KEY to your .env.local file.");
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};

const refreshAI = () => {
    ai = null; // Reset to force re-initialization
}

export const ensureVeoKey = async (): Promise<boolean> => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
        const hasKey = await aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await aistudio.openSelectKey();
            refreshAI();
            return true;
        }
        refreshAI();
        return true;
    }
    // Ensure AI is initialized
    getAI();
    return true;
};

export const generateVideo = async (
    prompt: string,
    model: string = ModelType.VEO_FAST
): Promise<string> => {
    await ensureVeoKey();

    let operation = await getAI().models.generateVideos({
        model: model,
        prompt: prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9',
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
        operation = await getAI().operations.getVideosOperation({ operation: operation });
    }

    if (operation.error) {
        throw new Error(String(operation.error.message || "Video generation failed"));
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) {
        throw new Error("No video URI returned");
    }

    // Append key for download
    return `${videoUri}&key=${process.env.NEXT_PUBLIC_API_KEY || process.env.API_KEY}`;
};

export const generateImageToImage = async (
    base64Image: string,
    prompt: string,
    model: string = ModelType.GEMINI_FLASH_IMAGE
): Promise<string> => {
    // stripping data:image/jpeg;base64, prefix if present for the API call
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    // Detect mime type from base64 header if possible, default to jpeg
    let mimeType = 'image/jpeg';
    if (base64Image.includes('data:image/png')) mimeType = 'image/png';
    if (base64Image.includes('data:image/webp')) mimeType = 'image/webp';

    const response = await getAI().models.generateContent({
        model: model,
        contents: {
            parts: [
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: cleanBase64
                    }
                },
                {
                    text: prompt
                }
            ]
        }
    });

    // Extract image
    let imageUrl = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
        }
    }

    if (!imageUrl) {
        throw new Error("No image generated.");
    }

    return imageUrl;
};

// Kept for backward compatibility if needed, but generateImageToImage is preferred
export const generateAvatarPortrait = async (
    base64Image: string,
    stylePrompt: string
): Promise<string> => {
    return generateImageToImage(
        base64Image,
        `Transform this person into the following style: ${stylePrompt}. Maintain the facial structure and identity of the person, but drastically change the artistic style, clothing, and background to match the description. High quality, detailed.`
    );
};

export const generateImage = async (
    prompt: string,
    model: string = ModelType.GEMINI_IMAGE
): Promise<string> => {
    await ensureVeoKey(); // Image preview models might also need paid key selection in IDX

    const imageConfig: any = {
        aspectRatio: "1:1",
    };

    // imageSize is only supported for gemini-3-pro-image-preview
    if (model === ModelType.GEMINI_IMAGE) {
        imageConfig.imageSize = "1K";
    }

    const response = await getAI().models.generateContent({
        model: model,
        contents: prompt,
        config: {
            imageConfig
        }
    });

    // Extract image
    let imageUrl = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
        }
    }

    if (!imageUrl) {
        throw new Error("No image generated.");
    }

    return imageUrl;
};

export const getChatSession = (model: string = ModelType.GEMINI_FLASH) => {
    return getAI().chats.create({
        model: model,
        config: {
            systemInstruction: "You are a professional, creative AI assistant within the FormaAI platform. Your goal is to help users generate content, refine ideas, and provide high-quality text outputs. Keep responses concise unless asked for detailed content.",
        }
    });
};
