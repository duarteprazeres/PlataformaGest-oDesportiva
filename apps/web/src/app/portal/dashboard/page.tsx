'use client';

import { toast } from "sonner";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlobalApi } from '@/lib/api-global';

interface TransferRequest {
    id: string;
    toClub: {
        name: string;
    };
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
}

interface Athlete {
    id: string;
    publicId: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    currentClubId: string | null;
    transferRequests: TransferRequest[];
}

interface CurrentClub {
    clubName?: string;
    teamName?: string;
    status: 'ACTIVE' | 'PENDING_WITHDRAWAL' | 'LEFT' | 'FREE_AGENT';
    withdrawalRequestedAt?: string;
    hoursRemaining?: number;
}

interface AthleteStats {
    totalMatches: number;
    totalGoals: number;
    totalAssists: number;
    clubsCount: number;
    teamsCount: number;
    yearsActive: number;
}

interface ClubHistoryItem {
    clubName: string;
    teamName?: string;
    joinedAt: string;
    leftAt?: string;
    matchesPlayed: number;
    goalsScored: number;
}

import { AbsenceNoticeModal } from '@/components/portal/AbsenceNoticeModal';

export default function PortalDashboardPage() {
    const router = useRouter();
    const [athletes, setAthletes] = useState<Athlete[]>([]);
    const [selectedAthlete, setSelectedAthlete] = useState<string | null>(null);
    const [currentClub, setCurrentClub] = useState<CurrentClub | null>(null);
    const [stats, setStats] = useState<AthleteStats | null>(null);
    const [history, setHistory] = useState<ClubHistoryItem[]>([]);
    const [upcomingTrainings, setUpcomingTrainings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submittingNotice, setSubmittingNotice] = useState<string | null>(null);
    const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    // State for absence notice
    const [selectedTraining, setSelectedTraining] = useState<{ id: string, title?: string, scheduledDate: string } | null>(null);
    const [newAthlete, setNewAthlete] = useState({
        firstName: '',
        lastName: '',
        birthDate: '',
        gender: 'MALE',
        citizenCard: '',
        taxId: ''
    });

    useEffect(() => {
        fetchAthletes();
    }, []);

    useEffect(() => {
        if (selectedAthlete) {
            loadAthleteDetails(selectedAthlete);
            loadUpcomingTrainings(selectedAthlete);
        }
    }, [selectedAthlete]);

    const fetchAthletes = async () => {
        try {
            const data = await GlobalApi.getMyAthletes();
            setAthletes(data);
            if (data.length > 0 && !selectedAthlete) {
                setSelectedAthlete(data[0].id);
            }
        } catch (err) {
            console.error(err);
            router.push('/portal/login');
        } finally {
            setLoading(false);
        }
    };

    const loadAthleteDetails = async (athleteId: string) => {
        try {
            const [clubData, statsData, historyData] = await Promise.all([
                GlobalApi.getCurrentClub(athleteId),
                GlobalApi.getAthleteStats(athleteId),
                GlobalApi.getAthleteHistory(athleteId)
            ]);
            setCurrentClub(clubData);
            setStats(statsData);
            setHistory(historyData.clubs || []);
        } catch (err) {
            console.error('Error loading athlete details:', err);
        }
    };

    const loadUpcomingTrainings = async (athleteId: string) => {
        try {
            const data = await GlobalApi.getUpcomingTrainings(athleteId);
            setUpcomingTrainings(data);
        } catch (err) {
            console.error('Error loading upcoming trainings:', err);
        }
    };

    const handleApproveTransfer = async (requestId: string) => {
        try {
            await GlobalApi.approveTransfer(requestId);
            toast.success('Transferência aprovada com sucesso!');
            fetchAthletes(); // Refresh to update list and remove pending request
            if (selectedAthlete) loadAthleteDetails(selectedAthlete); // Refresh details
        } catch (err: any) {
            toast.error('Erro ao aprovar transferência: ' + err.message);
        }
    };

    const handleOpenNoticeModal = (training: any) => {
        setSelectedTraining({
            id: training.id,
            title: training.title || 'Treino',
            scheduledDate: new Date(training.scheduledDate).toLocaleDateString()
        });
    };

    const handleCloseNoticeModal = () => {
        setSelectedTraining(null);
    };

    const handleConfirmNotice = async (type: 'ABSENCE' | 'PRESENCE', reason: string) => {
        if (!selectedAthlete || !selectedTraining) return;
        setSubmittingNotice(selectedTraining.id);
        try {
            await GlobalApi.submitAbsenceNotice({
                athleteId: selectedAthlete,
                trainingId: selectedTraining.id,
                type,
                reason
            });
            toast.success('Aviso enviado com sucesso!');
            loadUpcomingTrainings(selectedAthlete);
        } catch (err: any) {
            toast.error('Erro: ' + err.message);
        } finally {
            setSubmittingNotice(null);
            setSelectedTraining(null);
        }
    };

    const handleWithdrawal = async () => {
        if (!selectedAthlete) return;
        try {
            await GlobalApi.requestWithdrawal(selectedAthlete);
            toast.success('Rescisão solicitada! O atleta será libertado em 24 horas.');
            setShowWithdrawalModal(false);
            loadAthleteDetails(selectedAthlete);
        } catch (err: any) {
            toast.error('Erro: ' + err.message);
        }
    };

    const handleCancelWithdrawal = async () => {
        if (!selectedAthlete) return;
        try {
            await GlobalApi.cancelWithdrawal(selectedAthlete);
            toast.success('Rescisão cancelada com sucesso!');
            loadAthleteDetails(selectedAthlete);
        } catch (err: any) {
            toast.error('Erro: ' + err.message);
        }
    };

    const handleCreatePassport = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await GlobalApi.createPassport(newAthlete);
            setShowCreateModal(false);
            setNewAthlete({ firstName: '', lastName: '', birthDate: '', gender: 'MALE', citizenCard: '', taxId: '' });
            fetchAthletes(); // Refresh list
        } catch (err: any) {
            toast.error('Erro ao criar atleta: ' + err.message);
        }
    };

    const handleLogout = () => {
        GlobalApi.logout();
        router.push('/portal/login');
    };

    if (loading) return <div className="text-center py-12">A carregar...</div>;

    const selectedAthleteData = athletes.find(a => a.id === selectedAthlete);
    const pendingRequests = athletes.flatMap(a =>
        (a.transferRequests || []).map(r => ({ ...r, athleteName: `${a.firstName} ${a.lastName}` }))
    );

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Meus Atletas</h1>
                <div className="flex gap-3">
                    <button onClick={handleLogout} className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium">
                        Sair
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
                    >
                        + Novo Atleta
                    </button>
                </div>
            </div>

            {/* Pending Transfers Section */}
            {pendingRequests.length > 0 && (
                <div className="mb-8 bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                        🔔 Pedidos de Transferência Pendentes
                    </h3>
                    <div className="space-y-3">
                        {pendingRequests.map(req => (
                            <div key={req.id} className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100 flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-slate-900">
                                        {req.toClub.name} quer adicionar <span className="text-indigo-600">{req.athleteName}</span>
                                    </p>
                                    <p className="text-sm text-slate-500">Solicitado em {new Date(req.createdAt).toLocaleDateString()}</p>
                                </div>
                                <button
                                    onClick={() => handleApproveTransfer(req.id)}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                    Aprovar
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {athletes.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                    <div className="text-6xl mb-4">🏅</div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Sem atletas registados</h3>
                    <p className="text-slate-500">Registe um atleta para começar.</p>
                </div>
            ) : (
                <div className="grid lg:grid-cols-4 gap-6">
                    {/* Sidebar - Athlete List */}
                    <div className="lg:col-span-1 space-y-2">
                        {athletes.map(athlete => (
                            <button
                                key={athlete.id}
                                onClick={() => setSelectedAthlete(athlete.id)}
                                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedAthlete === athlete.id
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                    }`}
                            >
                                <div className="font-semibold text-slate-900">{athlete.firstName} {athlete.lastName}</div>
                                <div className="text-xs text-slate-500 font-mono mt-1">{athlete.publicId}</div>
                            </button>
                        ))}
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                        {selectedAthleteData && (
                            <>
                                {/* Current Club Card */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                    <h2 className="text-xl font-bold text-slate-900 mb-4">Clube Atual</h2>
                                    {currentClub && currentClub.status === 'FREE_AGENT' ? (
                                        <div className="text-center py-8">
                                            <div className="text-4xl mb-2">⚪</div>
                                            <p className="text-slate-600 font-medium">Atleta Livre</p>
                                            <p className="text-sm text-slate-500 mt-1">Disponível para inscrição em qualquer clube</p>
                                        </div>
                                    ) : currentClub ? (
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-slate-800">{currentClub.clubName}</h3>
                                                    {currentClub.teamName && (
                                                        <p className="text-sm text-slate-500">Equipa: {currentClub.teamName}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    {currentClub.status === 'ACTIVE' && (
                                                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                                                            🟢 Ativo
                                                        </span>
                                                    )}
                                                    {currentClub.status === 'PENDING_WITHDRAWAL' && (
                                                        <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-semibold rounded-full">
                                                            ⏳ Rescisão Pendente
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {currentClub.status === 'ACTIVE' && (
                                                <button
                                                    onClick={() => setShowWithdrawalModal(true)}
                                                    className="w-full mt-4 px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                                                >
                                                    Rescindir Contrato
                                                </button>
                                            )}

                                            {currentClub.status === 'PENDING_WITHDRAWAL' && (
                                                <div className="mt-4 bg-amber-50 p-4 rounded-lg border border-amber-200">
                                                    <p className="text-sm text-amber-800 mb-2">
                                                        ⏰ Faltam <strong>{currentClub.hoursRemaining}h</strong> para a rescisão ser efetivada
                                                    </p>
                                                    <button
                                                        onClick={handleCancelWithdrawal}
                                                        className="w-full px-4 py-2 bg-white text-amber-700 font-semibold rounded-lg hover:bg-amber-50 transition-colors border border-amber-300"
                                                    >
                                                        Cancelar Rescisão
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-slate-400">A carregar...</div>
                                    )}
                                </div>

                                {/* Upcoming Trainings & Absence Notice */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                    <h2 className="text-xl font-bold text-slate-900 mb-4">Próximos Treinos</h2>
                                    {upcomingTrainings.length === 0 ? (
                                        <p className="text-slate-500 text-sm text-center py-4 bg-slate-50 rounded-lg">Sem treinos agendados.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {upcomingTrainings.map((training) => (
                                                <div key={training.id} className="p-3 rounded-lg border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div>
                                                        <div className="font-semibold text-sm">{training.title || 'Treino'}</div>
                                                        <div className="text-xs text-slate-500">
                                                            {new Date(training.scheduledDate).toLocaleDateString()} | {training.startTime?.substring(0, 5)}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {training.absenceNotices?.length > 0 ? (
                                                            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded ${training.absenceNotices[0].type === 'ABSENCE'
                                                                ? 'bg-red-100 text-red-700'
                                                                : 'bg-green-100 text-green-700'
                                                                }`}>
                                                                {training.absenceNotices[0].type === 'ABSENCE' ? 'Ausência' : 'Presença'} {training.absenceNotices[0].status === 'APPROVED' ? '(Validado)' : '(Pendente)'}
                                                            </span>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => handleOpenNoticeModal(training)}
                                                                    disabled={submittingNotice === training.id}
                                                                    className="text-white bg-slate-700 px-3 py-1 rounded text-xs font-bold hover:bg-slate-800 disabled:opacity-50"
                                                                >
                                                                    Notificar Treinador
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Stats Card */}
                                {stats && (
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                        <h2 className="text-xl font-bold text-slate-900 mb-4">Estatísticas</h2>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="text-center">
                                                <div className="text-3xl font-bold text-indigo-600">{stats.totalMatches}</div>
                                                <div className="text-sm text-slate-500 mt-1">Jogos</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-3xl font-bold text-green-600">{stats.totalGoals}</div>
                                                <div className="text-sm text-slate-500 mt-1">Golos</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-3xl font-bold text-purple-600">{stats.totalAssists}</div>
                                                <div className="text-sm text-slate-500 mt-1">Assistências</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-slate-700">{stats.clubsCount}</div>
                                                <div className="text-sm text-slate-500 mt-1">Clubes</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-slate-700">{stats.teamsCount}</div>
                                                <div className="text-sm text-slate-500 mt-1">Equipas</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-slate-700">{stats.yearsActive}</div>
                                                <div className="text-sm text-slate-500 mt-1">Anos</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* History Timeline */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                    <h2 className="text-xl font-bold text-slate-900 mb-4">Histórico de Clubes</h2>
                                    {history.length === 0 ? (
                                        <p className="text-slate-500 text-center py-8">Sem histórico registado</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {history.map((club, idx) => (
                                                <div key={idx} className="flex gap-4 pb-4 border-b border-slate-100 last:border-0">
                                                    <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex-grow">
                                                        <h4 className="font-semibold text-slate-800">{club.clubName}</h4>
                                                        {club.teamName && <p className="text-sm text-slate-500">{club.teamName}</p>}
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            {new Date(club.joinedAt).toLocaleDateString()}
                                                            {club.leftAt && ` → ${new Date(club.leftAt).toLocaleDateString()}`}
                                                        </p>
                                                        <div className="flex gap-4 mt-2 text-sm">
                                                            <span className="text-slate-600">⚽ {club.goalsScored} golos</span>
                                                            <span className="text-slate-600">🏟️ {club.matchesPlayed} jogos</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Withdrawal Confirmation Modal */}
            {showWithdrawalModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">⚠️ Confirmar Rescisão</h3>
                        <p className="text-slate-600 mb-4">
                            Tem a certeza que deseja rescindir o contrato? O atleta ficará indisponível por <strong>24 horas</strong> antes de ser libertado.
                        </p>
                        <p className="text-sm text-slate-500 mb-6">
                            Durante este período, pode cancelar a rescisão. Após 24h, o atleta ficará livre para inscrição em qualquer clube.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowWithdrawalModal(false)}
                                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleWithdrawal}
                                className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
                            >
                                Confirmar Rescisão
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Athlete Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg">Novo Atleta</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <form onSubmit={handleCreatePassport} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                                    <input required type="text" className="w-full px-3 py-2 border rounded-lg"
                                        value={newAthlete.firstName} onChange={e => setNewAthlete({ ...newAthlete, firstName: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Sobrenome</label>
                                    <input required type="text" className="w-full px-3 py-2 border rounded-lg"
                                        value={newAthlete.lastName} onChange={e => setNewAthlete({ ...newAthlete, lastName: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Data de Nascimento</label>
                                <input required type="date" className="w-full px-3 py-2 border rounded-lg"
                                    value={newAthlete.birthDate} onChange={e => setNewAthlete({ ...newAthlete, birthDate: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Género</label>
                                <select className="w-full px-3 py-2 border rounded-lg"
                                    value={newAthlete.gender} onChange={e => setNewAthlete({ ...newAthlete, gender: e.target.value })}>
                                    <option value="MALE">Masculino</option>
                                    <option value="FEMALE">Feminino</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Cartão Cidadão</label>
                                    <input type="text" className="w-full px-3 py-2 border rounded-lg"
                                        value={newAthlete.citizenCard} onChange={e => setNewAthlete({ ...newAthlete, citizenCard: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">NIF</label>
                                    <input type="text" className="w-full px-3 py-2 border rounded-lg"
                                        value={newAthlete.taxId} onChange={e => setNewAthlete({ ...newAthlete, taxId: e.target.value })} />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700">Criar Atleta</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Absence Notice Modal */}
            {selectedTraining && (
                <AbsenceNoticeModal
                    isOpen={!!selectedTraining}
                    onClose={handleCloseNoticeModal}
                    onSubmit={handleConfirmNotice}
                    trainingTitle={selectedTraining.title || 'Treino'}
                    trainingDate={selectedTraining.scheduledDate}
                />
            )}
        </div>
    );
}
