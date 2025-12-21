"use client";

import { useState } from "react";
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
    Globe,
    Menu,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeToggle } from "./ui/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const locale = useLocale();
    const tNav = useTranslations('nav');
    const tDashboard = useTranslations('dashboard');
    const tAuth = useTranslations('auth');
    const tCommon = useTranslations('common');
    const { userData, signOut } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { icon: LayoutDashboard, key: "dashboard", path: "/dashboard" },
        { icon: Video, key: "video", path: "/video" },
        { icon: ImageIcon, key: "image", path: "/image" },
        { icon: MessageSquare, key: "chat", path: "/chat" },
        { icon: User, key: "avatar", path: "/avatar" },
        { icon: Folder, key: "library", path: "/library" },
        { icon: CreditCard, key: "credits", path: "/credits" },
    ];

    const handleNavClick = (path: string) => {
        setIsMobileMenuOpen(false);
        router.push(path);
    };

    const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
        <>
            {/* Logo */}
            <div className="flex items-center justify-between gap-2 mb-8 px-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                        <span className="font-bold text-black text-lg">F</span>
                    </div>
                    <span className={cn("text-xl font-bold tracking-tight", isDark ? "text-white" : "text-gray-900")}>{tCommon('appName')}</span>
                </div>
                {isMobile && (
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn("p-2 rounded-lg transition-colors", isDark ? "hover:bg-white/10" : "hover:bg-gray-200")}
                    >
                        <X className={cn("w-5 h-5", isDark ? "text-white" : "text-gray-700")} />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="space-y-1.5 flex-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    const Icon = item.icon;

                    return isMobile ? (
                        <button
                            key={item.path}
                            onClick={() => handleNavClick(item.path)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_-5px_rgba(0,196,204,0.3)]"
                                    : isDark
                                        ? "text-gray-400 hover:text-white hover:bg-white/5"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            )}
                        >
                            <Icon className={cn("w-5 h-5", isActive && "text-primary drop-shadow-[0_0_8px_rgba(0,196,204,0.5)]")} />
                            <span className="font-medium">{tNav(item.key)}</span>
                        </button>
                    ) : (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_-5px_rgba(0,196,204,0.3)]"
                                    : isDark
                                        ? "text-gray-400 hover:text-white hover:bg-white/5"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            )}
                        >
                            <Icon className={cn("w-5 h-5", isActive && "text-primary drop-shadow-[0_0_8px_rgba(0,196,204,0.5)]")} />
                            <span className="font-medium">{tNav(item.key)}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Credits + Theme + Logout */}
            <div className={cn("mt-auto pt-6 border-t space-y-4", isDark ? "border-white/10" : "border-gray-200")}>
                <div className={cn("px-4 py-3 rounded-xl border", isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200")}>
                    <div className={cn("text-xs mb-1", isDark ? "text-gray-400" : "text-gray-500")}>{tDashboard('availableCredits')}</div>
                    <div className="flex items-center justify-between">
                        <span className={cn("text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>{userData?.credits ?? 0}</span>
                        <Button size="sm" className="h-8 px-3 text-xs" onClick={() => {
                            setIsMobileMenuOpen(false);
                            router.push('/credits');
                        }}>
                            {tDashboard('buyCredits')}
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-between px-4 py-2">
                    <span className={cn("text-sm font-medium", isDark ? "text-gray-400" : "text-gray-600")}>
                        {isDark ? 'Dark' : 'Light'} Mode
                    </span>
                    <ThemeToggle />
                </div>

                <button
                    onClick={() => {
                        setIsMobileMenuOpen(false);
                        const newLocale = locale === 'ar' ? 'en' : 'ar';
                        router.push(pathname, { locale: newLocale });
                    }}
                    className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                        isDark ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                >
                    <Globe className="w-5 h-5" />
                    <span className="font-medium">{locale === 'ar' ? 'English' : 'العربية'}</span>
                </button>

                <button
                    onClick={() => {
                        setIsMobileMenuOpen(false);
                        signOut();
                    }}
                    className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                        isDark ? "text-gray-400 hover:text-red-400 hover:bg-red-500/10" : "text-gray-600 hover:text-red-600 hover:bg-red-50"
                    )}
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">{tAuth('logout')}</span>
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 rtl:left-auto rtl:right-0 w-72 flex-col border-r rtl:border-r-0 rtl:border-l p-6 z-50 hidden lg:flex transition-colors",
                isDark ? "border-white/10 bg-[#0a0a0f]" : "border-gray-200 bg-white"
            )}>
                <SidebarContent />
            </aside>

            {/* Mobile Header */}
            <div className={cn(
                "fixed top-0 left-0 right-0 h-16 border-b flex items-center justify-between px-4 z-40 lg:hidden transition-colors",
                isDark ? "bg-[#0a0a0f] border-white/10" : "bg-white border-gray-200"
            )}>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                        <span className="font-bold text-black text-lg">F</span>
                    </div>
                    <span className={cn("text-lg font-bold tracking-tight", isDark ? "text-white" : "text-gray-900")}>{tCommon('appName')}</span>
                </div>

                <div className="flex items-center gap-3">
                    <div className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                        <span className="text-primary font-semibold">{userData?.credits ?? 0}</span> {tNav('credits')}
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className={cn("p-2 rounded-lg transition-colors", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}
                    >
                        <Menu className={cn("w-6 h-6", isDark ? "text-white" : "text-gray-700")} />
                    </button>
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn("fixed inset-0 z-50 lg:hidden", isDark ? "bg-black/70" : "bg-black/50")}
                        />

                        {/* Sidebar */}
                        <motion.aside
                            initial={{ x: locale === 'ar' ? '100%' : '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: locale === 'ar' ? '100%' : '-100%' }}
                            transition={{ type: 'tween', duration: 0.3 }}
                            className={cn(
                                "fixed inset-y-0 w-72 flex flex-col p-6 z-50 lg:hidden transition-colors",
                                isDark ? "bg-[#0a0a0f]" : "bg-white",
                                locale === 'ar'
                                    ? cn("right-0 border-l", isDark ? "border-white/10" : "border-gray-200")
                                    : cn("left-0 border-r", isDark ? "border-white/10" : "border-gray-200")
                            )}
                        >
                            <SidebarContent isMobile />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
