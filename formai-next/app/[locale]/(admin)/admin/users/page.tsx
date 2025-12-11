'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { DataTable } from '@/components/admin/DataTable';
import { SearchInput } from '@/components/admin/SearchInput';
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';
import { CreditAdjustmentModal } from '@/components/admin/CreditAdjustmentModal';
import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import {
    Eye,
    Trash2,
    Ban,
    CheckCircle,
    Shield,
    User as UserIcon,
    Coins,
    Users,
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
}

export default function AdminUsersPage() {
    const t = useTranslations('admin');
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
    const [loading, setLoading] = useState(true);

    // Modals
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
    const [suspendModal, setSuspendModal] = useState<{ open: boolean; user: User | null; action: 'suspend' | 'unsuspend' }>({ open: false, user: null, action: 'suspend' });
    const [creditModal, setCreditModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
    const [actionLoading, setActionLoading] = useState(false);

    const pageSize = 20;

    const fetchUsers = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        try {
            const token = await user.getIdToken();
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pageSize.toString(),
            });

            if (search) params.set('search', search);
            if (roleFilter !== 'all') params.set('role', roleFilter);

            const response = await fetch(`/api/admin/users?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data.users);
                setTotal(data.total);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast.error(t('fetchError'));
        } finally {
            setLoading(false);
        }
    }, [user, page, search, roleFilter, t]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleDelete = async () => {
        if (!deleteModal.user || !user) return;

        setActionLoading(true);
        try {
            const token = await user.getIdToken();
            const response = await fetch(`/api/admin/users/${deleteModal.user.uid}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                toast.success(t('userDeleted'));
                fetchUsers();
            } else {
                toast.error(t('deleteError'));
            }
        } catch (error) {
            toast.error(t('deleteError'));
        } finally {
            setActionLoading(false);
            setDeleteModal({ open: false, user: null });
        }
    };

    const handleSuspend = async () => {
        if (!suspendModal.user || !user) return;

        setActionLoading(true);
        try {
            const token = await user.getIdToken();
            const response = await fetch(`/api/admin/users/${suspendModal.user.uid}/suspend`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: suspendModal.action,
                    reason: suspendModal.action === 'suspend' ? 'Suspended by admin' : undefined,
                }),
            });

            if (response.ok) {
                toast.success(suspendModal.action === 'suspend' ? t('userSuspended') : t('userUnsuspended'));
                fetchUsers();
            } else {
                toast.error(t('actionError'));
            }
        } catch (error) {
            toast.error(t('actionError'));
        } finally {
            setActionLoading(false);
            setSuspendModal({ open: false, user: null, action: 'suspend' });
        }
    };

    const handleCreditAdjustment = async (amount: number, reason: string, type: 'add' | 'deduct') => {
        if (!creditModal.user || !user) return;

        setActionLoading(true);
        try {
            const token = await user.getIdToken();
            const response = await fetch(`/api/admin/users/${creditModal.user.uid}/credits`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ amount, reason, type }),
            });

            if (response.ok) {
                toast.success(t('creditsAdjusted'));
                fetchUsers();
            } else {
                toast.error(t('actionError'));
            }
        } catch (error) {
            toast.error(t('actionError'));
        } finally {
            setActionLoading(false);
            setCreditModal({ open: false, user: null });
        }
    };

    const handleRoleChange = async (targetUser: User) => {
        if (!user) return;

        const newRole = targetUser.role === 'admin' ? 'user' : 'admin';

        try {
            const token = await user.getIdToken();
            const response = await fetch(`/api/admin/users/${targetUser.uid}/role`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role: newRole }),
            });

            if (response.ok) {
                toast.success(newRole === 'admin' ? t('promotedToAdmin') : t('demotedToUser'));
                fetchUsers();
            } else {
                const data = await response.json();
                toast.error(data.error || t('actionError'));
            }
        } catch (error) {
            toast.error(t('actionError'));
        }
    };

    const columns = [
        {
            key: 'user',
            header: t('user'),
            render: (u: User) => (
                <div className="flex items-center gap-3">
                    {u.photoURL ? (
                        <img src={u.photoURL} alt="" className="w-10 h-10 rounded-full" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {(u.displayName || u.email || 'U')[0].toUpperCase()}
                        </div>
                    )}
                    <div>
                        <p className="text-white font-medium">{u.displayName || 'No name'}</p>
                        <p className="text-gray-400 text-xs">{u.email}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'credits',
            header: t('credits'),
            render: (u: User) => (
                <span className="text-primary font-medium">{u.credits}</span>
            ),
        },
        {
            key: 'role',
            header: t('role'),
            render: (u: User) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'admin'
                        ? 'bg-yellow-500/10 text-yellow-400'
                        : 'bg-gray-500/10 text-gray-400'
                    }`}>
                    {u.role === 'admin' ? t('adminRole') : t('userRole')}
                </span>
            ),
        },
        {
            key: 'status',
            header: t('status'),
            render: (u: User) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.suspended
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-green-500/10 text-green-400'
                    }`}>
                    {u.suspended ? t('suspended') : t('active')}
                </span>
            ),
        },
        {
            key: 'createdAt',
            header: t('joined'),
            render: (u: User) => (
                <span className="text-gray-400 text-sm">
                    {new Date(u.createdAt).toLocaleDateString()}
                </span>
            ),
        },
        {
            key: 'actions',
            header: t('actions'),
            render: (u: User) => (
                <div className="flex items-center gap-2">
                    <Link href={`/admin/users/${u.uid}`}>
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title={t('view')}>
                            <Eye className="w-4 h-4" />
                        </button>
                    </Link>
                    <button
                        onClick={() => setCreditModal({ open: true, user: u })}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title={t('adjustCredits')}
                    >
                        <Coins className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleRoleChange(u)}
                        className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors"
                        title={u.role === 'admin' ? t('demoteToUser') : t('promoteToAdmin')}
                    >
                        {u.role === 'admin' ? <UserIcon className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => setSuspendModal({
                            open: true,
                            user: u,
                            action: u.suspended ? 'unsuspend' : 'suspend'
                        })}
                        className={`p-2 rounded-lg transition-colors ${u.suspended
                                ? 'text-gray-400 hover:text-green-400 hover:bg-green-500/10'
                                : 'text-gray-400 hover:text-orange-400 hover:bg-orange-500/10'
                            }`}
                        title={u.suspended ? t('unsuspend') : t('suspend')}
                    >
                        {u.suspended ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => setDeleteModal({ open: true, user: u })}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title={t('delete')}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">{t('users')}</h1>
                    <p className="text-gray-400 mt-1">{t('usersSubtitle')}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <SearchInput
                        placeholder={t('searchUsers')}
                        value={search}
                        onChange={(value) => {
                            setSearch(value);
                            setPage(1);
                        }}
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => {
                        setRoleFilter(e.target.value as 'all' | 'admin' | 'user');
                        setPage(1);
                    }}
                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary/50"
                >
                    <option value="all">{t('allRoles')}</option>
                    <option value="admin">{t('admins')}</option>
                    <option value="user">{t('usersOnly')}</option>
                </select>
            </div>

            {/* Table */}
            <DataTable
                data={users}
                columns={columns}
                total={total}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                loading={loading}
                emptyMessage={t('noUsers')}
                emptyIcon={<Users className="w-12 h-12 text-gray-600" />}
            />

            {/* Delete Modal */}
            <ConfirmationModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, user: null })}
                onConfirm={handleDelete}
                title={t('confirmDeleteUser')}
                message={t('deleteUserMessage', { name: deleteModal.user?.displayName || deleteModal.user?.email || '' })}
                confirmText={t('delete')}
                cancelText={t('cancel')}
                variant="danger"
                isLoading={actionLoading}
            />

            {/* Suspend Modal */}
            <ConfirmationModal
                isOpen={suspendModal.open}
                onClose={() => setSuspendModal({ open: false, user: null, action: 'suspend' })}
                onConfirm={handleSuspend}
                title={suspendModal.action === 'suspend' ? t('confirmSuspendUser') : t('confirmUnsuspendUser')}
                message={suspendModal.action === 'suspend'
                    ? t('suspendUserMessage', { name: suspendModal.user?.displayName || suspendModal.user?.email || '' })
                    : t('unsuspendUserMessage', { name: suspendModal.user?.displayName || suspendModal.user?.email || '' })}
                confirmText={suspendModal.action === 'suspend' ? t('suspend') : t('unsuspend')}
                cancelText={t('cancel')}
                variant={suspendModal.action === 'suspend' ? 'danger' : 'primary'}
                isLoading={actionLoading}
            />

            {/* Credit Adjustment Modal */}
            <CreditAdjustmentModal
                isOpen={creditModal.open}
                onClose={() => setCreditModal({ open: false, user: null })}
                onSubmit={handleCreditAdjustment}
                userName={creditModal.user?.displayName || creditModal.user?.email || ''}
                currentCredits={creditModal.user?.credits || 0}
                isLoading={actionLoading}
            />
        </div>
    );
}
