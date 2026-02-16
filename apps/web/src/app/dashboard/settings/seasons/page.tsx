'use client';

import { toast } from "sonner";

import React, { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Check, Archive, Calendar } from 'lucide-react';
import styles from './page.module.css';

interface Season {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

export default function SeasonsPage() {
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        startDate: '',
        endDate: '',
        isActive: true
    });

    const loadSeasons = async () => {
        try {
            const data = await fetchApi('/seasons');
            setSeasons(data);
        } catch (error) {
            console.error('Failed to load seasons', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSeasons();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetchApi('/seasons', {
                method: 'POST',
                body: JSON.stringify(formData),
            });
            setIsCreating(false);
            setFormData({ name: '', startDate: '', endDate: '', isActive: true });
            loadSeasons();
        } catch (error) {
            toast.error('Failed to create season');
        }
    };

    const toggleActive = async (id: string) => {
        try {
            await fetchApi(`/seasons/${id}/toggle-active`, { method: 'PATCH' });
            loadSeasons();
        } catch (error) {
            console.error('Failed to toggle season', error);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Season Management</h1>
                    <p className={styles.subtitle}>Define your sports seasons (e.g., 2024/2025).</p>
                </div>
                <Button onClick={() => setIsCreating(true)}>
                    <Plus size={18} />
                    New Season
                </Button>
            </div>

            {seasons.length === 0 && !isLoading && (
                <div className={styles.emptyState}>
                    No seasons found. Create your first season to get started.
                </div>
            )}

            <div className={styles.grid}>
                {seasons.map((season) => (
                    <div key={season.id} className={`${styles.card} ${season.isActive ? styles.active : ''}`}>
                        <div className={styles.cardHeader}>
                            <div>
                                <div className={styles.seasonName}>{season.name}</div>
                                <div className={styles.dates}>
                                    <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
                                    {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
                                </div>
                            </div>
                            <div className={`${styles.status} ${season.isActive ? styles.active : styles.inactive}`}>
                                {season.isActive ? 'Active' : 'Archived'}
                            </div>
                        </div>

                        <div className={styles.actions}>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleActive(season.id)}
                            >
                                {season.isActive ? (
                                    <><Archive size={14} /> Archive</>
                                ) : (
                                    <><Check size={14} /> Activate</>
                                )}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {isCreating && (
                <div className={styles.overlay} onClick={() => setIsCreating(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h3>Create New Season</h3>
                        <form onSubmit={handleCreate} className={styles.formGrid}>
                            <Input
                                label="Season Name (e.g. 2024/2025)"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <div className={styles.row}>
                                <Input
                                    label="Start Date"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    required
                                />
                                <Input
                                    label="End Date"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                                <Button type="submit">Create Season</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
