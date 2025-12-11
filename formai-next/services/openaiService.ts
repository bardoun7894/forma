import OpenAI from 'openai';

// Lazy initialization
let openai: OpenAI | null = null;

const getOpenAI = () => {
    if (!openai) {
        const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error("OpenAI API key not configured. Please add NEXT_PUBLIC_OPENAI_API_KEY to your .env.local file.");
        }
        openai = new OpenAI({
            apiKey,
            dangerouslyAllowBrowser: true, // Required for client-side usage
        });
    }
    return openai;
};

export type ChatMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};

// Send a chat message and get a response
export const sendChatMessage = async (
    messages: ChatMessage[],
    model: string = 'gpt-4o-mini'
): Promise<string> => {
    const client = getOpenAI();

    // Add system message if not present
    const hasSystemMessage = messages.some(m => m.role === 'system');
    const allMessages: ChatMessage[] = hasSystemMessage
        ? messages
        : [
            {
                role: 'system',
                content: 'You are a professional, creative AI assistant within the FormaAI platform. Your goal is to help users generate content, refine ideas, and provide high-quality text outputs. Keep responses concise unless asked for detailed content.'
            },
            ...messages
        ];

    const response = await client.chat.completions.create({
        model,
        messages: allMessages,
    });

    return response.choices[0]?.message?.content || 'No response generated.';
};
