import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    // Supported locales
    locales: ['ar', 'en'],

    // Default locale (Arabic)
    defaultLocale: 'ar',

    // Locale prefix behavior (as-needed)
    localePrefix: 'as-needed',
});

// Lightweight wrappers around Next.js navigation APIs
export const { Link, redirect, usePathname, useRouter, getPathname } =
    createNavigation(routing);