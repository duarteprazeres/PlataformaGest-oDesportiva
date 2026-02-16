import React from 'react';
import { Users, Calendar, Trophy } from 'lucide-react';
import styles from './TeamCard.module.css';

interface Team {
    id: string;
    name: string;
    category: string;
    season: any; // Can be string (legacy) or object
    gender: string;
    _count?: {
        players: number;
    };
}

interface TeamCardProps {
    team: Team;
}

export const TeamCard: React.FC<TeamCardProps> = ({ team }) => {
    // Helper to get season name safely
    const seasonName = typeof team.season === 'string' ? team.season : team.season?.name || 'Unknown Season';

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div className={styles.iconWrapper}>
                    {/* Placeholder for Team Logo or Initials */}
                    {team.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                    <h3 className={styles.name}>{team.name}</h3>
                    <span className={styles.category}>{team.category} • {team.gender}</span>
                </div>
            </div>

            <div className={styles.stats}>
                <div className={styles.statItem}>
                    <Users size={16} className={styles.statIcon} />
                    <span>{team._count?.players || 0} Players</span>
                </div>
                <div className={styles.statItem}>
                    <Calendar size={16} className={styles.statIcon} />
                    <span>{seasonName}</span>
                </div>
            </div>

            <div className={styles.actions}>
                <button className={styles.viewBtn}>Manage Team</button>
            </div>
        </div>
    );
};
