# UX Design Specification: FormaAI

**Status:** Draft
**Date:** 2025-11-30
**Design Reference:** `exampleLanding.html` (Itero style)

## 1. Project Understanding

### Vision
FormaAI is a professional AI generation platform that democratizes high-end creative tools. It combines the "one-click" simplicity of consumer apps (like Flow) with the raw power of top-tier models (Veo 3.1, Sora 2, Midjourney). The goal is to make professional video and image generation accessible without the complexity of managing API keys or technical parameters.

### Target Users
*   **Creators & Marketers:** Need high-quality assets quickly for social media and campaigns.
*   **Professionals:** Want access to SOTA models (Sora, Midjourney) but prefer a unified, managed interface.
*   **Visual Style Seekers:** Users attracted to premium, "cinematic" aesthetics who value a beautiful tool as much as the output.

### Core Experience
*   **"Magic" Generation:** Users shouldn't fight with settings. Enter a prompt -> Get a stunning result.
*   **Unified Workflow:** Seamless transition from Landing Page -> Auth -> Generation Forms.
*   **Visual Continuity:** The "Itero" aesthetic (Dark Mode, Neon Teal `#00C4CC`, Glassmorphism) will persist from the landing page into the core app application.

### Platform
*   **Web Application:** Responsive web app (Next.js) optimized for desktop creation but accessible on mobile for viewing/sharing.

## 2. Core Experience Principles

*   **Speed (The "Magic" Feel):** Interactions must feel instantaneous. Even if AI takes time to generate, the *interface* response (clicks, transitions) must be <100ms. Use optimistic UI updates and rich "processing" states (like the Itero loader) to maintain engagement.
*   **Guidance (One-Click Philosophy):** Hide complexity. The primary path (Text -> Video) should be obvious. Advanced settings (Camera motion, seed, negative prompts) should be tucked away in "Advanced" accordions or modals, not cluttering the main view.
*   **Cinematic Immersion:** The UI itself is a creative tool. It should feel "premium" and "dark" to let the generated colorful content pop. Use lighting effects (glows) to guide attention, not just flat colors.

## 3. Visual Foundation

### Design System Strategy
*   **Framework:** Tailwind CSS (Utility-first).
*   **Component Library:** Custom "Itero" components built on top of Radix UI primitives (for accessibility) but styled strictly to match the `exampleLanding.html` aesthetic.

### Color Palette (Extracted from Itero)
*   **Backgrounds:**
    *   `bg-page`: `#070707` (Deep Rich Black) - *Main background*
    *   `bg-panel`: `rgba(255, 255, 255, 0.03)` - *Glass panels*
    *   `bg-panel-hover`: `rgba(255, 255, 255, 0.05)`
*   **Primary Accents:**
    *   `primary-main`: `#00C4CC` (Neon Teal) - *Buttons, active states, glows*
    *   `primary-hover`: `#00e0e9`
    *   `primary-dim`: `rgba(0, 196, 204, 0.1)` - *Subtle backgrounds*
*   **Typography:**
    *   `text-main`: `#e2e8f0` (High contrast off-white)
    *   `text-muted`: `#9ca3af` (Gray-400 equivalent)
    *   `text-dim`: `#4b5563` (Gray-600 equivalent)

### Typography
*   **Font Family:** `Inter` (Google Fonts).
*   **Weights:** Light (300) for large display, Regular (400) for body, SemiBold (600) for headings/buttons.
*   **Style:** Clean, tracking-tight for headings, readable line-heights for body.

### Effects & Motion
*   **Glassmorphism:** `backdrop-filter: blur(12px)`, `border: 1px solid rgba(255, 255, 255, 0.08)`.
*   **Glows:** `text-shadow: 0 0 20px rgba(0, 196, 204, 0.4)` for key text. `box-shadow: 0 0 30px -5px rgba(0, 196, 204, 0.15)` for cards.
*   **Animation:** Smooth, physics-based transitions (using Framer Motion in Next.js).
    *   *Hover:* Scale up slightly (`scale-105`), increase glow.
    *   *Entrance:* Fade in + Slide up (`y: 20 -> y: 0`).

## 4. User Journey: Landing to Video Generation

### Primary Flow
**Landing Page → "Start Creating" CTA → Auth (if needed) → Dashboard/Generation Form**

### Key Screens

#### 4.1 Landing Page (Public)
*   **Reference:** `exampleLanding.html` (Itero style)
*   **Purpose:** Convert visitors to sign up.
*   **Layout:**
    *   Hero section with animated background (Unicorn Studio or similar)
    *   Clear value proposition: "The power of Sora and Midjourney, the simplicity of Flow"
    *   Primary CTA: "Start Creating" (Teal glow button)
    *   Feature showcase (3-step demo like Itero)
    *   Pricing cards (Credit packs)
*   **Navigation:** Top nav with "Login" and "Get Started" buttons.

#### 4.2 Authentication Modal/Page
*   **Trigger:** Click "Start Creating" or "Get Started" when not logged in.
*   **Layout:** 
    *   **Option A (Modal):** Glass panel modal overlay (like Itero's demo modal) with Email + Google OAuth.
    *   **Option B (Dedicated Page):** Full-screen centered auth form with split-screen design (left: branding/visuals, right: form).
*   **Recommendation:** Modal for faster conversion (less context switch).

#### 4.3 Dashboard/Home (Authenticated)
*   **Purpose:** Central hub for all generation types.
*   **Layout Pattern:** **Left Sidebar Navigation** (Desktop) / **Bottom Tab Bar** (Mobile)
    *   Sidebar items:
        *   🎬 **Video** (Primary - highlighted)
        *   🖼️ **Image**
        *   👤 **Avatar**
        *   📚 **My Library**
        *   💳 **Credits** (with balance badge)
*   **Main Content Area:**
    *   **Hero/Quick Start Section:** Large, centered "What do you want to create today?" with 3 cards (Video, Image, Avatar).
    *   **Recent Generations:** Masonry grid of thumbnails (like Pinterest) showing recent outputs.
    *   **Credit Balance:** Persistent top-right indicator with glow effect.

#### 4.4 Video Generation Form (The "Magic" Screen)
*   **Entry:** Click "Video" from sidebar or "Video" card from Dashboard.
*   **Layout:** **Single-Column Centered Form** (max-width 800px) with progressive disclosure.
*   **Form Structure:**
    *   **Step 1: Input (Always Visible)**
        *   Large textarea: "Describe your video..." (placeholder with examples)
        *   Optional: Image upload for Image-to-Video (collapsed by default, expand with "+ Add Image" button)
    *   **Step 2: Settings (Inline, Minimal)**
        *   Model selector: Dropdown or segmented control (Veo 3.1 Fast, Veo 3.1 HD, Sora 2, Sora 2 Pro)
        *   Aspect ratio: Icon-based selector (16:9, 9:16, 1:1)
        *   **"Advanced" Accordion (Collapsed):** Duration, Camera motion, Seed, etc.
    *   **Step 3: Generate**
        *   Large Teal button: "Generate Video" with credit cost badge (e.g., "10 credits")
        *   Disabled state if insufficient credits (with "Buy Credits" link)
*   **Processing State:**
    *   Replace form with full-screen "Processing" animation (like Itero's loader with progress bar)
    *   Show: Model name, Estimated time, Cancel button
*   **Success State:**
    *   Video player with generated result
    *   Actions: Download, Regenerate, Share, Save to Library

### Navigation Pattern
*   **Desktop:** Persistent left sidebar (always visible, ~240px width).
*   **Mobile:** Bottom tab bar (5 icons max) + hamburger menu for secondary items.
*   **Transitions:** Page transitions use fade + slide (Framer Motion `AnimatePresence`).

## 5. Component Specifications

### Buttons
*   **Primary (CTA):** 
    *   Background: `#00C4CC`, Hover: `#00e0e9`
    *   Text: Black (`#000000`), Font: SemiBold
    *   Shadow: `0 0 20px rgba(0, 196, 204, 0.3)`, Hover: `0 0 50px rgba(0, 196, 204, 0.5)`
    *   Padding: `py-3 px-6` (Tailwind)
*   **Secondary (Ghost):**
    *   Background: Transparent, Border: `1px solid rgba(255, 255, 255, 0.2)`
    *   Hover: `bg-white/5`
*   **Disabled:**
    *   Background: `rgba(255, 255, 255, 0.05)`, Text: `#4b5563`, No glow

### Form Inputs
*   **Text/Textarea:**
    *   Background: `rgba(255, 255, 255, 0.05)`
    *   Border: `1px solid rgba(255, 255, 255, 0.1)`
    *   Focus: Border `#00C4CC`, Ring `1px #00C4CC`
    *   Placeholder: `#9ca3af`
*   **Dropdowns/Selects:**
    *   Same styling as text inputs
    *   Chevron icon on right (Lucide `chevron-down`)

### Cards (Glass Panels)
*   **Default:**
    *   Background: `rgba(255, 255, 255, 0.03)`
    *   Backdrop: `blur(12px)`
    *   Border: `1px solid rgba(255, 255, 255, 0.08)`
    *   Padding: `p-6` to `p-8`
*   **Hover (Interactive Cards):**
    *   Border: `rgba(0, 196, 204, 0.3)`
    *   Transform: `scale(1.02)`

### Loading States
*   **Skeleton Screens:** Use glass panels with subtle pulse animation.
*   **Progress Bars:** 
    *   Track: `rgba(255, 255, 255, 0.1)`
    *   Fill: `#00C4CC` with glow `0 0 10px #00C4CC`
*   **Spinners:** Teal ring with rotating animation (Lucide `loader-2` icon).

## 6. Interaction Patterns

### Feedback & Validation
*   **Success:** Green accent (`#10b981`) with checkmark icon.
*   **Error:** Red accent (`#ef4444`) with alert icon. Display inline below input.
*   **Info:** Blue accent (`#3b82f6`) with info icon.

### Modals
*   **Overlay:** `bg-black/80` with `backdrop-blur-sm`.
*   **Content:** Glass panel with scale-in animation (`scale-95 -> scale-100`).
*   **Close:** X button top-right or click outside.

### Tooltips
*   **Trigger:** Hover on icon or text with underline-dotted.
*   **Style:** Small glass panel with arrow, max-width 200px.

### Async Operations (Video Generation)
*   **Optimistic UI:** Show "Processing" state immediately on button click.
*   **Polling:** Check status every 2-3 seconds via API.
*   **Notifications:** Toast notifications (top-right) for completion/errors.

## 7. Accessibility

*   **Keyboard Navigation:** All interactive elements accessible via Tab/Enter/Space.
*   **Focus States:** Visible focus ring (`ring-2 ring-[#00C4CC]`).
*   **Screen Readers:** Proper ARIA labels on all icons and interactive elements.
*   **Color Contrast:** Ensure WCAG AA compliance (4.5:1 for body text).

## 8. Responsive Breakpoints

*   **Mobile:** `< 768px` - Single column, bottom nav, stacked cards.
*   **Tablet:** `768px - 1024px` - 2-column grids, sidebar collapses to hamburger.
*   **Desktop:** `> 1024px` - Full sidebar, 3-4 column grids.

## 9. Design Deliverables

*   ✅ **Visual Foundation:** Color palette, typography, effects documented.
*   ✅ **User Journey:** Landing → Auth → Dashboard → Video Gen flow mapped.
*   ✅ **Interactive Mockups:** `ux-design-directions.html` with 3 key screens.
*   ✅ **Component Specs:** Buttons, forms, cards, loading states defined.

**Next Steps:**
1. User review of mockups and specifications.
2. Refinement based on feedback.
3. Handoff to Architecture workflow for technical implementation planning.


