'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

type AttendanceStatus = 'present' | 'absent' | 'justified';
type PlayerStatus = 'active' | 'injured' | 'suspended' | 'loaned';
type Team = { id: string; name: string };

type Player = {
  id: string;
  name: string;
  birthDate: string;
  nationality: string;
  number: number;
  position: string;
  team: Team;
  status: PlayerStatus;
  height: number;
  weight: number;
  foot: 'Direito' | 'Esquerdo' | 'Ambos';
  stats: {
    games: number; goals: number; assists: number;
    yellowCards: number; redCards: number; minutesPlayed: number;
  };
  attendance: {
    totalSessions: number; attended: number;
    missed: number; justified: number;
    lastMonthRate: number; streak: number;
    log: AttendanceStatus[];
  };
  guardian: {
    name: string; relation: string;
    phone: string; email: string; altPhone?: string;
  };
};

const clubTeams: Team[] = [
  { id: '1', name: 'Sénior A' },
  { id: '2', name: 'Sénior B' },
  { id: '3', name: 'Sub-23' },
  { id: '4', name: 'Sub-19' },
  { id: '5', name: 'Sub-17' },
  { id: '6', name: 'Sub-15' },
];



const statusConfig: Record<PlayerStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'Activo', color: '#16a34a', bg: '#f0fdf4' },
  injured: { label: 'Lesionado', color: '#dc2626', bg: '#fef2f2' },
  suspended: { label: 'Suspenso', color: '#ea580c', bg: '#fff7ed' },
  loaned: { label: 'Cedido', color: '#4f46e5', bg: '#eef2ff' },
};

const positionColors: Record<string, string> = {
  'Guarda-Redes': '#d97706',
  'Defesa Central': '#2563eb',
  'Defesa Lateral': '#2563eb',
  'Médio Defensivo': '#059669',
  'Médio': '#059669',
  'Médio Ofensivo': '#059669',
  'Extremo': '#7c3aed',
  'Avançado': '#dc2626',
};

function calcAge(d: string) {
  const today = new Date(), birth = new Date(d);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
}

/* ─── Card ─── */
function Card({ title, children, span }: { title: string; children: React.ReactNode; span?: boolean }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '1rem',
      border: '1px solid #f1f5f9',
      boxShadow: '0 1px 12px rgba(0,0,0,0.05)',
      overflow: 'hidden',
      gridColumn: span ? '1 / -1' : undefined,
    }}>
      <div style={{ padding: '1.1rem 1.5rem 0.5rem' }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '0.25rem 1.5rem 1.5rem' }}>{children}</div>
    </div>
  );
}

/* ─── Info Row ─── */
function InfoRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.55rem 0', borderBottom: '1px solid #f8fafc',
    }}>
      <span style={{ fontSize: '0.81rem', color: '#94a3b8' }}>{label}</span>
      <span style={{ fontSize: '0.87rem', fontWeight: 600, color: accent || '#1e293b' }}>{value}</span>
    </div>
  );
}

/* ─── Stat Bar ─── */
function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: '0.85rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{label}</span>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b' }}>{value}</span>
      </div>
      <div style={{ height: 5, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4 }} />
      </div>
    </div>
  );
}

/* ─── Attendance Grid ─── */
function AttendanceGrid({ log }: { log: AttendanceStatus[] }) {
  const COLOR: Record<AttendanceStatus, string> = {
    present: '#16a34a',
    absent: '#dc2626',
    justified: '#f59e0b',
  };
  const COLS = 16;
  const ROWS = 3;

  return (
    <div>
      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: '0.6rem' }}>
        Últimas 16 semanas · 3 sessões/semana
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gridTemplateRows: `repeat(${ROWS}, 14px)`,
        gridAutoFlow: 'column',
        gap: '4px',
      }}>
        {log.slice(0, COLS * ROWS).map((s, i) => (
          <div key={i} style={{ borderRadius: '3px', background: COLOR[s] }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
        {[
          { label: 'Presença', color: '#16a34a' },
          { label: 'Justificada', color: '#f59e0b' },
          { label: 'Falta', color: '#dc2626' },
        ].map((x) => (
          <div key={x.label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '2px', background: x.color }} />
            <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{x.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Edit Drawer ─── */
function EditDrawer({ player, teams, onSave, onClose }: {
  player: Player;
  teams: Team[];
  onSave: (updates: Partial<Player>) => void;
  onClose: () => void;
}) {
  const [number, setNumber] = useState(player.number);
  const [teamId, setTeamId] = useState(player.team.id);
  const [status, setStatus] = useState<PlayerStatus>(player.status);

  const btnBase: React.CSSProperties = {
    border: 'none', borderRadius: '50%', cursor: 'pointer',
    width: 40, height: 40, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '1.4rem', fontWeight: 300,
    background: 'rgba(255,255,255,0.07)',
    color: 'rgba(255,255,255,0.6)',
  };

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(10,16,30,0.7)',
        backdropFilter: 'blur(4px)', zIndex: 100,
      }} />

      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 420, zIndex: 101,
        background: 'linear-gradient(180deg, #0d1930 0%, #0a1020 100%)',
        boxShadow: '-12px 0 60px rgba(0,0,0,0.4)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '2rem 2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.3rem' }}>
                A editar
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{player.name}</div>
            </div>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.45)', width: 36, height: 36,
              borderRadius: '50%', cursor: 'pointer', fontSize: '0.9rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>

          {/* Number */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1.25rem' }}>
              Número de Camisola
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
              <button style={btnBase} onClick={() => setNumber((n) => Math.max(1, n - 1))}>−</button>
              <div style={{
                width: 120, height: 120, borderRadius: '1.25rem',
                background: 'rgba(255,255,255,0.04)',
                border: '2px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'radial-gradient(circle at 50% 0%, rgba(59,130,246,0.12), transparent 70%)',
                }} />
                <span style={{ fontSize: '3.75rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {number}
                </span>
              </div>
              <button style={btnBase} onClick={() => setNumber((n) => Math.min(99, n + 1))}>+</button>
            </div>
          </div>

          {/* Team */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1rem' }}>
              Equipa
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              {teams.map((t) => {
                const sel = teamId === t.id;
                return (
                  <button key={t.id} onClick={() => setTeamId(t.id)} style={{
                    padding: '0.75rem', borderRadius: '0.6rem', cursor: 'pointer',
                    border: sel ? '2px solid #3b82f6' : '2px solid rgba(255,255,255,0.07)',
                    background: sel ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                    color: sel ? '#93c5fd' : 'rgba(255,255,255,0.4)',
                    fontSize: '0.88rem', fontWeight: sel ? 700 : 500,
                    textAlign: 'center',
                  }}>
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status */}
          <div>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1rem' }}>
              Estado
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(Object.entries(statusConfig) as [PlayerStatus, typeof statusConfig[PlayerStatus]][]).map(([key, cfg]) => {
                const sel = status === key;
                return (
                  <button key={key} onClick={() => setStatus(key)} style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '0.85rem 1rem', borderRadius: '0.7rem', cursor: 'pointer',
                    border: sel ? `1.5px solid ${cfg.color}66` : '1.5px solid rgba(255,255,255,0.05)',
                    background: sel ? `${cfg.color}18` : 'rgba(255,255,255,0.02)',
                    textAlign: 'left',
                  }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: cfg.color, flexShrink: 0,
                      boxShadow: sel ? `0 0 10px ${cfg.color}99` : 'none',
                    }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: sel ? cfg.color : 'rgba(255,255,255,0.35)' }}>
                      {cfg.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.25rem 2rem 2.5rem',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', gap: '0.75rem',
        }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '0.85rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '0.65rem', color: 'rgba(255,255,255,0.4)',
            fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
          }}>
            Cancelar
          </button>
          <button onClick={() => {
            onSave({ number, team: teams.find((t) => t.id === teamId)!, status });
          }} style={{
            flex: 2, padding: '0.85rem',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            border: 'none', borderRadius: '0.65rem', color: '#fff',
            fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(59,130,246,0.35)',
          }}>
            Guardar Alterações
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Main Page ─── */
export default function PlayerProfile() {
  const params = useParams();
  const playerId = params.id as string;
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!playerId) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/athletes/${playerId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    })
      .then(res => { if (!res.ok) throw new Error('Não encontrado'); return res.json(); })
      .then(data => {
        setPlayer({
          id: data.id,
          name: `${data.firstName} ${data.lastName}`,
          birthDate: data.birthDate || '',
          nationality: data.nationality || 'Portuguesa',
          number: data.jerseyNumber || 0,
          position: data.position || data.category || '',
          team: data.currentTeam ? { id: data.currentTeam.id || '1', name: data.currentTeam.name } : { id: '1', name: '' },
          status: (data.status?.toLowerCase() as PlayerStatus) || 'active',
          height: data.height || 0,
          weight: data.weight || 0,
          foot: data.foot || 'Direito',
          stats: data.stats || { games: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, minutesPlayed: 0 },
          attendance: data.attendance || { totalSessions: 0, attended: 0, missed: 0, justified: 0, lastMonthRate: 0, streak: 0, log: [] },
          guardian: data.guardian || { name: '', relation: '', phone: '', email: '' },
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [playerId]);

  if (loading || !player) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'system-ui' }}>
      A carregar...
    </div>
  );


  const status = statusConfig[player.status];
  const posColor = positionColors[player.position] || '#4f46e5';
  const initials = player.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const overallRate = Math.round((player.attendance.attended / player.attendance.totalSessions) * 100);
  const rateColor = overallRate >= 85 ? '#16a34a' : overallRate >= 70 ? '#ea580c' : '#dc2626';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem' }}>

        {/* ── Banner ── */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          borderRadius: '1.5rem', marginBottom: '1.75rem',
          background: 'linear-gradient(140deg, #0c1426 0%, #142040 45%, #0c1830 100%)',
          boxShadow: '0 12px 56px rgba(10,18,40,0.3)',
        }}>

          {/* Top accent */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: `linear-gradient(90deg, ${posColor} 0%, ${posColor}44 60%, transparent 100%)`,
          }} />

          {/* Number watermark */}
          <div style={{
            position: 'absolute', right: '-1rem', top: '-2rem',
            fontSize: '22rem', fontWeight: 900, lineHeight: 1,
            color: 'rgba(255,255,255,0.025)',
            userSelect: 'none', pointerEvents: 'none', letterSpacing: '-0.04em',
          }}>
            {player.number}
          </div>

          {/* Radial glow behind avatar */}
          <div style={{
            position: 'absolute', left: '2rem', top: '50%',
            transform: 'translateY(-50%)',
            width: 200, height: 200, borderRadius: '50%',
            background: `radial-gradient(circle, ${posColor}22 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', padding: '2.25rem 2.5rem 2rem', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>

            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <svg width={110} height={110} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
                <circle cx={55} cy={55} r={50} fill="none" stroke={`${posColor}33`} strokeWidth={3} />
                <circle cx={55} cy={55} r={50} fill="none" stroke={posColor} strokeWidth={3}
                  strokeDasharray={`${(overallRate / 100) * 2 * Math.PI * 50} ${2 * Math.PI * 50}`}
                  strokeLinecap="round" />
              </svg>
              <div style={{
                position: 'relative', top: 7, left: 7,
                width: 96, height: 96, borderRadius: '50%',
                background: `linear-gradient(135deg, ${posColor}, ${posColor}aa)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', fontWeight: 800, color: '#fff',
                boxShadow: `0 8px 32px ${posColor}55`,
              }}>
                {initials}
              </div>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
                  {player.name}
                </h1>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'rgba(255,255,255,0.12)' }}>
                  #{player.number}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.7rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{
                  background: posColor, color: '#fff',
                  padding: '0.28rem 0.75rem', borderRadius: '0.35rem',
                  fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>{player.position}</span>
                <span style={{
                  background: `${status.color}22`, color: status.color,
                  border: `1px solid ${status.color}44`,
                  padding: '0.28rem 0.75rem', borderRadius: '0.35rem',
                  fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: status.color, display: 'inline-block' }} />
                  {status.label}
                </span>
                <span style={{
                  background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)',
                  padding: '0.28rem 0.75rem', borderRadius: '0.35rem',
                  fontSize: '0.7rem', fontWeight: 600,
                }}>{player.team.name}</span>
              </div>

              <div style={{ display: 'flex', gap: '2.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                {[
                  { label: 'Nascimento', value: formatDate(player.birthDate) },
                  { label: 'Idade', value: `${calcAge(player.birthDate)} anos` },
                  { label: 'Altura', value: `${player.height} cm` },
                  { label: 'Peso', value: `${player.weight} kg` },
                  { label: 'Pé', value: player.foot },
                ].map((x) => (
                  <div key={x.label}>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>
                      {x.label}
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{x.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setEditOpen(true)} style={{
              flexShrink: 0,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.13)',
              color: 'rgba(255,255,255,0.75)', borderRadius: '0.6rem',
              padding: '0.6rem 1.35rem', fontSize: '0.85rem',
              fontWeight: 600, cursor: 'pointer',
            }}>
              Editar
            </button>
          </div>

          {/* Stats bar */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(0,0,0,0.3)',
          }}>
            {[
              { label: 'Jogos', value: player.stats.games },
              { label: 'Golos', value: player.stats.goals },
              { label: 'Assistências', value: player.stats.assists },
              { label: 'Amarelos', value: player.stats.yellowCards },
              { label: 'Vermelhos', value: player.stats.redCards },
              { label: 'Minutos', value: player.stats.minutesPlayed },
            ].map((s, i, arr) => (
              <div key={s.label} style={{
                padding: '1rem 0', textAlign: 'center',
                borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>{s.value}</div>
                <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.15rem' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

          {/* Attendance — full width */}
          <Card title="Assiduidade e Presenças" span>
            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '2.5rem', alignItems: 'start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '3.25rem', fontWeight: 900, color: rateColor, lineHeight: 1 }}>{overallRate}%</span>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>taxa global</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
                  {player.attendance.attended} de {player.attendance.totalSessions} sessões — época 2024/25
                </div>
                <StatBar label="Presenças" value={player.attendance.attended} max={player.attendance.totalSessions} color="#16a34a" />
                <StatBar label="Faltas Justificadas" value={player.attendance.justified} max={player.attendance.totalSessions} color="#f59e0b" />
                <StatBar label="Faltas Injustificadas" value={player.attendance.missed} max={player.attendance.totalSessions} color="#dc2626" />
                <div style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#f0fdf4', borderRadius: '0.5rem', padding: '0.5rem 0.8rem' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#16a34a' }}>{player.attendance.streak}</span>
                  <span style={{ fontSize: '0.72rem', color: '#4ade80', fontWeight: 600 }}>treinos consecutivos</span>
                </div>
              </div>
              <AttendanceGrid log={player.attendance.log} />
            </div>
          </Card>

          {/* Personal */}
          <Card title="Informações Pessoais">
            <InfoRow label="Data de Nascimento" value={formatDate(player.birthDate)} />
            <InfoRow label="Idade" value={`${calcAge(player.birthDate)} anos`} />
            <InfoRow label="Nacionalidade" value={player.nationality} />
            <InfoRow label="Altura" value={`${player.height} cm`} />
            <InfoRow label="Peso" value={`${player.weight} kg`} />
            <InfoRow label="Pé Dominante" value={player.foot} />
          </Card>

          {/* Guardian */}
          <Card title="Encarregado de Educação">
            <InfoRow label="Nome" value={player.guardian.name} />
            <InfoRow label="Relação" value={player.guardian.relation} />
            <InfoRow label="Telemóvel" value={player.guardian.phone} />
            {player.guardian.altPhone && (
              <InfoRow label="Contacto Alternativo" value={player.guardian.altPhone} />
            )}
            <InfoRow label="Email" value={player.guardian.email} />
          </Card>

        </div>
      </div>

      {editOpen && (
        <EditDrawer
          player={player}
          teams={clubTeams}
          onSave={(updates) => {
            setPlayer((p) => p ? { ...p, ...updates } : null);
            setEditOpen(false);
          }}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}
