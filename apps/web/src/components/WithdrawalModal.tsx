'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { terminatePlayerLink } from '@/lib/api';
import { toast } from 'sonner';

interface WithdrawalModalProps {
    player: {
        id: string;
        firstName: string;
        lastName: string;
        status?: string;
    };
    onClose: () => void;
    onSuccess: () => void;
}

export default function WithdrawalModal({ player, onClose, onSuccess }: WithdrawalModalProps) {
    const [reason, setReason] = useState('');
    const [destinationClubEmail, setDestinationClubEmail] = useState('');
    const [withdrawalLetterUrl, setWithdrawalLetterUrl] = useState('');
    const [sendEmail, setSendEmail] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!reason.trim()) {
            toast.error('Por favor, indique o motivo da rescisão');
            return;
        }

        if (sendEmail && !destinationClubEmail.trim()) {
            toast.error('Por favor, indique o email do clube de destino');
            return;
        }

        setLoading(true);
        try {
            await terminatePlayerLink(player.id, {
                reason,
                withdrawalLetterUrl: withdrawalLetterUrl.trim() || undefined,
                destinationClubEmail: destinationClubEmail.trim() || undefined,
                sendEmail
            });

            toast.success('Rescisão processada com sucesso');
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Erro ao processar rescisão');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Rescisão de Atleta</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {player.firstName} {player.lastName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Warning if PENDING_WITHDRAWAL */}
                    {player.status === 'PENDING_WITHDRAWAL' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-800">
                                ⚠️ Este atleta já solicitou rescisão via Portal dos Pais.
                                Ao finalizar, a rescisão será efetivada.
                            </p>
                        </div>
                    )}

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Motivo da Rescisão <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Ex: Mudança de residência, transferência para outro clube..."
                            required
                        />
                    </div>

                    {/* Withdrawal Letter URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            URL da Carta de Desvinculação
                        </label>
                        <input
                            type="url"
                            value={withdrawalLetterUrl}
                            onChange={(e) => setWithdrawalLetterUrl(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="https://storage.example.com/carta_123.pdf"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            URL do documento armazenado no sistema de ficheiros
                        </p>
                    </div>

                    {/* Send Email Checkbox */}
                    <div className="flex items-start">
                        <input
                            type="checkbox"
                            id="sendEmail"
                            checked={sendEmail}
                            onChange={(e) => setSendEmail(e.target.checked)}
                            className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <label htmlFor="sendEmail" className="ml-3">
                            <span className="block text-sm font-medium text-gray-700">
                                Enviar documentação por email para o novo clube
                            </span>
                            <span className="block text-xs text-gray-500">
                                Envia a Carta de Desvinculação e o Exame Médico (se existir) para o clube de destino
                            </span>
                        </label>
                    </div>

                    {/* Destination Club Email (conditional) */}
                    {sendEmail && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email do Clube de Destino <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={destinationClubEmail}
                                onChange={(e) => setDestinationClubEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="secretariado@novoclube.pt"
                                required={sendEmail}
                            />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300"
                            disabled={loading}
                        >
                            {loading ? 'A processar...' : 'Confirmar Rescisão'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
