'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { CreditAdjustmentModal } from '@/components/admin/CreditAdjustmentModal';
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';
import { Link, useRouter } from '@/i18n/navigation';
import {
    ArrowLeft,
    Mail,
    Calendar,
    Coins,
    Shield,
    Ban,
    CheckCircle,
    Trash2,
    Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string | null;
    credits: number;
    role: 'admin' | 'user';
    createdAt: string;
    suspended?: boolean;
    suspendedReason?: string;
}

interface Transaction {
    id: string;
    amount: number;
    type: string;
    reason?: string;
    createdAt: string;
}

export default function UserDetailPage() {
    const params = useParams();
    const userId = params.userId as string;
    const t = useTranslations('admin');
    const { user: authUser } = useAuth();
    const router = useRouter();

    const [userData, setUserData] = useState<User | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const [creditModal, setCreditModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [suspendModal, setSuspendModal] = useState<{ open: boolean; action: 'suspend' | 'unsuspend' }>({ open: false, action: 'suspend' });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        async function fetchUser() {
            if (!authUser) return;

            try {
                const token = await authUser.getIdToken();
                const response = await fetch(`/api/admin/users/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.ok) {
                    const data = await response.json();
                    setUserData(data.user);
                    setTransactions(data.transactions || []);
                } else if (response.status === 404) {
                    toast.error(t('userNotFound'));
                    router.push('/admin/users');
                }
            } catch (error) {
                console.error('Failed to fetch user:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchUser();
    }, [authUser, userId, router, t]);

    const handleCreditAdjustment = async (amount: number, reason: string, type: 'add' | 'deduct') => {
        if (!authUser) return;

        setActionLoading(true);
        try {
            const token = await authUser.getIdToken();
            const response = await fetch(`/api/admin/users/${userId}/credits`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ amount, reason, type }),
            });

            if (response.ok) {
                const data = await response.json();
                setUserData(prev => prev ? { ...prev, credits: data.newCredits } : null);
                toast.success(t('creditsAdjusted'));
                setCreditModal(false);

                // Refresh transactions
                const userResponse = await fetch(`/api/admin/users/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    setTransactions(userData.transactions || []);
                }
            } else {
                toast.error(t('actionError'));
            }
        } catch (error) {
            toast.error(t('actionError'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleSuspend = async () => {
        if (!authUser) return;

        setActionLoading(true);
        try {
            const token = await authUser.getIdToken();
            const response = await fetch(`/api/admin/users/${userId}/suspend`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: suspendModal.action,
                    reason: 'Suspended by admin',
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setUserData(data.user);
                toast.success(suspendModal.action === 'suspend' ? t('userSuspended') : t('userUnsuspended'));
            } else {
                toast.error(t('actionError'));
            }
        } catch (error) {
            toast.error(t('actionError'));
        } finally {
            setActionLoading(false);
            setSuspendModal({ open: false, action: 'suspend' });
        }
    };

    const handleDelete = async () => {
        if (!authUser) return;

        setActionLoading(true);
        try {
            const token = await authUser.getIdToken();
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                toast.success(t('userDeleted'));
                router.push('/admin/users');
            } else {
                toast.error(t('deleteError'));
            }
        } catch (error) {
            toast.error(t('deleteError'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleRoleChange = async () => {
        if (!authUser || !userData) return;

        const newRole = userData.role === 'admin' ? 'user' : 'admin';

        try {
            const token = await authUser.getIdToken();
            const response = await fetch(`/api/admin/users/${userId}/role`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role: newRole }),
            });

            if (response.ok) {
                const data = await response.json();
                setUserData(data.user);
                toast.success(newRole === 'admin' ? t('promotedToAdmin') : t('demotedToUser'));
            } else {
                const data = await response.json();
                toast.error(data.error || t('actionError'));
            }
        } catch (error) {
            toast.error(t('actionError'));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400">{t('userNotFound')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/users">
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                    </button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white">{t('userDetails')}</h1>
                </div>
            </div>

            {/* User Profile Card */}
            <GlassCard className="p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    {/* Avatar */}
                    {userData.photoURL ? (
                        <img src={userData.photoURL} alt="" className="w-24 h-24 rounded-full" />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl">
                            {(userData.displayName || userData.email || 'U')[0].toUpperCase()}
                        </div>
                    )}

                    {/* Info */}
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-white">{userData.displayName || 'No name'}</h2>
                        <div className="flex flex-wrap gap-4 mt-3 text-sm">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Mail className="w-4 h-4" />
                                <span>{userData.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <Calendar className="w-4 h-4" />
                                <span>{t('joined')}: {new Date(userData.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${userData.role === 'admin'
                                    ? 'bg-yellow-500/10 text-yellow-400'
                                    : 'bg-gray-500/10 text-gray-400'
                                }`}>
                                {userData.role === 'admin' ? t('adminRole') : t('userRole')}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${userData.suspended
                                    ? 'bg-red-500/10 text-red-400'
                                    : 'bg-green-500/10 text-green-400'
                                }`}>
                                {userData.suspended ? t('suspended') : t('active')}
                            </span>
                        </div>
                    </div>

                    {/* Credits */}
                    <div className="text-center p-6 bg-primary/5 rounded-xl border border-primary/20">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Coins className="w-5 h-5 text-primary" />
                            <span className="text-gray-400">{t('credits')}</span>
                        </div>
                        <p className="text-4xl font-bold text-primary">{userData.credits}</p>
                    </div>
                </div>
            </GlassCard>

            {/* Actions */}
            <GlassCard className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">{t('actions')}</h3>
                <div className="flex flex-wrap gap-3">
                    <Button
                        variant="primary"
                        onClick={() => setCreditModal(true)}
                    >
                        <Coins className="w-4 h-4 mr-2" />
                        {t('adjustCredits')}
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleRoleChange}
                    >
                        <Shield className="w-4 h-4 mr-2" />
                        {userData.role === 'admin' ? t('demoteToUser') : t('promoteToAdmin')}
                    </Button>
                    <Button
                        variant={userData.suspended ? 'primary' : 'secondary'}
                        onClick={() => setSuspendModal({
                            open: true,
                            action: userData.suspended ? 'unsuspend' : 'suspend'
                        })}
                    >
                        {userData.suspended ? (
                            <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                {t('unsuspend')}
                            </>
                        ) : (
                            <>
                                <Ban className="w-4 h-4 mr-2" />
                                {t('suspend')}
                            </>
                        )}
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => setDeleteModal(true)}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('deleteUser')}
                    </Button>
                </div>
            </GlassCard>

            {/* Transaction History */}
            <GlassCard className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">{t('transactionHistory')}</h3>
                {transactions.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">{t('noTransactions')}</p>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                                <div>
                                    <p className="text-white font-medium capitalize">{tx.type}</p>
                                    {tx.reason && <p className="text-gray-400 text-sm">{tx.reason}</p>}
                                    <p className="text-gray-500 text-xs">
                                        {new Date(typeof tx.createdAt === 'string' ? tx.createdAt : tx.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <span className={`font-bold ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {tx.amount >= 0 ? '+' : ''}{tx.amount}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </GlassCard>

            {/* Modals */}
            <CreditAdjustmentModal
                isOpen={creditModal}
                onClose={() => setCreditModal(false)}
                onSubmit={handleCreditAdjustment}
                userName={userData.displayName || userData.email}
                currentCredits={userData.credits}
                isLoading={actionLoading}
            />

            <ConfirmationModal
                isOpen={suspendModal.open}
                onClose={() => setSuspendModal({ open: false, action: 'suspend' })}
                onConfirm={handleSuspend}
                title={suspendModal.action === 'suspend' ? t('confirmSuspendUser') : t('confirmUnsuspendUser')}
                message={suspendModal.action === 'suspend'
                    ? t('suspendUserMessage', { name: userData.displayName || userData.email })
                    : t('unsuspendUserMessage', { name: userData.displayName || userData.email })}
                confirmText={suspendModal.action === 'suspend' ? t('suspend') : t('unsuspend')}
                cancelText={t('cancel')}
                variant={suspendModal.action === 'suspend' ? 'danger' : 'primary'}
                isLoading={actionLoading}
            />

            <ConfirmationModal
                isOpen={deleteModal}
                onClose={() => setDeleteModal(false)}
                onConfirm={handleDelete}
                title={t('confirmDeleteUser')}
                message={t('deleteUserMessage', { name: userData.displayName || userData.email })}
                confirmText={t('delete')}
                cancelText={t('cancel')}
                variant="danger"
                isLoading={actionLoading}
            />
        </div>
    );
}
