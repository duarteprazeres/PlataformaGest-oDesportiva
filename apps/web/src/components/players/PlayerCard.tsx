import React, { useState } from 'react';
import { User, Shield, Phone, Calendar, XCircle } from 'lucide-react';
import WithdrawalModal from '../WithdrawalModal';
import styles from './PlayerCard.module.css';
import Link from "next/link";

interface Player {
    id: string;
    firstName: string;
    lastName: string;
    category: string;
    status?: string;
    currentTeam?: {
        name: string;
    };
    gender?: string;
    birthDate?: string;
    jerseyNumber?: number;
}

interface PlayerCardProps {
    player: Player;
    onUpdate?: () => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, onUpdate }) => {
    const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

    const getStatusBadge = () => {
        if (player.status === 'PENDING_WITHDRAWAL') {
            return <span className={styles.statusBadge} style={{ background: '#f59e0b' }}>Pedido de Rescisão</span>;
        }
        if (player.status === 'LEFT') {
            return <span className={styles.statusBadge} style={{ background: '#6b7280' }}>Desvinculado</span>;
        }
        return null;
    };

    return (
        <>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.avatar}>
                        {player.firstName.charAt(0)}{player.lastName.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 className={styles.name}>{player.firstName} {player.lastName}</h3>
                        <span className={styles.detail}>
                            {player.currentTeam ? player.currentTeam.name : 'No Team'} • #{player.jerseyNumber || '-'}
                        </span>
                        {getStatusBadge()}
                    </div>
                </div>

                <div className={styles.stats}>
                    <div className={styles.statItem}>
                        <User size={14} className={styles.statIcon} />
                        <span>{player.gender || 'N/A'}</span>
                    </div>
                    <div className={styles.statItem}>
                        <Calendar size={14} className={styles.statIcon} />
                        <span>{player.birthDate ? new Date(player.birthDate).getFullYear() : 'N/A'}</span>
                    </div>
                </div>

                <div className={styles.actions}>
                    <Link href={`/players/${player.id}`} className={styles.viewBtn}>
                        View Profile
                    </Link>
                    {player.status !== 'LEFT' && (
                        <button
                            className={styles.withdrawBtn}
                            onClick={() => setShowWithdrawalModal(true)}
                            title="Processar Rescisão"
                        >
                            <XCircle size={16} />
                            Rescisão
                        </button>
                    )}
                </div>
            </div>

            {showWithdrawalModal && (
                <WithdrawalModal
                    player={player}
                    onClose={() => setShowWithdrawalModal(false)}
                    onSuccess={() => {
                        onUpdate?.();
                    }}
                />
            )}
        </>
    );
};
