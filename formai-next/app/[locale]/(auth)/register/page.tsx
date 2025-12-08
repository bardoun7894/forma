'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

// Validation Schema
const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
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
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        try {
            // Create user
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const user = userCredential.user;

            // Update profile
            await updateProfile(user, {
                displayName: data.name,
            });

            // Create user document in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: data.name,
                photoURL: user.photoURL,
                credits: 10, // Free credits for new users
                createdAt: new Date().toISOString(),
                role: 'user',
            });

            toast.success('Account created successfully!');
            router.push(`/${locale}/dashboard`);
        } catch (error: any) {
            console.error('Registration error:', error);
            toast.error(error.message || 'Failed to create account');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-panel/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-glow">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">{t('register')}</h1>
                <p className="text-muted text-sm">{t('joinToday')}</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Name */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-muted uppercase tracking-wider">{t('name')}</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                        <input
                            {...register('name')}
                            type="text"
                            className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder:text-dim focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            placeholder={t('name')}
                        />
                    </div>
                    {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                </div>

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
                            dir="ltr"
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

                {/* Confirm Password */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-muted uppercase tracking-wider">{t('confirmPassword')}</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                        <input
                            {...register('confirmPassword')}
                            type="password"
                            className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder:text-dim focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            placeholder="••••••••"
                            dir="ltr"
                        />
                    </div>
                    {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>}
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary-hover text-black font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 mt-6"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : t('register')}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-muted">
                    {t('alreadyHaveAccount')}{' '}
                    <Link href={`/${locale}/login`} className="text-primary hover:text-primary-hover font-medium">
                        {t('login')}
                    </Link>
                </p>
            </div>
        </div>
    );
}
