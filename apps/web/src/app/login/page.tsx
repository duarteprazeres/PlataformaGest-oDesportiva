'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './login.module.css';
import { useTheme } from '@/context/ThemeContext';

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter(); // Actually useAuth login handles redirect, but we might keep router if we customize
    const { theme } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await login({ email, password });
            // Redirect handled by context
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.');
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>NovaScore</h1>
                    <p className={styles.subtitle}>Welcome back! Please sign in to continue.</p>
                </div>

                <form onSubmit={handleLogin} className={styles.form}>
                    {error && <div className={styles.errorAlert}>{error}</div>}

                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoCapitalize="none"
                    />

                    <div className={styles.passwordWrapper}>
                        <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <Link href="/forgot-password" className={styles.forgotLink}>
                            Forgot Password?
                        </Link>
                    </div>

                    <Button type="submit" fullWidth disabled={isLoading}>
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </Button>
                </form>

                <div className={styles.footer}>
                    <p>Don't have an account?</p>
                    <Link href="/register" className={styles.registerLink}>
                        Create an Account
                    </Link>
                    <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem', width: '100%' }}>
                        <p style={{ fontSize: '0.875rem', color: '#666' }}>Are you a Parent or Athlete?</p>
                        <Link href="/portal/login" className={styles.registerLink} style={{ color: '#4F46E5' }}>
                            Go to Athlete Portal
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
