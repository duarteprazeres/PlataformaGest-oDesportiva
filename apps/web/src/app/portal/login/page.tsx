'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlobalApi } from '@/lib/api-global';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import styles from './login.module.css';

export default function PortalLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await GlobalApi.login({ email, password });
            // data = { access_token, user }

            // Guardar token (solução simples para já)
            if (data?.access_token) {
                localStorage.setItem('global_token', data.access_token);
            }

            router.push('/portal/dashboard');
        } catch (err: any) {
            setError(err.message || 'Login falhou. Verifique as credenciais.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>NovaScore Athlete</h1>
                    <p className={styles.subtitle}>Gerencie a sua identidade desportiva.</p>
                </div>

                <form onSubmit={handleLogin} className={styles.form}>
                    {error && <div className={styles.errorAlert}>{error}</div>}

                    <Input
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="pai@exemplo.com"
                    />

                    <div className={styles.passwordWrapper}>
                        <Input
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                        {/* <Link href="/portal/forgot-password" className={styles.forgotLink}>
                Esqueceu a password?
            </Link> */}
                    </div>

                    <Button
                        type="submit"
                        fullWidth
                        disabled={loading}
                    >
                        {loading ? 'A entrar...' : 'Entrar'}
                    </Button>
                </form>

                <div className={styles.footer}>
                    <p>Ainda não tem conta?</p>
                    <Link href="/portal/register" className={styles.registerLink}>
                        Criar Conta Global
                    </Link>
                    <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem', width: '100%' }}>
                        <p style={{ fontSize: '0.875rem', color: '#666' }}>É Treinador ou Gestor?</p>
                        <Link href="/login" className={styles.registerLink} style={{ color: '#4F46E5' }}>
                            Aceder ao Painel do Clube
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
