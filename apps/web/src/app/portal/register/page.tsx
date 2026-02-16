'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlobalApi } from '@/lib/api-global';
import Link from 'next/link';
import { Check, Trophy, Loader } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import styles from './register.module.css';

export default function PortalRegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await GlobalApi.register(formData);

            // Auto login with token from registration
            if (data.access_token) {
                localStorage.setItem('global_auth_token', data.access_token);
            }

            router.push('/portal/dashboard');
        } catch (err: any) {
            setError(err.message || 'Registo falhou.');
        } finally {
            setLoading(false);
        }
    };

    const updateForm = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className={styles.container}>
            {/* Sidebar / Marketing Side */}
            <div className={styles.sidebar}>
                <div className={styles.brand}>
                    <div className={styles.logo}>N</div>
                    <span>NovaScore</span>
                </div>

                <div className={styles.marketingContent}>
                    <h1>O seu Passaporte Desportivo único.</h1>
                    <p>Acompanhe a carreira do seu atleta, independentemente do clube onde joga.</p>

                    <div className={styles.featureList}>
                        <div className={styles.feature}>
                            <div className={styles.checkIcon}><Check size={16} /></div>
                            <span>Histórico Unificado</span>
                        </div>
                        <div className={styles.feature}>
                            <div className={styles.checkIcon}><Check size={16} /></div>
                            <span>Transferências Simplificadas</span>
                        </div>
                        <div className={styles.feature}>
                            <div className={styles.checkIcon}><Check size={16} /></div>
                            <span>Controlo Parental Total</span>
                        </div>
                    </div>
                </div>

                <div className={styles.sidebarFooter}>
                    © 2026 NovaScore Platform
                </div>
            </div>

            {/* Main Form Area */}
            <div className={styles.main}>
                <div className={styles.formContainer}>

                    <div className={styles.content}>
                        <div className={styles.stepContent}>
                            <h2>Criar Conta de Pai</h2>
                            <p className={styles.sectionDesc}>Centralize a gestão desportiva da sua família numa única conta.</p>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Nome"
                                        value={formData.firstName}
                                        onChange={(e) => updateForm('firstName', e.target.value)}
                                        required
                                    />
                                    <Input
                                        label="Sobrenome"
                                        value={formData.lastName}
                                        onChange={(e) => updateForm('lastName', e.target.value)}
                                        required
                                    />
                                </div>

                                <Input
                                    label="Email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => updateForm('email', e.target.value)}
                                    required
                                />

                                <Input
                                    label="Password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => updateForm('password', e.target.value)}
                                    required
                                />

                                {error && (
                                    <div className={styles.errorBanner}>{error}</div>
                                )}

                                <div className={styles.actions}>
                                    <Button type="submit" disabled={loading}>
                                        {loading ? (
                                            <><Loader className="animate-spin" size={18} style={{ marginRight: '8px' }} /> A criar conta...</>
                                        ) : (
                                            <>Registar <Trophy size={18} style={{ marginLeft: '8px' }} /></>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className={styles.loginLink}>
                        Já tem conta? <Link href="/portal/login">Entrar</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
