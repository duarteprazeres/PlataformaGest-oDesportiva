'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface DashboardWidget {
    id: string;
    title: string;
    icon: string;
    value: string | number;
    subtitle: string;
    link: string;
    color: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const { user, logout } = useAuth(); // Could use context user
    const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const loadDashboardData = async () => {
            try {
                setIsLoading(true);

                // 1. Fetch Active Season
                const activeSeason = await fetchApi('/seasons/active');

                // 2. Fetch Data based on active season
                const [teams, players] = await Promise.all([
                    activeSeason ? fetchApi(`/teams?seasonId=${activeSeason.id}`) : [],
                    fetchApi('/players')
                ]);

                // 3. Calculate Stats
                const activeTeamsCount = teams.length;
                const totalPlayersCount = players.length; // Ideally filter by active status or season

                // Dynamic widgets with real club insights
                setWidgets([
                    {
                        id: 'next-match',
                        title: 'Próximo Jogo',
                        icon: '⚽',
                        value: '-- vs --', // Placeholder until match logic is implemented
                        subtitle: 'Agenda não disponível',
                        link: '/dashboard/teams',
                        color: 'bg-gradient-to-br from-indigo-500 to-indigo-600'
                    },
                    {
                        id: 'teams',
                        title: 'Equipas Ativas',
                        icon: '👥',
                        value: activeTeamsCount.toString(),
                        subtitle: activeSeason ? `Época ${activeSeason.name}` : 'Sem época ativa',
                        link: '/dashboard/teams',
                        color: 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                    },
                    {
                        id: 'players',
                        title: 'Total de Atletas',
                        icon: '🏃',
                        value: totalPlayersCount.toString(),
                        subtitle: `${activeTeamsCount} equipas ativas`,
                        link: '/dashboard/players',
                        color: 'bg-gradient-to-br from-blue-500 to-blue-600'
                    },
                    {
                        id: 'pending-confirmations',
                        title: 'Confirmações Pendentes',
                        icon: '⏳',
                        value: '0', // Reset to 0 to avoid false data
                        subtitle: 'Convocatórias para confirmar',
                        link: '/dashboard/teams',
                        color: 'bg-gradient-to-br from-amber-500 to-amber-600'
                    },
                    {
                        id: 'performance',
                        title: 'Taxa de Vitória',
                        icon: '📊',
                        value: '-', // Hide uncalculated data
                        subtitle: 'Esta época',
                        link: '/dashboard/teams',
                        color: 'bg-gradient-to-br from-purple-500 to-purple-600'
                    },
                    {
                        id: 'top-scorer',
                        title: 'Melhor Marcador',
                        icon: '🎯',
                        value: '-', // Hide uncalculated data
                        subtitle: '0 golos',
                        link: '/dashboard/players',
                        color: 'bg-gradient-to-br from-rose-500 to-rose-600'
                    }
                ]);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboardData();
    }, [router]);

    const handleLogout = () => {
        logout();
    };

    if (!user) return null;

    return (
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>Dashboard</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Bem-vindo, {user.firstName}!</p>
                </div>
                <Button variant="outline" onClick={handleLogout}>Sair</Button>
            </header>

            {/* Dynamic Widgets Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem'
            }}>
                {isLoading ? (
                    <p>A carregar dados...</p>
                ) : widgets.map((widget) => (
                    <div
                        key={widget.id}
                        onClick={() => router.push(widget.link)}
                        className={widget.color}
                        style={{
                            padding: '1.5rem',
                            borderRadius: '16px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            color: 'white',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div>
                                <p style={{ fontSize: '0.875rem', opacity: 0.9, fontWeight: 500 }}>{widget.title}</p>
                            </div>
                            <span style={{ fontSize: '2rem' }}>{widget.icon}</span>
                        </div>
                        <div>
                            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                                {widget.value}
                            </p>
                            <p style={{ fontSize: '0.875rem', opacity: 0.85 }}>
                                {widget.subtitle}
                            </p>
                        </div>
                        {/* Decorative background element */}
                        <div style={{
                            position: 'absolute',
                            bottom: '-20px',
                            right: '-20px',
                            width: '100px',
                            height: '100px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '50%'
                        }}></div>
                    </div>
                ))}
            </div>

            {/* Quick Actions Section */}
            <div style={{ marginTop: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Ações Rápidas</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    <button
                        onClick={() => router.push('/dashboard/teams')}
                        style={{
                            padding: '1rem',
                            backgroundColor: 'var(--surface)',
                            border: '2px dashed var(--border)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'border-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--primary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border)';
                        }}
                    >
                        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>+ Criar Jogo</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Agendar novo jogo</p>
                    </button>
                    <button
                        onClick={() => router.push('/dashboard/players')}
                        style={{
                            padding: '1rem',
                            backgroundColor: 'var(--surface)',
                            border: '2px dashed var(--border)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'border-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--primary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border)';
                        }}
                    >
                        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>+ Adicionar Atleta</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Registar novo atleta</p>
                    </button>
                    <button
                        onClick={() => router.push('/dashboard/settings')}
                        style={{
                            padding: '1rem',
                            backgroundColor: 'var(--surface)',
                            border: '2px dashed var(--border)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'border-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--primary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border)';
                        }}
                    >
                        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>⚙️ Configurações</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Gerir clube</p>
                    </button>
                </div>
            </div>
        </div>
    );
}
