'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { sendChatMessage, type ChatMessage as OpenAIChatMessage } from '@/services/openaiService';
import {
    saveChatMessage,
    getChatHistory,
    createChatSession,
    getUserChatSessions,
    deleteChatSession,
    updateChatSessionTitle,
    type ChatSession,
    type ChatMessage as DBChatMessage,
} from '@/lib/database';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    MessageSquare,
    Plus,
    Send,
    Bot,
    User,
    Loader2,
    Trash2,
    Menu,
    X,
    Sparkles,
    ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
};

export default function ChatPage() {
    const t = useTranslations('chat');
    const { userData } = useAuth();

    // State
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoadingSessions, setIsLoadingSessions] = useState(true);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Load sessions on mount
    useEffect(() => {
        if (userData?.uid) {
            loadSessions();
        }
    }, [userData?.uid]);

    const loadSessions = async () => {
        if (!userData?.uid) return;
        setIsLoadingSessions(true);
        try {
            const userSessions = await getUserChatSessions(userData.uid);
            setSessions(userSessions);

            // Auto-select first session or create new one
            if (userSessions.length > 0) {
                selectSession(userSessions[0].id);
            }
        } catch (error) {
            console.error('Failed to load sessions:', error);
        } finally {
            setIsLoadingSessions(false);
        }
    };

    const selectSession = async (sessionId: string) => {
        if (!userData?.uid) return;
        setCurrentSessionId(sessionId);
        setMessages([]);

        try {
            const history = await getChatHistory(userData.uid, sessionId);
            const loadedMessages: Message[] = history.map(msg => ({
                id: msg.id || Date.now().toString(),
                role: msg.role,
                content: msg.content,
                timestamp: new Date(msg.createdAt).getTime(),
            }));
            setMessages(loadedMessages);
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }

        setIsSidebarOpen(false);
    };

    const createNewChat = async () => {
        if (!userData?.uid) return;

        try {
            const sessionId = await createChatSession(userData.uid, t('newChat'));
            setCurrentSessionId(sessionId);
            setMessages([]);
            await loadSessions();
            setIsSidebarOpen(false);
        } catch (error) {
            console.error('Failed to create session:', error);
            toast.error(t('errorCreateSession'));
        }
    };

    const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(t('confirmDelete'))) return;

        try {
            await deleteChatSession(sessionId);
            if (currentSessionId === sessionId) {
                setCurrentSessionId(null);
                setMessages([]);
            }
            await loadSessions();
            toast.success(t('chatDeleted'));
        } catch (error) {
            console.error('Failed to delete session:', error);
            toast.error(t('errorDelete'));
        }
    };

    // Auto-scroll
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 150) + 'px';
        }
    }, [input]);

    const handleSend = async () => {
        if (!input.trim() || isLoading || !userData?.uid) return;

        // Create session if none exists
        let sessionId = currentSessionId;
        if (!sessionId) {
            try {
                sessionId = await createChatSession(userData.uid, input.slice(0, 50) + '...');
                setCurrentSessionId(sessionId);
                await loadSessions();
            } catch (error) {
                console.error('Failed to create session:', error);
                toast.error(t('errorCreateSession'));
                return;
            }
        }

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: Date.now(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        // Save user message to database
        try {
            await saveChatMessage({
                userId: userData.uid,
                sessionId: sessionId,
                role: 'user',
                content: userMsg.content,
                createdAt: new Date().toISOString(),
            });

            // Update session title if it's the first message
            if (messages.length === 0) {
                await updateChatSessionTitle(sessionId, userMsg.content.slice(0, 50));
                await loadSessions();
            }
        } catch (error) {
            console.error('Failed to save user message:', error);
        }

        try {
            // Build chat history for OpenAI
            const chatHistory: OpenAIChatMessage[] = [...messages, userMsg].map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content,
            }));

            const responseText = await sendChatMessage(chatHistory);

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: responseText,
                timestamp: Date.now(),
            };

            setMessages(prev => [...prev, aiMsg]);

            // Save AI response to database
            await saveChatMessage({
                userId: userData.uid,
                sessionId: sessionId,
                role: 'assistant',
                content: aiMsg.content,
                createdAt: new Date().toISOString(),
            });
        } catch (error) {
            console.error('Chat error:', error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: t('errorMessage'),
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, errorMsg]);
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

    if (!userData) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-6rem)] overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                className={cn(
                    "fixed lg:relative inset-y-0 left-0 z-50 w-72 bg-dark-card border-r border-white/5 flex flex-col",
                    "lg:translate-x-0 transition-transform duration-300",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Sidebar Header */}
                <div className="p-4 border-b border-white/5">
                    <button
                        onClick={createNewChat}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-dark font-semibold rounded-xl hover:bg-primary/90 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        {t('newChat')}
                    </button>
                </div>

                {/* Sessions List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {isLoadingSessions ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted" />
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-8 text-muted text-sm">
                            {t('noChats')}
                        </div>
                    ) : (
                        sessions.map((session) => (
                            <button
                                key={session.id}
                                onClick={() => selectSession(session.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all group",
                                    currentSessionId === session.id
                                        ? "bg-primary/10 text-white"
                                        : "hover:bg-white/5 text-muted"
                                )}
                            >
                                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                                <span className="flex-1 truncate text-sm">
                                    {session.title || t('newChat')}
                                </span>
                                <button
                                    onClick={(e) => handleDeleteSession(session.id, e)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                                >
                                    <Trash2 className="w-4 h-4 text-red-400" />
                                </button>
                            </button>
                        ))
                    )}
                </div>

                {/* Mobile Close Button */}
                <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="lg:hidden absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg"
                >
                    <X className="w-5 h-5" />
                </button>
            </motion.aside>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Chat Header */}
                <div className="flex items-center gap-4 p-4 border-b border-white/5 bg-dark-card/50">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="lg:hidden p-2 hover:bg-white/10 rounded-lg"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-semibold text-white">{t('title')}</h1>
                            <p className="text-xs text-muted">{t('subtitle')}</p>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-3xl mx-auto p-4 space-y-6">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-20">
                                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-6">
                                    <Sparkles className="w-10 h-10 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">{t('welcomeTitle')}</h3>
                                <p className="text-muted max-w-md mb-8">{t('welcomeMessage')}</p>

                                {/* Quick Prompts */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                                    {[t('prompt1'), t('prompt2'), t('prompt3'), t('prompt4')].map((prompt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setInput(prompt)}
                                            className="p-3 text-left text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-muted hover:text-white transition-all group"
                                        >
                                            <span className="flex items-center gap-2">
                                                {prompt}
                                                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "flex gap-4",
                                        msg.role === 'user' ? "flex-row-reverse" : ""
                                    )}
                                >
                                    {/* Avatar */}
                                    <div className={cn(
                                        "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                                        msg.role === 'user'
                                            ? "bg-purple-500/20"
                                            : "bg-gradient-to-br from-primary to-purple-600"
                                    )}>
                                        {msg.role === 'user' ? (
                                            <User className="w-5 h-5 text-purple-400" />
                                        ) : (
                                            <Bot className="w-5 h-5 text-white" />
                                        )}
                                    </div>

                                    {/* Message Bubble */}
                                    <div className={cn(
                                        "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                                        msg.role === 'user'
                                            ? "bg-purple-600 text-white rounded-tr-sm"
                                            : "bg-white/5 text-gray-200 rounded-tl-sm border border-white/5"
                                    )}>
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                </motion.div>
                            ))
                        )}

                        {/* Loading */}
                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex gap-4"
                            >
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-3 border border-white/5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-white/5 bg-dark-card/50">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex gap-3 items-end">
                            <div className="flex-1 relative">
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={t('placeholder')}
                                    disabled={isLoading}
                                    rows={1}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 resize-none transition-all"
                                    style={{ minHeight: '48px', maxHeight: '150px' }}
                                />
                            </div>
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
                                    input.trim() && !isLoading
                                        ? "bg-primary hover:bg-primary/90 text-dark"
                                        : "bg-white/10 text-muted cursor-not-allowed"
                                )}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-muted/50 text-center mt-2">
                            {t('disclaimer')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
