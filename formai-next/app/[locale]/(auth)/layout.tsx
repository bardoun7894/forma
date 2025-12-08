import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-page z-0" />
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px] animate-blob" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px] animate-blob animation-delay-2000" />
            </div>

            {/* Language Switcher (Top Right) */}
            <div className="absolute top-4 right-4 z-20">
                <LanguageSwitcher />
            </div>

            {/* Content */}
            <div className="w-full max-w-md z-10">
                {children}
            </div>
        </div>
    );
}
