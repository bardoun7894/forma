import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Inter, Tajawal } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import '../globals.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

const tajawal = Tajawal({
    subsets: ['arabic', 'latin'],
    weight: ['400', '500', '700'],
    variable: '--font-arabic',
    display: 'swap',
});

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    // Await params in Next.js 16
    const { locale } = await params;

    // Fetch messages for the current locale
    const messages = await getMessages({ locale });

    // Set dir="rtl" for Arabic, "ltr" for English
    const direction = locale === 'ar' ? 'rtl' : 'ltr';

    return (
        <html lang={locale} dir={direction} className="dark">
            <body className={`${inter.variable} ${tajawal.variable} ${locale === 'ar' ? 'font-arabic' : 'font-sans'} antialiased bg-page text-main`}>
                <AuthProvider>
                    <NextIntlClientProvider messages={messages}>
                        {children}
                        <Toaster position="top-center" />
                    </NextIntlClientProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
