/**
 * AuthContext — prototype role-based auth for SatyaBid SIH demo.
 *
 * This is a FRONTEND-ONLY prototype auth layer. No real backend session
 * is established. The architecture is designed to be replaced with Firebase
 * Authentication (Google OAuth + role claims) in production.
 *
 * Firebase readiness:
 *   - Replace `signInWithEmail()` with `signInWithEmailAndPassword(auth, email, password)`
 *   - Replace `signInWithGoogle()` with `signInWithPopup(auth, googleProvider)`
 *   - Replace `signOut()` with `signOut(auth)` and clear stored role
 *   - Persist role as a Firebase custom claim or Firestore user doc field
 *   - The `AuthProvider` → `useAuth()` interface stays the same
 */
import React, { createContext, useContext, useEffect, useState } from 'react';

export type UserRole = 'officer' | 'vendor';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string, role: UserRole) => Promise<void>;
  signInWithGoogle: (role: UserRole) => Promise<void>;
  signOut: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signIn: async () => {},
  signInWithGoogle: async () => {},
  signOut: () => {},
  isAuthenticated: false,
});

const STORAGE_KEY = 'satyabid_auth_user';

// Prototype demo users by role
const DEMO_USERS: Record<UserRole, AuthUser> = {
  officer: {
    id: 'officer_demo_001',
    name: 'A. Officer',
    email: 'a.officer@department.gov.in',
    role: 'officer',
  },
  vendor: {
    id: 'vendor_demo_001',
    name: 'NexGen Classrooms Pvt. Ltd.',
    email: 'contact@nexgenclassrooms.com',
    role: 'vendor',
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        if (parsed?.id && parsed?.role) {
          setUser(parsed);
        }
      }
    } catch {}
    setLoading(false);
  }, []);

  const persist = (u: AuthUser) => {
    setUser(u);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } catch {}
  };

  const signIn = async (email: string, _password: string, role: UserRole) => {
    // FIREBASE INTEGRATION POINT:
    // const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // const role = await getUserRole(userCredential.user.uid); // from Firestore
    await new Promise((r) => setTimeout(r, 600)); // simulate network
    const u: AuthUser = {
      ...DEMO_USERS[role],
      email: email || DEMO_USERS[role].email,
    };
    persist(u);
  };

  const signInWithGoogle = async (role: UserRole) => {
    // FIREBASE INTEGRATION POINT:
    // const provider = new GoogleAuthProvider();
    // const result = await signInWithPopup(auth, provider);
    // const role = await getUserRole(result.user.uid);
    await new Promise((r) => setTimeout(r, 600));
    persist(DEMO_USERS[role]);
  };

  const signOut = () => {
    // FIREBASE INTEGRATION POINT: await firebaseSignOut(auth);
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signInWithGoogle, signOut, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
