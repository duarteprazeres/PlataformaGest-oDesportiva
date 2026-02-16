'use client';

import { toast } from "sonner";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi, finalizeMatch, updateCallupStats } from '@/lib/api';

interface Match {
    id: string;
    opponentName: string;
    matchDate: string;
    matchTime: string | null;
    location: string;
    isHomeMatch: boolean;
    result: string;
    goalsFor: number | null;
    goalsAgainst: number | null;
}

interface Callup {
    id: string;
    playerId: string;
    player: {
        id: string;
        firstName: string;
        lastName: string;
    };
    confirmedByParent: boolean;
    played: boolean;
    goalsScored: number;
    minutesPlayed: number;
    yellowCards: number;
    redCard: boolean;
    coachRating: number | null;
}

export default function MatchDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [match, setMatch] = useState<Match | null>(null);
    const [callups, setCallups] = useState<Callup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Finalization State
    const [goalsFor, setGoalsFor] = useState(0);
    const [goalsAgainst, setGoalsAgainst] = useState(0);
    const [result, setResult] = useState<'WIN' | 'DRAW' | 'LOSS'>('WIN');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        loadData();
    }, [params.id]);

    const loadData = async () => {
        try {
            const matchData = await fetchApi(`/matches/${params.id}`);
            const callupsData = await fetchApi(`/matches/${params.id}/callups`);

            setMatch(matchData);
            setCallups(callupsData);

            // Initialize form if match is finished
            if (matchData.result !== 'SCHEDULED') {
                setGoalsFor(matchData.goalsFor || 0);
                setGoalsAgainst(matchData.goalsAgainst || 0);
                setResult(matchData.result);
                setNotes(matchData.notes || '');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStats = async (playerId: string, field: string, value: any, callupId: string) => {
        // Optimistic update
        const previousCallups = [...callups];

        // Find current callup data to merge
        const currentCallup = callups.find(c => c.id === callupId);
        if (!currentCallup) return;

        const updatedCallup = {
            ...currentCallup,
            [field]: value
        };

        setCallups(callups.map(c => c.id === callupId ? updatedCallup : c));

        try {
            await updateCallupStats(params.id, playerId, {
                played: updatedCallup.played,
                minutesPlayed: updatedCallup.minutesPlayed,
                goalsScored: updatedCallup.goalsScored,
                yellowCards: updatedCallup.yellowCards,
                redCard: updatedCallup.redCard,
                coachRating: updatedCallup.coachRating,
                notes: '' // TODO: Add notes field if needed
            });
        } catch (err) {
            console.error('Failed to update stats', err);
            // Revert on error
            setCallups(previousCallups);
            toast.error('Falha ao gravar estatísticas. Tente novamente.');
        }
    };

    const handleFinalizeMatch = async () => {
        if (!confirm('Tem certeza que deseja finalizar o jogo? As estatísticas serão gravadas permanentemente.')) {
            return;
        }

        try {
            await finalizeMatch(params.id, {
                result,
                goalsFor,
                goalsAgainst,
                notes
            });
            toast.success('Jogo finalizado! Estatísticas atualizadas.');
            router.push('/dashboard/matches');
        } catch (err: any) {
            toast.error(`Erro ao finalizar: ${err.message}`);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-600">A carregar dados do jogo...</div>;
    if (error || !match) return <div className="p-8 text-center text-red-600">Erro: {error || 'Jogo não encontrado'}</div>;

    const isFinalized = match.result !== 'SCHEDULED';

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
                        {match.isHomeMatch ? '🏠' : '✈️'} vs {match.opponentName}
                    </h1>
                    <p className="text-slate-600 mt-2">
                        📅 {new Date(match.matchDate).toLocaleDateString('pt-PT')} {match.matchTime && `às ${match.matchTime}`} • 📍 {match.location}
                    </p>
                </div>

                {/* Match Info Card - EDITABLE */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Resultado Final</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">

                        {/* Score Inputs */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Marcador (Golos)</label>
                            <div className="flex gap-3 items-center">
                                <div className="text-center">
                                    <span className="text-xs text-slate-500 mb-1 block">Nós</span>
                                    <input
                                        type="number"
                                        value={goalsFor}
                                        onChange={(e) => {
                                            const gFor = parseInt(e.target.value) || 0;
                                            setGoalsFor(gFor);
                                            // Auto-detect result based on score
                                            if (gFor > goalsAgainst) setResult('WIN');
                                            else if (gFor < goalsAgainst) setResult('LOSS');
                                            else setResult('DRAW');
                                        }}
                                        className="w-20 px-3 py-2 border rounded-lg text-center text-xl font-bold"
                                        placeholder="0"
                                        disabled={isFinalized}
                                    />
                                </div>
                                <span className="text-2xl font-bold text-slate-400">-</span>
                                <div className="text-center">
                                    <span className="text-xs text-slate-500 mb-1 block">Eles</span>
                                    <input
                                        type="number"
                                        value={goalsAgainst}
                                        onChange={(e) => {
                                            const gAgainst = parseInt(e.target.value) || 0;
                                            setGoalsAgainst(gAgainst);
                                            // Auto-detect result based on score
                                            if (goalsFor > gAgainst) setResult('WIN');
                                            else if (goalsFor < gAgainst) setResult('LOSS');
                                            else setResult('DRAW');
                                        }}
                                        className="w-20 px-3 py-2 border rounded-lg text-center text-xl font-bold"
                                        placeholder="0"
                                        disabled={isFinalized}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Result Dropdown */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Resultado Oficial</label>
                            <select
                                value={result}
                                onChange={(e) => setResult(e.target.value as any)}
                                className={`w-full px-4 py-2 rounded-lg border font-bold ${result === 'WIN' ? 'bg-green-50 text-green-700 border-green-200' :
                                    result === 'LOSS' ? 'bg-red-50 text-red-700 border-red-200' :
                                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                                    }`}
                                disabled={isFinalized}
                            >
                                <option value="WIN">Vitória (WIN)</option>
                                <option value="DRAW">Empate (DRAW)</option>
                                <option value="LOSS">Derrota (LOSS)</option>
                            </select>
                        </div>

                        {/* Status Badge */}
                        <div className="flex pb-2 justify-end">
                            <span className={`px-4 py-2 rounded-lg text-sm font-bold ${isFinalized ? 'bg-slate-800 text-white' : 'bg-blue-100 text-blue-800'}`}>
                                {isFinalized ? '🔒 JOGO FINALIZADO' : '⏱ A AGUARDAR FINALIZAÇÃO'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Callups */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-900">Estatísticas dos Jogadores ({callups.length})</h2>
                    </div>

                    <div className="space-y-3">
                        {callups.map((c) => (
                            <div key={c.id} className={`border rounded-lg p-4 transition-colors ${c.played ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
                                <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                                    {/* Player Info */}
                                    <div className="col-span-2">
                                        <p className="font-semibold text-slate-900">{c.player.firstName} {c.player.lastName}</p>
                                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${c.confirmedByParent ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {c.confirmedByParent ? 'Confirmado' : 'Pendente'}
                                        </span>
                                    </div>

                                    {/* Stats Input */}
                                    <div className="text-center">
                                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Jogou?</label>
                                        <input
                                            type="checkbox"
                                            checked={c.played}
                                            onChange={(e) => handleUpdateStats(c.player.id, 'played', e.target.checked, c.id)}
                                            className="w-6 h-6 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            disabled={isFinalized}
                                        />
                                    </div>
                                    <div className="text-center">
                                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Minutos</label>
                                        <input
                                            type="number"
                                            value={c.minutesPlayed}
                                            onChange={(e) => handleUpdateStats(c.player.id, 'minutesPlayed', parseInt(e.target.value) || 0, c.id)}
                                            className="w-16 px-2 py-1 border rounded text-sm text-center font-mono"
                                            min="0"
                                            max="120"
                                            disabled={!c.played || isFinalized}
                                        />
                                    </div>
                                    <div className="text-center">
                                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Golos</label>
                                        <input
                                            type="number"
                                            value={c.goalsScored}
                                            onChange={(e) => handleUpdateStats(c.player.id, 'goalsScored', parseInt(e.target.value) || 0, c.id)}
                                            className="w-16 px-2 py-1 border rounded text-sm text-center font-mono font-bold text-green-700"
                                            min="0"
                                            disabled={!c.played || isFinalized}
                                        />
                                    </div>
                                    <div className="text-center">
                                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Nota (0-10)</label>
                                        <input
                                            type="number"
                                            value={c.coachRating || 0}
                                            onChange={(e) => handleUpdateStats(c.player.id, 'coachRating', parseFloat(e.target.value) || 0, c.id)}
                                            className="w-16 px-2 py-1 border rounded text-sm text-center font-mono"
                                            min="0"
                                            max="10"
                                            step="0.5"
                                            disabled={!c.played || isFinalized}
                                        />
                                    </div>
                                    <div className="text-center">
                                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Cartões</label>
                                        <div className="flex justify-center gap-2">
                                            <input
                                                type="number"
                                                value={c.yellowCards}
                                                onChange={(e) => handleUpdateStats(c.player.id, 'yellowCards', parseInt(e.target.value) || 0, c.id)}
                                                className="w-10 px-1 py-1 border border-yellow-300 bg-yellow-50 rounded text-sm text-center font-mono"
                                                min="0"
                                                max="2"
                                                placeholder="Y"
                                                disabled={!c.played || isFinalized}
                                                title="Yellow Cards"
                                            />
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={c.redCard}
                                                    onChange={(e) => handleUpdateStats(c.player.id, 'redCard', e.target.checked, c.id)}
                                                    className="w-5 h-5 border-red-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                                    disabled={!c.played || isFinalized}
                                                    title="Red Card"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                {!isFinalized && (
                    <div className="flex justify-end gap-3 mt-8 p-4 bg-slate-100 rounded-xl border border-slate-200">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Notas do Treinador (Opcional)</label>
                            <input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg"
                                placeholder="Resumo do jogo, pontos positivos/negativos..."
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={handleFinalizeMatch}
                                className="px-8 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                            >
                                ✓ CONFIRMAR E FINALIZAR JOGO
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
