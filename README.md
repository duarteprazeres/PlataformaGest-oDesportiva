# 🏆 NovaScore - Plataforma de Gestão Desportiva (SaaS)

Uma plataforma multi-tenant robusta para gestão de clubes de futebol, focada na segurança, escalabilidade e conformidade com o RGPD.

## 🚀 Visão Geral Técnica

### Backend (`apps/backend`)
- **Framework**: NestJS (v10+)
- **Linguagem**: TypeScript (Strict Mode)
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Segurança**:
  - JWT Authentication (Access + Refresh Tokens)
  - RBAC (Role-Based Access Control)
  - Rate Limiting (ThrottlerModule)
  - Security Headers (Helmet)
  - Input Validation (class-validator + strict whitelist)
- **CI/CD**: GitHub Actions

### Mobile (`apps/mobile`)
- **Framework**: Flutter 3.16+
- **Plataformas**: Android & iOS

---

## 🛠️ Configuração do Projeto

### Pré-requisitos
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 (ou via Docker)

### Instalação

1. **Clonar o repositório**
   ```bash
   git clone <repo-url>
   cd PlataformaGest-oDesportiva
   npm install
   ```

2. **Configurar Variáveis de Ambiente**
   ⚠️ **Crítico**: O sistema **não arranca** sem as variáveis de segurança configuradas.
   
   Copie o exemplo e preencha com valores seguros:
   ```bash
   cp .env.example .env
   ```
   
   Certifique-se de definir:
   - `JWT_SECRET`: Uma string longa e aleatória.
   - `DATABASE_URL`: Connection string do PostgreSQL.
   - `RATE_LIMIT_TTL/MAX`: Configuração de throttling.

3. **Iniciar Base de Dados (Docker)**
   ```bash
   npm run docker:up
   ```

4. **Setup da Base de Dados**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npm run db:seed  # Opcional: Popular com dados de teste
   ```

5. **Iniciar Backend**
   ```bash
   # Modo Desenvolvimento
   npm run start:dev
   
   # Modo Produção
   npm run build
   npm run start:prod
   ```

---

## ✅ Estado do Projeto

### Fase de Estabilização (Concluída - Fev 2026)
- **Type Safety**: `strict: true` ativado, `no-explicit-any` enforced.
- **Segurança**: Rotação de segredos, proteção contra força bruta e headers HTTP seguros implementados.
- **CI/CD**: Pipeline de testes e linting automatizado via GitHub Actions.

### Funcionalidades Core
- **Gestão de Clubes**: Multi-tenancy isolado.
- **Atletas & Equipas**: Gestão completa de plantéis e escalões.
- **Treinos**: Marcação de presenças, bloqueio de treinos e gestão de sanções.
- **Rescisões (Modelo 2)**: Fluxo formal de saída de atletas com geração de documentação.

---

## 📚 Documentação Técnica

Para detalhes aprofundados sobre a arquitetura, decisões técnicas e dívida técnica resolvida, consulte:
- [CONTEXT.md](./CONTEXT.md): Resumo técnico e status atual.
- [CONTEXT2.md](./CONTEXT2.md): Análise técnica detalhada e auditoria.

---

## 🧪 Testes

O projeto possui uma suite de testes em expansão:

```bash
# Testes Unitários
npm run test

# Testes E2E (Em breve)
npm run test:e2e

# Cobertura de Testes
npm run test:cov
```

---

## 📄 Licença

Proprietário. Todos os direitos reservados.
