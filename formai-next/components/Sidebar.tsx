"use client";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import {
    LayoutDashboard,
    Video,
    Image as ImageIcon,
    MessageSquare,
    User,
    Folder,
    CreditCard,
    LogOut,
    Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import { useAuth } from "@/contexts/AuthContext";

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const locale = useLocale();
    const tNav = useTranslations('nav');
    const tDashboard = useTranslations('dashboard');
    const tAuth = useTranslations('auth');
    const tCommon = useTranslations('common');
    const { userData, signOut } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, key: "dashboard", path: "/dashboard" },
        { icon: Video, key: "video", path: "/video" },
        { icon: ImageIcon, key: "image", path: "/image" },
        { icon: MessageSquare, key: "chat", path: "/chat" },
        { icon: User, key: "avatar", path: "/avatar" },
        { icon: Folder, key: "library", path: "/library" },
        { icon: CreditCard, key: "credits", path: "/credits" },
    ];

    return (
        <aside className="fixed inset-y-0 left-0 rtl:left-auto rtl:right-0 w-72 flex-col border-r border-white/10 rtl:border-r-0 rtl:border-l rtl:border-white/10 bg-page/50 backdrop-blur-xl p-6 z-50 hidden lg:flex">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-8 px-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                    <span className="font-bold text-black text-lg">F</span>
                </div>
                <span className="text-xl font-bold tracking-tight text-white">{tCommon('appName')}</span>
            </div>

            {/* Navigation */}
            <nav className="space-y-1.5 flex-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_-5px_rgba(0,196,204,0.3)]"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Icon className={cn("w-5 h-5", isActive && "text-primary drop-shadow-[0_0_8px_rgba(0,196,204,0.5)]")} />
                            <span className="font-medium">{tNav(item.key)}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Credits + Logout */}
            <div className="mt-auto pt-6 border-t border-white/10 space-y-4">
                <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-xs text-gray-400 mb-1">{tDashboard('availableCredits')}</div>
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-white">{userData?.credits ?? 0}</span>
                        <Button size="sm" className="h-8 px-3 text-xs" onClick={() => router.push('/credits')}>
                            {tDashboard('buyCredits')}
                        </Button>
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