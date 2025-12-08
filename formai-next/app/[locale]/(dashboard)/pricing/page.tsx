'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Check } from 'lucide-react';

interface CreditPack {
    id: string;
    credits: number;
    price: number; // Price in EGP
    popular?: boolean;
}

const creditPacks: CreditPack[] = [
    {
        id: 'starter',
        credits: 100,
        price: 500, // 500 EGP
    },
    {
        id: 'pro',
        credits: 500,
        price: 2000, // 2000 EGP
        popular: true,
    },
    {
        id: 'enterprise',
        credits: 1000,
        price: 3500, // 3500 EGP
    },
];

export default function PricingPage() {
    const t = useTranslations('pricing');
    const { userData } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);

    const handlePurchase = async (pack: CreditPack) => {
        if (!userData) {
            toast.error(t('loginRequired'));
            router.push('/login');
            return;
        }

        setLoading(pack.id);

        try {
            const response = await fetch('/api/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    packId: pack.id,
                    userId: userData.uid,
                    userEmail: userData.email,
                    userPhone: userData.phoneNumber || undefined,
                }),
            });

            const result = await response.json();

            if (result.success && result.data?.url) {
                window.location.href = result.data.url;
            } else {
                toast.error(t('checkoutFailed'));
            }
        } catch (error) {
            console.error('Checkout error:', error);
            toast.error(t('unexpectedError'));
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-dark py-16 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        {t('title')}
                    </h1>
                    <p className="text-xl text-muted max-w-2xl mx-auto">
                        {t('subtitle')}
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {creditPacks.map((pack) => (
                        <GlassCard
                            key={pack.id}
                            className={`relative p-8 ${pack.popular ? 'border-2 border-primary' : ''
                                }`}
                        >
                            {pack.popular && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-primary text-dark px-4 py-1 rounded-full text-sm font-semibold">
                                        {t('popular')}
                                    </span>
                                </div>
                            )}

                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-bold text-white mb-2 capitalize">
                                    {pack.id}
                                </h3>
                                <div className="flex items-baseline justify-center gap-2 mb-4">
                                    <span className="text-5xl font-bold text-primary">
                                        {pack.price}
                                    </span>
                                    <span className="text-lg text-muted">EGP</span>
                                </div>
                                <p className="text-muted">
                                    {pack.credits} {t('credits')}
                                </p>
                            </div>

                            <ul className="space-y-4 mb-8">
                                <li className="flex items-start gap-3 text-dim">
                                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                    <span>{t('feature1')}</span>
                                </li>
                                <li className="flex items-start gap-3 text-dim">
                                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                    <span>{t('feature2')}</span>
                                </li>
                                <li className="flex items-start gap-3 text-dim">
                                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                    <span>{t('feature3')}</span>
                                </li>
                            </ul>

                            <Button
                                onClick={() => handlePurchase(pack)}
                                disabled={loading !== null}
                                isLoading={loading === pack.id}
                                className="w-full"
                                variant={pack.popular ? 'primary' : 'secondary'}
                            >
                                {t('buyNow')}
                            </Button>
                        </GlassCard>
                    ))}
                </div>
            </div>
        </div>
    );
}
