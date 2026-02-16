'use client';

import { toast } from "sonner";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/lib/api';

export default function MedicalPage() {
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
    const [injuries, setInjuries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [selectedPlayerId, setSelectedPlayerId] = useState('');
    const [status, setStatus] = useState('INJURED');
    const [injuryName, setInjuryName] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

    // Data for selectors
    const [players, setPlayers] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, [viewMode]);

    useEffect(() => {
        // Load players for the form
        if (user?.clubId) {
            // We need an endpoint to get all players, reusing teams or separate endpoint.
            // For now, let's assume we can fetch players generally or per team.
            // Let's fetch all active players via a teams loop or a direct players endpoint if available?
            // The backend usually has /teams. Let's fetch teams and aggregate for now (hacky but works without new endpoint)
            fetchApi('/teams?activeOnly=true').then(teams => {
                const allPlayers: any[] = [];
                const promises = teams.map((t: any) => fetchApi(`/teams/${t.id}`));
                Promise.all(promises).then(teamDetails => {
                    teamDetails.forEach((td: any) => {
                        if (td.players) allPlayers.push(...td.players);
                    });
                    // Remove duplicates
                    const uniquePlayers = Array.from(new Map(allPlayers.map(p => [p.id, p])).values());
                    setPlayers(uniquePlayers);
                });
            });
        }
    }, [user]);

    const loadData = async () => {
        setLoading(true);
        try {
            const url = viewMode === 'active' ? '/injuries?activeOnly=true' : '/injuries';
            const data = await fetchApi(url);
            setInjuries(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetchApi('/injuries', {
                method: 'POST',
                body: JSON.stringify({
                    playerId: selectedPlayerId,
                    status, // INJURED, SICK, CONDITIONED
                    name: injuryName,
                    description,
                    startDate
                })
            });
            setShowModal(false);
            loadData();
            // Reset form
            setInjuryName(''); setDescription(''); setSelectedPlayerId('');
        } catch (error) {
            toast.error('Erro ao registar lesão');
        }
    };

    const handleCloseInjury = async (id: string) => {
        if (!confirm('Dar alta médica a este jogador?')) return;
        try {
            await fetchApi(`/injuries/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    endDate: new Date().toISOString()
                })
            });
            loadData();
        } catch (error) {
            toast.error('Erro ao atualizar lesão');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Departamento Médico</h1>
                    <p className="text-gray-500">Gestão de lesões e disponibilidade fisica.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                >
                    + Registar Lesão
                </button>
            </div>

            {/* View Toggles */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                <button
                    onClick={() => setViewMode('active')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${viewMode === 'active' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                    Ativas
                </button>
                <button
                    onClick={() => setViewMode('history')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${viewMode === 'history' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                    Histórico
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-500">A carregar...</div>
            ) : injuries.length === 0 ? (
                <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-gray-500">Sem registos encontrados.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {injuries.map((injury) => (
                        <div key={injury.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 relative overflow-hidden group">
                            {/* Status Badge */}
                            <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-xl ${injury.endDate ? 'bg-green-100 text-green-700' :
                                injury.status === 'SICK' ? 'bg-purple-100 text-purple-700' :
                                    injury.status === 'CONDITIONED' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                }`}>
                                {injury.endDate ? 'RECUPERADO' : injury.status}
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                                    {/* Avatar placeholder until we have real images */}
                                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg font-bold">
                                        {injury.player.firstName[0]}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100">{injury.player.firstName} {injury.player.lastName}</h3>
                                    <p className="text-sm text-gray-500">{new Date(injury.startDate).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <h4 className="font-semibold text-lg mb-1">{injury.name}</h4>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">{injury.description || "Sem descrição"}</p>

                            {!injury.endDate && (
                                <button
                                    onClick={() => handleCloseInjury(injury.id)}
                                    className="w-full py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium border border-green-200 transition"
                                >
                                    Dar Alta Médica
                                </button>
                            )}
                            {injury.endDate && (
                                <p className="text-xs text-gray-400 text-center">Alta em: {new Date(injury.endDate).toLocaleDateString()}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold mb-4">Registar Boletim Clínico</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Jogador</label>
                                <select
                                    className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                                    value={selectedPlayerId}
                                    onChange={e => setSelectedPlayerId(e.target.value)}
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    {players.map(p => (
                                        <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Tipo</label>
                                <select
                                    className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                                    value={status}
                                    onChange={e => setStatus(e.target.value)}
                                >
                                    <option value="INJURED">Lesão (INJURED)</option>
                                    <option value="SICK">Doença (SICK)</option>
                                    <option value="CONDITIONED">Condicionado</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Diagnóstico / Nome</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                                    placeholder="Ex: Entorse do tornozelo"
                                    value={injuryName}
                                    onChange={e => setInjuryName(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Descrição</label>
                                <textarea
                                    className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 h-24"
                                    placeholder="Detalhes clínicos..."
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Registar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
