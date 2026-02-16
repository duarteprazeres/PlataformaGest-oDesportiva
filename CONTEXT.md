# CONTEXT.md - Resumo Técnico do Projeto

**Data**: 2026-02-16  
**Última Atualização**: Formalize Athlete Withdrawal Process (Modelo 2)

---

## 📋 Resumo da Sessão Atual (2026-02-16)

### Objetivo Principal
Implementar o **processo formal de rescisão de atletas (Modelo 2)**, adaptado à realidade do futebol juvenil português, onde a documentação (Carta de Desvinculação + Exame Médico) é enviada para o novo clube, os clubes podem iniciar rescisões, e os atletas não são automaticamente desvinculados no final da época.

### Trabalho Realizado

#### 1. **Backend - Modelo 2 Withdrawal** ✅

**Database Schema (`schema.prisma`)**:
- ✅ Novos campos no modelo `Player`:
  - `withdrawalReason` (String): Motivo da rescisão
  - `destinationClubEmail` (String): Email do clube de destino
  - `withdrawalLetterUrl` (String): URL da carta de desvinculação
  - `documentsSentAt` (DateTime): Timestamp do envio de documentos

**Mail Service**:
- ✅ `MailModule` criado e registado em `AppModule` e `AthletesModule`
- ✅ `MailService` com método `sendWithdrawalPackage()`:
  - Envia Carta de Desvinculação + Exame Médico para clube destino
  - Mock implementation pronta para integração SMTP

**Athletes Service**:
- ✅ Método `terminateLink()` implementado:
  - Atualiza status do jogador para `LEFT`
  - Regista motivo e email do clube destino
  - Liberta passaporte do atleta (`currentClubId = null`)
  - Envia email com documentação (opcional)

**API Endpoint**:
- ✅ `POST /athletes/players/:playerId/terminate`
- ✅ Aceita: `reason`, `withdrawalLetterUrl`, `destinationClubEmail`, `sendEmail`
- ✅ Autenticação: Apenas Club Admin

#### 2. **Frontend - Modelo 2 Withdrawal** ✅

**API Client (`lib/api.ts`)**:
- ✅ Método `terminatePlayerLink()` criado

**Componentes**:
- ✅ `WithdrawalModal.tsx`:
  - Formulário com campo de motivo (obrigatório)
  - Campo de URL da carta de desvinculação
  - Checkbox para enviar email
  - Campo de email do clube destino (condicional)
  - Validação de campos obrigatórios
  - Toast notifications
  
- ✅ `PlayerCard.tsx` atualizado:
  - Botão "Rescisão" para jogadores ativos
  - Status badges: "Pedido de Rescisão" (amarelo), "Desvinculado" (cinza)
  - Integração com `WithdrawalModal`

**CSS Styling**:
- ✅ Estilos para botão de rescisão (vermelho)
- ✅ Estilos para badges de status

#### 3. **Verificação** ✅
- ✅ Backend compila sem erros
- ✅ Prisma Client regenerado com novos campos
- ✅ Endpoint verificado com script de teste
- ✅ UI testada em browser:
  - Modal abre corretamente
  - Todos os campos presentes e funcionais
  - Validação funciona
  - Integração com backend verificada

---

## 🗂️ Estrutura Atual do Projeto

### Backend (NestJS + Prisma)
```
apps/backend/
├── prisma/
│   ├── schema.prisma              # ✅ UPDATED (Player withdrawal fields)
├── src/modules/
│   ├── mail/                      # ✅ NEW - Email service module
│   │   ├── mail.module.ts
│   │   └── mail.service.ts
│   ├── athletes/
│   │   ├── athletes.service.ts   # ✅ UPDATED (terminateLink method)
│   │   ├── athletes.controller.ts # ✅ UPDATED (terminate endpoint)
│   │   └── athletes.module.ts    # ✅ UPDATED (imports MailModule)
│   ├── absence-notices/           # ✅ Module, Controller, Service
│   ├── trainings/
│   │   ├── trainings.service.ts   # ✅ UPDATED (include absenceNotices)
│   └── ...
```

### Frontend (Next.js)
```
apps/web/src/
├── app/dashboard/
│   └── players/
│       └── page.tsx               # ✅ UPDATED (passes onUpdate callback)
├── components/
│   ├── WithdrawalModal.tsx        # ✅ NEW - Withdrawal form modal
│   └── players/
│       ├── PlayerCard.tsx         # ✅ UPDATED (withdrawal button + status badges)
│       └── PlayerCard.module.css  # ✅ UPDATED (new styles)
├── lib/
│   └── api.ts                     # ✅ UPDATED (terminatePlayerLink method)
└── ...
```

---

## ✅ Funcionalidades Completas

### Modelo 2: Formal Athlete Withdrawal ✅
- ✅ Database schema com campos de rescisão
- ✅ Backend API para rescisão iniciada por clube
- ✅ Serviço de email (mock, pronto para SMTP)
- ✅ Frontend: Modal de rescisão com upload de documentos
- ✅ Frontend: Status badges para estados de rescisão
- ✅ Libertação de passaporte de atleta
- ✅ Continuidade sazonal (sem auto-drop)

### Absence Notices System ✅
- ✅ Schema Database
- ✅ Backend API (CRUD + Review)
- ✅ Dashboard Integração (Coach Side)
- ✅ Aprovação/Rejeição de avisos
- ✅ Parent Portal integration

### Phase 2.1 - 2.6: Training Management ✅
- ✅ Training Lock & Finalize
- ✅ Training Categories (Upcoming, Pending Lock, History)
- ✅ Attendance Marking
- ✅ Medical Status Integration

### Authentication & Authorization ✅
- ✅ RBAC implementation
- ✅ Role Guards on controllers
- ✅ Ownership checks

### Frontend Architecture ✅
- ✅ Toast notifications (Sonner)
- ✅ Global Error Boundary
- ✅ Alert() replacement with toasts

---

## 🔨 Tarefas Pendentes

### Prioridade Alta 🔴

#### 1. **Email Service Integration**
- [ ] Configurar SMTP provider (ex: SendGrid, AWS SES, Nodemailer)
- [ ] Substituir mock `sendEmail()` com implementação real
- [ ] Adicionar templates HTML para emails profissionais
- [ ] Configurar variáveis de ambiente para credenciais SMTP

#### 2. **Document Storage Integration**
- [ ] Implementar upload de ficheiros (S3, Cloudinary, ou storage local)
- [ ] Gerar URLs públicos para Carta de Desvinculação
- [ ] Integrar upload no `WithdrawalModal`

#### 3. **Backend Stability**
- [ ] Resolver conflito de porta 3000 (processos duplicados)
- [ ] Implementar health check endpoint
- [ ] Adicionar logging estruturado para troubleshooting

### Prioridade Média 🟡

#### 4. **Withdrawal Flow Enhancements**
- [ ] Notificações para pais quando clube inicia rescisão
- [ ] Histórico de rescisões no perfil do atleta
- [ ] Confirmação de recepção de email pelo clube destino

#### 5. **Training Attendance Logic**
- [ ] Endpoint `POST /attendance` (bulk update)
- [ ] Lógica backend: Impedir marcar presença em lesionados
- [ ] Frontend: Botões Presente/Ausente funcionais

### Prioridade Baixa 🟢

#### 6. **Testing & Quality**
- [ ] Unit tests para `MailService`
- [ ] E2E tests para fluxo de rescisão completo
- [ ] Testes de carga para emails em massa

#### 7. **Melhorias e Otimizações**
- [ ] Relatórios e Estatísticas de rescisões
- [ ] Exportação de dados de transferências
- [ ] Dashboard analytics

---

## 🐛 Bugs Conhecidos

1. **Backend Port Conflict** (Prioridade Alta)
   - Sintoma: `EADDRINUSE: address already in use :::3000`
   - Causa: Processo duplicado do backend a correr
   - Fix temporário: `lsof -ti:3000 | xargs kill -9 && npm run start:dev`

---

**Documento mantido por**: Desenvolvimento Antigravity AI  
**Última sessão**: 2026-02-16 - Formalize Athlete Withdrawal Process (Modelo 2)  
**Status**: ✅ Backend Withdrawal | ✅ Frontend Withdrawal | ⏳ Email Integration | ⏳ Document Storage
