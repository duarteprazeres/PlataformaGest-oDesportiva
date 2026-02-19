'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    clubId: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (credentials: any, redirectTo?: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const checkSession = async () => {
        try {
            setIsLoading(true);
            const data = await fetchApi('/auth/me');
            if (data && data.user) {
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.log('No active session');
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkSession();
    }, []);

    const login = async (credentials: any, redirectTo: string = '/dashboard') => {
        await fetchApi('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
        const data = await fetchApi('/auth/me');
        if (data && data.user) {
            setUser(data.user);
            router.push(redirectTo);
        }
    };

    const logout = async () => {
        try {
            await fetchApi('/auth/logout', { method: 'POST' });
        } catch (e) {
            console.error('Logout failed', e);
        }
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
