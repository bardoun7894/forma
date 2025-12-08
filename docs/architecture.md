# FormaAI - System Architecture

**Version:** 1.0  
**Date:** 2025-12-01  
**Architect:** Winston (BMad Architect Agent)  
**Status:** ✅ Complete

---

## Executive Summary

FormaAI uses a **Firebase-first architecture** with Next.js 16 App Router, leveraging Firestore for data persistence, Firebase Auth for authentication (Email + Google OAuth), and Stripe for payments. The platform aggregates AI models via Kie.ai for video/image/avatar generation with a credit-based monetization system. **Arabic is the default language with RTL layout**, English available via toggle.

**Key Architectural Decisions:**
- **Database:** Firebase Firestore (NoSQL)
- **Auth:** Firebase Authentication
- **Payments:** Stripe Checkout + Webhooks
- **i18n:** next-intl (Arabic RTL default)
- **AI Integration:** Kie.ai via HTTP client with polling
- **State Management:** React Context + Firebase real-time listeners

---

## Project Context

### Overview
**FormaAI** - Professional AI generation platform democratizing access to Veo 3.1, Sora 2, and Midjourney via a unified, credit-based SaaS.

**Scale:**
- 5 Epics, 17 Stories
- 19 Functional Requirements (FR1-FR19)
- MVP Target: 15 days

**Core Features:**
1. Video Generation (Veo 3.1, Sora 2)
2. Image Generation (Nano Banana, Midjourney)
3. Avatar Studio (Kling AI)
4. Credit System (Stripe)
5. Admin Dashboard

**Critical NFRs:**
- **Performance:** <2s UI latency, <5s generation start
- **i18n:** Arabic RTL default, English toggle
- **UX:** Smaller fonts (14px), mobile responsive, dark Itero theme (#00C4CC teal, #070707 black)

---

## Brownfield Foundation

**Existing Setup (Locked):**
- Next.js 16.0.6 (App Router)
- React 19.2.0
- TypeScript 5.x
- Tailwind CSS 3.4.18
- Framer Motion 12.23.24
- Lucide React 0.555.0

---

## Architectural Decisions

### Decision 1: Database & Authentication - Firebase

**Status:** ✅ Confirmed  
**Services:** Firestore + Firebase Auth

**Firebase Configuration (User Provided):**
```typescript
// Project: my-app-3c17b
const firebaseConfig = {
  apiKey: "AIzaSyDXbXlamk0bHz1muBhyYtl2aTZ38J3cjKk",
  authDomain: "my-app-3c17b.firebaseapp.com",
  projectId: "my-app-3c17b",
  storageBucket: "my-app-3c17b.firebasestorage.app",
  messagingSenderId: "1052595244864",
  appId: "1:1052595244864:web:fba53c6a01a250b59bf4a5",
  measurementId: "G-RDB7N607LY"
};
```

**Firestore Data Model (NoSQL):**
```
/users/{userId}
  - email: string
  - displayName: string
  - role: 'user' | 'admin'
  - locale: 'ar' | 'en'
  - credits: number (denormalized)
  - createdAt: Timestamp
  
  /creditTransactions (subcollection)
    /{transactionId}
      - amount: number
      - type: 'purchase' | 'deduction' | 'adjustment'
      - stripePaymentId?: string
      - jobId?: string
      - createdAt: Timestamp
  
  /jobs (subcollection)
    /{jobId}
      - serviceType: 'video' | 'image' | 'avatar'
      - model: string
      - prompt: string
      - status: 'pending' | 'processing' | 'completed' | 'failed'
      - costCredits: number
      - resultUrls: string[]
      - createdAt: Timestamp
```

**Implementation:**
- Client: `firebase` 11.x for Auth, Firestore SDK
- Server: `firebase-admin` for secure operations in Server Components
- Auth Methods: Email/Password + Google OAuth (enabled in Firebase Console)

**Affects:** All Epics

---

### Decision 2: Internationalization (i18n)

**Status:** ✅ Decided  
**Library:** `next-intl` 3.x

**Configuration:**
- **Default Locale:** `ar` (Arabic RTL)
- **Supported:** `['ar', 'en']`
- **RTL Handling:** `dir="rtl"` in root `layout.tsx` when locale=ar
- **Translations:** `/messages/ar.json`, `/messages/en.json`
- **Language Switcher:** Client component in header

**Installation:**
```bash
npm install next-intl
```

**Affects:** Epic 1 (Story 1.3 Layout), all UI components

---

### Decision 3: Payments - Stripe

**Status:** ✅ Decided  
**Version:** `stripe` 15.x+

**Flow:**
1. User clicks "Buy Credits" → `/api/create-checkout` (Server Action)
2. Redirect to Stripe Checkout
3. Payment completes → Webhook → `/api/webhooks/stripe`
4. Webhook handler updates Firebase `users/{uid}/credits` using Admin SDK

**Webhook Validation:**
- Verify signature using `stripe.webhooks.constructEvent`
- Handle `checkout.session.completed` event
- Atomic credit update in Firestore

**Installation:**
```bash
npm install stripe
```

**Affects:** Epic 2 (Credit System)

---

### Decision 4: AI Integration - Kie.ai

**Status:** ✅ In Progress (Service exists)  
**Pattern:** HTTP Client (fetch) + Polling

**Current Service:** `services/aiService.ts`

**Models:**
- Video: Veo 3.1 Fast, Veo 3.1 HD, Sora 2, Sora 2 Pro
- Image: Nano Banana, Midjourney
- Avatar: Kling AI

**Async Handling:**
- Polling interval: 3s
- Timeout: 5 min
- Status tracking: Firebase `/users/{uid}/jobs/{jobId}`

**Affects:** Epic 3 (AI Generation), Epic 4 (Avatar)

---

### Decision 5: State Management

**Status:** ✅ Decided  
**Pattern:** React Context + Firebase Real-time Listeners

**Implementation:**
- **Auth State:** `onAuthStateChanged` listener
- **Credits:** Firestore real-time listener on `users/{uid}/credits`
- **Jobs:** Query listener on `users/{uid}/jobs` (ordered by createdAt)
- **No Zustand/Redux:** Firebase sync handles global state

**Affects:** All client components

---

### Decision 6: Form Validation

**Status:** ✅ Decided  
**Libraries:** Zod + React Hook Form

**Installation:**
```bash
npm install zod react-hook-form @hookform/resolvers
```

**Usage:**
```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  prompt: z.string().min(10).max(500),
  model: z.enum(['veo3-fast', 'veo3-hd', 'sora2'])
});
```

**Affects:** Epic 1 (Auth), Epic 3 (Generation forms)

---

### Decision 7: Error Handling & Notifications

**Status:** ✅ Decided  
**Library:** `react-hot-toast`

**Pattern:**
- Client errors: Toast notifications
- Server errors: Try-catch + structured logging
- Firebase Auth errors: Map to user-friendly Arabic/English messages

**Installation:**
```bash
npm install react-hot-toast
```

---

## Implementation Patterns

### Project Structure

```
formai-next/
  app/
    (auth)/
      login/page.tsx
      register/page.tsx
    (dashboard)/
      layout.tsx          # Sidebar for desktop, bottom nav for mobile
      page.tsx            # Dashboard home
      video/page.tsx
      image/page.tsx
      avatar/page.tsx
      credits/page.tsx
    api/
      create-checkout/route.ts
      webhooks/
        stripe/route.ts
    layout.tsx            # Root layout with dir="rtl" for Arabic
  components/
    auth/
      LoginForm.tsx
      RegisterForm.tsx
    dashboard/
      Sidebar.tsx
      CreditBadge.tsx
    generation/
      VideoForm.tsx
      ImageForm.tsx
  lib/
    firebase.ts           # Client Firebase config
    firebase-admin.ts     # Server Firebase Admin SDK
  services/
    aiService.ts          # Kie.ai integration (existing)
    stripe.ts             # Stripe helpers
  messages/
    ar.json               # Arabic translations
    en.json               # English translations
```

### Naming Conventions

- **Components:** `PascalCase.tsx` (e.g., `UserCard.tsx`)
- **Utilities:** `camelCase.ts` (e.g., `formatCredits.ts`)
- **Firestore Collections:** `camelCase` (e.g., `creditTransactions`)
- **API Routes:** `kebab-case` (e.g., `/api/create-checkout`)

### API Response Format

```typescript
type APIResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    messageAr?: string;  // Arabic error message
  };
};
```

### Error Handling Pattern

**Client:**
```typescript
try {
  const result = await someAction();
  if (result.success) {
    toast.success(t('success'));
  } else {
    toast.error(locale === 'ar' ? result.error.messageAr : result.error.message);
  }
} catch (err) {
  toast.error(t('unexpectedError'));
}
```

**Server:**
```typescript
export async function POST(req: Request) {
  try {
    // Logic
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' }
    }, { status: 500 });
  }
}
```

---

## Technology Stack Summary

| Category | Technology | Version | Status |
|----------|-----------|---------|--------|
| **Framework** | Next.js | 16.0.6 | ✅ Locked |
| **React** | React | 19.2.0 | ✅ Locked |
| **Language** | TypeScript | 5.x | ✅ Locked |
| **Database** | Firebase Firestore | 11.x | ✅ Decided |
| **Authentication** | Firebase Auth | 11.x | ✅ Decided |
| **Payments** | Stripe | 15.x+ | ✅ Decided |
| **i18n** | next-intl | 3.x | ✅ Decided |
| **Styling** | Tailwind CSS | 3.4.18 | ✅ Locked |
| **Animation** | Framer Motion | 12.23.24 | ✅ Locked |
| **Icons** | Lucide React | 0.555.0 | ✅ Locked |
| **Forms** | React Hook Form | Latest | ✅ Decided |
| **Validation** | Zod | Latest | ✅ Decided |
| **Notifications** | react-hot-toast | Latest | ✅ Decided |
| **AI Integration** | Kie.ai (HTTP) | N/A | ✅ In Progress |

---

## Epic-to-Architecture Mapping

### Epic 1: Foundation & Authentication
- **Story 1.1 (Infrastructure):**
  - Install: `firebase`, `firebase-admin`, `next-intl`, `stripe`, `zod`, `react-hook-form`, `@hookform/resolvers`, `react-hot-toast`
  - Create `lib/firebase.ts` and `lib/firebase-admin.ts`
  - Configure Firestore security rules
  
- **Story 1.2 (Auth):**
  - Components: `components/auth/LoginForm.tsx`, `RegisterForm.tsx`
  - Use Firebase Auth `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`
  - Google OAuth: `signInWithPopup(new GoogleAuthProvider())`
  
- **Story 1.3 (Layout):**
  - RTL: `app/layout.tsx` sets `dir="rtl"` when locale=ar
  - Sidebar: Desktop (persistent), Mobile (bottom tab bar)
  - Language switcher in header
  
- **Story 1.4 (Landing):**
  - Use existing `TubeLightBackground` component
  - Dark Itero theme

### Epic 2: Credit System
- **Story 2.1 (Wallet):**
  - Firestore: `users/{uid}/credits` field
  - Subcollection: `creditTransactions`
  
- **Story 2.3 (Stripe):**
  - API Route: `/api/create-checkout` → Stripe Checkout
  - Webhook: `/api/webhooks/stripe` → Update Firestore credits
  
- **Story 2.4 (Dashboard):**
  - Real-time listener on `users/{uid}/credits`
  - Display in `CreditBadge` component

### Epic 3: AI Generation
- **Story 3.2 (Video):**
  - Call `services/aiService.ts` → Kie.ai
  - Create job in Firestore: `users/{uid}/jobs/{jobId}`
  - Poll status, update Firestore
  
- **Story 3.4 (History):**
  - Query: `users/{uid}/jobs` ordered by `createdAt desc`

### Epic 5: Admin Dashboard
- **Story 5.1 (Dashboard):**
  - Firebase Admin SDK for aggregation queries
  - Role check: `user.role === 'admin'`

---

## Security Considerations

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /creditTransactions/{txId} {
        allow read: if request.auth.uid == userId;
        allow write: if false; // Only server can write
      }
      
      match /jobs/{jobId} {
        allow read: if request.auth.uid == userId;
        allow create: if request.auth.uid == userId;
        allow update: if false; // Only server updates status
      }
    }
    
    // Admin-only collection
    match /admin/{doc=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### Environment Variables

**Client (`.env.local`):**
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDXbXlamk0bHz1muBhyYtl2aTZ38J3cjKk
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=my-app-3c17b.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=my-app-3c17b
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=my-app-3c17b.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1052595244864
NEXT_PUBLIC_FIREBASE_APP_ID=1:1052595244864:web:fba53c6a01a250b59bf4a5
NEXT_PUBLIC_KIE_API_KEY=<your-kie-api-key>
```

**Server (`.env.local`):**
```bash
FIREBASE_ADMIN_SERVICE_ACCOUNT=<base64-encoded-service-account-json>
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Deployment Architecture

**Platform:** Vercel (recommended for Next.js)

**Configuration:**
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`
- **Node Version:** 20.x

**Environment Variables:** Set in Vercel Dashboard (same as `.env.local`)

**Firestore:** Production database (upgrade to Blaze plan for serverless functions if needed)

---

## First Implementation Story

**Story 1.1: Project Infrastructure**

**Checklist:**
1. ✅ Next.js 16 already set up
2. Install dependencies:
   ```bash
   npm install firebase firebase-admin next-intl stripe zod react-hook-form @hookform/resolvers react-hot-toast
   ```
3. Create `lib/firebase.ts`:
   ```typescript
   import { initializeApp } from 'firebase/app';
   import { getAuth } from 'firebase/auth';
   import { getFirestore } from 'firebase/firestore';
   
   const firebaseConfig = {
     apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
     authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
     projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
     storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
     messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
     appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
   };
   
   const app = initializeApp(firebaseConfig);
   export const auth = getAuth(app);
   export const db = getFirestore(app);
   ```
4. Create `lib/firebase-admin.ts` (Firebase Admin SDK)
5. Configure Firestore security rules
6. Set up `.env.local` with Firebase config
7. Configure `next-intl` for Arabic RTL default

---

## Architecture Decision Records (ADRs)

### ADR-001: Firebase over Prisma
**Date:** 2025-12-01  
**Status:** Accepted  
**Context:** Need database + auth for MVP  
**Decision:** Firebase (Firestore + Auth)  
**Rationale:** User preference, integrated auth, rapid development, no backend setup  
**Consequences:** NoSQL data model (denormalization), Firebase costs based on reads/writes

### ADR-002: Arabic RTL Default
**Date:** 2025-12-01  
**Status:** Accepted  
**Context:** Target audience includes Arabic speakers  
**Decision:** Arabic is default locale, `dir="rtl"` by default  
**Rationale:** User requirement, better UX for primary audience  
**Consequences:** All UI must support RTL layout, translations required

### ADR-003: Smaller Font Sizes
**Date:** 2025-12-01  
**Status:** Accepted  
**Context:** Professional aesthetic desired  
**Decision:** 14px body, 12px secondary (vs standard 16px)  
**Rationale:** User preference for "cleaner, professional look"  
**Consequences:** Must ensure WCAG AA compliance despite smaller fonts

---

**Architecture Status:** ✅ **COMPLETE**

All critical architectural decisions documented. Ready for implementation sprint planning.

**Next Step:** Update `bmm-workflow-status.yaml` and proceed to Sprint Planning workflow.
