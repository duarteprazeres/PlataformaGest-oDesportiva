'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Search, Mail, Shield, User, Briefcase, Lock } from 'lucide-react';
import { toast } from "sonner";
import styles from './page.module.css';

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await fetchApi('/users');
            setUsers(data);
        } catch (error) {
            console.error('Failed to load users', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>User Management</h1>
                    <p className={styles.subtitle}>Manage access for coaches, staff, and guardians.</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus size={18} style={{ marginRight: '8px' }} /> Add User
                </Button>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className={styles.stats}>
                    {users.length} Total Users
                </div>
            </div>

            <div className={styles.tableCard}>
                {isLoading ? (
                    <div className={styles.loading}>Loading users...</div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map(user => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className={styles.userCell}>
                                                <div className={styles.avatar}>
                                                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className={styles.userName}>{user.firstName} {user.lastName}</div>
                                                    <div className={styles.userId}>ID: {user.id.substring(0, 8)}...</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <RoleBadge role={user.role} />
                                        </td>
                                        <td className={styles.emailCell}>{user.email}</td>
                                        <td>
                                            <span className={styles.statusActive}>Active</span>
                                        </td>
                                        <td>
                                            <button className={styles.actionBtn}>Edit</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className={styles.emptyState}>No users found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {isCreateModalOpen && (
                <CreateUserModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={() => {
                        setIsCreateModalOpen(false);
                        loadUsers();
                    }}
                />
            )}
        </div>
    );
}

function RoleBadge({ role }: { role: string }) {
    let icon = <User size={12} />;
    let className = styles.roleDefault;
    let label = role;

    switch (role) {
        case 'ADMIN':
        case 'CLUB_ADMIN':
            icon = <Shield size={12} />;
            className = styles.roleAdmin;
            label = 'Administrator';
            break;
        case 'COACH':
            icon = <Briefcase size={12} />;
            className = styles.roleCoach;
            label = 'Coach';
            break;
        case 'PARENT':
            icon = <User size={12} />;
            className = styles.roleParent;
            label = 'Guardian';
            break;
    }

    return (
        <div className={`${styles.roleBadge} ${className}`}>
            {icon}
            <span>{label}</span>
        </div>
    );
}

function CreateUserModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'PARENT'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await fetchApi('/users', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            onSuccess();
        } catch (error) {
            toast.error('Failed to create user');
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h3>Add New User</h3>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>
                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    <div className={styles.row}>
                        <Input
                            label="First Name"
                            value={formData.firstName}
                            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                            required
                        />
                        <Input
                            label="Last Name"
                            value={formData.lastName}
                            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                            required
                        />
                    </div>
                    <Input
                        label="Email Address"
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                    <div className={styles.fieldGroup}>
                        <label>Role</label>
                        <select
                            className={styles.select}
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="PARENT">Guardian (Parent)</option>
                            <option value="COACH">Coach</option>
                            <option value="CLUB_ADMIN">Administrator</option>
                        </select>
                    </div>
                    <Input
                        label="Initial Password"
                        type="password"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        required
                        placeholder="Min. 6 characters"
                    />

                    <div className={styles.modalActions}>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create User'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
