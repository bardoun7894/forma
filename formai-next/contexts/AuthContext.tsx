'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { ensureUserDocument } from '@/lib/database';

interface UserData {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    credits: number;
    role: string;
    createdAt: string;
}

interface AuthContextType {
    user: User | null;
    userData: UserData | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userData: null,
    loading: true,
    signOut: async () => { },
    refreshUserData: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchUserData = async (firebaseUser: User) => {
        try {
            // Ensure user document exists (create if missing)
            await ensureUserDocument(firebaseUser.uid, {
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
            });
            // Fetch the user document
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
                const data = userDoc.data() as UserData;
                setUserData(data);
                // Cache user data in localStorage
                localStorage.setItem('userData', JSON.stringify(data));
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const refreshUserData = async () => {
        if (user) {
            await fetchUserData(user);
        }
    };

    useEffect(() => {
        // Try to load cached user data
        const cachedUserData = localStorage.getItem('userData');
        if (cachedUserData) {
            setUserData(JSON.parse(cachedUserData));
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                await fetchUserData(firebaseUser);
            } else {
                setUserData(null);
                localStorage.removeItem('userData');
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            setUser(null);
            setUserData(null);
            localStorage.removeItem('userData');
            router.push('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, userData, loading, signOut, refreshUserData }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
