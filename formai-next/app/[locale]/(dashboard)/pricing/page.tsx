'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { GlassCard } from '@/components/ui/GlassCard';
import { Check, CreditCard, Shield, Lock, ArrowRight, Sparkles } from 'lucide-react';

interface CreditPack {
    id: string;
    credits: number;
    price: number;
    popular?: boolean;
}

const creditPacks: CreditPack[] = [
    {
        id: 'starter',
        credits: 100,
        price: 9.99,
    },
    {
        id: 'pro',
        credits: 500,
        price: 39.99,
        popular: true,
    },
    {
        id: 'enterprise',
        credits: 1000,
        price: 69.99,
    },
];

export default function PricingPage() {
    const t = useTranslations('pricing');
    const { userData } = useAuth();
    const router = useRouter();

    const handleSelectPack = (pack: CreditPack) => {
        if (!userData) {
            toast.error(t('loginRequired'));
            router.push('/login?redirect=/checkout?pack=' + pack.id);
            return;
        }
        router.push(`/checkout?pack=${pack.id}`);
    };

    return (
        <div className="min-h-screen bg-dark py-16 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                        <Sparkles className="w-4 h-4" />
                        <span>{t('badge')}</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        {t('title')}
                    </h1>
                    <p className="text-xl text-muted max-w-2xl mx-auto">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {creditPacks.map((pack) => (
                        <GlassCard
                            key={pack.id}
                            className={`relative p-8 transition-all duration-300 hover:scale-[1.02] ${pack.popular
                                ? 'border-2 border-primary ring-2 ring-primary/20'
                                : 'border border-white/10 hover:border-white/20'
                            }`}
                        >
                            {pack.popular && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-primary text-dark px-4 py-1 rounded-full text-sm font-semibold shadow-lg shadow-primary/30">
                                        {t('popular')}
                                    </span>
                                </div>
                            )}

                            {/* Pack Info */}
                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-bold text-white mb-2 capitalize">
                                    {pack.id}
                                </h3>
                                <div className="flex items-baseline justify-center gap-1 mb-3">
                                    <span className="text-lg text-muted">$</span>
                                    <span className="text-5xl font-bold text-white">
                                        {Math.floor(pack.price)}
                                    </span>
                                    <span className="text-2xl text-muted">
                                        .{String(pack.price).split('.')[1] || '00'}
                                    </span>
                                </div>
                                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium">
                                    <CreditCard className="w-4 h-4" />
                                    {pack.credits} {t('credits')}
                                </div>
                            </div>

                            {/* Features */}
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-start gap-3 text-dim">
                                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Check className="w-3 h-3 text-primary" />
                                    </div>
                                    <span>{t('feature1')}</span>
                                </li>
                                <li className="flex items-start gap-3 text-dim">
                                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Check className="w-3 h-3 text-primary" />
                                    </div>
                                    <span>{t('feature2')}</span>
                                </li>
                                <li className="flex items-start gap-3 text-dim">
                                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Check className="w-3 h-3 text-primary" />
                                    </div>
                                    <span>{t('feature3')}</span>
                                </li>
                            </ul>

                            {/* CTA Button */}
                            <button
                                onClick={() => handleSelectPack(pack)}
                                className={`w-full py-3.5 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 group ${
                                    pack.popular
                                        ? 'bg-primary text-dark hover:bg-primary/90'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                            >
                                <span>{t('getStarted')}</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>

                            {/* Secure Badge */}
                            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted">
                                <Lock className="w-3 h-3" />
                                <span>{t('securePayment')}</span>
                            </div>
                        </GlassCard>
                    ))}
                </div>

                {/* Trust Section */}
                <div className="mt-16 text-center">
                    <div className="inline-flex flex-wrap items-center justify-center gap-6 md:gap-10 text-muted/60 text-sm">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            <span>{t('secureCheckout')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Lock className="w-5 h-5" />
                            <span>{t('sslProtected')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            <span>{t('allCardsAccepted')}</span>
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="flex items-center justify-center gap-3 mt-6">
                        <img src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" alt="PayPal" className="h-6 opacity-50" />
                        <div className="flex items-center gap-1.5">
                            <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center">
                                <span className="text-[10px] font-bold text-white/70">VISA</span>
                            </div>
                            <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center">
                                <div className="flex">
                                    <div className="w-2.5 h-2.5 bg-red-500/70 rounded-full -mr-1"></div>
                                    <div className="w-2.5 h-2.5 bg-yellow-500/70 rounded-full"></div>
                                </div>
                            </div>
                            <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center">
                                <span className="text-[9px] font-bold text-white/70">AMEX</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
