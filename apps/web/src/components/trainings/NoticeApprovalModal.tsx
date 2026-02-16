import { useState, useEffect } from 'react';
import { FiThumbsUp } from 'react-icons/fi';

interface NoticeApprovalModalProps {
    notice: {
        id: string;
        reason: string;
    };
    onClose: () => void;
    onConfirm: (createInjury: boolean, injuryData?: any) => Promise<void>;
}

export default function NoticeApprovalModal({ notice, onClose, onConfirm }: NoticeApprovalModalProps) {
    const [medicalFormData, setMedicalFormData] = useState({
        name: '',
        description: '',
        severity: 'MODERATE' as 'MILD' | 'MODERATE' | 'SEVERE',
        estimatedRecoveryDays: 7
    });

    useEffect(() => {
        setMedicalFormData(prev => ({
            ...prev,
            description: notice.reason
        }));
    }, [notice]);

    const handleConfirm = (createInjury: boolean) => {
        if (createInjury) {
            onConfirm(true, {
                name: medicalFormData.name,
                description: medicalFormData.description,
                severity: medicalFormData.severity,
                estimatedRecoveryDays: medicalFormData.estimatedRecoveryDays
            });
        } else {
            onConfirm(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <FiThumbsUp className="text-blue-600" size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Aprovar Ausência</h3>
                        <p className="text-sm text-gray-500">
                            Detetámos questões médicas na justificação.
                        </p>
                    </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-yellow-800">
                        <strong>Justificação:</strong> "{notice.reason}"
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
                            placeholder="Ex: Entorse no Tornozelo"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium block mb-1">Descrição</label>
                        <textarea
                            value={medicalFormData.description}
                            onChange={(e) => setMedicalFormData({ ...medicalFormData, description: e.target.value })}
                            rows={2}
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
                        onClick={() => handleConfirm(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                    >
                        Aprovar (Sem Lesão)
                    </button>
                    <button
                        onClick={() => handleConfirm(true)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                        Aprovar + Criar Lesão
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
}
