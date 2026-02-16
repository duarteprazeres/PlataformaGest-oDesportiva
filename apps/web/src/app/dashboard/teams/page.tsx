'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';

interface Team {
    id: string;
    name: string;
    category: string;
    seasonId: string;
    _count?: { players: number };
    // Stats placeholders
    matchesPlayed?: number;
    wins?: number;
    draws?: number;
    losses?: number;
}

interface Season {
    id: string;
    name: string;
    isActive: boolean;
}

export default function TeamsPage() {
    const router = useRouter();
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [selectedSeason, setSelectedSeason] = useState('');
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initial load: Fetch seasons
    useEffect(() => {
        const loadSeasons = async () => {
            try {
                const seasonsData = await fetchApi('/seasons');
                setSeasons(seasonsData);

                // Default to active season or first season
                const active = seasonsData.find((s: Season) => s.isActive);
                if (active) {
                    setSelectedSeason(active.id);
                } else if (seasonsData.length > 0) {
                    setSelectedSeason(seasonsData[0].id);
                }
            } catch (error) {
                console.error("Failed to load seasons", error);
            }
        };
        loadSeasons();
    }, []);

    // Fetch teams when season changes
    useEffect(() => {
        const loadTeams = async () => {
            if (!selectedSeason) return;

            setIsLoading(true);
            try {
                // Use the new query param filter!
                const teamsData = await fetchApi(`/teams?seasonId=${selectedSeason}`);
                setTeams(teamsData);
            } catch (error) {
                console.error("Failed to load teams", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadTeams();
    }, [selectedSeason]);

    const handleSeasonChange = (seasonId: string) => {
        setSelectedSeason(seasonId);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Equipas</h1>
                        <p className="text-slate-600 mt-1">Gerir equipas e ver calendário de jogos</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors"
                        >
                            Voltar
                        </button>
                        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-colors">
                            + Nova Equipa
                        </button>
                    </div>
                </div>

                {/* Season Filter */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Época
                    </label>
                    <select
                        className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-lg"
                        value={selectedSeason}
                        onChange={(e) => handleSeasonChange(e.target.value)}
                    >
                        {seasons.map((season) => (
                            <option key={season.id} value={season.id}>
                                {season.name} {season.isActive ? '(Ativa)' : ''}
                            </option>
                        ))}
                    </select>
                    <p className="text-sm text-slate-600 mt-2">
                        {isLoading ? 'A carregar...' : `${teams.length} ${teams.length === 1 ? 'equipa encontrada' : 'equipas encontradas'}`}
                    </p>
                </div>

                {/* Teams Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.length === 0 ? (
                        <div className="col-span-full bg-white rounded-xl shadow-sm p-12 text-center">
                            <p className="text-slate-500 text-lg">
                                {isLoading ? 'A carregar equipas...' : 'Nenhuma equipa nesta época'}
                            </p>
                        </div>
                    ) : (
                        teams.map((team) => (
                            <div
                                key={team.id}
                                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">{team.name}</h3>
                                        <span className="inline-block mt-1 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded">
                                            {team.category || 'Geral'}
                                        </span>
                                    </div>
                                    <span className="text-2xl">⚽</span>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Jogadores:</span>
                                        <span className="font-semibold">{team._count?.players || 0}</span>
                                    </div>
                                    {/* Placeholder Stats - hidden if data not available or 0 */}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Jogos:</span>
                                        <span className="font-semibold">0</span>
                                    </div>
                                    <div className="flex gap-4 text-sm opacity-50">
                                        <span className="text-green-600 font-semibold">- V</span>
                                        <span className="text-gray-600 font-semibold">- E</span>
                                        <span className="text-red-600 font-semibold">- D</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => router.push(`/dashboard/teams/${team.id}/matches`)}
                                        className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition-colors"
                                    >
                                        📅 Jogos
                                    </button>
                                    <button
                                        onClick={() => router.push(`/dashboard/teams/${team.id}`)}
                                        className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm transition-colors"
                                    >
                                        👥 Plantel
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
