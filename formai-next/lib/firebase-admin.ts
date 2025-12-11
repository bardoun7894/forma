// Firebase Admin SDK Configuration
// Used for server-side operations (Next.js API routes, Server Components, Server Actions)

import { initializeApp, getApps, cert, type ServiceAccount, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;
let adminAuthInstance: Auth | undefined;
let adminDbInstance: Firestore | undefined;

function initializeFirebaseAdmin(): App {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    // Service account can be provided as:
    // 1. Base64-encoded JSON in FIREBASE_ADMIN_SERVICE_ACCOUNT env var
    // 2. Path to service account JSON file in GOOGLE_APPLICATION_CREDENTIALS
    const serviceAccountBase64 = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;

    if (!serviceAccountBase64) {
        throw new Error('FIREBASE_ADMIN_SERVICE_ACCOUNT environment variable is not set');
    }

    const serviceAccount = JSON.parse(
        Buffer.from(serviceAccountBase64, 'base64').toString('utf-8')
    ) as ServiceAccount;

    return initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
}

// Lazy initialization getters
export function getAdminAuth(): Auth {
    if (!adminAuthInstance) {
        if (!adminApp) {
            adminApp = initializeFirebaseAdmin();
        }
        adminAuthInstance = getAuth(adminApp);
    }
    return adminAuthInstance;
}

export function getAdminDb(): Firestore {
    if (!adminDbInstance) {
        if (!adminApp) {
            adminApp = initializeFirebaseAdmin();
        }
        adminDbInstance = getFirestore(adminApp);
    }
    return adminDbInstance;
}

// Export getter functions - call these to get the actual instances
// Usage: const db = adminDb(); const auth = adminAuth();
export const adminAuth = getAdminAuth;
export const adminDb = getAdminDb;
