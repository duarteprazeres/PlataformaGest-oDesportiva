import { API_URL } from './api';

const GLOBAL_TOKEN_KEY = 'global_auth_token';

// Helper for Global Auth headers
function getGlobalHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem(GLOBAL_TOKEN_KEY) : null;
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
    };
}

export const GlobalApi = {
    // Auth
    async register(data: any) {
        const response = await fetch(`${API_URL}/auth/global/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Registration failed');
        }
        return response.json();
    },

    async login(data: any) {
        const response = await fetch(`${API_URL}/auth/global/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Login failed');
        const resData = await response.json();
        // Save token
        if (typeof window !== 'undefined' && resData.access_token) {
            localStorage.setItem(GLOBAL_TOKEN_KEY, resData.access_token);
        }
        return resData;
    },

    logout() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(GLOBAL_TOKEN_KEY);
        }
    },

    // Athletes
    async createPassport(data: any) {
        const response = await fetch(`${API_URL}/athletes`, {
            method: 'POST',
            headers: getGlobalHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create passport');
        return response.json();
    },

    async getMyAthletes() {
        const response = await fetch(`${API_URL}/athletes/my-athletes`, {
            method: 'GET',
            headers: getGlobalHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch athletes');
        return response.json();
    },

    // Transfer Requests (Parent View)
    // Note: We need an endpoint to LIST pending requests for the parent.
    // I missed creating a "Get My Requests" endpoint in the backend.
    // For now, we will just implement what we have.

    async approveTransfer(requestId: string) {
        const response = await fetch(`${API_URL}/athletes/transfers/${requestId}/approve`, {
            method: 'PATCH',
            headers: getGlobalHeaders(),
        });
        if (!response.ok) throw new Error('Failed to approve transfer');
        return response.json();
    },

    // Athlete Details
    async getAthleteHistory(athleteId: string) {
        const response = await fetch(`${API_URL}/athletes/${athleteId}/history`, {
            method: 'GET',
            headers: getGlobalHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch history');
        return response.json();
    },

    async getCurrentClub(athleteId: string) {
        const response = await fetch(`${API_URL}/athletes/${athleteId}/current-club`, {
            method: 'GET',
            headers: getGlobalHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch current club');
        return response.json();
    },

    async getAthleteStats(athleteId: string) {
        const response = await fetch(`${API_URL}/athletes/${athleteId}/stats`, {
            method: 'GET',
            headers: getGlobalHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch stats');
        return response.json();
    },

    // Withdrawal Management
    async requestWithdrawal(athleteId: string) {
        const response = await fetch(`${API_URL}/athletes/${athleteId}/request-withdrawal`, {
            method: 'POST',
            headers: getGlobalHeaders(),
        });
        if (!response.ok) throw new Error('Failed to request withdrawal');
        return response.json();
    },

    async cancelWithdrawal(athleteId: string) {
        const response = await fetch(`${API_URL}/athletes/${athleteId}/cancel-withdrawal`, {
            method: 'POST',
            headers: getGlobalHeaders(),
        });
        if (!response.ok) throw new Error('Failed to cancel withdrawal');
        return response.json();
    },

    // Absence Notices
    async submitAbsenceNotice(data: { athleteId: string, trainingId: string, reason?: string, type?: string }) {
        const response = await fetch(`${API_URL}/absence-notices`, {
            method: 'POST',
            headers: getGlobalHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to submit notice');
        return response.json();
    },

    async getMyAbsenceNotices() {
        const response = await fetch(`${API_URL}/absence-notices/parent`, {
            method: 'GET',
            headers: getGlobalHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch notices');
        return response.json();
    },

    async getUpcomingTrainings(athleteId: string) {
        // We'll need a specialized endpoint for this or use athletes/:id/trainings
        const response = await fetch(`${API_URL}/athletes/${athleteId}/upcoming-trainings`, {
            method: 'GET',
            headers: getGlobalHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch trainings');
        return response.json();
    }
};
