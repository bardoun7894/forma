'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { DataTable } from '@/components/admin/DataTable';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatsCard } from '@/components/admin/StatsCard';
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';
import {
    DollarSign,
    CreditCard,
    RefreshCcw,
    AlertCircle,
    TrendingUp,
    Undo2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Payment {
    id: string;
    userId: string;
    amount: number;
    currency: string;
    credits: number;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    createdAt: string;
    isManual?: boolean;
    notes?: string;
}

interface PaymentAnalytics {
    totalRevenue: number;
    totalCredits: number;
    completedCount: number;
    refundedCount: number;
    pendingCount: number;
    revenueByMonth: { month: string; revenue: number }[];
}

export default function AdminPaymentsPage() {
    const t = useTranslations('admin');
    const { user } = useAuth();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed' | 'refunded'>('all');
    const [loading, setLoading] = useState(true);

    const [refundModal, setRefundModal] = useState<{ open: boolean; payment: Payment | null }>({ open: false, payment: null });
    const [actionLoading, setActionLoading] = useState(false);

    const pageSize = 20;

    const fetchPayments = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        try {
            const token = await user.getIdToken();
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pageSize.toString(),
            });

            if (statusFilter !== 'all') params.set('status', statusFilter);

            const response = await fetch(`/api/admin/payments?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setPayments(data.payments);
                setTotal(data.total);
                setAnalytics(data.analytics);
            }
        } catch (error) {
            console.error('Failed to fetch payments:', error);
            toast.error(t('fetchError'));
        } finally {
            setLoading(false);
        }
    }, [user, page, statusFilter, t]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const handleRefund = async () => {
        if (!refundModal.payment || !user) return;

        setActionLoading(true);
        try {
            const token = await user.getIdToken();
            const response = await fetch(`/api/admin/payments/${refundModal.payment.id}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'refund',
                    reason: 'Refunded by admin',
                }),
            });

            if (response.ok) {
                toast.success(t('paymentRefunded'));
                fetchPayments();
            } else {
                const data = await response.json();
                toast.error(data.error || t('refundError'));
            }
        } catch (error) {
            toast.error(t('refundError'));
        } finally {
            setActionLoading(false);
            setRefundModal({ open: false, payment: null });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500/10 text-green-400';
            case 'pending': return 'bg-yellow-500/10 text-yellow-400';
            case 'failed': return 'bg-red-500/10 text-red-400';
            case 'refunded': return 'bg-gray-500/10 text-gray-400';
            default: return 'bg-gray-500/10 text-gray-400';
        }
    };

    const columns = [
        {
            key: 'id',
            header: t('paymentId'),
            render: (p: Payment) => (
                <span className="text-gray-400 font-mono text-xs">{p.id.slice(0, 8)}...</span>
            ),
        },
        {
            key: 'amount',
            header: t('amount'),
            render: (p: Payment) => (
                <span className="text-white font-medium">
                    {p.amount.toLocaleString()} {p.currency}
                </span>
            ),
        },
        {
            key: 'credits',
            header: t('credits'),
            render: (p: Payment) => (
                <span className="text-primary font-medium">{p.credits}</span>
            ),
        },
        {
            key: 'status',
            header: t('status'),
            render: (p: Payment) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(p.status)}`}>
                    {t(p.status)}
                </span>
            ),
        },
        {
            key: 'type',
            header: t('type'),
            render: (p: Payment) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.isManual
                        ? 'bg-purple-500/10 text-purple-400'
                        : 'bg-blue-500/10 text-blue-400'
                    }`}>
                    {p.isManual ? t('manual') : t('payment')}
                </span>
            ),
        },
        {
            key: 'createdAt',
            header: t('date'),
            render: (p: Payment) => (
                <span className="text-gray-400 text-sm">
                    {new Date(p.createdAt).toLocaleDateString()}
                </span>
            ),
        },
        {
            key: 'actions',
            header: t('actions'),
            render: (p: Payment) => (
                <div className="flex items-center gap-2">
                    {p.status === 'completed' && !p.isManual && (
                        <button
                            onClick={() => setRefundModal({ open: true, payment: p })}
                            className="p-2 text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors"
                            title={t('refund')}
                        >
                            <Undo2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">{t('payments')}</h1>
                <p className="text-gray-400 mt-1">{t('paymentsSubtitle')}</p>
            </div>

            {/* Analytics Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title={t('totalRevenue')}
                    value={analytics ? `${analytics.totalRevenue.toLocaleString()} EGP` : '...'}
                    icon={DollarSign}
                    variant="primary"
                />
                <StatsCard
                    title={t('totalCreditsSold')}
                    value={analytics?.totalCredits.toLocaleString() || '...'}
                    icon={CreditCard}
                    variant="default"
                />
                <StatsCard
                    title={t('completedPayments')}
                    value={analytics?.completedCount || '...'}
                    icon={TrendingUp}
                    variant="primary"
                />
                <StatsCard
                    title={t('refundedPayments')}
                    value={analytics?.refundedCount || '...'}
                    icon={RefreshCcw}
                    variant="warning"
                />
            </div>

            {/* Revenue Chart */}
            {analytics && analytics.revenueByMonth.length > 0 && (
                <GlassCard className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4">{t('revenueOverTime')}</h3>
                    <div className="flex items-end gap-4 h-48">
                        {analytics.revenueByMonth.map((item, index) => {
                            const maxRevenue = Math.max(...analytics.revenueByMonth.map(m => m.revenue));
                            const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                            return (
                                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                    <div className="w-full flex flex-col items-center justify-end h-36">
                                        <span className="text-xs text-gray-400 mb-1">
                                            {item.revenue.toLocaleString()}
                                        </span>
                                        <div
                                            className="w-full bg-gradient-to-t from-primary to-primary/50 rounded-t-lg transition-all duration-500"
                                            style={{ height: `${Math.max(height, 5)}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-500">{item.month}</span>
                                </div>
                            );
                        })}
                    </div>
                </GlassCard>
            )}

            {/* Filters */}
            <div className="flex gap-4">
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value as typeof statusFilter);
                        setPage(1);
                    }}
                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary/50"
                >
                    <option value="all">{t('allStatuses')}</option>
                    <option value="completed">{t('completed')}</option>
                    <option value="pending">{t('pending')}</option>
                    <option value="failed">{t('failed')}</option>
                    <option value="refunded">{t('refunded')}</option>
                </select>
            </div>

            {/* Payments Table */}
            <DataTable
                data={payments}
                columns={columns}
                total={total}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                loading={loading}
                emptyMessage={t('noPayments')}
                emptyIcon={<AlertCircle className="w-12 h-12 text-gray-600" />}
            />

            {/* Refund Modal */}
            <ConfirmationModal
                isOpen={refundModal.open}
                onClose={() => setRefundModal({ open: false, payment: null })}
                onConfirm={handleRefund}
                title={t('confirmRefund')}
                message={t('refundMessage', {
                    amount: refundModal.payment?.amount || 0,
                    credits: refundModal.payment?.credits || 0,
                })}
                confirmText={t('refund')}
                cancelText={t('cancel')}
                variant="danger"
                isLoading={actionLoading}
            />
        </div>
    );
}
