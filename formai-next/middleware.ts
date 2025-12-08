import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
    // Default locale (Arabic)
    defaultLocale: 'ar',

    // Supported locales
    locales: ['ar', 'en'],

    // Locale detection strategy
    localeDetection: true,

    // Prefix for locale in URL (e.g., /ar, /en)
    localePrefix: 'as-needed',
});

export const config = {
    // Match all pathnames except for
    // - API routes
    // - _next (Next.js internals)
    // - Static files
    matcher: ['/((?!api|_next|.*\\..*).*)'],
};
