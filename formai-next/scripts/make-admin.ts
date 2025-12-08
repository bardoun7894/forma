// Script to make a user an admin
// Run with: npx ts-node scripts/make-admin.ts

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const EMAIL = 'mbardouni44@gmail.com';

async function makeAdmin() {
    // Initialize Firebase Admin
    if (getApps().length === 0) {
        const serviceAccount = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT
            ? JSON.parse(
                Buffer.from(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT, 'base64').toString('utf-8')
            )
            : undefined;

        initializeApp({
            credential: serviceAccount ? cert(serviceAccount) : undefined,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
    }

    const db = getFirestore();

    // Find user by email
    const usersSnapshot = await db.collection('users').where('email', '==', EMAIL).get();

    if (usersSnapshot.empty) {
        console.error(`User with email ${EMAIL} not found`);
        process.exit(1);
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;

    // Update role to admin
    await db.collection('users').doc(userId).update({
        role: 'admin',
    });

    console.log(`Successfully made ${EMAIL} an admin!`);
    console.log(`User ID: ${userId}`);
}

makeAdmin().catch(console.error);
