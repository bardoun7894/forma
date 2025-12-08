import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Types
export interface UserDocument {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string | null;
    credits: number;
    role: 'admin' | 'user';
    createdAt: string;
    suspended?: boolean;
    suspendedAt?: Timestamp;
    suspendedReason?: string;
}

export interface ContentItem {
    id: string;
    type: 'video' | 'image' | 'avatar';
    userId: string;
    prompt: string;
    url: string;
    status: string;
    createdAt: string;
    flagged?: boolean;
    flaggedAt?: Timestamp;
    flagReason?: string;
    flaggedBy?: string;
}

export interface PaymentDocument {
    id: string;
    userId: string;
    amount: number;
    currency: string;
    credits: number;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    createdAt: string;
    refundedAt?: Timestamp;
    refundReason?: string;
    refundedBy?: string;
    isManual?: boolean;
    notes?: string;
}

export interface CreditTransaction {
    id: string;
    amount: number;
    type: 'purchase' | 'deduction' | 'adjustment' | 'refund' | 'manual';
    createdAt: Timestamp | string;
    adjustedBy?: string;
    reason?: string;
    relatedPaymentId?: string;
}

// User Queries
export async function getAllUsers(options: {
    page?: number;
    limit?: number;
    search?: string;
    role?: 'admin' | 'user';
    suspended?: boolean;
}): Promise<{ users: UserDocument[]; total: number }> {
    const { page = 1, limit = 20, search, role, suspended } = options;

    let query = adminDb.collection('users').orderBy('createdAt', 'desc');

    // Get all docs first for filtering (Firestore doesn't support OR queries easily)
    const snapshot = await query.get();
    let users = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserDocument));

    // Apply filters
    if (role) {
        users = users.filter(u => u.role === role);
    }

    if (suspended !== undefined) {
        users = users.filter(u => !!u.suspended === suspended);
    }

    if (search) {
        const searchLower = search.toLowerCase();
        users = users.filter(u =>
            u.email?.toLowerCase().includes(searchLower) ||
            u.displayName?.toLowerCase().includes(searchLower)
        );
    }

    const total = users.length;

    // Paginate
    const startIndex = (page - 1) * limit;
    users = users.slice(startIndex, startIndex + limit);

    return { users, total };
}

export async function getUserById(userId: string): Promise<UserDocument | null> {
    const doc = await adminDb.collection('users').doc(userId).get();
    if (!doc.exists) return null;
    return { ...doc.data(), uid: doc.id } as UserDocument;
}

export async function updateUser(userId: string, updates: Partial<UserDocument>): Promise<void> {
    await adminDb.collection('users').doc(userId).update(updates);
}

export async function deleteUser(userId: string): Promise<void> {
    // Delete user document
    await adminDb.collection('users').doc(userId).delete();

    // Optionally delete related content (videos, images, avatars)
    const collections = ['videos', 'images', 'avatars', 'chats'];
    for (const collectionName of collections) {
        const docs = await adminDb.collection(collectionName).where('userId', '==', userId).get();
        const batch = adminDb.batch();
        docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    }
}

export async function adjustUserCredits(
    userId: string,
    amount: number,
    adminUid: string,
    reason: string,
    type: 'adjustment' | 'manual' = 'adjustment'
): Promise<number> {
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        throw new Error('User not found');
    }

    const currentCredits = userDoc.data()?.credits || 0;
    const newCredits = Math.max(0, currentCredits + amount);

    // Update user credits
    await userRef.update({ credits: newCredits });

    // Log transaction
    await adminDb.collection('users').doc(userId).collection('creditTransactions').add({
        amount,
        type,
        adjustedBy: adminUid,
        reason,
        createdAt: Timestamp.now(),
    });

    return newCredits;
}

export async function updateUserRole(userId: string, role: 'admin' | 'user'): Promise<void> {
    await adminDb.collection('users').doc(userId).update({ role });
}

export async function suspendUser(userId: string, reason: string): Promise<void> {
    await adminDb.collection('users').doc(userId).update({
        suspended: true,
        suspendedAt: Timestamp.now(),
        suspendedReason: reason,
    });
}

export async function unsuspendUser(userId: string): Promise<void> {
    await adminDb.collection('users').doc(userId).update({
        suspended: false,
        suspendedAt: null,
        suspendedReason: null,
    });
}

// Content Queries
export async function getAllContent(options: {
    page?: number;
    limit?: number;
    type?: 'video' | 'image' | 'avatar';
    userId?: string;
    flagged?: boolean;
}): Promise<{ items: ContentItem[]; total: number }> {
    const { page = 1, limit = 20, type, userId, flagged } = options;

    const collections = type ? [type === 'video' ? 'videos' : type === 'image' ? 'images' : 'avatars'] : ['videos', 'images', 'avatars'];
    let allItems: ContentItem[] = [];

    for (const collectionName of collections) {
        let query = adminDb.collection(collectionName).orderBy('createdAt', 'desc');

        if (userId) {
            query = query.where('userId', '==', userId);
        }

        const snapshot = await query.get();
        const items = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                type: collectionName === 'videos' ? 'video' : collectionName === 'images' ? 'image' : 'avatar',
                userId: data.userId,
                prompt: data.prompt,
                url: data.videoUrl || data.imageUrl || data.avatarUrl,
                status: data.status,
                createdAt: data.createdAt,
                flagged: data.flagged || false,
                flaggedAt: data.flaggedAt,
                flagReason: data.flagReason,
                flaggedBy: data.flaggedBy,
            } as ContentItem;
        });

        allItems = [...allItems, ...items];
    }

    // Filter by flagged if specified
    if (flagged !== undefined) {
        allItems = allItems.filter(item => !!item.flagged === flagged);
    }

    // Sort by date
    allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = allItems.length;

    // Paginate
    const startIndex = (page - 1) * limit;
    allItems = allItems.slice(startIndex, startIndex + limit);

    return { items: allItems, total };
}

export async function flagContent(
    contentId: string,
    contentType: 'video' | 'image' | 'avatar',
    adminUid: string,
    reason: string
): Promise<void> {
    const collectionName = contentType === 'video' ? 'videos' : contentType === 'image' ? 'images' : 'avatars';
    await adminDb.collection(collectionName).doc(contentId).update({
        flagged: true,
        flaggedAt: Timestamp.now(),
        flagReason: reason,
        flaggedBy: adminUid,
    });
}

export async function unflagContent(contentId: string, contentType: 'video' | 'image' | 'avatar'): Promise<void> {
    const collectionName = contentType === 'video' ? 'videos' : contentType === 'image' ? 'images' : 'avatars';
    await adminDb.collection(collectionName).doc(contentId).update({
        flagged: false,
        flaggedAt: null,
        flagReason: null,
        flaggedBy: null,
    });
}

export async function deleteContent(contentId: string, contentType: 'video' | 'image' | 'avatar'): Promise<void> {
    const collectionName = contentType === 'video' ? 'videos' : contentType === 'image' ? 'images' : 'avatars';
    await adminDb.collection(collectionName).doc(contentId).delete();
}

// Payment Queries
export async function getAllPayments(options: {
    page?: number;
    limit?: number;
    status?: 'pending' | 'completed' | 'failed' | 'refunded';
    userId?: string;
}): Promise<{ payments: PaymentDocument[]; total: number; analytics: PaymentAnalytics }> {
    const { page = 1, limit = 20, status, userId } = options;

    let query = adminDb.collection('payments').orderBy('createdAt', 'desc');

    if (userId) {
        query = query.where('userId', '==', userId);
    }

    const snapshot = await query.get();
    let payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentDocument));

    // Calculate analytics from all payments
    const analytics = calculatePaymentAnalytics(payments);

    // Apply status filter
    if (status) {
        payments = payments.filter(p => p.status === status);
    }

    const total = payments.length;

    // Paginate
    const startIndex = (page - 1) * limit;
    payments = payments.slice(startIndex, startIndex + limit);

    return { payments, total, analytics };
}

export interface PaymentAnalytics {
    totalRevenue: number;
    totalCredits: number;
    completedCount: number;
    refundedCount: number;
    pendingCount: number;
    revenueByMonth: { month: string; revenue: number }[];
}

function calculatePaymentAnalytics(payments: PaymentDocument[]): PaymentAnalytics {
    const completedPayments = payments.filter(p => p.status === 'completed');
    const refundedPayments = payments.filter(p => p.status === 'refunded');
    const pendingPayments = payments.filter(p => p.status === 'pending');

    const totalRevenue = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalCredits = completedPayments.reduce((sum, p) => sum + (p.credits || 0), 0);

    // Calculate revenue by month (last 6 months)
    const revenueByMonth: { month: string; revenue: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });

        const monthRevenue = completedPayments
            .filter(p => {
                const paymentDate = new Date(p.createdAt);
                return paymentDate.getMonth() === date.getMonth() && paymentDate.getFullYear() === date.getFullYear();
            })
            .reduce((sum, p) => sum + (p.amount || 0), 0);

        revenueByMonth.push({ month: monthKey, revenue: monthRevenue });
    }

    return {
        totalRevenue,
        totalCredits,
        completedCount: completedPayments.length,
        refundedCount: refundedPayments.length,
        pendingCount: pendingPayments.length,
        revenueByMonth,
    };
}

export async function refundPayment(
    paymentId: string,
    adminUid: string,
    reason: string
): Promise<void> {
    const paymentRef = adminDb.collection('payments').doc(paymentId);
    const paymentDoc = await paymentRef.get();

    if (!paymentDoc.exists) {
        throw new Error('Payment not found');
    }

    const payment = paymentDoc.data() as PaymentDocument;

    if (payment.status === 'refunded') {
        throw new Error('Payment already refunded');
    }

    // Update payment status
    await paymentRef.update({
        status: 'refunded',
        refundedAt: Timestamp.now(),
        refundReason: reason,
        refundedBy: adminUid,
    });

    // Deduct credits from user if payment was completed
    if (payment.status === 'completed') {
        await adjustUserCredits(
            payment.userId,
            -payment.credits,
            adminUid,
            `Refund: ${reason}`,
            'refund'
        );
    }
}

export async function addManualCredits(
    userId: string,
    credits: number,
    adminUid: string,
    reason: string
): Promise<void> {
    // Add credits to user
    await adjustUserCredits(userId, credits, adminUid, reason, 'manual');

    // Create a payment record for tracking
    await adminDb.collection('payments').add({
        userId,
        amount: 0,
        currency: 'EGP',
        credits,
        status: 'completed',
        createdAt: new Date().toISOString(),
        isManual: true,
        notes: reason,
    });
}

// Dashboard Stats
export async function getDashboardStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    adminUsers: number;
    totalVideos: number;
    totalImages: number;
    totalAvatars: number;
    totalRevenue: number;
    flaggedContent: number;
}> {
    // Get user stats
    const usersSnapshot = await adminDb.collection('users').get();
    const users = usersSnapshot.docs.map(doc => doc.data());
    const totalUsers = users.length;
    const suspendedUsers = users.filter(u => u.suspended).length;
    const adminUsers = users.filter(u => u.role === 'admin').length;
    const activeUsers = totalUsers - suspendedUsers;

    // Get content stats
    const videosSnapshot = await adminDb.collection('videos').get();
    const imagesSnapshot = await adminDb.collection('images').get();
    const avatarsSnapshot = await adminDb.collection('avatars').get();

    const totalVideos = videosSnapshot.size;
    const totalImages = imagesSnapshot.size;
    const totalAvatars = avatarsSnapshot.size;

    // Count flagged content
    const flaggedVideos = videosSnapshot.docs.filter(d => d.data().flagged).length;
    const flaggedImages = imagesSnapshot.docs.filter(d => d.data().flagged).length;
    const flaggedAvatars = avatarsSnapshot.docs.filter(d => d.data().flagged).length;
    const flaggedContent = flaggedVideos + flaggedImages + flaggedAvatars;

    // Get payment stats
    const paymentsSnapshot = await adminDb.collection('payments').where('status', '==', 'completed').get();
    const totalRevenue = paymentsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

    return {
        totalUsers,
        activeUsers,
        suspendedUsers,
        adminUsers,
        totalVideos,
        totalImages,
        totalAvatars,
        totalRevenue,
        flaggedContent,
    };
}

// Get user's credit transactions
export async function getUserTransactions(userId: string): Promise<CreditTransaction[]> {
    const snapshot = await adminDb
        .collection('users')
        .doc(userId)
        .collection('creditTransactions')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CreditTransaction));
}
