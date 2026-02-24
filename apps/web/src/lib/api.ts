export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
    const headers: any = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${response.statusText}`);
    }

    return response.json();
}

export async function finalizeMatch(matchId: string, data: { result: string, goalsFor: number, goalsAgainst: number, notes?: string }) {
    return fetchApi(`/matches/${matchId}/finalize`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateCallupStats(matchId: string, playerId: string, data: any) {
    return fetchApi(`/matches/${matchId}/callups/${playerId}/stats`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export async function createTraining(data: FormData) {
    return fetchApi('/trainings', {
        method: 'POST',
        body: data,
    });
}

export async function getClubAbsenceNotices(status?: string) {
    const query = status ? `?status=${status}` : '';
    return fetchApi(`/absence-notices/club${query}`);
}

export async function approveAbsenceNotice(id: string, data: { reviewNotes?: string, createInjury?: boolean, injuryData?: any }) {
    return fetchApi(`/absence-notices/${id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export async function dismissAbsenceNotice(id: string, data: { reviewNotes?: string }) {
    return fetchApi(`/absence-notices/${id}/dismiss`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}


export async function lookupAthlete(params: { publicId?: string, citizenCard?: string, taxId?: string }) {
    const query = new URLSearchParams();
    if (params.publicId) query.append('publicId', params.publicId);
    if (params.citizenCard) query.append('citizenCard', params.citizenCard);
    if (params.taxId) query.append('taxId', params.taxId);

    return fetchApi(`/athletes/search?${query.toString()}`);
}

export async function requestTransfer(publicId: string) {
    return fetchApi('/athletes/request-transfer', {
        method: 'POST',
        body: JSON.stringify({ publicId }),
    });
}

export async function getNotifications(query?: { limit?: number; offset?: number; isRead?: boolean }) {
    const params = new URLSearchParams();
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.offset) params.append('offset', query.offset.toString());
    if (query?.isRead !== undefined) params.append('isRead', query.isRead.toString());
    return fetchApi(`/notifications?${params.toString()}`);
}

export async function getUnreadNotificationCount() {
    return fetchApi('/notifications/unread-count');
}

export async function markNotificationRead(id: string) {
    return fetchApi(`/notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsRead() {
    return fetchApi('/notifications/mark-all-read', { method: 'PATCH' });
}

export async function terminatePlayerLink(playerId: string, data: {
    reason: string;
    withdrawalLetterUrl?: string;
    destinationClubEmail?: string;
    sendEmail?: boolean;
}) {
    return fetchApi(`/athletes/players/${playerId}/terminate`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

// Global API object for clients that expect it (backward compatibility if needed, else remove)
export const GlobalApi = {
    getMyAthletes: async () => fetchApi('/athletes/my-athletes'),
    getCurrentClub: async (athleteId: string) => fetchApi(`/athletes/${athleteId}/current-club`),
    getAthleteStats: async (athleteId: string) => fetchApi(`/athletes/${athleteId}/stats`),
    getAthleteHistory: async (athleteId: string) => fetchApi(`/athletes/${athleteId}/history`),
    getUpcomingTrainings: async (athleteId: string) => fetchApi(`/athletes/${athleteId}/trainings/upcoming`),
    submitAbsenceNotice: async (data: any) => fetchApi('/absence-notices', { method: 'POST', body: JSON.stringify(data) }),
    requestWithdrawal: async (athleteId: string) => fetchApi(`/athletes/${athleteId}/withdrawal`, { method: 'POST' }),
    cancelWithdrawal: async (athleteId: string) => fetchApi(`/athletes/${athleteId}/withdrawal`, { method: 'DELETE' }),
    createPassport: async (data: any) => fetchApi('/athletes/passport', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => { /* Handle logout client side mostly */ }
};

export async function getPlayer(id: string) {
    return fetchApi(`/players/${id}`);
}

export async function updatePlayer(id: string, data: { jerseyNumber?: number; currentTeamId?: string; status?: string }) {
    return fetchApi(`/players/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}


export async function uploadPlayerPhoto(id: string, file: File) {
    const formData = new FormData();
    formData.append('photo', file);
    return fetchApi(`/players/${id}/photo`, {
        method: 'POST',
        body: formData,
    });
}

export async function getClubTeams() {
    return fetchApi('/teams');
}
