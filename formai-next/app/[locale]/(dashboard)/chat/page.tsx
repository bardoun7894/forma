'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { sendChatMessage, type ChatMessage as OpenAIChatMessage } from '@/services/openaiService';
import {
    saveChatMessage,
    getChatHistory,
    createChatSession,
    getUserChatSessions,
    deleteChatSession,
    updateChatSessionTitle,
    type ChatSession,
} from '@/lib/database';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    MessageSquare,
    Plus,
    Send,
    Bot,
    User,
    Loader2,
    Trash2,
    Sparkles,
    ChevronRight,
    History,
    ChevronDown,
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
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // State
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [isLoadingSessions, setIsLoadingSessions] = useState(true);
    const [showSessionDropdown, setShowSessionDropdown] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowSessionDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

            // Auto-select first session
            if (userSessions.length > 0 && !currentSessionId) {
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
        setShowSessionDropdown(false);

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
    };

    const createNewChat = async () => {
        if (!userData?.uid) return;

        try {
            const sessionId = await createChatSession(userData.uid, t('newChat'));
            setCurrentSessionId(sessionId);
            setMessages([]);
            setShowSessionDropdown(false);
            await loadSessions();
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

    const currentSession = sessions.find(s => s.id === currentSessionId);

    if (!userData) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-6.5rem)] lg:h-[calc(100vh-4rem)]">
            {/* Header */}
            <div className={cn("flex items-center justify-between gap-4 pb-4 border-b", isDark ? "border-white/10" : "border-gray-200")}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className={cn("font-semibold text-lg", isDark ? "text-white" : "text-gray-900")}>{t('title')}</h1>
                        <p className={cn("text-xs hidden sm:block", isDark ? "text-muted" : "text-gray-500")}>{t('subtitle')}</p>
                    </div>
                </div>

                {/* Session Selector Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowSessionDropdown(!showSessionDropdown)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-all",
                            isDark
                                ? "bg-white/5 hover:bg-white/10 border-white/10 text-muted hover:text-white"
                                : "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-600 hover:text-gray-900"
                        )}
                    >
                        <History className="w-4 h-4" />
                        <span className="hidden sm:inline max-w-[120px] truncate">
                            {currentSession?.title || t('newChat')}
                        </span>
                        <ChevronDown className={cn("w-4 h-4 transition-transform", showSessionDropdown && "rotate-180")} />
                    </button>

                    {showSessionDropdown && (
                        <div className={cn(
                            "absolute right-0 rtl:right-auto rtl:left-0 top-full mt-2 w-64 border rounded-xl shadow-2xl z-50 overflow-hidden",
                            isDark ? "bg-[#12121a] border-white/10" : "bg-white border-gray-200"
                        )}>
                            {/* New Chat Button */}
                            <button
                                onClick={createNewChat}
                                className={cn(
                                    "w-full flex items-center gap-2 px-4 py-3 text-sm text-primary hover:bg-primary/10 border-b transition-all",
                                    isDark ? "border-white/10" : "border-gray-200"
                                )}
                            >
                                <Plus className="w-4 h-4" />
                                {t('newChat')}
                            </button>

                            {/* Sessions List */}
                            <div className="max-h-64 overflow-y-auto">
                                {isLoadingSessions ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className={cn("w-5 h-5 animate-spin", isDark ? "text-muted" : "text-gray-400")} />
                                    </div>
                                ) : sessions.length === 0 ? (
                                    <div className={cn("text-center py-4 text-sm", isDark ? "text-muted" : "text-gray-500")}>
                                        {t('noChats')}
                                    </div>
                                ) : (
                                    sessions.map((session) => (
                                        <button
                                            key={session.id}
                                            onClick={() => selectSession(session.id)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-3 text-left transition-all group",
                                                currentSessionId === session.id
                                                    ? isDark ? "bg-primary/10 text-white" : "bg-primary/10 text-gray-900"
                                                    : isDark ? "hover:bg-white/5 text-muted" : "hover:bg-gray-50 text-gray-600"
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
                                                <Trash2 className="w-3 h-3 text-red-400" />
                                            </button>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto py-4">
                <div className="max-w-3xl mx-auto space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center py-12">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-4">
                                <Sparkles className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className={cn("text-lg font-semibold mb-2", isDark ? "text-white" : "text-gray-900")}>{t('welcomeTitle')}</h3>
                            <p className={cn("text-sm max-w-md mb-6", isDark ? "text-muted" : "text-gray-500")}>{t('welcomeMessage')}</p>

                            {/* Quick Prompts */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
                                {[t('prompt1'), t('prompt2'), t('prompt3'), t('prompt4')].map((prompt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setInput(prompt)}
                                        className={cn(
                                            "p-3 text-left text-sm border rounded-xl transition-all group",
                                            isDark
                                                ? "bg-white/5 hover:bg-white/10 border-white/10 text-muted hover:text-white"
                                                : "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-600 hover:text-gray-900"
                                        )}
                                    >
                                        <span className="flex items-center gap-2">
                                            <span className="flex-1 line-clamp-1">{prompt}</span>
                                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
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
                                    "flex gap-3",
                                    msg.role === 'user' ? "flex-row-reverse" : ""
                                )}
                            >
                                {/* Avatar */}
                                <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                    msg.role === 'user'
                                        ? "bg-purple-500/20"
                                        : "bg-gradient-to-br from-primary to-purple-600"
                                )}>
                                    {msg.role === 'user' ? (
                                        <User className="w-4 h-4 text-purple-400" />
                                    ) : (
                                        <Bot className="w-4 h-4 text-white" />
                                    )}
                                </div>

                                {/* Message Bubble */}
                                <div className={cn(
                                    "max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                                    msg.role === 'user'
                                        ? "bg-purple-600 text-white rounded-tr-sm"
                                        : isDark
                                            ? "bg-white/5 text-gray-200 rounded-tl-sm border border-white/5"
                                            : "bg-gray-100 text-gray-800 rounded-tl-sm border border-gray-200"
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
                            className="flex gap-3"
                        >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className={cn(
                                "rounded-2xl rounded-tl-sm px-4 py-3 border",
                                isDark ? "bg-white/5 border-white/5" : "bg-gray-100 border-gray-200"
                            )}>
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
            <div className={cn("pt-4 border-t", isDark ? "border-white/10" : "border-gray-200")}>
                <div className="max-w-3xl mx-auto">
                    <div className="flex gap-2 items-end">
                        <div className="flex-1 relative">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={t('placeholder')}
                                disabled={isLoading}
                                rows={1}
                                className={cn(
                                    "w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 resize-none transition-all text-sm",
                                    isDark
                                        ? "bg-white/5 border-white/10 text-white placeholder-white/30"
                                        : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
                                )}
                                style={{ minHeight: '48px', maxHeight: '120px' }}
                            />
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className={cn(
                                "w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
                                input.trim() && !isLoading
                                    ? "bg-primary hover:bg-primary/90 text-dark"
                                    : isDark ? "bg-white/10 text-muted cursor-not-allowed" : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            )}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                    <p className={cn("text-xs text-center mt-2", isDark ? "text-muted/50" : "text-gray-400")}>
                        {t('disclaimer')}
                    </p>
                </div>
            </div>
        </div>
    );
}
