# 🎮 AGENTE 4: TESTING - FEATURES


## 🎯 TAREFAS DETALHADAS

### ✅ TODO 4.1: Testes para Players Module

**Objetivo**: 80%+ coverage em módulo de jogadores

**Por que é Importante**:
- Feature principal da plataforma
- Dados pessoais (GDPR compliance)
- Multi-tenant critical
- Relacionamentos complexos (teams, parents, payments)

**Ficheiros a Criar**:
- `apps/backend/src/modules/players/players.service.spec.ts`
- `apps/backend/src/modules/players/players.controller.spec.ts`

**Setup Base**:
```typescript
describe('PlayersService', () => {
  let service: PlayersService;
  let prisma: PrismaService;
  
  const mockPrismaService = {
    player: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PlayersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();
    
    service = module.get(PlayersService);
    prisma = module.get(PrismaService);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
});
```

**Casos de Teste Obrigatórios**:

**1. Create Player (Happy Path)**:
- ✅ Criar jogador com dados válidos
- ✅ clubId deve ser herdado do user autenticado
- ✅ Status inicial deve ser ACTIVE
- ✅ Deve criar Player + User (parent) em transação
- ✅ Email do parent deve ser único
- ✅ Password do parent deve ser hashed

**2. Create Player (Validation)**:
- ✅ Name obrigatório
- ✅ BirthDate obrigatório e no passado
- ✅ Idade mínima/máxima (ex: 5-18 anos)
- ✅ Email formato válido
- ✅ Phone formato válido (se fornecido)
- ✅ Position deve ser enum válido

**3. Multi-tenant Isolation**:
- ✅ Jogador de Club A não aparece em listagem de Club B
- ✅ Club A não pode atualizar jogador de Club B
- ✅ Club A não pode deletar jogador de Club B
- ✅ findById verifica ownership

**4. Update Player**:
- ✅ Atualizar dados básicos (name, email, phone)
- ✅ Atualizar posição
- ✅ Atualizar foto
- ✅ Não pode mudar clubId
- ✅ Verificar ownership antes de update

**5. Soft Delete Player**:
- ✅ Marca player como deleted (deletedAt)
- ✅ Player deleted não aparece em findMany
- ✅ Player deleted ainda acessível via findById (para histórico)
- ✅ Não remove dados permanentemente

**6. Change Player Status**:
- ✅ ACTIVE → INJURED (válido)
- ✅ INJURED → ACTIVE (válido, recovery)
- ✅ ACTIVE → LEFT (válido, withdrawal)
- ✅ LEFT → ACTIVE (INVÁLIDO, precisa re-registration)

**7. Get Player by ID**:
- ✅ Retorna player com relações (user, team)
- ✅ Retorna null se não existe
- ✅ Verifica ownership (multi-tenant)

**8. List Players (Pagination)**:
- ✅ Retorna lista de players do clube
- ✅ Pagination funciona (skip, take)
- ✅ Filtra por teamId
- ✅ Filtra por status
- ✅ Filtra por ageGroup
- ✅ Não retorna soft-deleted
- ✅ Respeita multi-tenant

**9. Terminate Player Link (Withdrawal)**:
- ✅ Marca status como LEFT
- ✅ Regista withdrawalReason
- ✅ Liberta passaporte (currentClubId = null)
- ✅ Pode enviar email com documentação
- ✅ Regista documentsSentAt se email enviado

**10. Add Player to Team**:
- ✅ Adiciona player a team
- ✅ Verifica team pertence ao mesmo clube
- ✅ Player só pode estar numa team por vez (por época)
- ✅ Cria registo em PlayerTeamHistory

**11. Calculate Player Stats**:
- ✅ Total de jogos jogados
- ✅ Total de golos marcados
- ✅ Taxa de presença em treinos
- ✅ Stats são agregados de múltiplas tabelas

**Exemplo de Teste**:
```typescript
describe('create', () => {
  it('should create player with correct clubId', async () => {
    const createDto = {
      name: 'João Silva',
      birthDate: new Date('2010-05-15'),
      parentEmail: 'parent@example.com',
      parentPhone: '+351912345678',
      position: PlayerPosition.MIDFIELDER,
    };
    
    const mockUser = { id: 'user-123', clubId: 'club-abc' };
    
    prisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
    prisma.player.create = jest.fn().mockResolvedValue({
      id: 'player-1',
      ...createDto,
      clubId: 'club-abc',
      status: PlayerStatus.ACTIVE,
    });
    
    const result = await service.create(createDto, mockUser);
    
    expect(result.clubId).toBe('club-abc');
    expect(result.status).toBe(PlayerStatus.ACTIVE);
    expect(prisma.player.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        clubId: 'club-abc',
      }),
    });
  });
  
  it('should enforce multi-tenant isolation', async () => {
    const mockUser = { id: 'user-123', clubId: 'club-abc' };
    
    prisma.player.findMany = jest.fn().mockResolvedValue([
      { id: 'player-1', clubId: 'club-abc' },
    ]);
    
    const result = await service.findAll(mockUser);
    
    expect(prisma.player.findMany).toHaveBeenCalledWith({
      where: { clubId: 'club-abc', deletedAt: null },
    });
  });
});
```

**Target**: 80%+ coverage

---

### ✅ TODO 4.4: Testes para Training Module

**Objetivo**: 80%+ coverage em módulo de treinos

**Por que é Importante**:
- Feature core da plataforma
- Lock/finalize logic é complexa
- Integração com absence notices
- Attendance tracking

**Ficheiros a Criar**:
- `apps/backend/src/modules/trainings/trainings.service.spec.ts`
- `apps/backend/src/modules/trainings/trainings.controller.spec.ts`

**Casos de Teste Obrigatórios**:

**1. Create Training**:
- ✅ Happy path: criar treino válido
- ✅ clubId deve ser herdado do coach
- ✅ scheduledDate deve ser futura
- ✅ startTime < endTime
- ✅ Coach deve pertencer ao clube
- ✅ Team deve pertencer ao clube
- ✅ Status inicial: isFinalized = false

**2. Update Training**:
- ✅ Atualizar dados básicos (location, objectives)
- ✅ Não pode atualizar se isFinalized = true
- ✅ Pode atualizar exercises (JSON)
- ✅ Pode upload plan file

**3. Finalize Training (Lock)**:
- ✅ Marca isFinalized = true
- ✅ Regista finalizedAt timestamp
- ✅ Regista finalizedByUserId
- ✅ Não pode finalizar training no futuro
- ✅ Não pode finalizar training já finalizado
- ✅ Após finalizar, não pode modificar

**4. Cancel Training**:
- ✅ Marca isCancelled = true
- ✅ Regista cancellationReason
- ✅ Pode cancelar training finalized
- ✅ Não pode "uncancelar"

**5. Mark Attendance**:
- ✅ Marcar player como PRESENT
- ✅ Marcar player como ABSENT
- ✅ Marcar player como LATE
- ✅ Marcar player como JUSTIFIED (com absence notice)
- ✅ Marcar player como INJURED
- ✅ Player deve pertencer à team do training
- ✅ Não pode marcar presença se training não finalizado

**6. Cannot Modify Finalized Training**:
- ✅ Não pode atualizar location
- ✅ Não pode atualizar startTime/endTime
- ✅ Não pode adicionar/remover players
- ✅ Não pode atualizar exercises

**7. Absence Notices Integration**:
- ✅ Se player tem absence notice aprovado, status = JUSTIFIED
- ✅ Se absence notice pending, mostrar warning
- ✅ Se absence notice dismissed, player pode ser marked ABSENT

**8. List Trainings**:
- ✅ List upcoming trainings (scheduledDate >= today, not finalized)
- ✅ List pending lock (scheduledDate < today, not finalized)
- ✅ List history (finalized trainings)
- ✅ Filter by teamId
- ✅ Filter by coachId
- ✅ Respeita multi-tenant

**9. Get Training with Attendance**:
- ✅ Retorna training com lista de attendances
- ✅ Inclui player info em cada attendance
- ✅ Inclui absence notice se exists
- ✅ Calcula percentagem de presença

**10. Multi-tenant Isolation**:
- ✅ Coach de Club A não pode criar training para team de Club B
- ✅ Coach de Club A não vê trainings de Club B
- ✅ Attendance só mostra players do clube correto

**Exemplo de Teste**:
```typescript
describe('finalize', () => {
  it('should finalize training and prevent further modifications', async () => {
    const trainingId = 'training-1';
    const userId = 'coach-123';
    
    const mockTraining = {
      id: trainingId,
      scheduledDate: new Date('2026-02-15'), // passado
      isFinalized: false,
    };
    
    prisma.training.findUnique = jest.fn().mockResolvedValue(mockTraining);
    prisma.training.update = jest.fn().mockResolvedValue({
      ...mockTraining,
      isFinalized: true,
      finalizedAt: new Date(),
      finalizedByUserId: userId,
    });
    
    const result = await service.finalize(trainingId, userId);
    
    expect(result.isFinalized).toBe(true);
    expect(result.finalizedAt).toBeDefined();
    expect(result.finalizedByUserId).toBe(userId);
  });
  
  it('should not allow finalization of future training', async () => {
    const trainingId = 'training-1';
    
    const mockTraining = {
      id: trainingId,
      scheduledDate: new Date('2026-03-01'), // futuro
      isFinalized: false,
    };
    
    prisma.training.findUnique = jest.fn().mockResolvedValue(mockTraining);
    
    await expect(service.finalize(trainingId, 'user-123'))
      .rejects.toThrow('Cannot finalize future training');
  });
  
  it('should prevent modifications after finalization', async () => {
    const trainingId = 'training-1';
    
    const mockTraining = {
      id: trainingId,
      isFinalized: true,
    };
    
    prisma.training.findUnique = jest.fn().mockResolvedValue(mockTraining);
    
    await expect(service.update(trainingId, { location: 'New Location' }))
      .rejects.toThrow('Cannot modify finalized training');
  });
});

describe('markAttendance', () => {
  it('should mark player as PRESENT', async () => {
    const trainingId = 'training-1';
    const playerId = 'player-1';
    
    const mockTraining = {
      id: trainingId,
      teamId: 'team-1',
      isFinalized: true,
    };
    
    const mockPlayer = {
      id: playerId,
      teamId: 'team-1',
    };
    
    prisma.training.findUnique = jest.fn().mockResolvedValue(mockTraining);
    prisma.player.findUnique = jest.fn().mockResolvedValue(mockPlayer);
    prisma.trainingAttendance.upsert = jest.fn().mockResolvedValue({
      trainingId,
      playerId,
      status: AttendanceStatus.PRESENT,
    });
    
    const result = await service.markAttendance(trainingId, playerId, AttendanceStatus.PRESENT);
    
    expect(result.status).toBe(AttendanceStatus.PRESENT);
  });
});
```

**Target**: 80%+ coverage

---

## 📊 CHECKLIST DE PROGRESSO

- [x] TODO 4.1: Players Module Tests
  - [x] players.service.spec.ts (85%+ coverage)
  - [x] players.controller.spec.ts (Implementado)
  - [x] Todos os casos críticos testados
  - [x] Multi-tenant isolation verificado
  - [x] Soft delete testado (Verificado em teste dedicado)
  - [x] Withdrawal process testado (Implementado em `withdrawal.service.spec.ts`)
  
- [x] TODO 4.4: Training Module Tests
  - [x] trainings.service.spec.ts (90%+ coverage)
  - [x] trainings.controller.spec.ts (Implementado)
  - [x] Finalize logic testado
  - [x] Cannot modify finalized testado
  - [x] Attendance marking testado
  - [x] Absence notices integration testado

- [x] TODO 4.5: Subscription Management Tests (NOVO)
  - [x] Enforce plan limits (Players/Teams)
  - [x] Upgrade/Downgrade logic
  - [x] `subscription.service.spec.ts` criado

---

## 🚀 PRÓXIMOS PASSOS SUGERIDOS

1.  **E2E Tests Expansion**:
    *   Expandir cobertura E2E para outros fluxos críticos como Gestão de Pagamentos completos e Torneios.

2.  **Soft Delete Edge Cases**:
    *   Continuar a monitorizar se `deletedAt` é respeitado em todas as novas queries.

3.  **Expandir para Outros Módulos**:
    *   `ClubsModule` (Critical for settings)
    *   `UsersModule` (Critical for RBAC)

## ⚠️ AVISOS IMPORTANTES

1. **Soft Deletes**: Players deletados ainda devem ser acessíveis para histórico. Testa que `deletedAt` funciona corretamente.

2. **Multi-tenant**: SEMPRE verificar que clubId está sendo filtrado corretamente.

3. **Training Lock**: Após finalizar, NADA pode ser modificado. Testa todos os endpoints que devem falhar.

4. **Dates**: Cuidado com timezones. Usa UTC para consistência.

5. **Mocks**: Reseta mocks entre testes com `jest.clearAllMocks()`.

---

## 🎯 ORDEM SUGERIDA DE EXECUÇÃO

1. **TODO 4.1: Players Tests** (PRIMEIRO - mais complexo)
2. **TODO 4.4: Training Tests** (SEGUNDO - depende de entender players)

**Tempo Estimado Total**: 6-8 horas

---

## 📈 COMANDOS ÚTEIS

```bash
# Executar testes de players
npm test -- players.service.spec.ts

# Executar com coverage
npm run test:cov -- players

# Watch mode
npm test -- --watch players.service.spec.ts

# Verificar coverage total
npm run test:cov
```

---

## 💡 DICAS

1. **Reutiliza Setup**: Cria factory functions para dados de teste comuns.

2. **Edge Cases**: Pensa em casos extremos (datas no passado distante, idades inválidas, etc).

3. **Error Messages**: Testa que mensagens de erro são claras e úteis.

4. **Performance**: Testes devem ser rápidos. Se demorar muito, há algo errado.

5. **Documenta**: Usa `it('should ...')` descritivo para cada teste.