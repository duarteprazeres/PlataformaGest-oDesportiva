'use client';

import React, { useState, useEffect } from 'react';

interface AbsenceNoticeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (type: 'ABSENCE' | 'PRESENCE', reason: string) => Promise<void>;
    trainingTitle: string;
    trainingDate: string;
}

const MEDICAL_KEYWORDS = [
    'lesão', 'lesao', 'dor', 'médico', 'medico', 'hospital',
    'entorse', 'fratura', 'partiu', 'partido', 'febre', 'gripe',
    'indisposto', 'vómitos', 'diarreia', 'trauma', 'bater', 'cair', 'joelho', 'pé'
];

export function AbsenceNoticeModal({ isOpen, onClose, onSubmit, trainingTitle, trainingDate }: AbsenceNoticeModalProps) {
    const [type, setType] = useState<'ABSENCE' | 'PRESENCE'>('ABSENCE');
    const [reason, setReason] = useState('');
    const [showMedicalWarning, setShowMedicalWarning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setReason('');
            setType('ABSENCE');
            setShowMedicalWarning(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (type === 'ABSENCE') {
            const lowerReason = reason.toLowerCase();
            const hasKeyword = MEDICAL_KEYWORDS.some(keyword => lowerReason.includes(keyword));
            setShowMedicalWarning(hasKeyword);
        } else {
            setShowMedicalWarning(false);
        }
    }, [reason, type]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(type, reason);
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg">Aviso para Treino</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-4 bg-slate-50 p-3 rounded text-sm text-slate-600">
                        <p><strong>{trainingTitle}</strong></p>
                        <p>{trainingDate}</p>
                    </div>

                    <div className="mb-6 flex gap-2 p-1 bg-slate-100 rounded-lg">
                        <button
                            type="button"
                            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${type === 'ABSENCE' ? 'bg-white shadow text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => setType('ABSENCE')}
                        >
                            Ausência / Atraso
                        </button>
                        <button
                            type="button"
                            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${type === 'PRESENCE' ? 'bg-white shadow text-green-600' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => setType('PRESENCE')}
                        >
                            Confirmar Presença
                        </button>
                    </div>

                    {type === 'ABSENCE' ? (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Motivo da Ausência <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                                placeholder="Por favor explique o motivo..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />

                            {showMedicalWarning && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-3 animate-in fade-in slide-in-from-top-2">
                                    <div className="text-red-500 text-xl">🏥</div>
                                    <div className="text-sm">
                                        <p className="font-semibold text-red-800">Assunto Médico Detectado</p>
                                        <p className="text-red-600 mt-1">
                                            Parece que se trata de uma lesão ou doença. Esta informação será partilhada com o <strong>Departamento Médico</strong> do clube.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="mb-6 text-center py-4">
                            <div className="text-4xl mb-2">✅</div>
                            <p className="text-slate-600">Vou comparecer ao treino!</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`px-6 py-2 text-white font-semibold rounded-lg shadow-sm transition-colors ${type === 'ABSENCE'
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-green-600 hover:bg-green-700'
                                } disabled:opacity-50`}
                        >
                            {isSubmitting ? 'A enviar...' : 'Enviar Aviso'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
