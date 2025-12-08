'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
    Video,
    Image as ImageIcon,
    User,
    Wallet,
    LayoutDashboard,
} from 'lucide-react';

const navItems = [
    { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
    { key: 'video', href: '/video', icon: Video },
    { key: 'image', href: '/image', icon: ImageIcon },
    { key: 'avatar', href: '/avatar', icon: User },
    { key: 'credits', href: '/credits', icon: Wallet },
];

export default function BottomNav({ locale }: { locale: string }) {
    const t = useTranslations('nav');
    const pathname = usePathname();

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-panel/80 backdrop-blur-xl border-t border-white/10 z-50">
            <div className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.includes(item.href);

                    return (
                        <Link
                            key={item.key}
                            href={`/${locale}${item.href}`}
                            className={`
                flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all min-w-[60px]
                ${isActive
                                    ? 'text-primary'
                                    : 'text-muted hover:text-main'
                                }
              `}
                        >
                            <Icon size={20} />
                            <span className="text-xs font-medium truncate w-full text-center">
                                {t(item.key)}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
