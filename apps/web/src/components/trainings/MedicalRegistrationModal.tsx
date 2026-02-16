import { useState, useEffect } from 'react';
import { FiAlertCircle } from 'react-icons/fi';

interface MedicalRegistrationModalProps {
    player: {
        id: string;
        firstName: string;
        lastName: string;
        justification: string;
    };
    currentIndex: number;
    totalPlayers: number;
    onClose: () => void;
    onSkip: () => void;
    onConfirm: (data: any) => Promise<void>;
}

export default function MedicalRegistrationModal({
    player,
    currentIndex,
    totalPlayers,
    onClose,
    onSkip,
    onConfirm
}: MedicalRegistrationModalProps) {
    const [medicalFormData, setMedicalFormData] = useState({
        name: '',
        description: '',
        severity: 'MODERATE' as 'MILD' | 'MODERATE' | 'SEVERE',
        estimatedRecoveryDays: 7
    });

    useEffect(() => {
        setMedicalFormData({
            name: `Possível lesão/doença - ${player.firstName}`,
            description: player.justification,
            severity: 'MODERATE',
            estimatedRecoveryDays: 7
        });
    }, [player]);

    const handleSubmit = () => {
        onConfirm({
            playerId: player.id,
            status: 'INJURED',
            name: medicalFormData.name,
            description: medicalFormData.description,
            severity: medicalFormData.severity,
            startDate: new Date().toISOString(),
            estimatedRecoveryDate: new Date(Date.now() + medicalFormData.estimatedRecoveryDays * 24 * 60 * 60 * 1000).toISOString()
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                        <FiAlertCircle className="text-orange-600" size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Questão Médica Detetada</h3>
                        <p className="text-sm text-gray-500">
                            {player.firstName} {player.lastName}
                        </p>
                    </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-yellow-800">
                        <strong>Justificação:</strong> "{player.justification}"
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                        Detetámos palavras-chave médicas. Quer registar no Departamento Médico?
                    </p>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="text-sm font-medium block mb-1">Nome da Lesão/Doença</label>
                        <input
                            type="text"
                            value={medicalFormData.name}
                            onChange={(e) => setMedicalFormData({ ...medicalFormData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium block mb-1">Descrição</label>
                        <textarea
                            value={medicalFormData.description}
                            onChange={(e) => setMedicalFormData({ ...medicalFormData, description: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium block mb-1">Gravidade</label>
                            <select
                                value={medicalFormData.severity}
                                onChange={(e) => setMedicalFormData({ ...medicalFormData, severity: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                                <option value="MILD">Leve</option>
                                <option value="MODERATE">Moderada</option>
                                <option value="SEVERE">Grave</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-1">Recuperação (dias)</label>
                            <input
                                type="number"
                                value={medicalFormData.estimatedRecoveryDays}
                                onChange={(e) => setMedicalFormData({ ...medicalFormData, estimatedRecoveryDays: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 mt-6">
                    <button
                        onClick={onSkip}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                    >
                        Saltar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                        Registar no Dept. Médico
                    </button>
                </div>

                {totalPlayers > 1 && (
                    <p className="text-xs text-center text-gray-500 mt-3">
                        {currentIndex + 1} de {totalPlayers}
                    </p>
                )}
            </div>
        </div>
    );
}
