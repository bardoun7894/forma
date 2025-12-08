# Product Requirements Document (PRD): FormaAI

**Version:** 1.0
**Status:** Draft
**Date:** 2025-11-30
**Author:** BMad Analyst Agent

## 1. Executive Summary

**FormaAI** is a professional AI generation platform designed to democratize high-end creative tools. It combines the ease of use of consumer apps (like Flow) with the raw power of top-tier AI models (Veo 3.1, Sora 2, Midjourney) via the Kie.ai aggregator.

**The Problem:** Professional AI tools are often fragmented, complex, or require expensive individual subscriptions. Users want "one-click" magic without managing multiple API keys or learning complex interfaces.
**The Solution:** A unified, credit-based SaaS platform with a "Flow-like" cinematic UI that aggregates the best-in-class models for Video, Image, and Avatar generation.
**Unique Value Proposition:** "The power of Sora and Midjourney, the simplicity of Flow, in one credit-based subscription."

## 2. Success Metrics

*   **User Adoption:** 100+ active users in the first month.
*   **Engagement:** Average of 5 generations per user per session.
*   **Monetization:** 5% conversion rate from free trial (if applicable) to paid credit packs.
*   **Performance:** <2s latency for UI interactions; <5s start time for video generation tasks.

## 3. Scope & Phasing

### Phase 1: MVP (15-Day Deadline)
*   **Core Platform:** Next.js Web App, Auth, Stripe Credit System.
*   **Video Generation:**
    *   **Veo 3.1 Fast & HD** (via Kie.ai).
    *   **Sora 2 & Sora 2 Pro** (Requirement to be confirmed/integrated).
*   **Image Generation:**
    *   **Nano Banana** (Professional Style).
    *   **Midjourney** (Requirement to be confirmed/integrated).
*   **Avatar Generation:**
    *   **Kling AI** (via Kie.ai) for photo-to-avatar.
*   **UI/UX:** Dark mode, Glassmorphism, Framer Motion animations.

### Phase 2: Future / Growth
*   **AI Content Tools:** Writing, Transcription, Content Improvement.
*   **Community Features:** Public gallery, social sharing.
*   **Advanced Editor:** In-browser timeline for video stitching.

## 4. Functional Requirements

### 4.1 User Authentication & Management
*   **FR1:** Users can sign up/login via Email and Google OAuth.
*   **FR2:** Users can view their current credit balance in the dashboard.
*   **FR3:** Users can view their generation history (My Library).

### 4.2 Video Generation (The "Magic" Flow)
*   **FR4:** Users can generate videos from Text prompts.
*   **FR5:** Users can generate videos from Image inputs (Image-to-Video).
*   **FR6:** Users can select between models: `Veo 3.1 Fast`, `Veo 3.1 HD`, `Sora 2`, `Sora 2 Pro`.
*   **FR7:** Users can specify aspect ratio (16:9, 9:16, 1:1).
*   **FR8:** System must handle asynchronous generation with a "Processing" state and progress updates.

### 4.3 Image Generation
*   **FR9:** Users can generate high-fidelity images from text.
*   **FR10:** Users can select styles (Nano Banana, Midjourney).
*   **FR11:** Users can download images in high resolution.

### 4.4 Avatar/Portrait Service
*   **FR12:** Users can upload a selfie to generate AI avatars/portraits.
*   **FR13:** System must preserve facial identity while applying artistic styles.

### 4.5 Monetization (Credits)
*   **FR14:** Users can purchase credit packs via Stripe.
*   **FR15:** System deducts credits per generation based on model cost (e.g., Veo HD = 10 credits, Image = 1 credit).
*   **FR16:** System prevents generation if insufficient credits.

### 4.6 Admin Dashboard
*   **FR17:** Admin can view all users and their credit balances.
*   **FR18:** Admin can manually adjust user credits.
*   **FR19:** Admin can view system-wide usage stats.

## 5. Technical Requirements

### 5.1 AI Model Integration (Kie.ai)
*   **Veo 3.1 Integration:**
    *   Endpoint: `POST https://api.kie.ai/api/v1/veo/generate`
    *   Models: `veo3`
    *   Params: `prompt`, `aspectRatio`, `callBackUrl`
*   **Sora 2 / Midjourney Integration:**
    *   **⚠️ OPEN ITEM:** Specific API endpoints for "Sora 2" and "Midjourney" are not listed in public Kie.ai docs.
    *   *Assumption:* Will use `runway-api` or `luma-api` as fallbacks, or client must provide private API documentation.
    *   *Fallback:* Use `Flux Kontext` for Image and `Runway Gen-3` for Video if specific models are unavailable.

### 5.2 Payment System
*   **Provider:** Stripe.
*   **Model:** One-time payments for Credit Packs (Pre-paid).
*   **Webhooks:** Handle `checkout.session.completed` to top up user credits.

### 5.3 Frontend Architecture
*   **Framework:** Next.js 14+ (App Router).
*   **Styling:** Tailwind CSS + Framer Motion (Animations) + Glassmorphism utilities.
*   **State Management:** React Query (for async API polling).

## 6. UX/UI Guidelines
*   **Theme:** "Cinematic Dark" (Black background, Neon Teal/Purple accents).
*   **Interaction:** "One-click" philosophy. Hide complex settings behind "Advanced" toggles.
*   **Feedback:** Rich loading states (skeleton screens, progress bars) for long-running AI tasks.
*   **Visuals:** High-end glassmorphism effects for cards and modals.

## 7. Risks & Assumptions
*   **Risk:** 15-day deadline is extremely tight for a full SaaS. *Mitigation:* Strict adherence to MVP scope; use "off-the-shelf" UI components where possible.
*   **Risk:** Missing API docs for Sora/Midjourney. *Mitigation:* Build the interface to be model-agnostic so we can swap endpoints easily once docs are provided.
