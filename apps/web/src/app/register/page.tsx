// apps/web/src/app/(auth)/register/page.tsx
'use client';

import { toast } from "sonner";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Check, ArrowRight, ArrowLeft, Loader, Eye, EyeOff, Zap, Star, Building2 } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './page.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type Plan = 'FREE' | 'PRO' | 'PREMIUM';

interface FormData {
    // Step 1 - Club Info
    name: string;
    subdomain: string;
    email: string;
    phone: string;
    taxId: string;
    // Step 2 - Location
    address: string;
    city: string;
    postalCode: string;
    country: string;
    // Step 3 - Plan
    subscriptionPlan: Plan;
    // Step 4 - Admin
    adminName: string;
    adminEmail: string;
    adminPassword: string;
    confirmPassword: string;
}

// ─── Plan Config ──────────────────────────────────────────────────────────────

const PLANS: { id: Plan; label: string; price: string; icon: React.ReactNode; features: string[] }[] = [
    {
        id: 'FREE',
        label: 'Free',
        price: '0€/mês',
        icon: <Building2 size={22} />,
        features: [
            'Até 1 equipa',
            'Até 20 atletas',
            'Treinos e presenças',
            'Notificações básicas',
        ],
    },
    {
        id: 'PRO',
        label: 'Pro',
        price: '29€/mês',
        icon: <Zap size={22} />,
        features: [
            'Equipas ilimitadas',
            'Até 200 atletas',
            'Gestão financeira',
            'Relatórios e exportações',
            'Suporte prioritário',
        ],
    },
    {
        id: 'PREMIUM',
        label: 'Premium',
        price: '79€/mês',
        icon: <Star size={22} />,
        features: [
            'Tudo do Pro',
            'Atletas ilimitados',
            'Loja do clube',
            'Passaporte de atleta',
            'API access',
            'Gestor de conta dedicado',
        ],
    },
];

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
    { id: 1, title: 'Clube', desc: 'Informação base' },
    { id: 2, title: 'Localização', desc: 'Morada e contacto' },
    { id: 3, title: 'Plano', desc: 'Escolha a subscrição' },
    { id: 4, title: 'Admin', desc: 'Conta de acesso' },
    { id: 5, title: 'Revisão', desc: 'Confirmar e lançar' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function RegisterPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState<FormData>({
        name: '', subdomain: '', email: '', phone: '', taxId: '',
        address: '', city: '', postalCode: '', country: 'Portugal',
        subscriptionPlan: 'FREE',
        adminName: '', adminEmail: '', adminPassword: '', confirmPassword: '',
    });

    const update = (field: keyof FormData, value: string) =>
        setFormData(prev => ({ ...prev, [field]: value }));

    // ── Validation ──────────────────────────────────────────────────────────────

    const validate = (): boolean => {
        if (currentStep === 1) {
            if (!formData.name || !formData.subdomain || !formData.email) {
                setError('Preencha o nome, subdomínio e email do clube.'); return false;
            }
            const clean = formData.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
            if (clean !== formData.subdomain) update('subdomain', clean);
        }
        if (currentStep === 4) {
            if (!formData.adminName || !formData.adminEmail || !formData.adminPassword) {
                setError('Preencha todos os campos da conta admin.'); return false;
            }
            if (formData.adminPassword !== formData.confirmPassword) {
                setError('As passwords não coincidem.'); return false;
            }
            if (formData.adminPassword.length < 6) {
                setError('A password deve ter pelo menos 6 caracteres.'); return false;
            }
        }
        setError(''); return true;
    };

    const nextStep = () => { if (validate()) setCurrentStep(s => s + 1); };
    const prevStep = () => { setError(''); setCurrentStep(s => s - 1); };

    // ── Submit ──────────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError('');
        try {
            await fetchApi('/clubs', {
                method: 'POST',
                body: JSON.stringify({
                    name: formData.name,
                    subdomain: formData.subdomain,
                    email: formData.email,
                    phone: formData.phone || undefined,
                    taxId: formData.taxId || undefined,
                    address: formData.address || undefined,
                    city: formData.city || undefined,
                    postalCode: formData.postalCode || undefined,
                    country: formData.country,
                    subscriptionPlan: formData.subscriptionPlan,
                    adminName: formData.adminName,
                    adminEmail: formData.adminEmail,
                    adminPassword: formData.adminPassword,
                }),
            });
            toast.success('Clube criado com sucesso! Faça login para começar.');
            router.push('/login');
        } catch (err: any) {
            setError(err.message || 'Erro ao criar clube.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedPlan = PLANS.find(p => p.id === formData.subscriptionPlan)!;

    // ── Render ──────────────────────────────────────────────────────────────────

    return (
        <div className={styles.container}>
            {/* Sidebar */}
            <div className={styles.sidebar}>
                <div className={styles.brand}>
                    <div className={styles.logo}>N</div>
                    <span>NovaScore</span>
                </div>
                <div className={styles.marketingContent}>
                    <h1>Manage your Club like a Pro.</h1>
                    <p>Junte-se a centenas de treinadores e directores a transformar a gestão desportiva.</p>
                    <div className={styles.featureList}>
                        {['Equipas & Plantel', 'Planeamento de Treinos', 'Gestão Financeira', 'Passaporte de Atleta'].map(f => (
                            <div key={f} className={styles.feature}>
                                <div className={styles.checkIcon}><Check size={16} /></div>
                                <span>{f}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className={styles.sidebarFooter}>© 2026 NovaScore Platform</div>
            </div>

            {/* Main */}
            <div className={styles.main}>
                <div className={styles.formContainer}>

                    {/* Steps Header */}
                    <div className={styles.stepsHeader}>
                        {STEPS.map((s, idx) => (
                            <div key={s.id} className={`${styles.stepIndicator} ${currentStep >= s.id ? styles.stepActive : ''}`}>
                                <div className={styles.stepNumber}>{s.id}</div>
                                <div className={styles.stepText}>
                                    <span className={styles.stepTitle}>{s.title}</span>
                                    <span className={styles.stepDesc}>{s.desc}</span>
                                </div>
                                {idx < STEPS.length - 1 && <div className={styles.stepLine} />}
                            </div>
                        ))}
                    </div>

                    <div className={styles.content}>

                        {/* ── Step 1: Club Info ── */}
                        {currentStep === 1 && (
                            <div className={styles.stepContent}>
                                <h2>Informação do Clube</h2>
                                <Input label="Nome do Clube *" placeholder="ex: Académica de Coimbra"
                                    value={formData.name} onChange={e => update('name', e.target.value)} />
                                <div className={styles.fieldGroup}>
                                    <label>Subdomínio *</label>
                                    <div className={styles.subdomainInput}>
                                        <input placeholder="academica" value={formData.subdomain}
                                            onChange={e => update('subdomain', e.target.value)} />
                                        <span className={styles.suffix}>.novascore.com</span>
                                    </div>
                                    <p className={styles.hint}>Este será o endereço do seu clube.</p>
                                </div>
                                <Input label="Email de Contacto *" type="email" placeholder="geral@clube.pt"
                                    value={formData.email} onChange={e => update('email', e.target.value)} />
                                <Input label="Telefone" placeholder="+351 239 000 000"
                                    value={formData.phone} onChange={e => update('phone', e.target.value)} />
                                <Input label="NIF do Clube" placeholder="500123456"
                                    value={formData.taxId} onChange={e => update('taxId', e.target.value)} />
                            </div>
                        )}

                        {/* ── Step 2: Location ── */}
                        {currentStep === 2 && (
                            <div className={styles.stepContent}>
                                <h2>Localização</h2>
                                <p className={styles.sectionDesc}>Estes dados aparecem nos documentos e facturas do clube.</p>
                                <Input label="Morada" placeholder="Rua do Estádio, 1"
                                    value={formData.address} onChange={e => update('address', e.target.value)} />
                                <div className={styles.row}>
                                    <Input label="Cidade" placeholder="Coimbra"
                                        value={formData.city} onChange={e => update('city', e.target.value)} />
                                    <Input label="Código Postal" placeholder="3000-001"
                                        value={formData.postalCode} onChange={e => update('postalCode', e.target.value)} />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label>País</label>
                                    <select value={formData.country} onChange={e => update('country', e.target.value)}
                                        className={styles.select}>
                                        <option value="Portugal">Portugal</option>
                                        <option value="Brasil">Brasil</option>
                                        <option value="Espanha">Espanha</option>
                                        <option value="França">França</option>
                                        <option value="Outro">Outro</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* ── Step 3: Plan ── */}
                        {currentStep === 3 && (
                            <div className={styles.stepContent}>
                                <h2>Escolha o seu Plano</h2>
                                <p className={styles.sectionDesc}>Pode mudar de plano a qualquer momento.</p>
                                <div className={styles.plansGrid}>
                                    {PLANS.map(plan => (
                                        <button key={plan.id} type="button"
                                            className={`${styles.planCard} ${formData.subscriptionPlan === plan.id ? styles.planSelected : ''}`}
                                            onClick={() => update('subscriptionPlan', plan.id)}>
                                            <div className={styles.planHeader}>
                                                <span className={styles.planIcon}>{plan.icon}</span>
                                                <span className={styles.planLabel}>{plan.label}</span>
                                                <span className={styles.planPrice}>{plan.price}</span>
                                            </div>
                                            <ul className={styles.planFeatures}>
                                                {plan.features.map(f => (
                                                    <li key={f}><Check size={13} />{f}</li>
                                                ))}
                                            </ul>
                                            {formData.subscriptionPlan === plan.id && (
                                                <div className={styles.planBadge}>Seleccionado</div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Step 4: Admin ── */}
                        {currentStep === 4 && (
                            <div className={styles.stepContent}>
                                <h2>Conta de Administrador</h2>
                                <p className={styles.sectionDesc}>Utilizará esta conta para gerir toda a plataforma.</p>
                                <Input label="Nome Completo *" placeholder="João Silva"
                                    value={formData.adminName} onChange={e => update('adminName', e.target.value)} />
                                <Input label="Email de Login *" type="email" placeholder="joao@clube.pt"
                                    value={formData.adminEmail} onChange={e => update('adminEmail', e.target.value)} />
                                <div className={styles.passwordRow}>
                                    <div className={styles.passwordWrapper}>
                                        <Input label="Password *" type={showPassword ? 'text' : 'password'}
                                            value={formData.adminPassword} onChange={e => update('adminPassword', e.target.value)} />
                                        <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(s => !s)}>
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <Input label="Confirmar Password *" type="password"
                                        value={formData.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} />
                                </div>
                            </div>
                        )}

                        {/* ── Step 5: Review ── */}
                        {currentStep === 5 && (
                            <div className={styles.stepContent}>
                                <h2>Revisão Final</h2>
                                <div className={styles.reviewCard}>
                                    <div className={styles.reviewSection}>
                                        <h3>Clube</h3>
                                        <div className={styles.reviewItem}><span>Nome:</span><strong>{formData.name}</strong></div>
                                        <div className={styles.reviewItem}><span>URL:</span><strong>{formData.subdomain}.novascore.com</strong></div>
                                        <div className={styles.reviewItem}><span>Email:</span><strong>{formData.email}</strong></div>
                                        {formData.phone && <div className={styles.reviewItem}><span>Telefone:</span><strong>{formData.phone}</strong></div>}
                                        {formData.taxId && <div className={styles.reviewItem}><span>NIF:</span><strong>{formData.taxId}</strong></div>}
                                    </div>
                                    {(formData.city || formData.address) && (
                                        <>
                                            <div className={styles.divider} />
                                            <div className={styles.reviewSection}>
                                                <h3>Localização</h3>
                                                {formData.address && <div className={styles.reviewItem}><span>Morada:</span><strong>{formData.address}</strong></div>}
                                                {formData.city && <div className={styles.reviewItem}><span>Cidade:</span><strong>{formData.city} {formData.postalCode}</strong></div>}
                                                <div className={styles.reviewItem}><span>País:</span><strong>{formData.country}</strong></div>
                                            </div>
                                        </>
                                    )}
                                    <div className={styles.divider} />
                                    <div className={styles.reviewSection}>
                                        <h3>Plano</h3>
                                        <div className={styles.reviewItem}>
                                            <span>Subscrição:</span>
                                            <strong>{selectedPlan.label} — {selectedPlan.price}</strong>
                                        </div>
                                    </div>
                                    <div className={styles.divider} />
                                    <div className={styles.reviewSection}>
                                        <h3>Administrador</h3>
                                        <div className={styles.reviewItem}><span>Nome:</span><strong>{formData.adminName}</strong></div>
                                        <div className={styles.reviewItem}><span>Email:</span><strong>{formData.adminEmail}</strong></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {error && <div className={styles.errorBanner}>{error}</div>}

                        {/* Navigation */}
                        <div className={styles.actions}>
                            {currentStep > 1
                                ? <Button variant="outline" onClick={prevStep} disabled={isSubmitting}>
                                    <ArrowLeft size={18} style={{ marginRight: 8 }} /> Voltar
                                </Button>
                                : <div />
                            }
                            {currentStep < 5
                                ? <Button onClick={nextStep}>
                                    Próximo <ArrowRight size={18} style={{ marginLeft: 8 }} />
                                </Button>
                                : <Button onClick={handleSubmit} disabled={isSubmitting}>
                                    {isSubmitting
                                        ? <><Loader className="animate-spin" size={18} style={{ marginRight: 8 }} />A criar...</>
                                        : <>Lançar Clube <Trophy size={18} style={{ marginLeft: 8 }} /></>
                                    }
                                </Button>
                            }
                        </div>
                    </div>

                    <div className={styles.loginLink}>
                        Já tem conta? <Link href="/login">Entrar aqui</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
