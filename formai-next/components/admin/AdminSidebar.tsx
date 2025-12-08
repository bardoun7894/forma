"use client";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import {
    LayoutDashboard,
    Users,
    FileVideo,
    CreditCard,
    LogOut,
    Globe,
    Shield,
    ArrowLeft,
    Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('admin');
    const tAuth = useTranslations('auth');
    const { userData, signOut } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, key: "dashboard", path: "/admin" },
        { icon: Users, key: "users", path: "/admin/users" },
        { icon: FileVideo, key: "content", path: "/admin/content" },
        { icon: CreditCard, key: "payments", path: "/admin/payments" },
        { icon: Settings, key: "settings", path: "/admin/settings" },
    ];

    return (
        <aside className="fixed inset-y-0 left-0 rtl:left-auto rtl:right-0 w-72 flex-col border-r border-white/10 rtl:border-r-0 rtl:border-l rtl:border-white/10 bg-page/50 backdrop-blur-xl p-6 z-50 hidden lg:flex">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-8 px-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">{t('title')}</span>
            </div>

            {/* Back to App */}
            <Link
                href="/dashboard"
                className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors border border-white/10"
            >
                <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                <span className="font-medium">{t('backToApp')}</span>
            </Link>

            {/* Navigation */}
            <nav className="space-y-1.5 flex-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.path || (item.path !== '/admin' && pathname.startsWith(item.path));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_15px_-5px_rgba(239,68,68,0.3)]"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Icon className={cn("w-5 h-5", isActive && "text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]")} />
                            <span className="font-medium">{t(item.key)}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Admin Info + Logout */}
            <div className="mt-auto pt-6 border-t border-white/10 space-y-4">
                <div className="px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/10">
                    <div className="flex items-center gap-3">
                        {userData?.photoURL ? (
                            <img
                                src={userData.photoURL}
                                alt={userData.displayName || 'Admin'}
                                className="w-10 h-10 rounded-full border-2 border-red-500/20"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 font-bold">
                                {(userData?.displayName || userData?.email || 'A')[0].toUpperCase()}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {userData?.displayName || 'Admin'}
                            </p>
                            <p className="text-xs text-red-400 truncate">{t('adminRole')}</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => {
                        const newLocale = locale === 'ar' ? 'en' : 'ar';
                        router.push(pathname, { locale: newLocale });
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                    <Globe className="w-5 h-5" />
                    <span className="font-medium">{locale === 'ar' ? 'English' : 'العربية'}</span>
                </button>

                <button
                    onClick={signOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">{tAuth('logout')}</span>
                </button>
            </div>
        </aside>
    );
}
