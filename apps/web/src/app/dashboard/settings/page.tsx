'use client';

import React, { useState } from 'react';
import { Moon, Sun, Lock, Bell, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/context/ThemeContext';
import styles from './page.module.css';

export default function SettingsPage() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();

    // Password State
    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ text: 'Passwords do not match.', type: 'error' });
            return;
        }
        if (passwordData.newPassword.length < 6) {
            setMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
            return;
        }

        setIsSaving(true);
        setMessage({ text: '', type: '' });

        try {
            await fetchApi('/users/change-password', {
                method: 'POST',
                body: JSON.stringify({ password: passwordData.newPassword }),
            });
            setMessage({ text: 'Password updated successfully!', type: 'success' });
            setPasswordData({ newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            setMessage({ text: error.message || 'Failed to update password.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Settings</h1>

            <div className={styles.grid}>

                {/* Sports Configuration */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <Calendar size={20} className={styles.icon} />
                        <h3>Sports Configuration</h3>
                    </div>
                    <div className={styles.settingRow}>
                        <div>
                            <div className={styles.settingLabel}>Season Management</div>
                            <div className={styles.settingDesc}>Manage active seasons and history.</div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/settings/seasons')}>
                            Manage Seasons
                        </Button>
                    </div>
                </div>

                {/* Appearance Settings */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <Sun size={20} className={styles.icon} />
                        <h3>Appearance</h3>
                    </div>
                    <div className={styles.settingRow}>
                        <div>
                            <div className={styles.settingLabel}>Theme Mode</div>
                            <div className={styles.settingDesc}>Switch between light and dark mode.</div>
                        </div>
                        <button className={styles.toggleBtn} onClick={toggleTheme}>
                            {theme === 'light' ? (
                                <div className={styles.toggleContent}><Moon size={16} /> Dark</div>
                            ) : (
                                <div className={styles.toggleContent}><Sun size={16} /> Light</div>
                            )}
                        </button>
                    </div>
                </div>

                {/* Security Settings */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <Lock size={20} className={styles.icon} />
                        <h3>Security</h3>
                    </div>

                    <form onSubmit={handleChangePassword} className={styles.form}>
                        <div className={styles.settingLabel}>Change Password</div>
                        <div className={styles.row}>
                            <Input
                                type="password"
                                placeholder="New Password"
                                value={passwordData.newPassword}
                                onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                required
                            />
                            <Input
                                type="password"
                                placeholder="Confirm Password"
                                value={passwordData.confirmPassword}
                                onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                required
                            />
                        </div>

                        {message.text && (
                            <div className={`${styles.message} ${styles[message.type]}`}>
                                {message.text}
                            </div>
                        )}

                        <div className={styles.actions}>
                            <Button type="submit" disabled={isSaving} variant="outline">
                                {isSaving ? 'Updating...' : 'Update Password'}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Notifications (Placeholder) */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <Bell size={20} className={styles.icon} />
                        <h3>Notifications</h3>
                    </div>
                    <div className={styles.settingRow}>
                        <div>
                            <div className={styles.settingLabel}>Email Notifications</div>
                            <div className={styles.settingDesc}>Receive updates about team events.</div>
                        </div>
                        {/* Adding a checked toggle appearance with CSS */}
                        <div className={styles.fakeToggleActive}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
