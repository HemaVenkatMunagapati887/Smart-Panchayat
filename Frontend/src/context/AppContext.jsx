// ============================================================
//  context/AppContext.jsx  — Global State & Auth Context
//  Replaces prop-drilling for user, complaints, lang, toasts.
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as api from '../services/api';

const AppContext = createContext(null);

/**
 * Toast entry shape:
 *   { id, message, type: 'success' | 'error' | 'warning' | 'info' }
 */

export function AppProvider({ children }) {
    // ── Auth ────────────────────────────────────────────────
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('sp_user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const isLoggedIn = !!user?.token;

    const login = async (email, password) => {
        const { data, ok, error } = await api.login(email, password);
        if (ok && data?.token) {
            const userData = {
                role: data.role,
                name: data.name,
                email: data.email,
                token: data.token,
                avatar: data.avatar,
            };
            setUser(userData);
            localStorage.setItem('sp_user', JSON.stringify(userData));
            return { ok: true, role: data.role };
        }
        // Prioritize network error message, then API response message
        const errorMessage = error || data?.message || 'Login failed. Please try again.';
        return { ok: false, message: errorMessage };
    };

    const googleLogin = async (credential) => {
        const { data, ok, error } = await api.googleAuth(credential);
        if (ok && data?.token) {
            const userData = {
                role: data.role,
                name: data.name,
                email: data.email,
                token: data.token,
                avatar: data.avatar,
            };
            setUser(userData);
            localStorage.setItem('sp_user', JSON.stringify(userData));
            return { ok: true, role: data.role };
        }
        const errorMessage = error || data?.message || 'Google login failed. Please try again.';
        return { ok: false, message: errorMessage };
    };

    const updateUser = (newData) => {
        const updated = { ...user, ...newData };
        setUser(updated);
        localStorage.setItem('sp_user', JSON.stringify(updated));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('sp_user');
        setComplaints([]);
    };

    // Handle token expiry globally
    const handleUnauthorized = useCallback(() => {
        logout();
    }, []);

    // ── Language ─────────────────────────────────────────────
    const [lang, setLang] = useState(() => localStorage.getItem('sp_lang') || 'en');

    useEffect(() => {
        localStorage.setItem('sp_lang', lang);
    }, [lang]);

    // ── Complaints ───────────────────────────────────────────
    const [complaints, setComplaints] = useState([]);
    const [complaintsLoading, setComplaintsLoading] = useState(false);

    const refreshComplaints = useCallback(async () => {
        if (!user?.token) return;
        setComplaintsLoading(true);
        const { data, ok, status } = await api.fetchComplaints(user.token);
        setComplaintsLoading(false);
        if (status === 401 || status === 403) { handleUnauthorized(); return; }
        if (ok && Array.isArray(data)) setComplaints(data);
    }, [user?.token, handleUnauthorized]);

    useEffect(() => {
        if (!isLoggedIn) return;
        refreshComplaints();
        const interval = setInterval(refreshComplaints, 30000);
        return () => clearInterval(interval);
    }, [isLoggedIn, refreshComplaints]);

    // ── Toast System ─────────────────────────────────────────
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Convenience helpers - memoized to prevent downstream effect loops
    const toast = useMemo(() => ({
        success: (msg, duration) => addToast(msg, 'success', duration),
        error: (msg, duration) => addToast(msg, 'error', duration),
        warning: (msg, duration) => addToast(msg, 'warning', duration),
        info: (msg, duration) => addToast(msg, 'info', duration),
    }), [addToast]);

    // ── Global Error Boundary State ──────────────────────────
    const [globalError, setGlobalError] = useState(null);

    const value = useMemo(() => ({
        // Auth
        user,
        token: user?.token,
        isLoggedIn,
        login,
        googleLogin,
        logout,
        updateUser,
        handleUnauthorized,

        // Language
        lang,
        setLang,

        // Complaints
        complaints,
        setComplaints,
        complaintsLoading,
        refreshComplaints,

        // Toasts
        toasts,
        toast,
        removeToast,

        // Global error
        globalError,
        setGlobalError,
    }), [
        user, isLoggedIn, handleUnauthorized,
        lang, complaints, complaintsLoading, refreshComplaints,
        toasts, toast, removeToast,
        globalError
    ]);

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

/** Hook to consume all app state */
export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
