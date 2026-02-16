'use client';

import { useState, useEffect } from 'react';
import { fetchApi, createTraining } from '@/lib/api';

interface Training {
    id: string;
    scheduledDate: string;
    startTime: string;
    location: string;
    notes: string;
    planFileUrl: string | null;
    team: { name: string };
    coach: { firstName: string; lastName: string };
}

interface Team {
    id: string;
    name: string;
}

export default function TrainingsPage() {
    const [viewMode, setViewMode] = useState<'upcoming' | 'pending_lock' | 'history'>('upcoming');
    const [trainings, setTrainings] = useState<Training[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [selectedTeam, setSelectedTeam] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('19:00');
    const [endTime, setEndTime] = useState('20:30');
    const [location, setLocation] = useState('Campo Principal');
    const [notes, setNotes] = useState('');

    // Recurring State
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

    useEffect(() => {
        loadData();
    }, [viewMode]);

    const loadData = async () => {
        try {
            const url = `/trainings?status=${viewMode}`;
            const [trainingsData, teamsData] = await Promise.all([
                fetchApi(url),
                fetchApi('/teams?activeOnly=true')
            ]);
            setTrainings(trainingsData);
            setTeams(teamsData);
            if (teamsData.length > 0) setSelectedTeam(teamsData[0].id);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('teamId', selectedTeam);
            formData.append('scheduledDate', date);
            formData.append('startTime', startTime);
            formData.append('endTime', endTime);
            formData.append('location', location);
            if (notes) formData.append('notes', notes);
            if (isRecurring) {
                formData.append('isRecurring', 'true');
                formData.append('frequency', 'WEEKLY');
                if (recurrenceEndDate) formData.append('recurrenceEndDate', recurrenceEndDate);
            }

            await createTraining(formData);

            alert('Treino agendado com sucesso!');
            setIsCreating(false);
            loadData(); // Refresh list
        } catch (error: any) {
            alert('Erro ao criar treino: ' + error.message);
        }
    };

    if (loading) return <div className="p-8">A carregar...</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestão de Treinos</h1>
                    <div className="flex gap-2 mt-2 border-b border-gray-200">
                        <button
                            onClick={() => setViewMode('upcoming')}
                            className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${viewMode === 'upcoming'
                                    ? 'border-indigo-600 text-indigo-700'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            📅 Próximos Treinos
                        </button>
                        <button
                            onClick={() => setViewMode('pending_lock')}
                            className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${viewMode === 'pending_lock'
                                    ? 'border-orange-600 text-orange-700'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            ⚠️ Treinos por Lacrar
                        </button>
                        <button
                            onClick={() => setViewMode('history')}
                            className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${viewMode === 'history'
                                    ? 'border-green-600 text-green-700'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            📚 Histórico
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
                >
                    + Agendar Treino
                </button>
            </div>

            {/* List */}
            <div className="grid gap-4">
                {trainings.map(training => (
                    <div key={training.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg">{new Date(training.scheduledDate).toLocaleDateString('pt-PT')} • {new Date(training.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</h3>
                            <p className="text-slate-600">{training.team.name} @ {training.location}</p>
                            {training.notes && <p className="text-sm text-slate-500 mt-1">📝 {training.notes}</p>}
                        </div>
                        <div className="flex gap-2">
                            <a
                                href={`/dashboard/trainings/${training.id}`}
                                className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 text-sm font-medium flex items-center gap-1"
                            >
                                Detalhes e Presenças
                            </a>
                        </div>
                    </div>
                ))}
                {trainings.length === 0 && <p className="text-slate-500 text-center py-8">Nenhum treino agendado.</p>}
            </div>

            {/* Create Modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold mb-4">Agendar Novo Treino</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Equipa</label>
                                <select
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={selectedTeam}
                                    onChange={e => setSelectedTeam(e.target.value)}
                                >
                                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Data</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border rounded-lg px-3 py-2"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Local</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border rounded-lg px-3 py-2"
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Início</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full border rounded-lg px-3 py-2"
                                        value={startTime}
                                        onChange={e => setStartTime(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Fim</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full border rounded-lg px-3 py-2"
                                        value={endTime}
                                        onChange={e => setEndTime(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="flex items-center mb-3">
                                    <input
                                        type="checkbox"
                                        id="recurring"
                                        checked={isRecurring}
                                        onChange={e => setIsRecurring(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded"
                                    />
                                    <label htmlFor="recurring" className="ml-2 text-sm font-medium text-slate-900">
                                        Repetir Semanalmente
                                    </label>
                                </div>
                                {isRecurring && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-sm font-medium mb-1 text-slate-600">Repetir até (Fim da Época)</label>
                                        <input
                                            type="date"
                                            required={isRecurring}
                                            className="w-full border rounded-lg px-3 py-2 bg-white"
                                            value={recurrenceEndDate}
                                            onChange={e => setRecurrenceEndDate(e.target.value)}
                                            min={date}
                                        />
                                        <p className="text-xs text-slate-500 mt-1">O treino será criado todas as semanas até esta data.</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Notas (Opcional)</label>
                                <textarea
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    rows={2}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Notas (Opcional)</label>
                                <textarea
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    rows={2}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
                                >
                                    Agendar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
