'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function TeamDetailPage() {
    const router = useRouter();
    const params = useParams();
    const teamId = params.teamId as string;

    const [team, setTeam] = useState({
        id: teamId,
        name: 'Sub-15 Masculino',
        category: 'SUB15',
        season: '2025/2026',
    });

    const [players, setPlayers] = useState([
        { id: '1', name: 'João Silva', position: 'MIDFIELDER', jerseyNumber: 10, matches: 12, goals: 5 },
        { id: '2', name: 'Pedro Costa', position: 'FORWARD', jerseyNumber: 9, matches: 10, goals: 8 },
        { id: '3', name: 'Miguel Santos', position: 'DEFENDER', jerseyNumber: 4, matches: 12, goals: 1 },
    ]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/dashboard/teams')}
                        className="text-indigo-600 hover:text-indigo-700 font-semibold mb-4 flex items-center gap-1"
                    >
                        ← Equipas
                    </button>
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">{team.name}</h1>
                            <p className="text-slate-600 mt-1">{team.category} • {team.season}</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.push(`/dashboard/teams/${teamId}/matches`)}
                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors"
                            >
                                📅 Ver Jogos
                            </button>
                            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-colors">
                                + Adicionar Jogador
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <p className="text-slate-600 text-sm font-medium mb-1">Jogadores</p>
                        <p className="text-3xl font-bold text-slate-900">{players.length}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <p className="text-slate-600 text-sm font-medium mb-1">Jogos Totais</p>
                        <p className="text-3xl font-bold text-slate-900">12</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <p className="text-slate-600 text-sm font-medium mb-1">Golos Marcados</p>
                        <p className="text-3xl font-bold text-indigo-600">28</p>
                    </div>
                </div>

                {/* Players Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-xl font-bold text-slate-900">Plantel</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                                        Nº
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                                        Nome
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                                        Posição
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                                        Jogos
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                                        Golos
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {players.map((player) => (
                                    <tr key={player.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-bold text-lg text-slate-900">{player.jerseyNumber}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="font-semibold text-slate-900">{player.name}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded">
                                                {player.position}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {player.matches}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                                            {player.goals}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button className="text-indigo-600 hover:text-indigo-700 font-semibold">
                                                Ver Detalhes
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
