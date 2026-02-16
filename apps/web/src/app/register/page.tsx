'use client';

import { toast } from "sonner";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link
import { Trophy, Check, ArrowRight, ArrowLeft, Loader, Eye, EyeOff } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './page.module.css';

const STEPS = [
    { id: 1, title: 'Club Details', desc: 'Setup your workspace' },
    { id: 2, title: 'Admin Account', desc: 'Secure your access' },
    { id: 3, title: 'Review', desc: 'Confirm & Launch' }
];

export default function RegisterPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        subdomain: '',
        email: '', // Club Contact Email
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        confirmPassword: ''
    });

    const updateForm = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const nextStep = () => {
        // Basic Validation per step
        if (currentStep === 1) {
            if (!formData.name || !formData.subdomain || !formData.email) {
                setError('Please fill in all club details.');
                return;
            }
            // Improve subdomain (remove spaces, lowercase)
            const cleanSubdomain = formData.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
            if (cleanSubdomain !== formData.subdomain) {
                setFormData(prev => ({ ...prev, subdomain: cleanSubdomain }));
            }
        }

        if (currentStep === 2) {
            if (!formData.adminName || !formData.adminEmail || !formData.adminPassword) {
                setError('Please complete admin account details.');
                return;
            }
            if (formData.adminPassword !== formData.confirmPassword) {
                setError('Passwords do not match.');
                return;
            }
            if (formData.adminPassword.length < 6) {
                setError('Password must be at least 6 characters.');
                return;
            }
        }

        setError('');
        setCurrentStep(prev => prev + 1);
    };

    const prevStep = () => setCurrentStep(prev => prev - 1);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError('');

        try {
            // 1. Register Club + Admin
            await fetchApi('/clubs', {
                method: 'POST',
                body: JSON.stringify({
                    name: formData.name,
                    subdomain: formData.subdomain,
                    email: formData.email,
                    adminName: formData.adminName,
                    adminEmail: formData.adminEmail,
                    adminPassword: formData.adminPassword
                })
            });

            // Success! Redirect to login
            toast.success('Clube criado com sucesso! Por favor, faça login.');
            router.push('/login');
        } catch (err: any) {
            setError(err.message || 'Failed to create club');
        } finally {
            setIsSubmitting(false);
        }
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
                    <h1>Manage your Club like a Pro.</h1>
                    <p>Join thousands of coaches and directors transforming their sports management.</p>

                    <div className={styles.featureList}>
                        <div className={styles.feature}>
                            <div className={styles.checkIcon}><Check size={16} /></div>
                            <span>Teams & Rosters Management</span>
                        </div>
                        <div className={styles.feature}>
                            <div className={styles.checkIcon}><Check size={16} /></div>
                            <span>Training Scheduler</span>
                        </div>
                        <div className={styles.feature}>
                            <div className={styles.checkIcon}><Check size={16} /></div>
                            <span>Financial Tracking</span>
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
                        {currentStep === 1 && (
                            <div className={styles.stepContent}>
                                <h2>Club Information</h2>
                                <Input
                                    label="Club Name"
                                    placeholder="e.g. FC Porto Academy"
                                    value={formData.name}
                                    onChange={(e) => updateForm('name', e.target.value)}
                                />
                                <div className={styles.fieldGroup}>
                                    <label>Subdomain</label>
                                    <div className={styles.subdomainInput}>
                                        <input
                                            placeholder="fcporto"
                                            value={formData.subdomain}
                                            onChange={(e) => updateForm('subdomain', e.target.value)}
                                        />
                                        <span className={styles.suffix}>.novascore.com</span>
                                    </div>
                                    <p className={styles.hint}>This will be your club's address.</p>
                                </div>
                                <Input
                                    label="Contact Email"
                                    type="email"
                                    placeholder="admin@club.com"
                                    value={formData.email}
                                    onChange={(e) => updateForm('email', e.target.value)}
                                />
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className={styles.stepContent}>
                                <h2>Admin Account</h2>
                                <p className={styles.sectionDesc}>You will use this account to manage the entire platform.</p>
                                <Input
                                    label="Full Name"
                                    placeholder="John Doe"
                                    value={formData.adminName}
                                    onChange={(e) => updateForm('adminName', e.target.value)}
                                />
                                <Input
                                    label="Login Email"
                                    type="email"
                                    placeholder="john@club.com"
                                    value={formData.adminEmail}
                                    onChange={(e) => updateForm('adminEmail', e.target.value)}
                                />
                                <div className={styles.passwordRow}>
                                    <div className={styles.passwordWrapper}>
                                        <Input
                                            label="Password"
                                            type={showPassword ? "text" : "password"}
                                            value={formData.adminPassword}
                                            onChange={(e) => updateForm('adminPassword', e.target.value)}
                                        />
                                        <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <Input
                                        label="Confirm Password"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => updateForm('confirmPassword', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className={styles.stepContent}>
                                <h2>Final Review</h2>
                                <div className={styles.reviewCard}>
                                    <div className={styles.reviewSection}>
                                        <h3>Club</h3>
                                        <div className={styles.reviewItem}>
                                            <span>Name:</span> <strong>{formData.name}</strong>
                                        </div>
                                        <div className={styles.reviewItem}>
                                            <span>URL:</span> <strong>{formData.subdomain}.novascore.com</strong>
                                        </div>
                                    </div>
                                    <div className={styles.divider} />
                                    <div className={styles.reviewSection}>
                                        <h3>Admin</h3>
                                        <div className={styles.reviewItem}>
                                            <span>Name:</span> <strong>{formData.adminName}</strong>
                                        </div>
                                        <div className={styles.reviewItem}>
                                            <span>Email:</span> <strong>{formData.adminEmail}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className={styles.errorBanner}>{error}</div>
                        )}

                        {/* Navigation Actions */}
                        <div className={styles.actions}>
                            {currentStep > 1 ? (
                                <Button variant="outline" onClick={prevStep} disabled={isSubmitting}>
                                    <ArrowLeft size={18} style={{ marginRight: '8px' }} /> Back
                                </Button>
                            ) : (
                                <div /> /* Spacer */
                            )}

                            {currentStep < 3 ? (
                                <Button onClick={nextStep}>
                                    Next Step <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                                </Button>
                            ) : (
                                <Button onClick={handleSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <><Loader className="animate-spin" size={18} style={{ marginRight: '8px' }} /> Creating Club...</>
                                    ) : (
                                        <>Complete Registration <Trophy size={18} style={{ marginLeft: '8px' }} /></>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className={styles.loginLink}>
                        Already have an account? <Link href="/login">Login here</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
