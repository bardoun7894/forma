'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { Loader2, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

// Validation Schema
const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const params = useParams();
    const locale = params.locale as string;
    const t = useTranslations('auth');
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && user) {
            router.push(`/${locale}/dashboard`);
        }
    }, [user, loading, router, locale]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth, data.email, data.password);
            toast.success(t('loginSuccess') || 'Logged in successfully');
            router.push(`/${locale}/dashboard`);
        } catch (error: any) {
            console.error('Login error:', error);
            toast.error(error.message || 'Failed to login');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            toast.success(t('loginSuccess') || 'Logged in successfully');
            router.push(`/${locale}/dashboard`);
        } catch (error: any) {
            console.error('Google login error:', error);
            toast.error(error.message || 'Failed to login with Google');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-panel/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-glow">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">{t('login')}</h1>
                <p className="text-muted text-sm">{t('welcomeBack')}</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Email */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-muted uppercase tracking-wider">{t('email')}</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                        <input
                            {...register('email')}
                            type="email"
                            className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder:text-dim focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            placeholder="name@example.com"
                            dir="ltr" // Email is always LTR
                        />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                </div>

                {/* Password */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-muted uppercase tracking-wider">{t('password')}</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                        <input
                            {...register('password')}
                            type="password"
                            className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder:text-dim focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            placeholder="••••••••"
                            dir="ltr"
                        />
                    </div>
                    {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary-hover text-black font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 mt-6"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : t('login')}
                </button>
            </form>

            <div className="my-6 flex items-center gap-4">
                <div className="h-px bg-white/10 flex-1" />
                <span className="text-xs text-muted">{t('or')}</span>
                <div className="h-px bg-white/10 flex-1" />
            </div>

            {/* Google Login */}
            <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                </svg>
                {t('continueWithGoogle')}
            </button>

            <div className="mt-6 text-center">
                <p className="text-sm text-muted">
                    {t('dontHaveAccount')}{' '}
                    <Link href={`/${locale}/register`} className="text-primary hover:text-primary-hover font-medium">
                        {t('register')}
                    </Link>
                </p>
            </div>
        </div>
    );
}
