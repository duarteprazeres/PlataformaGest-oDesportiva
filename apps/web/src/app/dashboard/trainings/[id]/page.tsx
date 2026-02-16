'use client';

import { toast } from "sonner";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchApi, approveAbsenceNotice, dismissAbsenceNotice } from '@/lib/api';
import { detectMedicalIssue } from '@/lib/constants';
import { Player, AttendanceRecord } from '@/lib/types';
import { FiCalendar, FiClock, FiMapPin, FiUpload, FiDownload, FiCheck, FiX, FiAlertTriangle, FiSave, FiAlertCircle, FiArrowLeft, FiLock, FiHome, FiThumbsUp, FiThumbsDown } from 'react-icons/fi';
import NoticeApprovalModal from '@/components/trainings/NoticeApprovalModal';
import MedicalRegistrationModal from '@/components/trainings/MedicalRegistrationModal';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'JUSTIFIED_ABSENT';

interface AttendanceState {
    status: AttendanceStatus | null;
    justification: string;
}

export default function TrainingDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [training, setTraining] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Attendance state: Map<playerId, AttendanceState>
    const [attendanceState, setAttendanceState] = useState<Map<string, AttendanceState>>(new Map());

    // Notice Approval State
    const [noticeToApprove, setNoticeToApprove] = useState<any>(null);

    // Medical modal state
    const [showMedicalModal, setShowMedicalModal] = useState(false);
    const [playersNeedingMedicalRegistration, setPlayersNeedingMedicalRegistration] = useState<any[]>([]);
    const [currentMedicalPlayer, setCurrentMedicalPlayer] = useState<any | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await fetchApi(`/trainings/${params.id}`);
            setTraining(data);

            // Initialize attendance state from existing data
            const initialState = new Map<string, AttendanceState>();
            data.attendance?.forEach((att: any) => {
                initialState.set(att.playerId, {
                    status: att.status,
                    justification: att.justification || ''
                });
            });
            setAttendanceState(initialState);
        } catch (error) {
            console.error(error);
            router.push('/dashboard/trainings');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAttendance = (playerId: string, status: AttendanceStatus) => {
        const newState = new Map(attendanceState);
        const current = newState.get(playerId) || { status: null, justification: '' };
        newState.set(playerId, { ...current, status });
        setAttendanceState(newState);
    };

    const handleJustificationChange = (playerId: string, justification: string) => {
        const newState = new Map(attendanceState);
        const current = newState.get(playerId) || { status: null, justification: '' };
        newState.set(playerId, { ...current, justification });
        setAttendanceState(newState);
    };

    const handleSaveAttendance = async () => {
        // Build attendance array
        const attendance: any[] = [];
        const playersWithMedicalIssues: any[] = [];

        attendanceState.forEach((state, playerId) => {
            if (state.status) {
                attendance.push({
                    playerId,
                    status: state.status,
                    justification: state.justification || undefined
                });

                // Check for medical keywords in ABSENT justifications
                if (state.status === 'ABSENT' && state.justification) {
                    if (detectMedicalIssue(state.justification)) {
                        const player = allPlayers.find((p: any) => p.id === playerId);
                        if (player) {
                            playersWithMedicalIssues.push({
                                ...player,
                                justification: state.justification
                            });
                        }
                    }
                }
            }
        });

        if (attendance.length === 0) {
            toast.warning('Marque pelo menos um jogador antes de guardar.');
            return;
        }

        setSaving(true);
        try {
            await fetchApi(`/trainings/${params.id}/attendance`, {
                method: 'POST',
                body: JSON.stringify({ attendance })
            });

            // Success! Reload to show updated data
            await loadData();

            // Check if any medical issues detected
            if (playersWithMedicalIssues.length > 0) {
                setPlayersNeedingMedicalRegistration(playersWithMedicalIssues);
                setCurrentMedicalPlayer(playersWithMedicalIssues[0]);
                setShowMedicalModal(true);
                setShowMedicalModal(true);
            } else {
                toast.success('✅ Presenças guardadas com sucesso!');
            }
        } catch (error: any) {
            toast.error(`Erro: ${error.message || 'Não foi possível guardar presenças'}`);
        } finally {
            setSaving(false);
        }
    };

    const handleProcessNotice = async (noticeId: string, action: 'approve' | 'dismiss') => {
        try {
            if (action === 'dismiss') {
                await dismissAbsenceNotice(noticeId, { reviewNotes: 'Rejeitado via lista de presenças' });
                await loadData();
                return;
            }

            // For approval, check for medical issues
            const notice = training.absenceNotices?.find((n: any) => n.id === noticeId);
            if (notice && detectMedicalIssue(notice.reason)) {
                setNoticeToApprove(notice);
                return;
            }

            // Normal approval without medical issue
            await approveAbsenceNotice(noticeId, { reviewNotes: 'Aprovado via lista de presenças' });
            await loadData();
            toast.success('Aviso aprovado com sucesso');
        } catch (error: any) {
            toast.error(`Erro: ${error.message}`);
        }
    };

    const handleConfirmNoticeApproval = async (createInjury: boolean, injuryData?: any) => {
        if (!noticeToApprove) return;
        try {
            await approveAbsenceNotice(noticeToApprove.id, {
                reviewNotes: 'Aprovado via lista de presenças',
                createInjury,
                injuryData
            });

            setNoticeToApprove(null);
            toast.success(createInjury ? '✅ Aviso aprovado e lesão registada!' : '✅ Aviso aprovado!');
            await loadData();
        } catch (error: any) {
            toast.error(`Erro: ${error.message}`);
        }
    };

    const handleMedicalRecordConfirm = async (data: any) => {
        if (!currentMedicalPlayer) return;

        try {
            await fetchApi('/injuries', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            toast.success(`✅ Registo médico criado para ${currentMedicalPlayer.firstName}!`);

            // Check if there are more players
            const currentIndex = playersNeedingMedicalRegistration.findIndex(p => p.id === currentMedicalPlayer.id);
            if (currentIndex < playersNeedingMedicalRegistration.length - 1) {
                const nextPlayer = playersNeedingMedicalRegistration[currentIndex + 1];
                setCurrentMedicalPlayer(nextPlayer);
            } else {
                // All done
                setShowMedicalModal(false);
                toast.success('✅ Todos os registos médicos foram criados!');
            }
        } catch (error: any) {
            toast.error(`Erro ao criar registo médico: ${error.message}`);
        }
    };

    const handleMedicalRecordSkip = () => {
        const currentIndex = playersNeedingMedicalRegistration.findIndex(p => p.id === currentMedicalPlayer!.id);
        if (currentIndex < playersNeedingMedicalRegistration.length - 1) {
            const nextPlayer = playersNeedingMedicalRegistration[currentIndex + 1];
            setCurrentMedicalPlayer(nextPlayer);
        } else {
            setShowMedicalModal(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            await fetch(`http://localhost:3000/trainings/${params.id}`, {
                method: 'PATCH',
                headers: {},
                body: formData,
                credentials: 'include'
            });

            loadData();
            toast.success('Plano carregado com sucesso');
        } catch (error) {
            toast.error('Erro ao carregar plano.');
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">A carregar...</div></div>;
    if (!training) return <div className="text-center text-gray-500 mt-10">Treino não encontrado.</div>;

    const handleFinalizeTraining = async () => {
        if (!training) return;

        const confirmed = confirm(
            '⚠️ TEM A CERTEZA?\n\n' +
            'Lacrar este treino irá:\n' +
            '• Impedir qualquer alteração futura\n' +
            '• Fixar presenças permanentemente\n' +
            '• Esta ação NÃO pode ser revertida\n\n' +
            'Deseja continuar?'
        );

        if (!confirmed) return;

        try {
            await fetchApi(`/trainings/${params.id}/finalize`, {
                method: 'PATCH'
            });
            toast.success('✅ Treino lacrado com sucesso!');
            await loadData(); // Reload to show locked state
        } catch (error: any) {
            toast.error(`Erro: ${error.message || 'Não foi possível lacrar o treino'}`);
        }
    };

    const allPlayers: Player[] = training.team?.players || [];
    const attendanceMap = new Map<string, AttendanceRecord>(
        training.attendance?.map((a: any) => [a.playerId, a]) || []
    );

    // Enable save button if ANY player has a status marked (even if it matches existing)
    // This allows re-saving and ensures button is always enabled when there's attendance data
    const hasUnsavedChanges = attendanceState.size > 0 && Array.from(attendanceState.values()).some(state => state.status !== null);

    // Check if training can be finalized (must be after end time)
    const canFinalize = (() => {
        if (!training || training.isFinalized) return false;

        const trainingDate = new Date(training.scheduledDate);
        const endTime = new Date(training.endTime);
        trainingDate.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

        return new Date() >= trainingDate;
    })();

    const getFinalizationTooltip = () => {
        if (training.isFinalized) return '';
        if (!canFinalize) {
            const trainingDate = new Date(training.scheduledDate);
            const endTime = new Date(training.endTime);
            trainingDate.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
            return `Treino só pode ser lacrado após o término: ${trainingDate.toLocaleString('pt-PT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}`;
        }
        return 'Lacrar treino (não permitir mais alterações)';
    };

    return (
        <div className="space-y-6">
            {/* Navigation and Actions Bar */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.push('/dashboard/trainings')}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <FiArrowLeft className="w-5 h-5" />
                    <span className="font-medium">Voltar</span>
                </button>

                {!training.isFinalized && (
                    <button
                        onClick={handleFinalizeTraining}
                        disabled={!canFinalize}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow transition-colors ${canFinalize
                            ? 'bg-orange-600 hover:bg-orange-700 text-white font-semibold'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed font-semibold'
                            }`}
                        title={getFinalizationTooltip()}
                    >
                        <FiLock className="w-4 h-4" />
                        <span>Lacrar Treino</span>
                    </button>
                )}
                {training.isFinalized && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 font-semibold rounded-lg" title="Treino lacrado - não é possível fazer mais alterações">
                        <FiLock className="w-4 h-4" />
                        <span>Treino Lacrado</span>
                    </div>
                )}
            </div>

            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">Detalhes do Treino</h1>
                        <p className="text-gray-500">{training.team?.name}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                        AGENDADO
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <FiCalendar size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Data</p>
                            <p className="font-medium">{new Date(training.scheduledDate).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <FiClock size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Horário</p>
                            <p className="font-medium">{training.startTime.slice(0, 5)} - {training.endTime.slice(0, 5)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <FiMapPin size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Local</p>
                            <p className="font-medium">{training.location}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Attendance Column */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="font-bold text-lg">Presenças</h2>
                        <span className="text-xs text-gray-500">{allPlayers.length} Jogadores</span>
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
                        {allPlayers.map((player: any) => {
                            const isInjured = player.medicalStatus === 'INJURED' || player.medicalStatus === 'SICK';
                            const isConditioned = player.medicalStatus === 'CONDITIONED';
                            const attendance = (attendanceMap.get(player.id) || {}) as any;
                            const currentState = (attendanceState.get(player.id) || { status: null, justification: '' }) as any;
                            const currentStatus = currentState.status || attendance?.status;
                            const showJustificationField = currentStatus === 'ABSENT' || currentStatus === 'JUSTIFIED_ABSENT';

                            return (
                                <div key={player.id} className={`p-4 ${isInjured ? 'bg-red-50/30' : ''}`}>
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                                                {player.firstName[0]}
                                            </div>
                                            <div>
                                                <p className="font-medium">{player.firstName} {player.lastName}</p>
                                                <div className="flex gap-2 text-xs mt-1">
                                                    {isInjured && <span className="text-red-600 font-bold flex items-center gap-1"><FiAlertTriangle /> {player.medicalStatus}</span>}
                                                    {isConditioned && <span className="text-yellow-600 font-bold flex items-center gap-1"><FiAlertTriangle /> CONDICIONADO</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleMarkAttendance(player.id, 'PRESENT')}
                                                disabled={training.isFinalized || isInjured}
                                                className={`p-2 rounded-lg transition ${currentStatus === 'PRESENT'
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                                                    } ${(training.isFinalized || isInjured) ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                title={training.isFinalized ? 'Treino lacrado - não é possível editar' : (isInjured ? 'Jogador lesionado/doente não pode estar presente' : 'Marcar presente')}
                                            >
                                                <FiCheck />
                                            </button>
                                            <button
                                                onClick={() => handleMarkAttendance(player.id, 'ABSENT')}
                                                disabled={training.isFinalized}
                                                className={`p-2 rounded-lg transition ${currentStatus === 'ABSENT' || currentStatus === 'JUSTIFIED_ABSENT'
                                                    ? 'bg-red-500 text-white'
                                                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                                                    } ${training.isFinalized ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                title={training.isFinalized ? 'Treino lacrado - não é possível editar' : 'Marcar ausente'}
                                            >
                                                <FiX />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Parent Notice */}
                                    {(() => {
                                        const notice = training.absenceNotices?.find((n: any) => n.playerId === player.id);
                                        if (!notice) return null;
                                        return (
                                            <div className="mt-2 mb-2 p-2 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between gap-2 ml-13">
                                                <div className="flex items-center gap-2">
                                                    <FiHome className="text-indigo-600 flex-shrink-0" size={16} />
                                                    <div className="text-xs">
                                                        <span className="font-bold text-indigo-700">
                                                            Aviso do Encarregado: {notice.type === 'ABSENCE' ? 'Ausência' : 'Presença'}
                                                        </span>
                                                        {notice.reason && <p className="text-indigo-600 mt-0.5 opacity-80 italic">"{notice.reason}"</p>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {notice.status === 'PENDING' && !training.isFinalized ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleProcessNotice(notice.id, 'dismiss')}
                                                                className="p-1.5 text-red-600 hover:bg-red-100 rounded transition"
                                                                title="Rejeitar aviso"
                                                            >
                                                                <FiThumbsDown size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleProcessNotice(notice.id, 'approve')}
                                                                className="p-1.5 text-green-600 hover:bg-green-100 rounded transition"
                                                                title="Aprovar aviso"
                                                            >
                                                                <FiThumbsUp size={14} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${notice.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                            notice.status === 'DISMISSED' ? 'bg-red-100 text-red-700' :
                                                                'bg-amber-100 text-amber-700'
                                                            }`}>
                                                            {notice.status}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Justification field for absences */}
                                    {showJustificationField && (
                                        <div className="mt-3 pl-13">
                                            <label className="text-xs text-gray-500 mb-1 block">
                                                Justificação {detectMedicalIssue(currentState.justification || '') &&
                                                    <span className="ml-1 text-orange-600 font-bold">
                                                        <FiAlertCircle className="inline" /> Questão médica detetada
                                                    </span>
                                                }
                                            </label>
                                            <input
                                                type="text"
                                                value={currentState.justification || attendanceMap.get(player.id)?.justification || ''}
                                                onChange={(e) => handleJustificationChange(player.id, e.target.value)}
                                                disabled={training.isFinalized}
                                                placeholder="Ex: Dor no joelho, Assuntos pessoais, etc."
                                                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Save button */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200">
                        {/* Save button */}
                        <button
                            onClick={handleSaveAttendance}
                            disabled={!hasUnsavedChanges || saving || training.isFinalized}
                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold shadow transition ${!hasUnsavedChanges || saving || training.isFinalized
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                        >
                            <FiSave />
                            {training.isFinalized ? 'Treino Lacrado' : (saving ? 'A guardar...' : 'Guardar Presenças')}
                        </button>
                    </div>
                </div>

                {/* Plan Column */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="font-bold text-lg mb-4">Plano de Treino</h2>

                        {training.planFileUrl ? (
                            <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-xl">
                                <p className="text-green-600 font-medium mb-2">Plano Carregado</p>
                                <a
                                    href={`http://localhost:3000${training.planFileUrl}`}
                                    target="_blank"
                                    className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                                >
                                    <FiDownload /> Ver Documento
                                </a>
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-400 mb-2">Substituir ficheiro:</p>
                                    <input type="file" onChange={handleFileUpload} disabled={uploading} className="hidden" id="replace-upload" />
                                    <label htmlFor="replace-upload" className="cursor-pointer text-xs bg-gray-100 px-3 py-1 rounded text-gray-600 hover:bg-gray-200">Escolher novo</label>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition cursor-pointer relative">
                                <input
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                />
                                <div className="mb-3 mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                    <FiUpload size={24} />
                                </div>
                                <p className="text-sm font-medium">Carregar Plano</p>
                                <p className="text-xs text-gray-400 mt-1">PDF ou Imagem (Máx. 5MB)</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Medical Registration Modal */}
            {showMedicalModal && currentMedicalPlayer && (
                <MedicalRegistrationModal
                    player={currentMedicalPlayer}
                    currentIndex={playersNeedingMedicalRegistration.findIndex(p => p.id === currentMedicalPlayer.id)}
                    totalPlayers={playersNeedingMedicalRegistration.length}
                    onClose={() => setShowMedicalModal(false)}
                    onSkip={handleMedicalRecordSkip}
                    onConfirm={handleMedicalRecordConfirm}
                />
            )}

            {/* Notice Approval Modal */}
            {noticeToApprove && (
                <NoticeApprovalModal
                    notice={noticeToApprove}
                    onClose={() => setNoticeToApprove(null)}
                    onConfirm={handleConfirmNoticeApproval}
                />
            )}
        </div>
    );
}

