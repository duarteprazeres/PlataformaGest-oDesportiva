export interface Player {
    id: string;
    firstName: string;
    lastName: string;
    medicalStatus: 'FIT' | 'INJURED' | 'SICK' | 'CONDITIONED';
    [key: string]: any; // For other properties from the API
}

export interface AbsenceNotice {
    id: string;
    playerId: string;
    type: 'ABSENCE' | 'LATE';
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'DISMISSED';
}

export interface AttendanceRecord {
    playerId: string;
    status: 'PRESENT' | 'ABSENT' | 'JUSTIFIED_ABSENT' | null;
    justification?: string;
}

export interface Training {
    id: string;
    team: {
        id: string;
        name: string;
        players: Player[];
    };
    scheduledDate: string;
    startTime: string;
    endTime: string;
    location: string;
    isFinalized: boolean;
    planFileUrl?: string;
    attendance?: AttendanceRecord[];
    absenceNotices?: AbsenceNotice[];
}
