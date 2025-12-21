'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslations } from 'next-intl';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { Wallet, Plus, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';

interface CreditTransaction {
    id: string;
    amount: number;
    type: 'purchase' | 'deduction' | 'adjustment';
    createdAt: Date;
    stripeSessionId?: string;
    priceId?: string;
}

export default function CreditsPage() {
    const t = useTranslations('credits');
    const { userData } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();
    const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userData) return;

        const fetchTransactions = async () => {
            try {
                const txRef = collection(db, 'users', userData.uid, 'creditTransactions');
                const q = query(txRef, orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(q);

                const txs = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                })) as CreditTransaction[];

                setTransactions(txs);
            } catch (error) {
                console.error('Error fetching transactions:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [userData]);

    if (!userData) {
        return <div className={cn("p-8", isDark ? "text-white" : "text-gray-900")}>{t('loginRequired')}</div>;
    }

    return (
        <div className={cn("min-h-screen p-4 md:p-8", isDark ? "bg-dark" : "bg-gray-50")}>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className={cn("text-3xl md:text-4xl font-bold mb-2", isDark ? "text-white" : "text-gray-900")}>
                        {t('title')}
                    </h1>
                    <p className={cn(isDark ? "text-muted" : "text-gray-500")}>{t('subtitle')}</p>
                </div>

                {/* Balance Card */}
                <GlassCard className="p-6 md:p-8 mb-8">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                                <Wallet className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <p className={cn("text-sm mb-1", isDark ? "text-muted" : "text-gray-500")}>{t('currentBalance')}</p>
                                <p className={cn("text-4xl font-bold", isDark ? "text-white" : "text-gray-900")}>
                                    {userData.credits || 0}
                                    <span className="text-lg text-primary ml-2">{t('credits')}</span>
                                </p>
                            </div>
                        </div>

                        <Button
                            onClick={() => router.push('/pricing')}
                            variant="primary"
                            className="flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            {t('buyMore')}
                        </Button>
                    </div>
                </GlassCard>

                {/* Transaction History */}
                <div className="mb-4">
                    <h2 className={cn("text-2xl font-bold mb-4 flex items-center gap-2", isDark ? "text-white" : "text-gray-900")}>
                        <Clock className="w-6 h-6" />
                        {t('history')}
                    </h2>
                </div>

                {loading ? (
                    <GlassCard className="p-8 text-center">
                        <p className={cn(isDark ? "text-muted" : "text-gray-500")}>{t('loading')}</p>
                    </GlassCard>
                ) : transactions.length === 0 ? (
                    <GlassCard className="p-8 text-center">
                        <p className={cn("mb-4", isDark ? "text-muted" : "text-gray-500")}>{t('noHistory')}</p>
                        <Button onClick={() => router.push('/pricing')} variant="secondary">
                            {t('getStarted')}
                        </Button>
                    </GlassCard>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((tx) => (
                            <GlassCard key={tx.id} className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'purchase'
                                                    ? 'bg-green-500/20'
                                                    : 'bg-red-500/20'
                                                }`}
                                        >
                                            {tx.type === 'purchase' ? (
                                                <Plus className="w-5 h-5 text-green-400" />
                                            ) : (
                                                <span className="text-red-400 text-sm">-</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                                                {tx.type === 'purchase'
                                                    ? t('typePurchase')
                                                    : tx.type === 'deduction'
                                                        ? t('typeDeduction')
                                                        : t('typeAdjustment')}
                                            </p>
                                            <p className={cn("text-xs", isDark ? "text-muted" : "text-gray-500")}>
                                                {tx.createdAt.toLocaleDateString()} {tx.createdAt.toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div
                                        className={`text-lg font-bold ${tx.type === 'purchase' ? 'text-green-400' : 'text-red-400'
                                            }`}
                                    >
                                        {tx.type === 'purchase' ? '+' : '-'}
                                        {tx.amount}
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
