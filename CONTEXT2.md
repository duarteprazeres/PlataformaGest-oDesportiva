# Sistema de Avisos de Ausência dos Pais - Estratégia de Implementação

## Visão Geral

Sistema que permite pais avisar treinadores sobre ausências dos seus filhos (atletas) aos treinos, **até ao final do treino**. Inclui workflow de validação pelo treinador com integração automática ao sistema de presenças e departamento médico.

## Arquitetura

### Relacionamentos de Dados

```
GlobalParent (portal) → Athlete → Player (club) → Training
                                                      ↓
                                            AbsenceNotice ← GlobalParent
                                                      ↓
                                            Validated by Coach → TrainingAttendance + Injury (optional)
```

### Fluxo Completo

1. **Pai acede portal** (`/portal/dashboard`)
2. **Vê lista de próximos treinos** do(s) filho(s)
3. **Submete aviso de ausência** com justificação
4. **Sistema deteta keywords médicas** e alerta pai
5. **Notificação criada** para treinador(es) da equipa
6. **Treinador vê avisos pendentes** (badge no treino)
7. **Treinador valida**:
   - Aceita: marca ausência + opcionalmente cria injury
   - Rejeita: descarta aviso
8. **Sistema regista** attendance e/ou injury automaticamente

## Componentes Backend

### 1. Database Schema

```prisma
// Novo enum
enum AbsenceNoticeStatus {
  PENDING
  APPROVED
  DISMISSED
}

// Nova tabela
model AbsenceNotice {
  id                String   @id @default(uuid())
  
  // Relação com atleta/jogador
  athleteId         String
  athlete           Athlete  @relation(fields: [athleteId], references: [id])
  
  playerId          String?  // Pode ser null se atleta não tiver player no clube
  player            Player?  @relation(fields: [playerId], references: [id])
  
  trainingId        String
  training          Training @relation(fields: [trainingId], references: [id])
  
  // Quem submeteu (pai)
  submittedByParentId String
  submittedBy       GlobalParent @relation("SubmittedNotices", fields: [submittedByParentId], references: [id])
  
  reason            String   // Justificação do pai
  status            AbsenceNoticeStatus @default(PENDING)
  
  // Validação do treinador
  reviewedByUserId  String?
  reviewedBy        User?    @relation("ReviewedNotices", fields: [reviewedByUserId], references: [id])
  reviewedAt        DateTime?
  reviewNotes       String?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([trainingId, status])
  @@index([athleteId])
  @@index([status])
}
```

### 2. Module: `absence-notices`

**Localização**: `apps/backend/src/modules/absence-notices/`

**Estrutura**:
```
absence-notices/
├── dto/
│   ├── create-absence-notice.dto.ts
│   ├── approve-notice.dto.ts
│   └── dismiss-notice.dto.ts
├── absence-notices.controller.ts
├── absence-notices.service.ts
└── absence-notices.module.ts
```

**DTOs**:

```typescript
// create-absence-notice.dto.ts
class CreateAbsenceNoticeDto {
  @IsUUID()
  athleteId: string;
  
  @IsUUID()
  trainingId: string;
  
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason: string;
}

// approve-notice.dto.ts
class ApproveNoticeDto {
  @IsOptional()
  @IsBoolean()
  createInjury?: boolean;
  
  @IsOptional()
  @ValidateNested()
  injuryData?: {
    name: string;
    severity: 'MILD' | 'MODERATE' | 'SEVERE';
    estimatedRecoveryDays: number;
  };
  
  @IsOptional()
  @IsString()
  notes?: string;
}
```

**Endpoints**:
- `POST /absence-notices` - Pai submete aviso (GlobalAuth)
- `GET /absence-notices` - Listar avisos (filtrar por training, status)
- `GET /absence-notices/:id` - Detalhes de aviso específico
- `PATCH /absence-notices/:id/approve` - Treinador aprova (JwtAuth + Coach/Admin)
- `PATCH /absence-notices/:id/dismiss` - Treinador descarta

### 3. Service Methods

**Validações Críticas**:
1. Training ainda não terminou: `scheduledDate + endTime >= now()`
2. Pai é owner do athlete
3. Athlete tem player no clube do training (opcional warning se não)

**Logic `approve()`**:
```typescript
async approve(noticeId: string, userId: string, dto: ApproveNoticeDto) {
  // 1. Buscar notice com training e player
  // 2. Validar permissões (coach/admin do clube)
  // 3. Marcar notice como APPROVED
  // 4. Criar TrainingAttendance (ABSENT, justification = notice.reason)
  // 5. Se dto.createInjury: criar Injury
  // 6. Return success
}
```

## Componentes Frontend

### 1. Portal dos Pais (`/portal`)

**Nova Página**: `/portal/dashboard/trainings/[athleteId]`

**Features**:
- Lista de próximos treinos (scheduling >= today)
- Card por treino com:
  - Data, horário, local
  - Nome da equipa
  - Botão "Avisar Ausência"
- Modal de aviso:
  - Campo de justificação (textarea)
  - Deteção de keywords médicas (warning laranja)
  - Botão "Submeter Aviso"
- Secção "Meus Avisos":
  - Lista de avisos submetidos
  - Status: Pendente / Aprovado / Descartado
  - Cor-coded badges

**API Calls**:
```typescript
// Em lib/api-global.ts
getAthleteTrainings(athleteId: string): Promise<Training[]>
submitAbsenceNotice(data: { athleteId, trainingId, reason }): Promise<AbsenceNotice>
getMyAbsenceNotices(athleteId?: string): Promise<AbsenceNotice[]>
```

### 2. Dashboard Treinador (`/dashboard`)

**Alterações em `/dashboard/trainings/[id]/page.tsx`**:

1. **Badge de Avisos**:
   - Buscar `absenceNotices` pendentes do training
   - Mostrar badge com número no header

2. **Nova Secção "Avisos de Ausência"**:
   - Antes da secção de presenças
   - Card por aviso pendente:
     - Nome do jogador + foto pai
     - Data de submissão
     - Justificação (com highlight de keywords médicas)
     - Botões: "Validar" | "Descartar"

3. **Modal de Validação**:
   - Justificação (readonly)
   - Checkbox "Criar registo médico"
   - Se checked: formulário inline (nome, gravidade, dias)
   - Notas adicionais (opcional)
   - Botão "Confirmar Validação"

**Estado adicional**:
```typescript
const [absenceNotices, setAbsenceNotices] = useState<AbsenceNotice[]>([]);
const [selectedNotice, setSelectedNotice] = useState<AbsenceNotice | null>(null);
const [showValidationModal, setShowValidationModal] = useState(false);
```

## Prioridades de Implementação

### MVP (Mínimo Viável) - 3h
1. ✅ Schema + migration
2. ✅ Backend: POST /absence-notices (submit)
3. ✅ Backend: GET /absence-notices (list)
4. ✅ Backend: PATCH approve/dismiss
5. ✅ Portal: Página de treinos básica
6. ✅ Portal: Modal de submissão
7. ✅ Dashboard: Lista de avisos pendentes
8. ✅ Dashboard: Botões aprovar/rejeitar (sem modal)

### Melhorias (Fase 2) - 2h
1. Keywords detection no portal
2. Modal de validação completo
3. Integração automática com injuries
4. Badges visuais
5. Notification toasts

### Polimento (Fase 3) - 1h
1. Filtros (por status, por atleta)
2. Histórico de avisos
3. Estatísticas (% aprovação, etc.)
4. Email notifications (opcional)

## Notas de Segurança

- **GlobalParent**: Só pode submeter avisos dos próprios athletes
- **Coach/Admin**: Só pode validar avisos de treinos do próprio clube
- **Timing**: Validar sempre se treino ainda não terminou

## Testes

**Script**: `apps/backend/test_absence_notices.sh`

```bash
# 1. Login como pai (GlobalAuth)
# 2. Get athlete trainings
# 3. Submit absence notice
# 4. Login como coach (JWT)
# 5. Get pending notices for training
# 6. Approve notice with injury creation
# 7. Verify attendance created
# 8. Verify injury created
# 9. Check absence notice status = APPROVED
```

## Próximos Passos

1. Criar migration com schema
2. Implementar backend module (DTOs, service, controller)
3. Testar endpoints via curl/script
4. Implementar portal UI
5. Implementar dashboard UI
6. Testes integração end-to-end
