'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { getChatSession } from '@/services/geminiService';
import { Button } from '@/components/ui/Button';
import { IconSend, IconRobot, IconUser, IconLoader } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Message type definition
type Message = {
    id: string;
    role: 'user' | 'model';
    content: string;
    timestamp: number;
};

export default function ChatPage() {
    const t = useTranslations('dashboard');
    const { userData } = useAuth();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [chatSession, setChatSession] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize chat session on mount
    useEffect(() => {
        try {
            const session = getChatSession();
            setChatSession(session);
        } catch (error) {
            console.error("Failed to init chat:", error);
        }
    }, []);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !chatSession || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: Date.now(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const result = await chatSession.sendMessage(userMsg.content);
            const responseText = result.response.text();

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                content: responseText,
                timestamp: Date.now(),
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("Chat error:", error);
            // Optional: Show error toast
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex items-center justify-between mb-4 shrink-0">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <IconRobot className="w-8 h-8 text-primary" />
                    {t('startChat')}
                </h1>
            </div>

            {/* Chat Container */}
            <div className="flex-1 bg-panel border border-white/5 rounded-2xl overflow-hidden flex flex-col relative shadow-2xl">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-50 p-8">
                            <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full flex items-center justify-center mb-4">
                                <IconRobot className="w-10 h-10 text-primary" />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">AI Assistant</h3>
                            <p className="text-sm text-muted max-w-md">
                                Ask me anything! I can help you generate ideas, write content, or answer questions about your projects.
                            </p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "flex gap-4 max-w-3xl",
                                    msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                                )}
                            >
                                {/* Avatar */}
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                    msg.role === 'user' ? "bg-purple-500/20 text-purple-400" : "bg-primary/20 text-primary"
                                )}>
                                    {msg.role === 'user' ? <IconUser className="w-5 h-5" /> : <IconRobot className="w-5 h-5" />}
                                </div>

                                {/* Bubble */}
                                <div className={cn(
                                    "rounded-2xl px-5 py-3 text-sm md:text-base leading-relaxed",
                                    msg.role === 'user'
                                        ? "bg-purple-600 text-white rounded-tr-none"
                                        : "bg-white/10 text-slate-200 rounded-tl-none border border-white/5"
                                )}>
                                    {msg.content}
                                </div>
                            </motion.div>
                        ))
                    )}

                    {/* Loading Indicator */}
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex gap-4 max-w-3xl"
                        >
                            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                                <IconRobot className="w-5 h-5" />
                            </div>
                            <div className="bg-white/5 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="metric-input-container p-4 border-t border-white/5 bg-black/20 backdrop-blur-sm">
                    <div className="flex gap-3 relative z-10">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            disabled={isLoading}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className={cn(
                                "w-12 h-12 rounded-xl p-0 flex items-center justify-center transition-all",
                                input.trim() ? "bg-primary hover:bg-primary-hover" : "bg-white/10 opacity-50 cursor-not-allowed"
                            )}
                        >
                            {isLoading ? <IconLoader className="w-5 h-5 animate-spin" /> : <IconSend className="w-5 h-5" />}
                        </Button>
                    </div>
                    {/* Input Glow Effect */}
                    <div className="absolute inset-0 -z-10 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
                </div>
            </div>
        </div>
    );
}
