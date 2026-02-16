export class AthleteStatsDto {
    athleteId!: string;
    athleteName!: string;

    totalMatches!: number;
    totalGoals!: number;
    totalAssists!: number;

    clubsCount!: number;
    teamsCount!: number;

    yearsActive!: number;
    firstRegistration?: Date;
    currentStatus!: 'ACTIVE' | 'PENDING_WITHDRAWAL' | 'LEFT' | 'FREE_AGENT';
}
