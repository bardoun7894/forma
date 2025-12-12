import { db } from './firebase';
import { collection, addDoc, updateDoc, doc, query, where, getDocs, orderBy, Timestamp, getDoc, setDoc } from 'firebase/firestore';

// Types for different data models
export interface VideoGeneration {
    id?: string;
    userId: string;
    prompt: string;
    taskId?: string; // Veo API task ID for polling
    videoUrl: string;
    thumbnailUrl?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'deleted';
    errorMessage?: string;
    model: string; // 'veo3' or 'veo3_fast'
    aspectRatio?: '16:9' | '9:16';
    duration: number;
    creditsUsed: number;
    createdAt: string;
    completedAt?: string;
    deletedAt?: string;
}

export interface ImageGeneration {
    id?: string;
    userId: string;
    prompt: string;
    imageUrl: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'deleted';
    model: string; // 'midjourney' or 'nano-banana'
    creditsUsed: number;
    createdAt: string;
    completedAt?: string;
    deletedAt?: string;
}

export interface AvatarGeneration {
    id?: string;
    userId: string;
    prompt: string;
    avatarUrl: string;
    type: 'image' | 'video'; // image = portrait, video = talking avatar
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'deleted';
    creditsUsed: number;
    createdAt: string;
    completedAt?: string;
    deletedAt?: string;
}

export interface ChatMessage {
    id?: string;
    userId: string;
    sessionId: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
}

export interface Payment {
    id?: string;
    userId: string;
    amount: number;
    currency: string;
    credits: number;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    stripePaymentId?: string;
    createdAt: string;
}

// Video Generation Functions
export async function saveVideoGeneration(data: Omit<VideoGeneration, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'videos'), {
        ...data,
        createdAt: new Date().toISOString(),
    });
    return docRef.id;
}

export async function updateVideoGeneration(id: string, updates: Partial<VideoGeneration>): Promise<void> {
    await updateDoc(doc(db, 'videos', id), updates);
}

export async function getUserVideos(userId: string): Promise<VideoGeneration[]> {
    try {
        const q = query(
            collection(db, 'videos'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoGeneration));
    } catch (error) {
        // If index doesn't exist yet, try without orderBy
        console.warn('Videos query with orderBy failed, trying without:', error);
        try {
            const q = query(
                collection(db, 'videos'),
                where('userId', '==', userId)
            );
            const snapshot = await getDocs(q);
            const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoGeneration));
            // Sort in memory
            return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (fallbackError) {
            console.error('Videos query failed completely:', fallbackError);
            return [];
        }
    }
}

export async function getVideoByTaskId(taskId: string): Promise<VideoGeneration | null> {
    const q = query(
        collection(db, 'videos'),
        where('taskId', '==', taskId)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as VideoGeneration;
}

export async function getVideoById(id: string): Promise<VideoGeneration | null> {
    const docRef = doc(db, 'videos', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as VideoGeneration;
}

export async function getPendingVideos(userId: string): Promise<VideoGeneration[]> {
    const q = query(
        collection(db, 'videos'),
        where('userId', '==', userId),
        where('status', 'in', ['pending', 'processing'])
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoGeneration));
}

export async function deleteVideo(id: string): Promise<void> {
    await updateDoc(doc(db, 'videos', id), {
        status: 'deleted',
        deletedAt: new Date().toISOString(),
    });
}

// Image Generation Functions
export async function saveImageGeneration(data: Omit<ImageGeneration, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'images'), {
        ...data,
        createdAt: new Date().toISOString(),
    });
    return docRef.id;
}

export async function updateImageGeneration(id: string, updates: Partial<ImageGeneration>): Promise<void> {
    await updateDoc(doc(db, 'images', id), updates);
}

export async function deleteImage(id: string): Promise<void> {
    await updateDoc(doc(db, 'images', id), {
        status: 'deleted',
        deletedAt: new Date().toISOString(),
    });
}

export async function getUserImages(userId: string): Promise<ImageGeneration[]> {
    try {
        const q = query(
            collection(db, 'images'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ImageGeneration));
    } catch (error) {
        // If index doesn't exist yet, try without orderBy
        console.warn('Images query with orderBy failed, trying without:', error);
        try {
            const q = query(
                collection(db, 'images'),
                where('userId', '==', userId)
            );
            const snapshot = await getDocs(q);
            const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ImageGeneration));
            // Sort in memory
            return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (fallbackError) {
            console.error('Images query failed completely:', fallbackError);
            return [];
        }
    }
}

// Avatar Generation Functions
export async function saveAvatarGeneration(data: Omit<AvatarGeneration, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'avatars'), {
        ...data,
        createdAt: new Date().toISOString(),
    });
    return docRef.id;
}

export async function deleteAvatar(id: string): Promise<void> {
    await updateDoc(doc(db, 'avatars', id), {
        status: 'deleted',
        deletedAt: new Date().toISOString(),
    });
}

export async function getUserAvatars(userId: string): Promise<AvatarGeneration[]> {
    try {
        const q = query(
            collection(db, 'avatars'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AvatarGeneration));
    } catch (error) {
        // If index doesn't exist yet, try without orderBy
        console.warn('Avatars query with orderBy failed, trying without:', error);
        try {
            const q = query(
                collection(db, 'avatars'),
                where('userId', '==', userId)
            );
            const snapshot = await getDocs(q);
            const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AvatarGeneration));
            // Sort in memory
            return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (fallbackError) {
            console.error('Avatars query failed completely:', fallbackError);
            return [];
        }
    }
}

// Chat Session Interface
export interface ChatSession {
    id: string;
    userId: string;
    title: string;
    createdAt: string;
    updatedAt: string;
}

// Chat Functions
export async function saveChatMessage(data: Omit<ChatMessage, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'chats'), {
        ...data,
        createdAt: new Date().toISOString(),
    });

    // Update session's updatedAt
    const sessionRef = doc(db, 'chatSessions', data.sessionId);
    await setDoc(sessionRef, { updatedAt: new Date().toISOString() }, { merge: true });

    return docRef.id;
}

export async function getChatHistory(userId: string, sessionId: string): Promise<ChatMessage[]> {
    const q = query(
        collection(db, 'chats'),
        where('userId', '==', userId),
        where('sessionId', '==', sessionId),
        orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
}

export async function createChatSession(userId: string, title: string = 'New Chat'): Promise<string> {
    const docRef = await addDoc(collection(db, 'chatSessions'), {
        userId,
        title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });
    return docRef.id;
}

export async function getUserChatSessions(userId: string): Promise<ChatSession[]> {
    const q = query(
        collection(db, 'chatSessions'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatSession));
}

export async function updateChatSessionTitle(sessionId: string, title: string): Promise<void> {
    const sessionRef = doc(db, 'chatSessions', sessionId);
    await setDoc(sessionRef, { title, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function deleteChatSession(sessionId: string): Promise<void> {
    // Delete all messages in the session
    const q = query(collection(db, 'chats'), where('sessionId', '==', sessionId));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    // Delete the session
    await deleteDoc(doc(db, 'chatSessions', sessionId));
}

// Payment Functions
export async function savePayment(data: Omit<Payment, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'payments'), {
        ...data,
        createdAt: new Date().toISOString(),
    });
    return docRef.id;
}

export async function getUserPayments(userId: string): Promise<Payment[]> {
    const q = query(
        collection(db, 'payments'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
}

// Credit Management
export async function ensureUserDocument(userId: string, userData?: Partial<any>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        // Create a basic user document with default credits
        await setDoc(userRef, {
            uid: userId,
            email: userData?.email || '',
            displayName: userData?.displayName || '',
            photoURL: userData?.photoURL || null,
            credits: 10, // default free credits
            role: 'user',
            createdAt: new Date().toISOString(),
            ...userData,
        });
    }
}

export async function deductCredits(userId: string, amount: number): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        // If user document doesn't exist, create it with default credits
        await ensureUserDocument(userId);
    }
    const currentCredits = userSnap.exists() ? userSnap.data()?.credits || 0 : 10;
    await updateDoc(userRef, {
        credits: Math.max(0, currentCredits - amount),
    });
}

export async function addCredits(userId: string, amount: number): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        await ensureUserDocument(userId);
    }
    const currentCredits = userSnap.exists() ? userSnap.data()?.credits || 0 : 10;
    await updateDoc(userRef, {
        credits: currentCredits + amount,
    });
}
