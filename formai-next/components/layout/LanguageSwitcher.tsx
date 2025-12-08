'use client';
"use no memo";

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { Languages } from 'lucide-react';

export default function LanguageSwitcher() {
    const locale = useLocale();
    const t = useTranslations('settings');
    const router = useRouter();
    const pathname = usePathname();

    const toggleLocale = () => {
        const newLocale = locale === 'ar' ? 'en' : 'ar';
        // Use next-intl's router.push which automatically handles locale prefix
        router.push(pathname, { locale: newLocale });
    };

    return (
        <button
            onClick={toggleLocale}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-panel hover:bg-panel-hover border border-white/10 transition-all text-sm"
            aria-label={t('language')}
        >
            <Languages size={16} />
            <span className="font-medium">
                {locale === 'ar' ? 'EN' : 'عربي'}
            </span>
        </button>
    );
}