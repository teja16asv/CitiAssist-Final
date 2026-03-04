import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    onAuthStateChanged,
    signInWithPopup,
    signOut
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    // Manual Local Profile Fallback
    const loadManualProfile = () => {
        const stored = localStorage.getItem('citiassist_manual_profile');
        if (stored) {
            return JSON.parse(stored);
        }
        return null;
    };

    // We keep track of a merged currentUser state
    // It's either the Firebase User OR the Local Storage User
    const [currentUser, setCurrentUser] = useState(loadManualProfile());
    const [loading, setLoading] = useState(true);

    // Google Login
    async function loginWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            // If they sign in with Google, we can wipe the local manual profile
            localStorage.removeItem('citiassist_manual_profile');
            return result.user;
        } catch (error) {
            console.error("Error signing in with Google", error);
            throw error;
        }
    }

    // Save Manual Profile (Free Alternative to Auth)
    function saveManualProfile(name, phone, emergencyContact, locationData) {
        const profile = {
            isManual: true,
            displayName: name,
            phoneNumber: phone,
            emergencyContact: emergencyContact, // For SOS Feature
            location: locationData, // { lat, lng }
            createdAt: new Date().toISOString()
        };
        localStorage.setItem('citiassist_manual_profile', JSON.stringify(profile));
        setCurrentUser(profile);
    }

    async function logout() {
        // Clear manual profile if it exists
        localStorage.removeItem('citiassist_manual_profile');

        // Clear Firebase session if it exists
        if (auth.currentUser) {
            await signOut(auth);
        }

        setCurrentUser(null);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setCurrentUser(firebaseUser);
            } else {
                // If no firebase user, fall back to checking if manual profile exists
                setCurrentUser(loadManualProfile());
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        loginWithGoogle,
        saveManualProfile,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
