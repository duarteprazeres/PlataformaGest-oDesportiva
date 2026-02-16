export class ClubHistoryItemDto {
    clubId!: string;
    clubName!: string;
    teamName?: string;
    joinedAt!: Date;
    leftAt?: Date;
    matchesPlayed!: number;
    goalsScored!: number;
}

export class AthleteHistoryDto {
    athleteId!: string;
    athleteName!: string;
    clubs!: ClubHistoryItemDto[];
    totalClubs!: number;
    totalMatches!: number;
    totalGoals!: number;
}
