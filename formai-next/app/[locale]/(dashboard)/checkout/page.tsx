'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import {
    ArrowLeft,
    CreditCard,
    Shield,
    Lock,
    Check,
    Sparkles,
    Zap
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// PayPal locale mapping
const getPayPalLocale = (locale: string): string => {
    const localeMap: Record<string, string> = {
        'en': 'en_US',
        'ar': 'ar_EG',
        'fr': 'fr_FR',
        'de': 'de_DE',
        'es': 'es_ES',
    };
    return localeMap[locale] || 'en_US';
};

interface CreditPack {
    id: string;
    credits: number;
    price: number;
    name: string;
    description: string;
}

const creditPacks: Record<string, CreditPack> = {
    starter: {
        id: 'starter',
        credits: 100,
        price: 9.99,
        name: 'Starter Pack',
        description: 'Perfect for trying out our AI tools',
    },
    pro: {
        id: 'pro',
        credits: 500,
        price: 39.99,
        name: 'Pro Pack',
        description: 'Best value for regular creators',
    },
    enterprise: {
        id: 'enterprise',
        credits: 1000,
        price: 69.99,
        name: 'Enterprise Pack',
        description: 'For power users and teams',
    },
};

export default function CheckoutPage() {
    const t = useTranslations('checkout');
    const locale = useLocale();
    const { userData, refreshUserData } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();
    const searchParams = useSearchParams();
    const packId = searchParams.get('pack') || 'starter';

    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [newCredits, setNewCredits] = useState(0);

    const pack = creditPacks[packId] || creditPacks.starter;
    const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const paypalLocale = getPayPalLocale(locale);

    useEffect(() => {
        if (!userData) {
            router.push('/login?redirect=/checkout?pack=' + packId);
        }
    }, [userData, router, packId]);

    if (!paypalClientId) {
        return (
            <div className={cn("min-h-screen flex items-center justify-center", isDark ? "bg-dark" : "bg-gray-50")}>
                <p className="text-red-500">Payment system is not configured.</p>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className={cn("min-h-screen flex items-center justify-center", isDark ? "bg-dark" : "bg-gray-50")}>
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const createOrder = async () => {
        try {
            const response = await fetch('/api/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    packId: pack.id,
                    userId: userData.uid,
                }),
            });

            const data = await response.json();

            if (!data.success || !data.orderId) {
                throw new Error('Failed to create order');
            }

            return data.orderId;
        } catch (error) {
            console.error('Create order error:', error);
            toast.error(t('orderFailed'));
            throw error;
        }
    };

    const onApprove = async (data: { orderID: string }) => {
        setIsProcessing(true);
        try {
            const response = await fetch('/api/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: data.orderID,
                }),
            });

            const result = await response.json();

            if (result.success) {
                setNewCredits(result.credits);
                setPaymentSuccess(true);
                if (refreshUserData) {
                    await refreshUserData();
                }
            } else {
                throw new Error(result.error || 'Capture failed');
            }
        } catch (error) {
            console.error('Capture error:', error);
            toast.error(t('paymentFailed'));
        } finally {
            setIsProcessing(false);
        }
    };

    // Success Screen
    if (paymentSuccess) {
        return (
            <div className={cn("min-h-screen flex items-center justify-center p-4", isDark ? "bg-dark" : "bg-gray-50")}>
                <div className="max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="w-10 h-10 text-green-500" />
                    </div>
                    <h1 className={cn("text-3xl font-bold mb-2", isDark ? "text-white" : "text-gray-900")}>{t('successTitle')}</h1>
                    <p className={cn("mb-6", isDark ? "text-muted" : "text-gray-500")}>{t('successMessage')}</p>

                    <div className={cn("rounded-2xl p-6 mb-8", isDark ? "bg-white/5" : "bg-white border border-gray-200")}>
                        <div className="flex items-center justify-center gap-2 text-primary mb-2">
                            <Sparkles className="w-5 h-5" />
                            <span className="text-lg font-semibold">+{pack.credits} Credits</span>
                        </div>
                        <p className={cn("text-sm", isDark ? "text-muted" : "text-gray-500")}>{t('newBalance')}: <span className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>{newCredits}</span></p>
                    </div>

                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-full py-3 px-4 bg-primary text-dark font-semibold rounded-xl hover:bg-primary/90 transition-all"
                    >
                        {t('goToDashboard')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <PayPalScriptProvider
            options={{
                clientId: paypalClientId,
                currency: 'USD',
                intent: 'capture',
                components: 'buttons',
                enableFunding: 'card',
                locale: paypalLocale,
            }}
        >
            <div className={cn("min-h-screen", isDark ? "bg-dark" : "bg-gray-50")}>
                {/* Processing Overlay */}
                {isProcessing && (
                    <div className={cn("fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50", isDark ? "bg-dark/90" : "bg-white/90")}>
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className={cn("text-lg font-medium", isDark ? "text-white" : "text-gray-900")}>{t('processing')}</p>
                            <p className={cn("text-sm mt-1", isDark ? "text-muted" : "text-gray-500")}>{t('doNotClose')}</p>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className={cn("border-b", isDark ? "border-white/10" : "border-gray-200")}>
                    <div className="max-w-6xl mx-auto px-4 py-4">
                        <Link
                            href="/pricing"
                            className={cn("inline-flex items-center gap-2 transition-colors", isDark ? "text-muted hover:text-white" : "text-gray-500 hover:text-gray-900")}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>{t('backToPricing')}</span>
                        </Link>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-4 py-8 lg:py-16">
                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">

                        {/* Left Side - Order Summary */}
                        <div className="order-2 lg:order-1">
                            <h2 className={cn("text-xl font-semibold mb-6", isDark ? "text-white" : "text-gray-900")}>{t('orderSummary')}</h2>

                            {/* Product Card */}
                            <div className={cn("rounded-2xl p-6 mb-6", isDark ? "bg-white/5" : "bg-white border border-gray-200")}>
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Zap className="w-7 h-7 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={cn("text-lg font-semibold", isDark ? "text-white" : "text-gray-900")}>{pack.name}</h3>
                                        <p className={cn("text-sm mb-2", isDark ? "text-muted" : "text-gray-500")}>{pack.description}</p>
                                        <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-sm">
                                            <CreditCard className="w-3.5 h-3.5" />
                                            {pack.credits} Credits
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>${pack.price}</span>
                                    </div>
                                </div>
                            </div>

                            {/* What's Included */}
                            <div className={cn("rounded-2xl p-6 mb-6", isDark ? "bg-white/5" : "bg-white border border-gray-200")}>
                                <h4 className={cn("text-sm font-medium uppercase tracking-wider mb-4", isDark ? "text-muted" : "text-gray-500")}>{t('whatsIncluded')}</h4>
                                <ul className="space-y-3">
                                    <li className={cn("flex items-center gap-3", isDark ? "text-white" : "text-gray-900")}>
                                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                                            <Check className="w-3 h-3 text-green-500" />
                                        </div>
                                        {t('feature1')}
                                    </li>
                                    <li className={cn("flex items-center gap-3", isDark ? "text-white" : "text-gray-900")}>
                                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                                            <Check className="w-3 h-3 text-green-500" />
                                        </div>
                                        {t('feature2')}
                                    </li>
                                    <li className={cn("flex items-center gap-3", isDark ? "text-white" : "text-gray-900")}>
                                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                                            <Check className="w-3 h-3 text-green-500" />
                                        </div>
                                        {t('feature3')}
                                    </li>
                                    <li className={cn("flex items-center gap-3", isDark ? "text-white" : "text-gray-900")}>
                                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                                            <Check className="w-3 h-3 text-green-500" />
                                        </div>
                                        {t('feature4')}
                                    </li>
                                </ul>
                            </div>

                            {/* Order Total */}
                            <div className={cn("rounded-2xl p-6", isDark ? "bg-white/5" : "bg-white border border-gray-200")}>
                                <div className="flex items-center justify-between mb-3">
                                    <span className={cn(isDark ? "text-muted" : "text-gray-500")}>{t('subtotal')}</span>
                                    <span className={cn(isDark ? "text-white" : "text-gray-900")}>${pack.price}</span>
                                </div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className={cn(isDark ? "text-muted" : "text-gray-500")}>{t('tax')}</span>
                                    <span className={cn(isDark ? "text-white" : "text-gray-900")}>$0.00</span>
                                </div>
                                <div className={cn("border-t pt-3 mt-3", isDark ? "border-white/10" : "border-gray-200")}>
                                    <div className="flex items-center justify-between">
                                        <span className={cn("text-lg font-semibold", isDark ? "text-white" : "text-gray-900")}>{t('total')}</span>
                                        <span className="text-2xl font-bold text-primary">${pack.price}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Payment */}
                        <div className="order-1 lg:order-2">
                            <div className="lg:sticky lg:top-8">
                                <h2 className={cn("text-xl font-semibold mb-6", isDark ? "text-white" : "text-gray-900")}>{t('paymentMethod')}</h2>

                                <div className={cn("rounded-2xl p-6 lg:p-8", isDark ? "bg-white/5" : "bg-white border border-gray-200")}>
                                    {/* Security Header */}
                                    <div className={cn("flex items-center justify-center gap-2 text-sm mb-6 pb-6 border-b", isDark ? "text-muted border-white/10" : "text-gray-500 border-gray-200")}>
                                        <Lock className="w-4 h-4 text-green-500" />
                                        <span>{t('secureCheckout')}</span>
                                    </div>

                                    {/* Single PayPal Button - Handles both PayPal & Cards */}
                                    <div className="mb-6">
                                        <PayPalButtons
                                            style={{
                                                layout: 'vertical',
                                                color: 'gold',
                                                shape: 'rect',
                                                label: 'checkout',
                                                height: 50,
                                                tagline: false,
                                            }}
                                            createOrder={createOrder}
                                            onApprove={onApprove}
                                            onError={(err) => {
                                                console.error('PayPal error:', err);
                                                toast.error(t('paymentError'));
                                            }}
                                            onCancel={() => {
                                                toast.error(t('paymentCancelled'));
                                            }}
                                        />
                                    </div>

                                    {/* Accepted Methods */}
                                    <div className="text-center mb-6">
                                        <p className={cn("text-xs mb-3", isDark ? "text-muted" : "text-gray-500")}>{t('acceptedMethods')}</p>
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-12 h-7 bg-[#003087] rounded flex items-center justify-center">
                                                <span className="text-[10px] font-bold text-white italic">PayPal</span>
                                            </div>
                                            <div className="w-10 h-7 bg-white rounded flex items-center justify-center">
                                                <span className="text-[10px] font-bold text-blue-600">VISA</span>
                                            </div>
                                            <div className="w-10 h-7 bg-white rounded flex items-center justify-center">
                                                <div className="flex">
                                                    <div className="w-3 h-3 bg-red-500 rounded-full -mr-1"></div>
                                                    <div className="w-3 h-3 bg-yellow-500 rounded-full opacity-80"></div>
                                                </div>
                                            </div>
                                            <div className="w-10 h-7 bg-white rounded flex items-center justify-center">
                                                <span className="text-[9px] font-bold text-blue-800">AMEX</span>
                                            </div>
                                            <div className="w-10 h-7 bg-gradient-to-r from-orange-500 to-red-500 rounded flex items-center justify-center">
                                                <span className="text-[8px] font-bold text-white">Discover</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Security Badges */}
                                    <div className={cn("grid grid-cols-2 gap-3 pt-4 border-t", isDark ? "border-white/10" : "border-gray-200")}>
                                        <div className={cn("flex items-center gap-2 text-xs", isDark ? "text-muted" : "text-gray-500")}>
                                            <Shield className="w-4 h-4 text-green-500" />
                                            <span>{t('buyerProtection')}</span>
                                        </div>
                                        <div className={cn("flex items-center gap-2 text-xs", isDark ? "text-muted" : "text-gray-500")}>
                                            <Lock className="w-4 h-4 text-green-500" />
                                            <span>{t('sslEncryption')}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Money Back Guarantee */}
                                <div className="mt-6 text-center">
                                    <p className={cn("text-sm", isDark ? "text-muted" : "text-gray-500")}>
                                        <Shield className="w-4 h-4 inline-block mr-1 text-primary" />
                                        {t('moneyBackGuarantee')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PayPalScriptProvider>
    );
}
