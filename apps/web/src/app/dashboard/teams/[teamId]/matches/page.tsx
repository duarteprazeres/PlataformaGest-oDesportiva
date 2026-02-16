'use client';

import { toast } from "sonner";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Match {
    id: string;
    opponent: string;
    date: string;
    location: string;
    isHomeMatch: boolean;
    result: string;
    goalsFor: number | null;
    goalsAgainst: number | null;
}

export default function TeamMatchesPage({ params }: { params: { teamId: string } }) {
    const router = useRouter();
    const [matches, setMatches] = useState<Match[]>([]);
    const [teamName, setTeamName] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newMatch, setNewMatch] = useState({
        opponentName: '',
        matchDate: '',
        location: '',
        isHomeMatch: true,
    });

    // Mock data
    useEffect(() => {
        setTeamName('Sub-15 Masculino');
        setMatches([
            {
                id: '1',
                opponent: 'FC Porto B',
                date: '2026-02-10',
                location: 'Estádio Municipal',
                isHomeMatch: true,
                result: 'SCHEDULED',
                goalsFor: null,
                goalsAgainst: null,
            },
            {
                id: '2',
                opponent: 'Benfica Sub-15',
                date: '2026-01-28',
                location: 'Seixal',
                isHomeMatch: false,
                result: 'FINISHED',
                goalsFor: 2,
                goalsAgainst: 3,
            },
        ]);
    }, [params.teamId]);

    const handleCreateMatch = (e: React.FormEvent) => {
        e.preventDefault();
        toast.info('Funcionalidade de criar jogo em desenvolvimento!');
        setShowCreateModal(false);
    };

    const getStatusBadge = (result: string) => {
        const colors: Record<string, string> = {
            SCHEDULED: 'bg-blue-100 text-blue-800',
            IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
            FINISHED: 'bg-green-100 text-green-800',
            CANCELLED: 'bg-red-100 text-red-800',
        };
        const labels: Record<string, string> = {
            SCHEDULED: 'Agendado',
            IN_PROGRESS: 'Em Curso',
            FINISHED: 'Finalizado',
            CANCELLED: 'Cancelado',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[result]}`}>
                {labels[result]}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <button
                            onClick={() => router.push('/dashboard/teams')}
                            className="text-indigo-600 hover:text-indigo-700 font-semibold mb-2 flex items-center gap-1"
                        >
                            ← Equipas
                        </button>
                        <h1 className="text-3xl font-bold text-slate-900">Jogos - {teamName}</h1>
                        <p className="text-slate-600 mt-1">Calendário e resultados</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
                    >
                        + Novo Jogo
                    </button>
                </div>

                {/* Matches List */}
                <div className="space-y-4">
                    {matches.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                            <p className="text-slate-500 text-lg">Nenhum jogo registado</p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg"
                            >
                                Criar Primeiro Jogo
                            </button>
                        </div>
                    ) : (
                        matches.map((match) => (
                            <div
                                key={match.id}
                                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => router.push(`/dashboard/teams/${params.teamId}/matches/${match.id}`)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-2">
                                            <h3 className="text-xl font-bold text-slate-900">
                                                {match.isHomeMatch ? '🏠' : '✈️'} vs {match.opponent}
                                            </h3>
                                            {getStatusBadge(match.result)}
                                        </div>
                                        <p className="text-slate-600">
                                            📅 {new Date(match.date).toLocaleDateString('pt-PT')} • 📍 {match.location}
                                        </p>
                                        {match.result === 'FINISHED' && (
                                            <p className="text-2xl font-bold text-indigo-600 mt-2">
                                                {match.goalsFor} - {match.goalsAgainst}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <button className="px-4 py-2 bg-indigo-50 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-100">
                                            Ver Detalhes →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Create Match Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold text-lg">Novo Jogo</h3>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    ✕
                                </button>
                            </div>
                            <form onSubmit={handleCreateMatch} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Adversário
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-3 py-2 border rounded-lg"
                                        value={newMatch.opponentName}
                                        onChange={(e) => setNewMatch({ ...newMatch, opponentName: e.target.value })}
                                        placeholder="Nome do adversário"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Data
                                    </label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full px-3 py-2 border rounded-lg"
                                        value={newMatch.matchDate}
                                        onChange={(e) => setNewMatch({ ...newMatch, matchDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Localização
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-3 py-2 border rounded-lg"
                                        value={newMatch.location}
                                        onChange={(e) => setNewMatch({ ...newMatch, location: e.target.value })}
                                        placeholder="Nome do estádio"
                                    />
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="isHomeMatch"
                                        checked={newMatch.isHomeMatch}
                                        onChange={(e) => setNewMatch({ ...newMatch, isHomeMatch: e.target.checked })}
                                        className="mr-2"
                                    />
                                    <label htmlFor="isHomeMatch" className="text-sm text-slate-700">
                                        Jogo em casa
                                    </label>
                                </div>
                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700"
                                    >
                                        Criar Jogo
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
