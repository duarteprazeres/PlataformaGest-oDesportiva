# 🔍 CONTEXTO TÉCNICO - NOVASCORE SAAS

**Projeto**: NovaScore - Plataforma SaaS de Gestão Desportiva  
**Tecnologia**: NestJS + Prisma + PostgreSQL + Flutter  
**Estado Atual**: Estabilizado - Pronto para Escala (Fase 1 & 2 Concluídas)  
**Gravidade**: MODERADA - Problemas Críticos Resolvidos, Foco em Features e Testes

---

## 📊 SUMÁRIO EXECUTIVO

O projeto NovaScore encontra-se numa fase crítica: tem utilizadores reais a testar o sistema, mas a análise técnica revelou **vulnerabilidades de segurança fundamentais** e **ausência de type safety** que podem resultar em:

- Crashes inesperados em produção devido a erros de tipo não capturados
- Vulnerabilidades de segurança que expõem dados sensíveis de clubes (multi-tenant)
- Bugs não detetados devido à ausência completa de testes automatizados
- Possibilidade de data corruption por falta de validação de inputs
- Risco de breach de segurança por secrets default e configurações inadequadas

**Conclusão Principal**: A arquitetura estabilizou significativamente. Type safety estrito, segurança reforçada e pipeline de CI/CD estão implementados. O foco agora deve mudar para aumento de cobertura de testes e funcionalidades.

---

## 🎯 CONTEXTO DO NEGÓCIO

### Modelo Multi-Tenant
O NovaScore é uma plataforma SaaS onde **cada clube de futebol é um tenant independente**. Isto significa que:

- Um único banco de dados PostgreSQL serve múltiplos clubes
- Isolamento de dados é **CRÍTICO** - um clube nunca pode ver dados de outro
- Cada tabela tem `clubId` como foreign key para garantir isolamento
- Falhas no isolamento multi-tenant = **GDPR violation** + perda total de confiança

### Dados Sensíveis Geridos
O sistema gere:
- Dados pessoais de menores (jogadores)
- Informação financeira (pagamentos, mensalidades)
- Dados de saúde (lesões, histórico médico)
- Credenciais de autenticação
- Informação fiscal dos clubes

**Implicação**: Qualquer vulnerabilidade tem consequências legais graves (RGPD/GDPR).

### Estado Atual de Utilização
- **Utilizadores ativos**: Em fase de testes com clubes reais
- **Dados reais**: Sistema já contém informação sensível de pessoas reais
- **Sem rollback plan**: Não existe estratégia documentada de disaster recovery
- **Zero monitoring**: Não há alertas quando algo falha

---

## ✅ [RESOLVIDO] PROBLEMA CRÍTICO #1: TYPESCRIPT TYPE SAFETY DESATIVADO
> **Status**: Resolvido em Fev 2026. `strict: true` ativado, 90+ erros corrigidos.

### Descrição Técnica do Problema

O ficheiro `apps/backend/tsconfig.json` tem configuração que **anula completamente os benefícios do TypeScript**:

```
strictNullChecks: false
noImplicitAny: false
strictBindCallApply: false
forceConsistentCasingInFileNames: false
noFallthroughCasesInSwitch: false
```

#### O Que Isto Significa Tecnicamente

**1. `strictNullChecks: false`**
- Permite que variáveis declaradas como tipos específicos recebam `null` ou `undefined` sem erro
- O código pode chamar métodos em objetos que são `null` em runtime → **NullPointerException equivalente**
- Exemplo de problema: `user.email.toLowerCase()` quando `user` é `null` → crash

**2. `noImplicitAny: false`**
- TypeScript não avisa quando infere tipo `any` automaticamente
- Variáveis podem ter qualquer tipo sem declaração explícita
- Perde-se completamente type checking → equivalente a escrever JavaScript puro
- Bugs de tipo não são capturados em compile time

**3. `strictBindCallApply: false`**
- Permite chamar funções com argumentos errados sem erro
- `function add(a: number, b: number)` pode ser chamada com strings
- Bugs silenciosos que só aparecem em runtime

**4. Ausência de `noUnusedLocals` e `noUnusedParameters`**
- Código morto pode acumular-se
- Variáveis declaradas mas nunca usadas não geram warnings
- Aumenta cognitive load e dificulta manutenção

### Impacto Real no Código

Com estas configurações, o seguinte código **compila sem erros**:

```typescript
// Problema 1: null/undefined não verificado
function getPlayerName(player: Player) {
  return player.name.toUpperCase(); // Se player é null → CRASH
}

// Problema 2: any implícito
function processPayment(data) { // 'data' é any implícito
  return data.amount * 1.23; // Se data.amount é string → bug silencioso
}

// Problema 3: argumentos errados
function createPlayer(name: string, age: number) {
  // implementação
}
createPlayer(123, "John"); // Compila mas está errado!
```

### Consequências em Produção

1. **Runtime Crashes**: `Cannot read property 'X' of undefined` → aplicação crasha
2. **Data Corruption**: Operações matemáticas com strings → dados incorretos salvos
3. **Security Issues**: Tipo `any` permite passar objetos maliciosos sem validação
4. **Bugs Silenciosos**: Erros não são visíveis até utilizador reportar

### Estimativa de Problemas Escondidos

Baseado em projetos similares com configuração lax:
- **50-150 potenciais null/undefined errors** não capturados
- **30-80 usos de `any`** que deveriam ter tipos explícitos
- **10-30 funções** com argumentos incorretos que compilam
- **20-40 variáveis não utilizadas** que confundem o código

---

## ✅ [RESOLVIDO] PROBLEMA CRÍTICO #2: ESLINT PERMITE PRÁTICAS PERIGOSAS
> **Status**: Resolvido. `no-explicit-any` agora é erro.

### Descrição Técnica do Problema

O ficheiro `apps/backend/.eslintrc.js` tem a regra:

```
'@typescript-eslint/no-explicit-any': 'off'
```

#### O Que Isto Significa

ESLint é a segunda linha de defesa depois do TypeScript compiler. Com esta regra desligada:

1. **Desenvolvedores podem usar `any` livremente** sem warnings
2. **Code reviews não capturam** tipos fracos automaticamente
3. **CI/CD não falha** quando código com `any` é commitado
4. **Acumula-se debt técnico** progressivamente

### Padrões Problemáticos Não Detectados

Com ESLint permissivo, estes padrões passam despercebidos:

**1. Controllers sem tipos de retorno**
```typescript
async createPlayer(dto: any) { // any permitido
  return this.service.create(dto); // retorno implícito
}
```

**2. Services com parâmetros any**
```typescript
async processPayment(data: any) { // sem validação
  // data pode ser qualquer coisa
}
```

**3. Variáveis não utilizadas**
```typescript
const user = await this.findUser(id); // nunca usado
const result = await this.process(); // sobrescrito depois
return await this.otherResult();
```

### Impacto na Qualidade do Código

1. **Code Review Ineficaz**: Reviewers têm de capturar manualmente problemas que tooling devia apanhar
2. **Onboarding Difícil**: Novos devs não têm guidance automática
3. **Refactoring Perigoso**: Mudar código sem tipos fortes = altíssima probabilidade de bugs
4. **Debt Técnico Crescente**: Cada nova feature adiciona mais código fraco

---

## ✅ [RESOLVIDO] PROBLEMA CRÍTICO #3: SECRETS E CONFIGURAÇÕES INSEGURAS
> **Status**: Resolvido. Fallbacks inseguros removidos. App falha se secrets não existirem.

### Descrição Técnica do Problema

O ficheiro `.env.example` contém valores default perigosos:

```
JWT_SECRET=dev_secret_change_in_production
JWT_REFRESH_SECRET=your_refresh_secret_key
DB_PASSWORD=your_secure_password_here
```

#### Análise de Risco de Segurança

**1. JWT Secret Fraco**
- String simples e previsível
- Se usado em produção, permite forjar tokens
- Atacante pode criar tokens válidos para qualquer utilizador
- **IMPACTO**: Acesso não autorizado total ao sistema

**2. Secrets Commitados em Git**
- Se `.env` foi commitado alguma vez, secrets estão no histórico Git
- Mesmo depois de removido, permanece em commits antigos
- Repositórios públicos expõem secrets permanentemente
- **IMPACTO**: Breach completo se repo for público

**3. Falta de Secrets Management**
- Secrets hardcoded em `.env` files
- Não há rotação de secrets
- Não há diferenciação entre dev/staging/production
- **IMPACTO**: Um leak compromete todos os ambientes

### Vulnerabilidades Específicas

**JWT Token Forgery**
- Atacante com o JWT_SECRET pode criar tokens válidos
- Pode impersonar qualquer utilizador (incluindo SUPER_ADMIN)
- Pode aceder a dados de qualquer clube (bypass multi-tenant)

**Database Access**
- Password fraca é facilmente brute-forced
- Sem rotação, uma vez comprometida permanece comprometida
- Acesso direto ao database bypassa toda a lógica da aplicação

**Cross-Tenant Data Breach**
- Com acesso administrativo forjado, atacante pode:
  - Ler dados de todos os clubes
  - Modificar dados financeiros
  - Apagar informação
  - Exfiltrar dados pessoais (GDPR violation)

### Estado Atual de Proteção

**Verificações Necessárias**:
1. `.env` está no `.gitignore`? → Precisa confirmação
2. Histórico Git tem secrets? → Precisa varredura
3. Produção usa secrets diferentes? → Precisa confirmação
4. Há secrets manager? → Aparentemente não existe

---

## 🔴 PROBLEMA CRÍTICO #4: VALIDAÇÃO DE INPUT AUSENTE

### Descrição Técnica do Problema

**Bibliotecas Instaladas Mas Não Utilizadas**:
- `class-validator@^0.14.0` → instalado
- `class-transformer@^0.5.1` → instalado

**Mas**: Não há evidência de DTOs implementados com validação real.

#### O Que Deveria Existir Mas Não Existe

**1. DTOs com Decorators de Validação**
Cada endpoint deveria ter Data Transfer Objects com validação explícita.

Exemplo do que está AUSENTE:
```typescript
// Deveria existir mas não existe:
// src/modules/auth/dto/login.dto.ts
// src/modules/players/dto/create-player.dto.ts
// src/modules/payments/dto/create-payment.dto.ts
```

**2. Global Validation Pipe**
O `main.ts` deveria configurar validação global, mas análise sugere que não está implementado.

**3. Whitelist e Transform**
Sem configuração adequada, a aplicação aceita propriedades extras não documentadas.

### Vetores de Ataque Possíveis

**1. Mass Assignment Vulnerability**
```
POST /api/players
{
  "name": "João",
  "age": 15,
  "isAdmin": true,  ← Campo não esperado mas aceite
  "clubId": "outro-clube-uuid"  ← Bypass multi-tenant!
}
```

**2. Type Coercion Attacks**
```
POST /api/payments
{
  "amount": "100.50' OR 1=1--",  ← String quando devia ser number
  "playerId": {"$ne": null}  ← NoSQL injection attempt
}
```

**3. Injection Attacks**
Sem validação, inputs maliciosos chegam à database:
```
POST /api/clubs
{
  "name": "'; DROP TABLE players; --",
  "email": "<script>alert('xss')</script>@test.com"
}
```

**4. Data Corruption**
```
POST /api/players
{
  "birthDate": "not-a-date",
  "weight": "very heavy",
  "height": [1, 2, 3]
}
```

### Consequências Reais

1. **SQL Injection**: Prisma protege parcialmente, mas input validation é essencial
2. **NoSQL Injection**: Se usarem MongoDB para algo, vulnerável
3. **XSS**: Dados maliciosos salvos e renderizados sem sanitização
4. **Business Logic Bypass**: Utilizadores podem manipular campos que não deviam
5. **Multi-Tenant Bypass**: Atacante pode aceder dados de outros clubes

### GDPR/RGPD Implications

Aceitar e processar dados não validados viola:
- Art. 5(1)(f) - Integridade e confidencialidade
- Art. 32 - Segurança do processamento
- Art. 25 - Data protection by design

**Multa Potencial**: até 4% do revenue anual ou €20 milhões

---

## ✅ [RESOLVIDO] PROBLEMA CRÍTICO #5: RATE LIMITING NÃO IMPLEMENTADO
> **Status**: Resolvido. `ThrottlerModule` (100 req/min) e `Helmet` implementados.

### Descrição Técnica do Problema

**Biblioteca Instalada**: `@nestjs/throttler@^5.1.1`

**Mas**: Não há evidência de configuração no `AppModule` ou aplicação de guards.

#### Vulnerabilidades de Denial of Service

**1. Brute Force Attacks**
Sem rate limiting no endpoint `/api/auth/login`:
- Atacante pode tentar 1000+ passwords por segundo
- Pode comprometer contas com passwords fracas em minutos
- Não há throttling ou account lockout

**2. Resource Exhaustion**
Endpoints de listagem sem limite:
```
GET /api/players?limit=999999999
GET /api/payments?page=1&limit=1000000
```
- Cliente malicioso pode request datasets enormes
- Consome memória e CPU excessivos
- Pode causar crash ou lentidão para outros clubes

**3. API Abuse**
Sem rate limits, utilizador pode:
- Fazer scraping de todos os dados
- Sobrecarregar o sistema com requests inúteis
- Causar custos excessivos de infrastructure
- Impactar performance para utilizadores legítimos

### Impacto Multi-Tenant Específico

Numa arquitectura multi-tenant, **um cliente malicioso afeta TODOS os outros clubes**:

1. **Resource Contention**: Database connections esgotadas
2. **Memory Leaks**: Requests massivos consomem RAM
3. **CPU Starvation**: Queries pesadas bloqueiam outros requests
4. **Noisy Neighbor Problem**: Um tenant mau degrada experiência de todos

---

## 🔄 [EM PROGRESSO] PROBLEMA ALTO #1: ZERO COBERTURA DE TESTES
> **Status**: Em Progresso. Pipeline de testes ativa. AuthService coberto (100%). Outros módulos pendentes.

### Descrição Técnica do Problema

**Configuração Existente**:
- Jest configurado no `package.json`
- Scripts `test`, `test:cov`, `test:e2e` disponíveis
- Estrutura de pastas `test/unit/`, `test/integration/`, `test/e2e/` criadas

**Mas**: Não há ficheiros `*.spec.ts` implementados.

#### Implicações de Não Ter Testes

**1. Impossibilidade de Refactoring Seguro**
- Qualquer mudança pode quebrar funcionalidades existentes
- Sem testes, não há rede de segurança
- Medo de mexer em código legacy
- Debt técnico acumula-se indefinidamente

**2. Bugs Não Capturados**
- Erros só são descobertos por utilizadores em produção
- Edge cases não são testados
- Regression bugs passam despercebidos
- Cada fix pode introduzir novos bugs

**3. Documentação Inexistente**
- Testes servem como documentação viva do comportamento esperado
- Sem testes, comportamento do sistema é ambíguo
- Onboarding de novos devs é muito mais difícil

**4. Confiança Zero em Deployments**
- Cada deploy é um "leap of faith"
- Não há garantia que features core continuam a funcionar
- Rollbacks são manuais e demorados

### Áreas Críticas Sem Testes

**1. Autenticação e Autorização**
- Login flow não testado
- JWT generation/validation não testado
- Role-based access control não verificado
- Multi-tenant isolation não garantido

**2. Business Logic Core**
- Criação de jogadores
- Processamento de pagamentos
- Cálculo de estatísticas
- Validações de negócio

**3. Database Operations**
- Queries Prisma não verificadas
- Transactions não testadas
- Cascade deletes não confirmados
- Soft deletes podem ter bugs

### Estimativa de Coverage Necessária

Para um projeto em produção com utilizadores reais:
- **Minimum viable**: 60% coverage de módulos core
- **Good**: 80% coverage overall
- **Excellent**: 90%+ com mutation testing

**Módulos que DEVEM ter testes**:
1. `auth/` - 90%+ coverage (crítico para segurança)
2. `clubs/` - 80%+ coverage (core do multi-tenant)
3. `players/` - 80%+ coverage (feature principal)
4. `payments/` - 90%+ coverage (dados financeiros)
5. `users/` - 85%+ coverage (gestão de acessos)

---

## ✅ [RESOLVIDO] PROBLEMA ALTO #2: CI/CD PIPELINE INEXISTENTE
> **Status**: Resolvido. GitHub Actions implementado para Build, Lint e Test em cada push.

### Descrição Técnica do Problema

**Estado Atual**:
- Pasta `.github/workflows/` não existe ou está vazia
- Deployments são manuais
- Não há automated checks antes de merge
- Não há rollback automático

#### Consequências de Deployments Manuais

**1. Human Error**
- Esquecer correr migrations
- Deploy do branch errado
- Esquecer atualizar environment variables
- Não fazer backup antes de deploy arriscado

**2. Downtime Não Planeado**
- Deploy manual pode causar minutos/horas de indisponibilidade
- Não há health checks automáticos
- Rollback é manual e demorado
- Utilizadores afetados durante processo

**3. Inconsistência entre Ambientes**
- Dev/Staging/Production podem divergir
- Bugs que funcionam em dev mas falham em prod
- "Works on my machine" syndrome

**4. Slow Velocity**
- Medo de fazer deploy → features demoram a chegar
- Deploys grandes e arriscados vs pequenos e seguros
- Feedback loop lento

### Checks Ausentes

**Pre-Merge Checks (Deviam bloquear PR)**:
- ❌ Linting
- ❌ Type checking
- ❌ Unit tests
- ❌ Integration tests
- ❌ Security scanning (npm audit)
- ❌ Code coverage threshold

**Pre-Deploy Checks**:
- ❌ Database migrations dry-run
- ❌ Build verification
- ❌ Smoke tests
- ❌ Environment variables validation

**Post-Deploy Checks**:
- ❌ Health check endpoint
- ❌ Rollback on failure
- ❌ Notifications (Slack/Email)

---

## 🟠 PROBLEMA ALTO #3: MONITORING E OBSERVABILITY AUSENTES

### Descrição Técnica do Problema

**Não há evidência de**:
- Error tracking (Sentry, Rollbar)
- Logging estruturado (Winston, Pino)
- Performance monitoring (New Relic, DataDog)
- Uptime monitoring
- Alertas automáticos

#### Consequências da Falta de Observability

**1. Descoberta Reativa de Bugs**
- Utilizadores reportam problemas ANTES da equipa saber
- Não há metrics de quantos erros ocorrem
- Impossível priorizar fixes (não sabemos o que falha mais)

**2. Debugging Impossível em Produção**
Quando algo falha:
- Não há stack traces capturados
- Não há contexto do erro (user, club, request)
- Não há logs estruturados para análise
- Debugging é "às cegas"

**3. Performance Degradation Silenciosa**
- Queries lentas não são detectadas
- Memory leaks acumulam-se
- CPU spikes passam despercebidos
- Utilizadores sofrem mas não reportam

**4. Impossibilidade de SLA**
- Não sabemos uptime real
- Não sabemos response times
- Não há baseline para melhorias
- Impossível garantir qualidade de serviço

### Métricas Críticas Não Monitorizadas

**Application Metrics**:
- Request rate (requests/second)
- Error rate (errors/requests)
- Response time (p50, p95, p99)
- Active users/clubs

**Business Metrics**:
- Logins por dia/clube
- Pagamentos processados
- Features mais usadas
- Churn signals

**Infrastructure Metrics**:
- CPU/Memory usage
- Database connections
- Query performance
- Disk space

---

## 🟡 PROBLEMA MÉDIO #1: PRISMA SCHEMA SEM INDEXES EXPLÍCITOS

### Descrição Técnica do Problema

O schema Prisma tem relacionamentos bem desenhados mas **falta indexes explícitos em foreign keys**.

#### Foreign Keys Sem Indexes

**Tabelas Afetadas**:
- `User.clubId` - consultado em TODAS as queries de users
- `Player.clubId` - filtrado constantemente
- `Team.clubId` - usado em joins frequentes
- `Training.teamId` - queries por equipa
- `Payment.playerId` - histórico de pagamentos
- `Payment.status` - filtros por estado

**Queries Afetadas**:
```sql
-- Sem index em clubId, isto é um full table scan:
SELECT * FROM users WHERE club_id = 'uuid';

-- Join sem index é O(n*m):
SELECT * FROM players p
JOIN teams t ON p.team_id = t.id
WHERE p.club_id = 'uuid';

-- Filter em status sem index:
SELECT * FROM payments WHERE status = 'PENDING';
```

#### Performance Degradation com Escala

**Estado Atual (10 clubes, ~1000 rows)**:
- Queries funcionam "suficientemente rápido"
- Full table scans são aceitáveis
- Joins são toleráveis

**Projeção (100 clubes, ~100,000 rows)**:
- Full table scans tornam-se lentos (>500ms)
- Joins multiplicam o problema (>2s)
- Database CPU spike em queries simultâneas
- Outros tenants afetados por queries lentas

**Projeção (1000 clubes, ~1M rows)**:
- Sistema praticamente inutilizável
- Queries timeout frequentemente
- Database fica sobrecarregado
- Necessidade de sharding prematuro

### N+1 Query Problems

Sem indexes adequados, padrões comuns causam N+1:

**Exemplo**: Listar players com seus teams
```typescript
// Busca todos os players (1 query)
const players = await prisma.player.findMany({
  where: { clubId }
});

// Para cada player, busca team (N queries)
for (const player of players) {
  player.team = await prisma.team.findUnique({
    where: { id: player.teamId }
  });
}
```

Sem index em `Player.teamId`, cada lookup é um table scan.

### Composite Indexes Ausentes

Queries típicas filtram por múltiplas colunas:
```sql
-- Pagamentos pendentes de um clube:
SELECT * FROM payments
WHERE club_id = 'uuid' AND status = 'PENDING';

-- Users ativos de um clube com role específico:
SELECT * FROM users
WHERE club_id = 'uuid' AND role = 'COACH' AND is_active = true;
```

Sem composite indexes, database usa apenas um index e filtra o resto em memória.

---

## 🟡 PROBLEMA MÉDIO #2: DATABASE BACKUPS NÃO CONFIGURADOS

### Descrição Técnica do Problema

**Estado Atual**:
- PostgreSQL rodando em Docker (desenvolvimento)
- Não há evidência de backup strategy
- Não há disaster recovery plan
- Não há point-in-time recovery

#### Cenários de Perda de Dados

**1. Falha de Hardware**
- Disk failure no servidor → perda total de dados
- Sem backups, recovery é impossível
- TODOS os clubes perdem TODOS os dados

**2. Human Error**
```sql
-- Alguém acidentalmente roda:
DELETE FROM players; -- Sem WHERE clause
UPDATE payments SET status = 'PAID'; -- Afeta todas as rows
DROP TABLE users; -- Catastrófico
```

Sem backups recentes, dados perdidos permanentemente.

**3. Software Bug**
- Bug na aplicação corrompe dados em massa
- Migration mal feita altera dados incorretamente
- Sem backups, impossível reverter

**4. Security Breach**
- Atacante deleta dados maliciosamente
- Ransomware encripta database
- Sem backups offline, dados são perdidos

### Compliance Requirements

**GDPR Article 32**:
> "ability to restore the availability and access to personal data in a timely manner in the event of a physical or technical incident"

**Sem backups**:
- Violação de GDPR
- Impossível garantir availability
- Multas potenciais

### Backup Strategy Ausente

**Deveria Existir**:
1. **Automated Daily Backups**
   - Full backup diário
   - Incremental backups por hora
   - Retention de 30 dias minimum

2. **Offsite Storage**
   - Backups em location geográfica diferente
   - Protegido contra disaster local

3. **Backup Testing**
   - Recovery drill mensal
   - Verificação de integridade
   - Tempo de recovery documentado

4. **Point-in-Time Recovery**
   - WAL archiving configurado
   - Possibilidade de recovery para qualquer momento
   - Essencial para recovery de data corruption

---

## 🟡 PROBLEMA MÉDIO #3: REDIS CACHING NÃO IMPLEMENTADO

### Descrição Técnica do Problema

**Estado Atual**:
- Redis configurado no `docker-compose.yml`
- Container rodando
- **Mas**: Não integrado na aplicação

#### Queries Que Deveriam Ser Cached

**1. User Lookup em Authentication**
```typescript
// Em CADA request, busca o user:
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { club: true }
});
```

Sem cache, isto vai ao database em TODOS os requests autenticados.

**2. Club Settings**
```typescript
// Settings raramente mudam mas são consultados sempre:
const club = await prisma.club.findUnique({
  where: { id: clubId },
  select: { settings: true }
});
```

**3. Player Statistics**
```typescript
// Stats são calculados e demoram:
const stats = await calculatePlayerStats(playerId);
```

#### Performance Impact

**Sem Cache**:
- Database hit rate: ~100% (tudo vai ao DB)
- Average query time: 10-50ms
- Database connections: constantly maxed out
- Response time: 200-500ms

**Com Cache (estimativa)**:
- Cache hit rate: ~80-90%
- Cached query time: <1ms
- Database connections: underutilized
- Response time: 50-100ms

**Escalabilidade**:
- 100 clubes × 10 users × 100 requests/day = 100,000 database queries
- Com 90% cache hit rate = 10,000 database queries
- **10x reduction em database load**

---

## 🟢 PONTOS FORTES DO PROJETO

### Arquitetura Bem Desenhada

**1. Prisma Schema**
- ✅ Multi-tenancy bem implementado via `clubId`
- ✅ Enums tipados (UserRole, PaymentStatus, etc.)
- ✅ Relacionamentos bem definidos
- ✅ Soft deletes implementados (`deletedAt`)
- ✅ Audit fields (createdAt, updatedAt)

**2. Estrutura Modular**
- ✅ Separação clara por domínios (auth, clubs, players, etc.)
- ✅ Seguir convenções NestJS
- ✅ DTOs e Entities separados (estrutura criada)

**3. Stack Tecnológico Sólido**
- ✅ NestJS - framework enterprise-grade
- ✅ Prisma - ORM moderno e type-safe
- ✅ PostgreSQL - database robusto
- ✅ Docker - containerização adequada

### Bibliotecas Corretas Instaladas

- ✅ class-validator / class-transformer para validação
- ✅ @nestjs/jwt / passport para auth
- ✅ bcrypt para password hashing
- ✅ @nestjs/throttler para rate limiting
- ✅ @nestjs/swagger para documentação

**Problema**: Bibliotecas instaladas mas não configuradas/usadas.

---

## 📊 MATRIZ DE PRIORIDADES

### 🔴 URGENTE (Próximas 48-72h)

1. **TypeScript Strict Mode** - Fundação de qualidade
2. **JWT Secrets Rotation** - Segurança básica
3. **Input Validation** - Prevenir data corruption
4. **Rate Limiting** - Prevenir abuse

### 🟠 ALTA PRIORIDADE (1-2 Semanas)

1. **Test Coverage Core Modules** - Confiança para iterar
2. **CI/CD Pipeline** - Automated quality checks
3. **Error Monitoring** - Visibility de problemas

### 🟡 MÉDIA PRIORIDADE (2-4 Semanas)

1. **Database Indexes** - Performance com escala
2. **Automated Backups** - Disaster recovery
3. **Redis Caching** - Otimização de performance

### 🟢 BAIXA PRIORIDADE (Backlog)

1. **E2E Tests** - Confidence em critical flows
2. **Performance Monitoring** - Detailed metrics
3. **Documentation** - API docs completa

---

## 🎯 OBJETIVOS MENSURÁVEIS

### Qualidade de Código
- **Baseline**: 0% test coverage, TypeScript lax
- **Target**: 60%+ coverage, strict mode ativo
- **Metric**: Jest coverage report + tsc --noEmit

### Segurança
- **Baseline**: Secrets fracos, sem validação
- **Target**: Secrets fortes rotacionados, validação global
- **Metric**: Security audit pass, npm audit clean

### Performance
- **Baseline**: Desconhecido (sem monitoring)
- **Target**: p95 < 200ms, database queries < 100ms
- **Metric**: APM metrics (após implementar monitoring)

### Deployment
- **Baseline**: Manual, ~30min, downtime possível
- **Target**: Automated, <5min, zero downtime
- **Metric**: Deployment frequency, MTTR (mean time to recovery)

---

## 🚨 RED FLAGS PARA O AGENTE

### Coisas a NÃO Fazer

1. **NÃO fazer breaking changes** sem migration path
2. **NÃO commitrar secrets** em nenhum ficheiro
3. **NÃO modificar Prisma schema** sem criar migration
4. **NÃO apagar código** sem confirmar que não é usado
5. **NÃO fazer deploy** automático sem aprovação

### Validações Essenciais

Após cada modificação, o agente deve:
1. ✅ Confirmar que `npm run build` funciona
2. ✅ Confirmar que `npm run lint` passa
3. ✅ Confirmar que `npx prisma validate` passa
4. ✅ Criar commit atómico com mensagem descritiva

### Approach Incremental

- Fazer mudanças em **branches separadas**
- Um problema por vez
- Commits pequenos e testáveis
- Possibilidade de rollback em qualquer passo

---

## 📚 CONTEXTO ADICIONAL

### Multi-Tenancy É CRÍTICO

Qualquer falha no isolamento multi-tenant é **catastrófica**:
- Um clube não pode NUNCA ver dados de outro
- Queries devem SEMPRE filtrar por `clubId`
- Guards devem SEMPRE validar tenant do user
- Testes devem SEMPRE verificar isolamento

### Dados Pessoais Sensíveis

Sistema gere dados de **menores de idade**:
- Requer proteções GDPR extras
- Consentimento parental necessário
- Retention policies específicas
- Direito ao esquecimento (delete cascade)

### Financial Data

Sistema processa **pagamentos reais**:
- Reconciliação de pagamentos é crítica
- Auditoria completa necessária
- Compliance com regulações financeiras
- Estados de pagamento são state machines

---

## 🔍 ANÁLISE FORENSE NECESSÁRIA

Antes de começar correções, o agente deve:

1. **Escanear repositório completo**
   - Contar usos de `any`
   - Identificar ficheiros sem types
   - Mapear dependências entre módulos

2. **Analisar código implementado**
   - Que controllers existem realmente?
   - Que services têm lógica de negócio?
   - Onde estão os security holes?

3. **Verificar histórico Git**
   - Secrets alguma vez foram commitados?
   - Qual é o padrão de commits?
   - Há branches órfãs?

4. **Validar ambiente**
   - Produção existe? Onde?
   - Que environment variables estão configuradas?
   - CI/CD parcialmente implementado?

---

## 💡 FILOSOFIA DE CORREÇÃO

### Princípios Orientadores

1. **Segurança First** - Nenhuma correção que reduza segurança
2. **Não Quebrar Produção** - Utilizadores reais dependem do sistema
3. **Incremental Progress** - Melhorias pequenas e contínuas
4. **Automated Validation** - Tooling deve capturar problemas
5. **Documentation** - Cada decisão deve ser documentada

### Definição de "Feito"

Uma correção está completa quando:
- ✅ Código compila sem warnings
- ✅ Linter passa sem erros
- ✅ Testes existentes passam (se houver)
- ✅ Documentação atualizada
- ✅ Commit message explica o "porquê"

---

## 📞 QUESTÕES PARA O HUMANO

Antes de implementar correções, confirmar:

1. **Produção**: Sistema já está em produção real? Onde?
2. **Utilizadores**: Quantos clubes/users ativos existem?
3. **Dados**: Há dados reais sensíveis já no sistema?
4. **Timeline**: Qual é a urgência? Há deadline?
5. **Recursos**: Há budget para ferramentas pagas (Sentry, etc.)?
6. **Prioridades**: Qual problema resolver primeiro?

---

**FIM DO CONTEXTO TÉCNICO**

Este documento fornece a base técnica completa para o agente Antigravity entender os problemas críticos do NovaScore e propor soluções adequadas que:
- Resolvam vulnerabilidades de segurança
- Melhorem type safety e qualidade
- Não quebrem funcionalidade existente
- Sejam incrementais e testáveis
- Preparem o sistema para escala

O agente deve ler este contexto completo antes de propor qualquer modificação ao código.