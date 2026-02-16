export const MEDICAL_KEYWORDS = [
    'lesão', 'lesao', 'lesionado', 'lesionada',
    'doente', 'doença', 'doenca',
    'dor', 'dores',
    'entorse', 'fratura', 'rutura', 'rutura', 'luxação', 'luxacao',
    'febre', 'gripe', 'constipação', 'constipacao',
    'contusão', 'contusao', 'traumatismo',
    'torção', 'torcao', 'distensão', 'distensao',
    'inflamação', 'inflamacao', 'tendinite',
    'joelho', 'tornozelo', 'pé', 'pe', 'ombro', 'costas', 'coxa'
];

export const detectMedicalIssue = (text: string): boolean => {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return MEDICAL_KEYWORDS.some(keyword => lowerText.includes(keyword));
};
