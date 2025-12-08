'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Shield, UserPlus, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
    const t = useTranslations('admin');
    const { userData } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleMakeAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            toast.error(t('emailRequired'));
            return;
        }

        setLoading(true);
        try {
            // Find user by email
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', email.trim()));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                toast.error(t('userNotFound'));
                setLoading(false);
                return;
            }

            const userDoc = snapshot.docs[0];
            const userId = userDoc.id;

            // Update role to admin
            await updateDoc(doc(db, 'users', userId), {
                role: 'admin',
            });

            toast.success(t('userPromotedSuccess', { email }));
            setEmail('');
        } catch (error) {
            console.error('Error making user admin:', error);
            toast.error(t('actionError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Settings className="w-8 h-8" />
                    {t('settings')}
                </h1>
                <p className="text-gray-400 mt-1">{t('settingsSubtitle')}</p>
            </div>

            {/* Make Admin Section */}
            <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-yellow-500/10">
                        <Shield className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">{t('addNewAdmin')}</h2>
                        <p className="text-gray-400 text-sm">{t('addNewAdminDescription')}</p>
                    </div>
                </div>

                <form onSubmit={handleMakeAdmin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            {t('userEmail')}
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            className="w-full max-w-md px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors"
                            required
                        />
                    </div>
                    <Button
                        type="submit"
                        isLoading={loading}
                        className="flex items-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        {t('makeAdmin')}
                    </Button>
                </form>
            </GlassCard>

            {/* Current Admin Info */}
            <GlassCard className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">{t('currentAdmin')}</h2>
                <div className="flex items-center gap-4">
                    {userData?.photoURL ? (
                        <img
                            src={userData.photoURL}
                            alt=""
                            className="w-12 h-12 rounded-full border-2 border-yellow-500/20"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-400 font-bold text-xl">
                            {(userData?.displayName || userData?.email || 'A')[0].toUpperCase()}
                        </div>
                    )}
                    <div>
                        <p className="text-white font-medium">{userData?.displayName || 'Admin'}</p>
                        <p className="text-gray-400 text-sm">{userData?.email}</p>
                    </div>
                    <span className="ml-auto px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400">
                        {t('adminRole')}
                    </span>
                </div>
            </GlassCard>
        </div>
    );
}
