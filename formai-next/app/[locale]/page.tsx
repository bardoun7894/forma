"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { AuthModal } from "@/components/AuthModal";
import { Play, Sparkles, Zap, Video, Image as ImageIcon, Pen, Download, Shield, User, Lock, CheckCircle, Twitter, Github, Instagram, Linkedin, ArrowRight } from "lucide-react";
import { TubeLightBackground } from "@/components/TubeLightBackground";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { GlowingBorder } from "@/components/ui/GlowingBorder";
import { Modal } from "@/components/ui/Modal";

export default function LandingPage() {
  const locale = useLocale();
  const router = useRouter();
  const { user, loading } = useAuth();

  // Modal states
  const [activeVideo, setActiveVideo] = useState<boolean>(false);
  const [activeGalleryImage, setActiveGalleryImage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.push(`/${locale}/dashboard`);
    }
  }, [user, loading, router, locale]);

  const t = useTranslations('landing');
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const handleAuthSuccess = (user: { name: string; email: string }) => {
    console.log("Auth success:", user);
    setIsAuthOpen(false);
    router.push(`/${locale}/dashboard`);
  };

  return (
    <div className="min-h-screen text-white overflow-x-hidden selection:bg-primary selection:text-black relative bg-gradient-to-b from-[#070707] to-black">

      {/* Background gradient removed (tube light only in hero) */}

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#070707]/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,196,204,0.4)]">
              <span className="font-bold text-black text-lg">F</span>
            </div>
            <span className="text-lg md:text-xl font-bold tracking-tight">{tCommon('appName')}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageSwitcher />
            <Button variant="secondary" size="sm" className="hidden sm:inline-flex" onClick={() => setIsAuthOpen(true)}>{tNav('signIn')}</Button>
            <Button size="sm" className="hidden sm:inline-flex" onClick={() => setIsAuthOpen(true)}>{tNav('getStarted')}</Button>
            {/* Mobile Menu Button - Fixed i18n */}
            <Button variant="secondary" size="sm" className="sm:hidden" onClick={() => setIsAuthOpen(true)}>{tNav('signIn')}</Button>
          </div>
        </div>
      </nav>

      {/* Hero with tube light animation */}
      <section className="relative pt-24 md:pt-36 pb-16 lg:pt-52 lg:pb-32 px-4 sm:px-6 z-10 overflow-hidden">
        {/* Tube light background only in hero */}
        <div className="absolute inset-0 overflow-hidden">
          <TubeLightBackground />
        </div>
        <div className="max-w-6xl mx-auto text-center relative z-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 md:mb-8 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-gray-300">{t('badge')}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-4 md:mb-6 leading-[1.1] text-white">
            {t('heroHeadline')}
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
            {t('heroSubheadline')}
          </p>

          <div className="mb-10 md:mb-12">
            <Button
              size="lg"
              className="text-base md:text-lg px-8 md:px-12 h-12 md:h-14"
              onClick={() => setIsAuthOpen(true)}
            >
              {t('heroCTA')} <Sparkles className="ml-2 w-4 h-4 md:w-5 md:h-5" />
            </Button>
            <p className="text-gray-400 text-sm mt-4">
              {t('heroHonest')}
            </p>
          </div>

          {/* Product UI Mockup */}
          <GlowingBorder containerClassName="max-w-4xl mx-auto rounded-2xl mb-20" className="bg-black/80 backdrop-blur-xl">
            <div className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group" onClick={() => setActiveVideo(true)}>
              <Image
                src="/images/landing/hero-mockup.png"
                alt={t('productMockupAlt')}
                fill
                className="object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-white fill-white" />
                </div>
              </div>
            </div>
          </GlowingBorder>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 md:py-24 px-4 sm:px-6 border-t border-white/5 bg-gradient-to-b from-black/30 to-transparent relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-12 md:mb-16">
            {t('howItWorksTitle')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Step 1 */}
            <GlassCard hoverEffect className="p-8 text-center transition-all duration-300 hover:scale-[1.02]">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Pen className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3">{t('step1Title')}</h3>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                {t('step1Description')}
              </p>
            </GlassCard>
            {/* Step 2 */}
            <GlassCard hoverEffect className="p-8 text-center transition-all duration-300 hover:scale-[1.02]">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3">{t('step2Title')}</h3>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                {t('step2Description')}
              </p>
            </GlassCard>
            {/* Step 3 */}
            <GlassCard hoverEffect className="p-8 text-center transition-all duration-300 hover:scale-[1.02]">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-green-500/10 flex items-center justify-center">
                <Download className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3">{t('step3Title')}</h3>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                {t('step3Description')}
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section id="features" className="py-16 md:py-24 px-4 sm:px-6 border-t border-white/5 bg-black/40 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-12 md:mb-16">
            {t('keyBenefitsTitle')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {/* Benefit 1 */}
            <SpotlightCard className="p-6 text-center h-full">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Video className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 text-white">{t('benefit1Title')}</h3>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                {t('benefit1Description')}
              </p>
            </SpotlightCard>
            {/* Benefit 2 */}
            <SpotlightCard className="p-6 text-center h-full" spotlightColor="rgba(168, 85, 247, 0.15)">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                <Zap className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 text-white">{t('benefit2Title')}</h3>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                {t('benefit2Description')}
              </p>
            </SpotlightCard>
            {/* Benefit 3 */}
            <SpotlightCard className="p-6 text-center h-full" spotlightColor="rgba(34, 197, 94, 0.15)">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-green-500/10 flex items-center justify-center">
                <User className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 text-white">{t('benefit3Title')}</h3>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                {t('benefit3Description')}
              </p>
            </SpotlightCard>
            {/* Benefit 4 */}
            <SpotlightCard className="p-6 text-center h-full" spotlightColor="rgba(59, 130, 246, 0.15)">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <Shield className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 text-white">{t('benefit4Title')}</h3>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                {t('benefit4Description')}
              </p>
            </SpotlightCard>
          </div>
        </div>
      </section>

      {/* Demo Video */}
      <section id="demo" className="py-16 md:py-24 px-4 sm:px-6 border-t border-white/5 bg-gradient-to-b from-black/30 to-transparent relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 md:mb-12">
            {t('demoVideoTitle')}
          </h2>
          <p className="text-lg text-gray-300 text-center mb-10 md:mb-16 max-w-3xl mx-auto">
            {t('demoVideoDescription')}
          </p>
          <div className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-black/40 to-gray-900/40 p-1 backdrop-blur-lg hover:border-primary/30 transition-all duration-300 cursor-pointer group" onClick={() => setActiveVideo(true)}>
            <div className="aspect-video relative">
              <Image
                src="/images/landing/hero-mockup.png"
                alt={t('productMockupAlt')}
                fill
                className="object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                  <Play className="w-10 h-10 text-white fill-white" />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 text-center">
            <Button
              variant="secondary"
              size="lg"
              className="px-8 md:px-12"
              onClick={() => setIsAuthOpen(true)}
            >
              {t('tryItYourself')} <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Visual Examples Gallery */}
      <section id="gallery" className="py-16 md:py-24 px-4 sm:px-6 border-t border-white/5 bg-gradient-to-b from-black/30 to-transparent relative z-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 md:mb-12">
            {t('galleryTitle')}
          </h2>
          <p className="text-lg text-gray-300 text-center mb-10 md:mb-16 max-w-3xl mx-auto">
            {t('galleryDescription')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Example 1 - Cinematic Video */}
            <div
              className="rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-black/40 to-gray-900/40 p-1 backdrop-blur-lg hover:border-primary/30 transition-all duration-300 group cursor-pointer"
              onClick={() => setActiveGalleryImage("/images/landing/gallery-video.png")}
            >
              <div className="aspect-video relative">
                <Image
                  src="/images/landing/gallery-video.png"
                  alt={t('galleryExample1Title')}
                  fill
                  className="object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4 opacity-100 group-hover:opacity-100 transition-opacity">
                  <div className="w-full">
                    <p className="text-white font-medium">{t('galleryExample1Title')}</p>
                    <p className="text-gray-400 text-sm">{t('galleryExample1Subtitle')}</p>
                  </div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <ImageIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
            {/* Example 2 - Portrait */}
            <div
              className="rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-black/40 to-gray-900/40 p-1 backdrop-blur-lg hover:border-purple-500/30 transition-all duration-300 group cursor-pointer"
              onClick={() => setActiveGalleryImage("/images/landing/gallery-portrait.png")}
            >
              <div className="aspect-video relative">
                <Image
                  src="/images/landing/gallery-portrait.png"
                  alt={t('galleryExample2Title')}
                  fill
                  className="object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                  <div>
                    <p className="text-white font-medium">{t('galleryExample2Title')}</p>
                    <p className="text-gray-400 text-sm">{t('galleryExample2Subtitle')}</p>
                  </div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <ImageIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
            {/* Example 3 - Avatar */}
            <div
              className="rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-black/40 to-gray-900/40 p-1 backdrop-blur-lg hover:border-green-500/30 transition-all duration-300 group cursor-pointer"
              onClick={() => setActiveGalleryImage("/images/landing/gallery-avatar.png")}
            >
              <div className="aspect-video relative">
                <Image
                  src="/images/landing/gallery-avatar.png"
                  alt={t('galleryExample3Title')}
                  fill
                  className="object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                  <div>
                    <p className="text-white font-medium">{t('galleryExample3Title')}</p>
                    <p className="text-gray-400 text-sm">{t('galleryExample3Subtitle')}</p>
                  </div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <ImageIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 text-center">
            <Button
              variant="secondary"
              size="lg"
              className="px-8 md:px-12"
              onClick={() => setIsAuthOpen(true)}
            >
              {t('exploreMoreExamples')} <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 md:py-24 px-4 sm:px-6 border-t border-white/5 bg-gradient-to-b from-black/40 to-transparent relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">{t('testimonialTitle')}</h2>
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <GlassCard hoverEffect className="p-6 md:p-8">
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                  A
                </div>
                <div className="ml-4">
                  <p className="text-gray-300 italic">{"\""}{t('testimonial1Quote')}{"\""}</p>
                  <p className="text-gray-500 text-sm mt-4">— {t('testimonial1Author')}</p>
                </div>
              </div>
            </GlassCard>
            <GlassCard hoverEffect className="p-6 md:p-8">
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                  M
                </div>
                <div className="ml-4">
                  <p className="text-gray-300 italic">{"\""}{t('testimonial2Quote')}{"\""}</p>
                  <p className="text-gray-500 text-sm mt-4">— {t('testimonial2Author')}</p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Security Badges */}
          <div className="mt-16 text-center">
            <p className="text-gray-400 mb-8">{t('securityTitle')}</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-12">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                  <Shield className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-gray-300 text-sm font-medium">{t('securityBadge1Title')}</p>
                <p className="text-gray-500 text-xs">{t('securityBadge1Subtitle')}</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
                  <Lock className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-gray-300 text-sm font-medium">{t('securityBadge2Title')}</p>
                <p className="text-gray-500 text-xs">{t('securityBadge2Subtitle')}</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-3">
                  <CheckCircle className="w-6 h-6 text-purple-400" />
                </div>
                <p className="text-gray-300 text-sm font-medium">{t('securityBadge3Title')}</p>
                <p className="text-gray-500 text-xs">{t('securityBadge3Subtitle')}</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                </div>
                <p className="text-gray-300 text-sm font-medium">{t('securityBadge4Title')}</p>
                <p className="text-gray-500 text-xs">{t('securityBadge4Subtitle')}</p>
              </div>
            </div>
          </div>


        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 md:py-32 px-4 sm:px-6 border-t border-white/5 bg-gradient-to-b from-black/50 to-transparent relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">{t('ctaTitle')}</h2>
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            {t('ctaSubtitle')}
          </p>
          <Button
            size="lg"
            className="text-lg md:text-2xl px-10 md:px-16 h-14 md:h-16 rounded-full bg-primary hover:bg-primary-hover shadow-xl"
            onClick={() => setIsAuthOpen(true)}
          >
            {t('ctaButton')} <ArrowRight className="ml-3 w-5 h-5 md:w-6 md:h-6" />
          </Button>
          <p className="text-gray-500 text-sm mt-6">
            {t('freeTrialNote')}
          </p>
        </div>
      </section>

      <footer className="py-12 md:py-16 border-t border-white/10 relative z-10 bg-[#070707]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,196,204,0.4)]">
                <span className="font-bold text-black text-lg">F</span>
              </div>
              <span className="text-lg font-bold tracking-tight">{tCommon('appName')}</span>
            </div>
            {/* Functional Footer Links with Anchors */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-primary transition-colors">{t('footerHome')}</a>
              <a href="#features" className="hover:text-primary transition-colors">{t('footerFeatures')}</a>
              {/* Pricing doesn't exist yet, keeping # */}
              <a href="#" className="hover:text-primary transition-colors">{t('footerPricing')}</a>
              {/* Blog doesn't exist yet, keeping # */}
              <a href="#" className="hover:text-primary transition-colors">{t('footerBlog')}</a>
              <a href="#contact" className="hover:text-primary transition-colors">{t('footerContact')}</a>
              <a href="#" className="hover:text-primary transition-colors">{t('footerPrivacy')}</a>
              <a href="#" className="hover:text-primary transition-colors">{t('footerTerms')}</a>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-500 hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-primary transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-primary transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-gray-500 text-xs md:text-sm">
            <p>{t('copyright')} {t('footerMadeWith')}</p>
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
          {/* Placeholder for actual video embed */}
          <div className="text-center p-8">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-white" />
            </div>
            <p className="text-white text-lg font-medium">Demo Video Placeholder</p>
            <p className="text-gray-400 mt-2">Replace with YouTube/Vimeo iframe</p>
          </div>
        </div>
      </Modal>

      {/* Gallery Lightbox Modal */}
      <Modal
        isOpen={!!activeGalleryImage}
        onClose={() => setActiveGalleryImage(null)}
        className="max-w-6xl bg-transparent border-none shadow-none"
        showCloseButton={true}
      >
        {activeGalleryImage && (
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl">
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
