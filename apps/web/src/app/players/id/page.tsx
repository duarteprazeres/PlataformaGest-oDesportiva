'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { GlobalApi } from '@/lib/api-global'; // ou api.ts se for para clubes
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import styles from './page.module.css';

interface Athlete {
  id: string;
  publicId: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  citizenCard: string;
  taxId: string;
  passportUrl?: string;
}

interface Player {
  id: string;
  jerseyNumber?: number;
  teamId?: string;
  teamName?: string;
  status: string;
  joinDate: string;
}

export default function PlayerProfile() {
  const params = useParams();
  const playerId = params.id as string;
  
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlayerProfile();
  }, [playerId]);

  const fetchPlayerProfile = async () => {
    try {
      setLoading(true);
      // Fetch atleta e player dados
      const [athleteData, playerData] = await Promise.all([
        GlobalApi.getAthleteById(playerId), // ajusta conforme a API
        GlobalApi.getPlayerById(playerId),
      ]);
      
      setAthlete(athleteData);
      setPlayer(playerData);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Carregando perfil...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.playerInfo}>
          <h1>{athlete?.firstName} {athlete?.lastName}</h1>
          <Badge>{player?.teamName || 'Sem equipa'}</Badge>
          <Badge variant="secondary">#{player?.jerseyNumber || 'N/A'}</Badge>
        </div>
        <div className={styles.actions}>
          <Button>Editar Dados</Button>
          <Button variant="outline">Ver Histórico</Button>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h3>Dados Pessoais</h3>
          <p><strong>ID Público:</strong> {athlete?.publicId}</p>
          <p><strong>Data Nascimento:</strong> {athlete?.birthDate}</p>
          <p><strong>Cartão Cidadão:</strong> {athlete?.citizenCard}</p>
          <p><strong>NIF:</strong> {athlete?.taxId}</p>
        </div>

        <div className={styles.card}>
          <h3>Clubístico</h3>
          <p><strong>Equipa:</strong> {player?.teamName || 'Por atribuir'}</p>
          <p><strong>Número:</strong> #{player?.jerseyNumber || 'Por atribuir'}</p>
          <p><strong>Estado:</strong> <Badge>{player?.status}</Badge></p>
          <p><strong>Data Entrada:</strong> {player?.joinDate}</p>
        </div>

        <div className={styles.card}>
          <h3>Documentos</h3>
          {athlete?.passportUrl ? (
            <a href={athlete.passportUrl} target="_blank">Ver Passaporte</a>
          ) : (
            <p>Sem passaporte registado</p>
          )}
        </div>
      </div>
    </div>
  );
}

