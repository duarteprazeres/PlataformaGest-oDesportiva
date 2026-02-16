'use client';

import { toast } from "sonner";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MatchDetailPage({ params }: { params: { teamId: string; id: string } }) {
    const router = useRouter();

    // Mock data
    const [match] = useState({
        id: params.id,
        opponent: 'FC Porto B',
        date: '2026-02-10',
        time: '15:00',
        location: 'Estádio Municipal',
        isHomeMatch: true,
        result: 'SCHEDULED',
        goalsFor: null,
        goalsAgainst: null,
    });

    const [callups, setCallups] = useState([
        { id: '1', playerName: 'João Silva', confirmed: true, played: false, goals: 0, minutes: 0, rating: null },
        { id: '2', playerName: 'Pedro Costa', confirmed: false, played: false, goals: 0, minutes: 0, rating: null },
        { id: '3', playerName: 'Miguel Santos', confirmed: true, played: false, goals: 0, minutes: 0, rating: null },
    ]);

    const handleUpdateStats = (playerId: string, field: string, value: any) => {
        setCallups(callups.map(c => c.id === playerId ? { ...c, [field]: value } : c));
    };

    const handleFinalizeMatch = () => {
        if (confirm('Tem certeza que deseja finalizar o jogo? As estatísticas serão gravadas permanentemente.')) {
            toast.success('Jogo finalizado! Estatísticas atualizadas.');
            router.push('/dashboard/matches');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.push('/dashboard/matches')}
                        className="text-indigo-600 hover:text-indigo-700 font-semibold mb-4"
                    >
                        ← Voltar aos Jogos
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900">
                        {match.isHomeMatch ? '🏠' : '✈️'} vs {match.opponent}
                    </h1>
                    <p className="text-slate-600 mt-2">
                        📅 {new Date(match.date).toLocaleDateString('pt-PT')} às {match.time} • 📍 {match.location}
                    </p>
                </div>

                {/* Match Info Card */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Informação do Jogo</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Resultado</label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="number"
                                    className="w-20 px-3 py-2 border rounded-lg text-center"
                                    placeholder="0"
                                    disabled={match.result === 'FINISHED'}
                                />
                                <span className="text-2xl font-bold">-</span>
                                <input
                                    type="number"
                                    className="w-20 px-3 py-2 border rounded-lg text-center"
                                    placeholder="0"
                                    disabled={match.result === 'FINISHED'}
                                />
                            </div>
                        </div>
                        <div className="flex items-end">
                            <span className={`px-3 py-2 rounded-lg text-sm font-semibold ${match.result === 'FINISHED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                {match.result === 'FINISHED' ? '✓ Finalizado' : '⏱ Agendado'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Callups */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-900">Convocatória ({callups.length} jogadores)</h2>
                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-sm">
                            + Convocar Jogador
                        </button>
                    </div>

                    <div className="space-y-3">
                        {callups.map((player) => (
                            <div key={player.id} className="border border-slate-200 rounded-lg p-4">
                                <div className="grid grid-cols-6 gap-4 items-center">
                                    {/* Player Info */}
                                    <div className="col-span-2">
                                        <p className="font-semibold text-slate-900">{player.playerName}</p>
                                        <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-semibold ${player.confirmed
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {player.confirmed ? '✓ Confirmado' : '⏳ Pendente'}
                                        </span>
                                    </div>

                                    {/* Stats Input */}
                                    <div>
                                        <label className="block text-xs text-slate-600 mb-1">Jogou</label>
                                        <input
                                            type="checkbox"
                                            checked={player.played}
                                            onChange={(e) => handleUpdateStats(player.id, 'played', e.target.checked)}
                                            className="w-5 h-5"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-600 mb-1">Minutos</label>
                                        <input
                                            type="number"
                                            value={player.minutes}
                                            onChange={(e) => handleUpdateStats(player.id, 'minutes', parseInt(e.target.value))}
                                            className="w-16 px-2 py-1 border rounded text-sm"
                                            min="0"
                                            max="90"
                                            disabled={!player.played}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-600 mb-1">Golos</label>
                                        <input
                                            type="number"
                                            value={player.goals}
                                            onChange={(e) => handleUpdateStats(player.id, 'goals', parseInt(e.target.value))}
                                            className="w-16 px-2 py-1 border rounded text-sm"
                                            min="0"
                                            disabled={!player.played}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-600 mb-1">Avaliação</label>
                                        <input
                                            type="number"
                                            value={player.rating || ''}
                                            onChange={(e) => handleUpdateStats(player.id, 'rating', parseFloat(e.target.value))}
                                            className="w-16 px-2 py-1 border rounded text-sm"
                                            min="0"
                                            max="10"
                                            step="0.5"
                                            placeholder="0-10"
                                            disabled={!player.played}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => router.push(`/dashboard/teams/${params.teamId}/matches`)}
                        className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleFinalizeMatch}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
                    >
                        ✓ Finalizar Jogo
                    </button>
                </div>
            </div>
        </div>
    );
}
