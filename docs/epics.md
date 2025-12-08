# Epics and User Stories: FormaAI

**Version:** 1.0
**Date:** 2025-12-04
**Status:** Approved
**Source:** PRD v1.0, Architecture v1.0

---

## Epic 1: Foundation & Core Setup
**Goal:** Establish the technical foundation and core application shell to enable all subsequent features.

### Story 1.1: Project Infrastructure Setup
**As a** Developer
**I want** to set up the Next.js project with Firebase, Stripe, and i18n dependencies
**So that** the development environment is ready for feature implementation.

**Acceptance Criteria:**
- [ ] Next.js 16 project initialized with TypeScript and Tailwind CSS
- [ ] Dependencies installed: `firebase`, `firebase-admin`, `next-intl`, `stripe`, `zod`, `react-hook-form`, `react-hot-toast`
- [ ] `lib/firebase.ts` created with client initialization
- [ ] `lib/firebase-admin.ts` created with server admin initialization
- [ ] Firestore security rules configured (users can only read/write own data)
- [ ] Environment variables configured in `.env.local`

**Technical Implementation:**
- Use Architecture Section 5.3 (Frontend) and 6.1 (Infrastructure)
- Configure `next.config.js` for image domains

### Story 1.2: Internationalization (i18n) Setup
**As a** User
**I want** to view the application in Arabic (RTL) or English (LTR)
**So that** I can use the platform in my preferred language.

**Acceptance Criteria:**
- [ ] `next-intl` configured with default locale `ar`
- [ ] Root layout sets `dir="rtl"` when locale is Arabic
- [ ] Root layout sets `dir="ltr"` when locale is English
- [ ] Translation files created: `/messages/ar.json` and `/messages/en.json`
- [ ] Language switcher component implemented in header
- [ ] Arabic font (e.g., Cairo or Tajawal) configured via `next/font`

**Technical Implementation:**
- Architecture Decision 2: Arabic RTL Default
- Use `NextIntlClientProvider` in layout

### Story 1.3: Core Layout & Theme
**As a** User
**I want** to see a professional dark-themed interface with consistent navigation
**So that** I can easily navigate the application.

**Acceptance Criteria:**
- [ ] Dark theme implemented (#070707 background, #00C4CC teal accents)
- [ ] Responsive Sidebar navigation (Desktop: persistent, Mobile: bottom/drawer)
- [ ] Header with user profile placeholder and credit badge placeholder
- [ ] `TubeLightBackground` component integrated for landing page
- [ ] Toast notification system set up (`react-hot-toast`)

**Technical Implementation:**
- Architecture Section 6 (UX/UI Guidelines)
- Use Framer Motion for transitions

---

## Epic 2: User Authentication & Profile
**Goal:** Enable secure user access and account management.

### Story 2.1: User Registration & Login
**As a** New User
**I want** to sign up using Email or Google
**So that** I can create an account and access the platform.

**Acceptance Criteria:**
- [ ] Login page at `/login` with Email/Password and Google options
- [ ] Register page at `/register` with Name, Email, Password
- [ ] Form validation using Zod (Email format, Password min 6 chars)
- [ ] Successful registration creates user document in Firestore `users/{uid}`
- [ ] User document includes: `email`, `displayName`, `role: 'user'`, `createdAt`
- [ ] Redirect to `/dashboard` upon success

**Technical Implementation:**
- Architecture Decision 1: Firebase Auth
- Use `createUserWithEmailAndPassword` and `signInWithPopup`
- Firestore path: `users/{uid}`

### Story 2.2: Authentication State Management
**As a** User
**I want** the application to remember my login state
**So that** I don't have to log in every time I refresh.

**Acceptance Criteria:**
- [ ] `AuthContext` implemented to track user session
- [ ] Protected routes redirect to `/login` if unauthenticated
- [ ] Public routes (Landing) accessible without login
- [ ] Loading skeleton displayed while checking auth status
- [ ] Logout functionality clears session and redirects to home

**Technical Implementation:**
- Architecture Decision 5: State Management
- Use `onAuthStateChanged` listener

---

## Epic 3: Credit System & Payments (PENDING IMPLEMENTATION)
**Goal:** Implement the monetization engine.

### Story 3.1: Credit Wallet & Display
**As a** User
**I want** to see my current credit balance
**So that** I know how many generations I can perform.

**Acceptance Criteria:**
- [ ] Firestore `users/{uid}/credits` field tracks balance
- [ ] Real-time listener updates UI immediately when balance changes
- [ ] `CreditBadge` component displays balance in Header/Sidebar
- [ ] Visual indicator for low balance (< 10 credits)

**Technical Implementation:**
- Architecture Decision 3: Payments
- Real-time Firestore listener

### Story 3.2: Purchase Credits (Stripe Integration)
**As a** User
**I want** to purchase credit packs
**So that** I can generate more content.

**Acceptance Criteria:**
- [ ] Pricing page displaying credit packs (e.g., 100 credits for $10)
- [ ] "Buy Now" button triggers Stripe Checkout session
- [ ] API Route `/api/create-checkout` handles session creation
- [ ] Success URL redirects to `/dashboard?success=true`
- [ ] Cancel URL redirects to `/pricing?canceled=true`

**Technical Implementation:**
- Architecture Decision 3: Stripe
- Use `stripe.checkout.sessions.create`

### Story 3.3: Payment Webhook Handler
**As a** System
**I want** to process successful payments automatically
**So that** users receive their credits immediately.

**Acceptance Criteria:**
- [ ] API Route `/api/webhooks/stripe` created
- [ ] Verify Stripe signature to ensure security
- [ ] Handle `checkout.session.completed` event
- [ ] Extract `userId` from session metadata
- [ ] Atomically increment user credits in Firestore
- [ ] Log transaction in `users/{uid}/creditTransactions`

**Technical Implementation:**
- Architecture Decision 3: Webhooks
- Use Firebase Admin SDK for secure database updates

---

## Epic 4: AI Video Generation
**Goal:** Enable video creation capabilities.

### Story 4.1: Video Generation Interface
**As a** User
**I want** a form to input my video prompt and settings
**So that** I can specify what video I want to create.

**Acceptance Criteria:**
- [ ] Video creation page at `/video`
- [ ] Text area for prompt (min 10 chars)
- [ ] Model selector: Veo 3.1 Fast, Veo 3.1 HD, Sora 2
- [ ] Aspect ratio selector: 16:9, 9:16, 1:1
- [ ] "Generate" button shows cost (e.g., "Generate (10 credits)")
- [ ] Button disabled if insufficient credits

**Technical Implementation:**
- Architecture Decision 6: Form Validation (Zod)
- UI components from Epic 1

### Story 4.2: Video Generation Logic (Kie.ai)
**As a** User
**I want** the system to process my video request
**So that** I get a generated video result.

**Acceptance Criteria:**
- [ ] API call to `services/aiService.ts` on form submission
- [ ] Deduct credits optimistically or validate balance before call
- [ ] Create job document in `users/{uid}/jobs` with status 'pending'
- [ ] Poll Kie.ai API for completion
- [ ] Update job status to 'completed' with video URL
- [ ] Handle errors and refund credits if generation fails

**Technical Implementation:**
- Architecture Decision 4: AI Integration
- Polling mechanism for async jobs

---

## Epic 5: AI Image Generation
**Goal:** Enable image creation capabilities.

### Story 5.1: Image Generation Interface & Logic
**As a** User
**I want** to generate images from text prompts
**So that** I can create visual assets.

**Acceptance Criteria:**
- [ ] Image creation page at `/image`
- [ ] Prompt input and Style selector (Nano Banana, Midjourney)
- [ ] Integration with Kie.ai image endpoint
- [ ] Credit deduction (e.g., 1 credit per image)
- [ ] Display generated image with Download button

**Technical Implementation:**
- Similar pattern to Video Generation but using Image endpoints

---

## Epic 6: Avatar Studio
**Goal:** Enable avatar creation capabilities.

### Story 6.1: Avatar Creation Flow
**As a** User
**I want** to upload a photo to generate an AI avatar
**So that** I can create a personalized character.

**Acceptance Criteria:**
- [ ] Avatar page at `/avatar`
- [ ] Image upload component (drag & drop)
- [ ] Upload image to Firebase Storage (or convert to base64 if small)
- [ ] Send to Kie.ai (Kling AI model)
- [ ] Display result side-by-side with original

**Technical Implementation:**
- Architecture Decision 4: AI Integration

---

## Epic 7: My Library & History
**Goal:** Manage generated content.

### Story 7.1: User Library
**As a** User
**I want** to see all my generated videos and images
**So that** I can access them later.

**Acceptance Criteria:**
- [ ] Library page at `/library`
- [ ] Grid view of generated content
- [ ] Filter by type: All, Video, Image, Avatar
- [ ] Sort by date (newest first)
- [ ] Click item to view full size/play video

**Technical Implementation:**
- Query Firestore `users/{uid}/jobs`
- Use infinite scroll or pagination

---

## Epic 8: Admin Dashboard
**Goal:** Platform management.

### Story 8.1: Admin Overview
**As a** Admin
**I want** to view user statistics
**So that** I can monitor platform usage.

**Acceptance Criteria:**
- [ ] Admin route `/admin` protected (role must be 'admin')
- [ ] List of all users with credit balances
- [ ] Ability to manually add/remove credits for a user
- [ ] View total system generation count

**Technical Implementation:**
- Architecture Section 6.2 (Security Rules)
- Firebase Admin SDK
