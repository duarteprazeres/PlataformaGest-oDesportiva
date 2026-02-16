'use client';

import React, { useEffect, useState } from 'react';
import { User, Mail, Shield } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './page.module.css';

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await fetchApi('/users/profile');
            setUser(data);
            setFormData({
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                email: data.email || '',
            });
        } catch (error) {
            console.error('Failed to load profile', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage('');

        try {
            const updatedUser = await fetchApi('/users/profile', {
                method: 'PATCH',
                body: JSON.stringify(formData),
            });
            setUser(updatedUser);
            // Update local storage too to keep topbar consistent without reload
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setMessage('Profile updated successfully!');
        } catch (error) {
            setMessage('Failed to update profile.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className={styles.loading}>Loading profile...</div>;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>My Profile</h1>

            <div className={styles.grid}>
                {/* Profile Card */}
                <div className={styles.card}>
                    <div className={styles.avatarLarge}>
                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </div>
                    <h2 className={styles.nameDisplay}>{user?.firstName} {user?.lastName}</h2>
                    <div className={styles.roleBadge}>{user?.role}</div>

                    <div className={styles.infoList}>
                        <div className={styles.infoItem}>
                            <Mail size={16} />
                            <span>{user?.email}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <Shield size={16} />
                            <span>Club ID: {user?.clubId}</span>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Edit Information</h3>
                    <form onSubmit={handleUpdate} className={styles.form}>
                        <div className={styles.row}>
                            <Input
                                label="First Name"
                                value={formData.firstName}
                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                            />
                            <Input
                                label="Last Name"
                                value={formData.lastName}
                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </div>
                        <Input
                            label="Email Address"
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />

                        {message && <div className={styles.message}>{message}</div>}

                        <div className={styles.actions}>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
