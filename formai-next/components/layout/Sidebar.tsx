'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import {
    Video,
    Image as ImageIcon,
    User,
    Wallet,
    LayoutDashboard,
    Library,
    MessageSquare,
} from 'lucide-react';

const navItems = [
    { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
    { key: 'video', href: '/video', icon: Video },
    { key: 'image', href: '/image', icon: ImageIcon },
    { key: 'avatar', href: '/avatar', icon: User },
    { key: 'library', href: '/library', icon: Library },
    { key: 'chat', href: '/chat', icon: MessageSquare },
    { key: 'credits', href: '/credits', icon: Wallet },
];

export default function Sidebar({ locale }: { locale: string }) {
    const t = useTranslations('nav');
    const pathname = usePathname();
    const { userData, signOut } = useAuth();

    return (
        <aside className="hidden md:flex flex-col w-64 bg-panel/50 backdrop-blur-xl border-e border-white/10 h-screen sticky top-0">
            {/* Logo */}
            <div className="p-6 border-b border-white/10">
                <h1 className="text-2xl font-bold text-primary">
                    {locale === 'ar' ? 'فورما AI' : 'FormaAI'}
                </h1>
                <p className="text-xs text-muted mt-1">
                    {locale === 'ar' ? 'أدوات إبداعية' : 'Creative Tools'}
                </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.includes(item.href);

                    return (
                        <Link
                            key={item.key}
                            href={`/${locale}${item.href}`}
                            className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                ${isActive
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'text-muted hover:bg-panel-hover hover:text-main'
                                }
              `}
                        >
                            <Icon size={20} />
                            <span className="text-sm font-medium">{t(item.key)}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom section - User Info */}
            <div className="p-4 border-t border-white/10">
                {userData ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            {userData.photoURL ? (
                                <img
                                    src={userData.photoURL}
                                    alt={userData.displayName || 'User'}
                                    className="w-10 h-10 rounded-full border-2 border-primary/20"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {(userData.displayName || userData.email || 'U')[0].toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {userData.displayName || 'User'}
                                </p>
                                <p className="text-xs text-muted truncate">{userData.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted">{locale === 'ar' ? 'الرصيد' : 'Credits'}</span>
                            <span className="text-primary font-bold">{userData.credits || 0}</span>
                        </div>
                        <button
                            onClick={signOut}
                            className="w-full text-xs text-red-400 hover:text-red-300 transition-colors py-2"
                        >
                            {locale === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
                        </button>
                    </div>
                ) : (
                    <div className="text-xs text-muted text-center">
                        {locale === 'ar' ? 'سجل الدخول للمتابعة' : 'Login to continue'}
                    </div>
                )}
            </div>
        </aside>
    );
}
