export class CurrentClubDto {
    athleteId!: string;
    athleteName!: string;

    // Club info
    clubId?: string;
    clubName?: string;
    clubLogoUrl?: string;
    teamName?: string;

    // Player status
    status!: 'ACTIVE' | 'PENDING_WITHDRAWAL' | 'LEFT' | 'FREE_AGENT';
    withdrawalRequestedAt?: Date;
    coolOffEndsAt?: Date;
    hoursRemaining?: number;
}
