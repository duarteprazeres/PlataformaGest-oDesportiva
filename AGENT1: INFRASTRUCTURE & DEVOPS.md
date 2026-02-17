# 🔧 AGENTE 1: INFRASTRUCTURE & DEVOPS

## 🎯 TAREFAS DETALHADAS

### ✅ TODO 1.1: Implementar Rate Limiting

**Objetivo**: Proteger API contra abuse (DoS, scraping, spam)

**Passos**:
1. Configurar `ThrottlerModule` no `app.module.ts`:
   - TTL: 60 segundos
   - Limite global: 100 requests/minuto

2. Aplicar rate limiting específico em endpoints críticos:
   - **Auth**: 5 requests/min
   - **Payments**: 10 requests/min
   - **Upload de ficheiros**: 3 requests/min

3. Usar decorator `@Throttle()` nos controllers

**Ficheiros a Modificar**:
- `apps/backend/src/app.module.ts`
- `apps/backend/src/modules/auth/auth.controller.ts`
- `apps/backend/src/modules/payments/payments.controller.ts`
- `apps/backend/src/modules/upload/upload.controller.ts` (se existir)

**Validação**:
- Testar com múltiplos requests rápidos
- Verificar resposta 429 (Too Many Requests)
- Confirmar headers `X-RateLimit-*`

---

### ✅ TODO 1.2: Adicionar Validation Pipes Globais

**Objetivo**: Validar todos os inputs automaticamente

**Passos**:
1. Configurar `ValidationPipe` global no `main.ts`:
   - `whitelist: true` (remove props não declaradas)
   - `forbidNonWhitelisted: true` (rejeita props extras)
   - `transform: true` (transforma tipos)
   - `enableImplicitConversion: true`

2. Verificar que todos os DTOs usam decorators `class-validator`

3. Adicionar validações custom se necessário (ex: NIF português)

**Ficheiros a Modificar**:
- `apps/backend/src/main.ts`
- Verificar DTOs em `apps/backend/src/modules/*/dto/`

**Validação**:
- Enviar request com campos extra → deve rejeitar
- Enviar request com tipos errados → deve transformar ou rejeitar
- Verificar mensagens de erro são claras

---

### ✅ TODO 3.1: Implementar Logging Estruturado (Winston)

**Objetivo**: Logs estruturados para debugging e análise

**Passos**:
1. Instalar dependências:
   ```bash
   npm install winston nest-winston
   ```

2. Configurar Winston no `main.ts`:
   - Transport para console (desenvolvimento)
   - Transport para ficheiros: `logs/error.log`, `logs/combined.log`
   - Formato JSON com timestamp

3. Substituir logger nos services principais:
   - Operações CRUD
   - Autenticação (sucesso/falha)
   - Erros com stack trace
   - Performance warnings (queries >100ms)

**Ficheiros a Criar**:
- `logs/` (diretório)

**Ficheiros a Modificar**:
- `apps/backend/src/main.ts`
- Services principais em `apps/backend/src/modules/*/`

**Validação**:
- Verificar logs em `logs/combined.log`
- Confirmar formato JSON
- Testar log de erro aparece em `logs/error.log`

---

### ✅ TODO 3.2: Configurar Error Tracking (Sentry)

**Objetivo**: Capturar bugs automaticamente em produção

**Passos**:
1. Criar conta free tier em Sentry.io
2. Criar projeto NestJS no Sentry
3. Copiar DSN

4. Instalar SDK:
   ```bash
   npm install @sentry/node @sentry/profiling-node
   ```

5. Configurar no `main.ts`:
   - Inicializar Sentry com DSN
   - Configurar environment
   - tracesSampleRate: 1.0

6. Criar filtro global de exceções

**Ficheiros a Criar**:
- `apps/backend/src/filters/sentry-exception.filter.ts`

**Ficheiros a Modificar**:
- `apps/backend/src/main.ts`
- `.env` (adicionar `SENTRY_DSN`)
- `.env.example` (documentar variável)

**Validação**:
- Forçar um erro e verificar aparece no Sentry
- Confirmar stack trace está completo
- Verificar user context está anexado

---

### ✅ TODO 3.3: Adicionar Health Check Endpoint

**Objetivo**: Endpoint para verificar saúde da aplicação

**Passos**:
1. Instalar Terminus:
   ```bash
   npm install @nestjs/terminus
   ```

2. Criar `HealthModule` e `HealthController`

3. Implementar checks:
   - Database (ping check)
   - Disk storage (threshold 90%)
   - Memory heap (max 300MB)

4. Expor endpoint `GET /health`

**Ficheiros a Criar**:
- `apps/backend/src/modules/health/health.module.ts`
- `apps/backend/src/modules/health/health.controller.ts`

**Ficheiros a Modificar**:
- `apps/backend/src/app.module.ts` (importar HealthModule)

**Validação**:
- Curl `GET /health` deve retornar status "ok"
- Parar database → health check deve falhar
- Verificar resposta JSON está bem formatada

---

### ✅ TODO 3.4: Implementar Application Metrics

**Objetivo**: Tracking de performance e uso

**Passos**:
1. Criar `MetricsService` para tracking:
   - Request count
   - Error count
   - Average response time
   - Active users

2. Criar middleware para tracking automático

3. Expor endpoint `GET /metrics`

**Ficheiros a Criar**:
- `apps/backend/src/modules/metrics/metrics.module.ts`
- `apps/backend/src/modules/metrics/metrics.service.ts`
- `apps/backend/src/modules/metrics/metrics.middleware.ts`
- `apps/backend/src/modules/metrics/metrics.controller.ts`

**Ficheiros a Modificar**:
- `apps/backend/src/app.module.ts`

**Validação**:
- Fazer alguns requests
- Verificar `GET /metrics` retorna dados
- Confirmar contadores incrementam corretamente

---

### ✅ TODO 5.1: Configurar Database Backups Automáticos

**Objetivo**: Proteção contra perda de dados

**Passos**:
1. Criar script bash `backup-db.sh`:
   - pg_dump para backup completo
   - Compressão gzip
   - Retention de 30 dias
   - Upload S3 (opcional)

2. Criar script `restore-db.sh` para recovery

3. Configurar cron job (diário às 3AM)

4. Documentar processo em `README-OPS.md`

**Ficheiros a Criar**:
- `scripts/backup-db.sh`
- `scripts/restore-db.sh`
- `README-OPS.md`

**Validação**:
- Executar backup manualmente
- Testar restore em database de teste
- Verificar ficheiros de backup são criados

---

### ✅ TODO 5.2: Configurar WAL Archiving

**Objetivo**: Point-in-time recovery

**Passos**:
1. Documentar configurações para `postgresql.conf`:
   - wal_level = replica
   - archive_mode = on
   - archive_command configurado

2. Instruções para criar diretório `/archive/wal`

3. Documentar processo de recovery

**Ficheiros a Criar**:
- `docs/RECOVERY.md`

**Nota**: Esta configuração é feita no servidor PostgreSQL, não no código da aplicação

---

### ✅ TODO 5.3: Disaster Recovery Plan

**Objetivo**: Plano documentado para cenários de desastre

**Passos**:
1. Criar `docs/DISASTER-RECOVERY.md` com procedimentos para:
   - Database corruption
   - Server crash
   - Data breach
   - Rollback de deploy

2. Cada cenário deve ter:
   - Sintomas
   - Ações específicas
   - Comandos exactos
   - Responsáveis

3. Criar `docs/INCIDENT-RESPONSE.md` para resposta a incidentes

**Ficheiros a Criar**:
- `docs/DISASTER-RECOVERY.md`
- `docs/INCIDENT-RESPONSE.md`

---

### ✅ TODO 5.4: Environment-Specific Configuration

**Objetivo**: Separar configurações dev/staging/prod

**Passos**:
1. Criar ficheiros `.env` separados:
   - `.env.development`
   - `.env.staging`
   - `.env.production`

2. Criar módulo de configuração com validação Joi:
   - Validar NODE_ENV
   - Validar DATABASE_URL
   - Validar JWT_SECRET (min 32 chars)

3. Configuration service centralizado

**Ficheiros a Criar**:
- `apps/backend/src/config/configuration.ts`
- `apps/backend/src/config/validation.ts`
- `.env.development`
- `.env.staging`
- `.env.production`

**Ficheiros a Modificar**:
- `apps/backend/src/app.module.ts` (importar ConfigModule)

**Validação**:
- App deve falhar startup se variáveis obrigatórias faltam
- Verificar configuração correta em cada ambiente

---

## 📊 CHECKLIST DE PROGRESSO

- [x] TODO 1.1: Rate Limiting
- [x] TODO 1.2: Validation Pipes
- [x] TODO 3.1: Winston Logging
- [x] TODO 3.2: Sentry Error Tracking
- [x] TODO 3.3: Health Check Endpoint
- [x] TODO 3.4: Application Metrics
- [x] TODO 5.1: Database Backups
- [x] TODO 5.2: WAL Archiving (Documentação)
- [x] TODO 5.3: Disaster Recovery Plan
- [x] TODO 5.4: Environment Configuration

---

## ⚠️ AVISOS IMPORTANTES

1. **NÃO modificar**: `schema.prisma`, ficheiros de teste (*.spec.ts), módulos de negócio (players, clubs, payments)
2. **Testar sempre** antes de marcar como completo
3. **Documentar** todas as configurações e decisões
4. **Commits incrementais** - um por tarefa completada
5. **Validação**: Cada tarefa deve ter validação funcional antes de avançar

---

## ✅ RESUMO DO TRABALHO REALIZADO

Todas as tarefas planeadas foram concluídas com sucesso:

1.  **Segurança & Fiabilidade**:
    *   Rate Limiting implementado (Throttler).
    *   Validation Pipes globais ativos.
    *   Configuração de ambiente segura e tipada.

2.  **Observabilidade**:
    *   Logging estruturado (Winston) em JSON.
    *   Error Tracking (Sentry) integrado.
    *   Health Checks (`/health`) e Métricas (`/metrics`) expostos.

3.  **Recuperação de Dados**:
    *   Scripts de Backup e Restore criados (`npm run db:backup`).
    *   Documentação de WAL Archiving e Disaster Recovery criada.

---

## 🚀 PRÓXIMOS PASSOS (Sugestões)

Para elevar a infraestrutura ao próximo nível, sugiro:

1.  **CI/CD Pipelines (GitHub Actions)**:
    *   Automatizar correr testes e linting em cada PR.
    *   Automatizar build e push de imagem Docker para registry.
    *   Automatizar deploy para staging/prod.

2.  **Container Orchestration**:
    *   Preparar deployment para Kubernetes (K8s) ou ECS se a escala aumentar.
    *   Criar `docker-compose.prod.yml` otimizado para produção.

3.  **Cloud Deployment**:
    *   Provisionar infraestrutura real (AWS/GCP/Azure) usando Terraform (IaC).
    *   Configurar armazenamento externo (S3) para backups e uploads.

4.  **Security Hardening**:
    *   Implementar Helmet para headers de segurança HTTP.
    *   Configurar CORS restritivo.
    *   Scan de vulnerabilidades em dependências e imagens Docker.