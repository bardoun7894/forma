// Firebase Admin SDK Configuration
// Used for server-side operations (Next.js API routes, Server Components, Server Actions)

import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (singleton pattern)
if (getApps().length === 0) {
    // Service account can be provided as:
    // 1. Base64-encoded JSON in FIREBASE_ADMIN_SERVICE_ACCOUNT env var
    // 2. Path to service account JSON file in GOOGLE_APPLICATION_CREDENTIALS

    const serviceAccount = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT
        ? (JSON.parse(
            Buffer.from(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT, 'base64').toString('utf-8')
        ) as ServiceAccount)
        : undefined;

    initializeApp({
        credential: serviceAccount ? cert(serviceAccount) : undefined,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
}

// Export admin instances
export const adminAuth = getAuth();
export const adminDb = getFirestore();
