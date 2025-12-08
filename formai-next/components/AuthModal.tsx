"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { GlassCard } from "./ui/GlassCard";
import { Button } from "./ui/Button";
import { X, Mail, Lock, User, ArrowRight } from "lucide-react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAuthSuccess: (user: { name: string; email: string }) => void;
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const t = useTranslations('auth');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (mode === 'signin') {
                // Sign In
                const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
                toast.success(t('loginSuccess'));
                onAuthSuccess({
                    name: userCredential.user.displayName || 'Forma Creator',
                    email: userCredential.user.email || formData.email
                });
            } else {
                // Sign Up
                const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                const user = userCredential.user;

                // Update profile with name
                await updateProfile(user, {
                    displayName: formData.name,
                });

                // Create user document in Firestore
                await setDoc(doc(db, 'users', user.uid), {
                    uid: user.uid,
                    email: user.email,
                    displayName: formData.name,
                    photoURL: user.photoURL,
                    credits: 10, // Free credits for new users
                    createdAt: new Date().toISOString(),
                    role: 'user',
                });

                toast.success(t('registerSuccess'));
                onAuthSuccess({
                    name: formData.name,
                    email: formData.email
                });
            }
        } catch (error: any) {
            console.error('Auth error:', error);
            toast.error(error.message || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setIsLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            const user = userCredential.user;

            // Create/update user document in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                credits: 10,
                createdAt: new Date().toISOString(),
                role: 'user',
            }, { merge: true });

            toast.success(t('loginSuccess'));
            onAuthSuccess({
                name: user.displayName || 'Forma Creator',
                email: user.email || ''
            });
        } catch (error: any) {
            console.error('Google auth error:', error);
            toast.error(error.message || 'Google authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md">
                <GlassCard className="p-0 overflow-hidden border-white/20 shadow-2xl shadow-primary/10 bg-[#0a0a0a]/80">

                    {/* Header / Tabs */}
                    <div className="flex border-b border-white/10">
                        <button
                            onClick={() => setMode('signin')}
                            className={`flex-1 py-4 text-sm font-medium transition-colors ${mode === 'signin' ? 'bg-white/5 text-white shadow-[inset_0_-2px_0_0_#00C4CC]' : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {t('signIn')}
                        </button>
                        <button
                            onClick={() => setMode('signup')}
                            className={`flex-1 py-4 text-sm font-medium transition-colors ${mode === 'signup' ? 'bg-white/5 text-white shadow-[inset_0_-2px_0_0_#00C4CC]' : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {t('signUp')}
                        </button>
                    </div>

                    <div className="p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold mb-2 tracking-tight">
                                {mode === 'signin' ? t('welcomeBackShort') : t('createAccount')}
                            </h2>
                            <p className="text-gray-400 text-sm">
                                {mode === 'signin'
                                    ? t('enterCredentials')
                                    : t('joinCreators')}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {mode === 'signup' && (
                                <div className="space-y-1">
                                    <div className="relative">
                                        <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                                        <input
                                            type="text"
                                            placeholder={t('fullName')}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                                    <input
                                        type="email"
                                        placeholder={t('emailAddress')}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                                    <input
                                        type="password"
                                        placeholder={t('password')}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full mt-2 h-12 text-md" disabled={isLoading}>
                                {isLoading ? t('loading') : mode === 'signin' ? t('signIn') : t('signUp')} <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </form>

                        <div className="relative my-6 flex items-center gap-4">
                            <div className="h-px bg-white/10 flex-1"></div>
                            <span className="text-[10px] uppercase text-gray-500 font-medium tracking-widest">{t('or')}</span>
                            <div className="h-px bg-white/10 flex-1"></div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={handleGoogleAuth}
                                disabled={isLoading}
                                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-medium hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                                {t('continueWithGoogle')}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </GlassCard>
            </div>
        </div>
    );
}