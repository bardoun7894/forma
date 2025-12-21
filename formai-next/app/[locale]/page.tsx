"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Play,
    Sparkles,
    Zap,
    Video,
    Image as ImageIcon,
    ArrowRight,
    Check,
    Star,
    Users,
    Shield,
    ChevronRight,
    Download,
    Lock,
    CheckCircle,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { AuthModal } from "@/components/AuthModal";
import { Modal } from "@/components/ui/Modal";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { GradientText } from "@/components/ui/GradientText";
import { HeroVisual } from "@/components/landing/HeroVisual";
import { ModelShowcase } from "@/components/landing/ModelShowcase";
import { UseCases } from "@/components/landing/UseCases";
import { PricingPreview } from "@/components/landing/PricingPreview";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function LandingPage() {
    const locale = useLocale();
    const router = useRouter();
    const { user, loading } = useAuth();
    const { theme } = useTheme();
    const t = useTranslations("landing");
    const tNav = useTranslations("nav");
    const tCommon = useTranslations("common");
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeVideo, setActiveVideo] = useState(false);
    const [activeGalleryImage, setActiveGalleryImage] = useState<string | null>(null);
    const isDark = theme === 'dark';

    useEffect(() => {
        if (!loading && user) {
            router.push(`/${locale}/dashboard`);
        }
    }, [user, loading, router, locale]);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleAuthSuccess = () => {
        setIsAuthOpen(false);
        router.push(`/${locale}/dashboard`);
    };

    return (
        <div className={`min-h-screen overflow-x-hidden selection:bg-primary selection:text-black transition-colors duration-300 ${isDark ? 'text-white bg-[#050505]' : 'text-gray-900 bg-gray-50'}`}>
            {/* Ambient background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {isDark ? (
                    <>
                        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[150px]" />
                        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[150px]" />
                        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-[150px]" />
                        {/* Grid pattern */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black_40%,transparent_100%)]" />
                    </>
                ) : (
                    <>
                        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />
                        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-purple-400/10 rounded-full blur-[150px]" />
                        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-cyan-400/10 rounded-full blur-[150px]" />
                        {/* Grid pattern - light */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black_40%,transparent_100%)]" />
                    </>
                )}
            </div>

            {/* Navigation */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled
                ? isDark
                    ? "bg-[#050505]/90 backdrop-blur-xl border-b border-white/5"
                    : "bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-sm"
                : "bg-transparent"
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between">
                    <Link href={`/${locale}`} className="flex items-center gap-2.5 group">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
                            <span className="font-bold text-black text-lg">F</span>
                        </div>
                        <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{tCommon("appName")}</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className={`text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                            {t("footerFeatures")}
                        </a>
                        <a href="#models" className={`text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                            AI Models
                        </a>
                        <a href="#pricing" className={`text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                            {t("footerPricing")}
                        </a>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <ThemeToggle />
                        <LanguageSwitcher />
                        <Button variant="secondary" size="sm" className="hidden sm:inline-flex" onClick={() => setIsAuthOpen(true)}>
                            {tNav("signIn")}
                        </Button>
                        <Button size="sm" onClick={() => setIsAuthOpen(true)}>
                            {tNav("getStarted")}
                            <ChevronRight className="w-4 h-4 ms-1" />
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section - Split Layout */}
            <section className="relative pt-24 md:pt-32 lg:pt-44 pb-12 md:pb-16 lg:pb-24 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                        {/* Left: Content */}
                        <div className="text-center lg:text-start order-2 lg:order-1">
                            {/* Badge */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-primary/5 border border-primary/20'}`}
                            >
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                                </span>
                                <span className={`text-xs sm:text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t("badge")}</span>
                            </motion.div>

                            {/* Headline */}
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-4 sm:mb-6 leading-[1.15]"
                            >
                                <span className={isDark ? 'text-white' : 'text-gray-900'}>{t("heroHeadline").split(" ").slice(0, 3).join(" ")}</span>{" "}
                                <GradientText className="inline-block">
                                    {t("heroHeadline").split(" ").slice(3).join(" ")}
                                </GradientText>
                            </motion.h1>

                            {/* Subheadline */}
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className={`text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                            >
                                {t("heroSubheadline")}
                            </motion.p>

                            {/* CTAs - Improved for mobile */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start mb-6 sm:mb-8"
                            >
                                <Button
                                    size="lg"
                                    className="text-sm sm:text-base px-6 sm:px-8 h-11 sm:h-12 shadow-lg shadow-primary/25 w-full sm:w-auto"
                                    onClick={() => setIsAuthOpen(true)}
                                >
                                    {t("heroCTA")}
                                    <Sparkles className="w-4 h-4 ms-2" />
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="lg"
                                    className="text-sm sm:text-base px-6 sm:px-8 h-11 sm:h-12 w-full sm:w-auto"
                                    onClick={() => setActiveVideo(true)}
                                >
                                    <Play className="w-4 h-4 me-2" />
                                    Watch Demo
                                </Button>
                            </motion.div>

                            {/* Social Proof - Improved for mobile */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className={`flex flex-col sm:flex-row items-center gap-3 sm:gap-6 justify-center lg:justify-start text-xs sm:text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2 rtl:space-x-reverse">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className={`w-6 sm:w-7 h-6 sm:h-7 rounded-full bg-gradient-to-br flex items-center justify-center text-[9px] sm:text-[10px] font-medium ${isDark ? 'from-gray-700 to-gray-800 border-2 border-[#050505] text-gray-400' : 'from-gray-200 to-gray-300 border-2 border-gray-50 text-gray-600'}`}>
                                                {["A", "M", "S", "J"][i - 1]}
                                            </div>
                                        ))}
                                    </div>
                                    <span>10K+ creators</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="flex">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <Star key={i} className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-yellow-500 fill-yellow-500" />
                                        ))}
                                    </div>
                                    <span>4.9/5 rating</span>
                                </div>
                            </motion.div>
                        </div>

                        {/* Right: Visual - Hidden on small mobile, shown on md+ */}
                        <div className="relative order-1 lg:order-2 hidden sm:block">
                            <HeroVisual />
                        </div>
                    </div>
                </div>
            </section>

            {/* Trusted By / Stats Section */}
            <section className={`py-12 sm:py-16 px-4 sm:px-6 ${isDark ? 'border-y border-white/5 bg-black/30' : 'border-y border-gray-200 bg-white/50'}`}>
                <div className="max-w-6xl mx-auto">
                    <p className={`text-center text-xs sm:text-sm mb-8 sm:mb-10 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Trusted by creators and businesses worldwide</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-12">
                        {[
                            { value: 50000, suffix: "+", label: "Videos Generated" },
                            { value: 200000, suffix: "+", label: "Images Created" },
                            { value: 10000, suffix: "+", label: "Active Users" },
                            { value: 99, suffix: "%", label: "Satisfaction Rate" },
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="text-center"
                            >
                                <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">
                                    <AnimatedCounter
                                        end={stat.value}
                                        suffix={stat.suffix}
                                        className={`bg-gradient-to-r bg-clip-text text-transparent ${isDark ? 'from-white to-gray-400' : 'from-gray-900 to-gray-600'}`}
                                    />
                                </div>
                                <p className={`text-[10px] sm:text-xs md:text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="features" className="py-16 sm:py-20 lg:py-28 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12 sm:mb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 sm:mb-6"
                        >
                            <Zap className="w-4 h-4 text-primary" />
                            <span className="text-sm text-primary font-medium">Simple 3-Step Process</span>
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}
                        >
                            {t("howItWorksTitle")}
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className={`text-base sm:text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                            Transform your ideas into stunning visuals in minutes, not hours.
                        </motion.p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 sm:gap-8 relative">
                        {/* Connecting line */}
                        <div className={`hidden md:block absolute top-20 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent ${isDark ? 'via-white/10' : 'via-gray-300'} to-transparent`} />

                        {[
                            { step: "01", icon: "✍️", title: t("step1Title"), desc: t("step1Description"), color: "primary" },
                            { step: "02", icon: "✨", title: t("step2Title"), desc: t("step2Description"), color: "purple" },
                            { step: "03", icon: "🚀", title: t("step3Title"), desc: t("step3Description"), color: "green" },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15 }}
                                className="relative text-center group"
                            >
                                <div className={`w-14 sm:w-16 h-14 sm:h-16 mx-auto mb-4 sm:mb-6 rounded-2xl flex items-center justify-center text-xl sm:text-2xl relative z-10 transition-colors ${isDark ? 'bg-[#0a0a0a] border border-white/10 group-hover:border-white/20' : 'bg-white border border-gray-200 group-hover:border-primary/30 shadow-sm'}`}>
                                    {item.icon}
                                </div>
                                <span className={`text-[10px] font-mono uppercase tracking-widest mb-2 block ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Step {item.step}</span>
                                <h3 className={`text-lg sm:text-xl font-semibold mb-2 sm:mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                                <p className={`text-sm leading-relaxed max-w-xs mx-auto ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* AI Models Showcase */}
            <section id="models" className={`py-16 sm:py-20 lg:py-28 px-4 sm:px-6 ${isDark ? 'bg-gradient-to-b from-white/[0.02] to-transparent' : 'bg-gradient-to-b from-gray-100/50 to-transparent'}`}>
                <div className="max-w-6xl mx-auto">
                    <ModelShowcase
                        title="World-Class AI Models"
                        subtitle="Access the most powerful AI video and image generation models in one unified platform."
                    />
                </div>
            </section>

            {/* Key Benefits */}
            <section className="py-16 sm:py-20 lg:py-28 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12 sm:mb-16">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}
                        >
                            {t("keyBenefitsTitle")}
                        </motion.h2>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {[
                            { icon: Video, title: t("benefit1Title"), desc: t("benefit1Description"), color: "primary", bg: "primary/10" },
                            { icon: Zap, title: t("benefit2Title"), desc: t("benefit2Description"), color: "purple-400", bg: "purple-500/10" },
                            { icon: Users, title: t("benefit3Title"), desc: t("benefit3Description"), color: "green-400", bg: "green-500/10" },
                            { icon: Shield, title: t("benefit4Title"), desc: t("benefit4Description"), color: "blue-400", bg: "blue-500/10" },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -4 }}
                                className="group"
                            >
                                <div className={`p-4 sm:p-6 rounded-2xl transition-all h-full ${isDark ? 'bg-white/[0.02] border border-white/5 hover:border-white/10' : 'bg-white border border-gray-200 hover:border-primary/30 shadow-sm hover:shadow-md'}`}>
                                    <div className={`w-10 sm:w-12 h-10 sm:h-12 rounded-xl mb-3 sm:mb-4 bg-${item.bg} flex items-center justify-center`}>
                                        <item.icon className={`w-5 sm:w-6 h-5 sm:h-6 text-${item.color}`} />
                                    </div>
                                    <h3 className={`text-base sm:text-lg font-semibold mb-1 sm:mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                                    <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Use Cases */}
            <section className={`py-16 sm:py-20 lg:py-28 px-4 sm:px-6 ${isDark ? 'bg-gradient-to-b from-white/[0.02] to-transparent' : 'bg-gradient-to-b from-gray-100/50 to-transparent'}`}>
                <div className="max-w-6xl mx-auto">
                    <UseCases
                        title="Built for Every Creator"
                        subtitle="From marketers to artists, FormAI empowers creators across industries."
                        translations={{
                            marketing: "Marketing Teams",
                            marketingDesc: "Create scroll-stopping ads and social content that converts.",
                            ecommerce: "E-Commerce",
                            ecommerceDesc: "Generate product videos and lifestyle images at scale.",
                            creative: "Creative Agencies",
                            creativeDesc: "Deliver stunning visuals for clients in record time.",
                            education: "Education",
                            educationDesc: "Create engaging educational content and presentations.",
                            social: "Content Creators",
                            socialDesc: "Produce viral-worthy videos for TikTok, YouTube, and more.",
                            personal: "Personal Projects",
                            personalDesc: "Bring your creative ideas to life without technical skills.",
                        }}
                    />
                </div>
            </section>

            {/* Gallery */}
            <section className="py-16 sm:py-20 lg:py-28 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12 sm:mb-16">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}
                        >
                            {t("galleryTitle")}
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className={`text-base sm:text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                            {t("galleryDescription")}
                        </motion.p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {[
                            { src: "/images/landing/gallery-video.png", title: t("galleryExample1Title"), subtitle: t("galleryExample1Subtitle"), color: "primary" },
                            { src: "/images/landing/gallery-portrait.png", title: t("galleryExample2Title"), subtitle: t("galleryExample2Subtitle"), color: "purple-500" },
                            { src: "/images/landing/gallery-avatar.png", title: t("galleryExample3Title"), subtitle: t("galleryExample3Subtitle"), color: "green-500" },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                onClick={() => setActiveGalleryImage(item.src)}
                                className="group cursor-pointer"
                            >
                                <div className={`rounded-2xl overflow-hidden transition-all ${isDark ? 'border border-white/5 hover:border-white/20 bg-white/[0.02]' : 'border border-gray-200 hover:border-primary/30 bg-white shadow-sm hover:shadow-lg'}`}>
                                    <div className="aspect-video relative overflow-hidden">
                                        <Image
                                            src={item.src}
                                            alt={item.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                                            <p className="text-white font-medium text-sm sm:text-base">{item.title}</p>
                                            <p className="text-gray-400 text-xs sm:text-sm">{item.subtitle}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Preview */}
            <section id="pricing" className={`py-16 sm:py-20 lg:py-28 px-4 sm:px-6 ${isDark ? 'bg-gradient-to-b from-white/[0.02] to-transparent' : 'bg-gradient-to-b from-gray-100/50 to-transparent'}`}>
                <div className="max-w-5xl mx-auto">
                    <PricingPreview
                        locale={locale}
                        title="Simple, Transparent Pricing"
                        subtitle="Pay only for what you use. No subscriptions, no hidden fees."
                        starterTitle="Starter Pack"
                        starterPrice="$9"
                        starterFeatures={["100 Credits", "All AI Models", "HD Quality", "Email Support"]}
                        proTitle="Creator Pro"
                        proPrice="$29"
                        proFeatures={["500 Credits", "Priority Queue", "4K Quality", "Priority Support", "Commercial License"]}
                        proBadge="POPULAR"
                        ctaText="Get Started"
                        viewAllText="View all pricing plans"
                    />
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-16 sm:py-20 lg:py-28 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12 sm:mb-16">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}
                        >
                            {t("testimonialTitle")}
                        </motion.h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                        {[
                            { quote: t("testimonial1Quote"), author: t("testimonial1Author"), initial: "A", gradient: "from-primary to-cyan-500" },
                            { quote: t("testimonial2Quote"), author: t("testimonial2Author"), initial: "M", gradient: "from-purple-500 to-pink-500" },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className={`p-5 sm:p-6 md:p-8 rounded-2xl ${isDark ? 'bg-white/[0.02] border border-white/5' : 'bg-white border border-gray-200 shadow-sm'}`}
                            >
                                <div className="flex gap-1 mb-3 sm:mb-4">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-yellow-500 fill-yellow-500" />
                                    ))}
                                </div>
                                <p className={`text-base sm:text-lg mb-4 sm:mb-6 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>"{item.quote}"</p>
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white font-semibold text-sm`}>
                                        {item.initial}
                                    </div>
                                    <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>{item.author}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Trust Badges */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="mt-12 sm:mt-16 flex flex-wrap justify-center gap-6 sm:gap-8 md:gap-12"
                    >
                        {[
                            { icon: Shield, label: t("securityBadge1Title"), sublabel: t("securityBadge1Subtitle"), color: "green" },
                            { icon: Lock, label: t("securityBadge2Title"), sublabel: t("securityBadge2Subtitle"), color: "blue" },
                            { icon: CheckCircle, label: t("securityBadge3Title"), sublabel: t("securityBadge3Subtitle"), color: "purple" },
                        ].map((badge, i) => (
                            <div key={i} className="flex flex-col items-center text-center">
                                <div className={`w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-${badge.color}-500/10 flex items-center justify-center mb-2`}>
                                    <badge.icon className={`w-4 sm:w-5 h-4 sm:h-5 text-${badge.color}-400`} />
                                </div>
                                <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{badge.label}</p>
                                <p className={`text-[10px] sm:text-xs ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>{badge.sublabel}</p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-16 sm:py-20 lg:py-28 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative rounded-2xl sm:rounded-3xl overflow-hidden"
                    >
                        {/* Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/10 to-cyan-500/20" />
                        <div className={`absolute inset-0 backdrop-blur-xl ${isDark ? 'bg-[#050505]/80' : 'bg-white/80'}`} />

                        <div className="relative p-6 sm:p-8 md:p-16 text-center">
                            <h2 className={`text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t("ctaTitle")}</h2>
                            <p className={`text-base sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t("ctaSubtitle")}
                            </p>
                            <Button
                                size="lg"
                                className="text-base sm:text-lg px-8 sm:px-10 h-12 sm:h-14 shadow-lg shadow-primary/25"
                                onClick={() => setIsAuthOpen(true)}
                            >
                                {t("ctaButton")}
                                <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 ms-2" />
                            </Button>
                            <p className={`text-xs sm:text-sm mt-4 sm:mt-6 ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>
                                {t("freeTrialNote")}
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className={`py-10 sm:py-12 border-t ${isDark ? 'border-white/5 bg-black/40' : 'border-gray-200 bg-gray-50'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
                        <Link href={`/${locale}`} className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
                                <span className="font-bold text-black">F</span>
                            </div>
                            <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{tCommon("appName")}</span>
                        </Link>

                        <div className={`flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                            <a href="#features" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-gray-900'}`}>{t("footerFeatures")}</a>
                            <a href="#pricing" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-gray-900'}`}>{t("footerPricing")}</a>
                            <a href="#" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-gray-900'}`}>{t("footerPrivacy")}</a>
                            <a href="#" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-gray-900'}`}>{t("footerTerms")}</a>
                        </div>

                        <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>
                            {t("copyright")}
                        </p>
                    </div>
                </div>
            </footer>

            {/* Auth Modal */}
            <AuthModal
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
                onAuthSuccess={handleAuthSuccess}
            />

            {/* Video Modal */}
            <Modal
                isOpen={activeVideo}
                onClose={() => setActiveVideo(false)}
                className="max-w-5xl bg-black"
            >
                <div className="aspect-video w-full bg-black relative flex items-center justify-center">
                    <div className="text-center p-8">
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                            <Play className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-white text-lg font-medium">Demo Video</p>
                        <p className="text-gray-400 mt-2">Replace with YouTube/Vimeo embed</p>
                    </div>
                </div>
            </Modal>

            {/* Gallery Lightbox */}
            <Modal
                isOpen={!!activeGalleryImage}
                onClose={() => setActiveGalleryImage(null)}
                className="max-w-6xl bg-transparent border-none shadow-none"
                showCloseButton={true}
            >
                {activeGalleryImage && (
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden">
                        <Image
                            src={activeGalleryImage}
                            alt="Gallery Preview"
                            fill
                            className="object-contain"
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
}
