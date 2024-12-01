import React, { createContext, useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';

// Create a context for authentication
export const AuthContext = createContext();

// AuthProvider component to provide user and admin status
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setUser(user);
            if (user) {
                const idTokenResult = await user.getIdTokenResult();
                setIsAdmin(!!idTokenResult.claims.isAdmin);
            } else {
                setIsAdmin(false);
            }
        });

        return () => unsubscribe(); // Cleanup on unmount
    }, []);

    return (
        <AuthContext.Provider value={{ user, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};
