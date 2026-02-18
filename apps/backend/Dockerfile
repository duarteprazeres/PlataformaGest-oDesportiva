# ============================================================
# Stage 1: Builder
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Dependências de sistema para bcrypt e módulos nativos
RUN apk add --no-cache python3 make g++

# Copia manifests
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

# Instala TODAS as dependências (incluindo dev) no builder
RUN npm install --workspace=apps/backend --legacy-peer-deps

# Copia código fonte
COPY apps/backend ./apps/backend

WORKDIR /app/apps/backend

# Gera cliente Prisma (cria node_modules/.prisma dentro do builder)
RUN npx prisma generate

# Compila TypeScript
RUN npm run build

# ============================================================
# Stage 2: Production
# ============================================================
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache python3 make g++

ENV NODE_ENV=production

# Copia manifests
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

# Instala apenas dependências de produção
RUN npm install --workspace=apps/backend --omit=dev --legacy-peer-deps

WORKDIR /app/apps/backend

# Copia o build compilado do stage builder
COPY --from=builder /app/apps/backend/dist ./dist

# Copia schema e migrações Prisma
COPY --from=builder /app/apps/backend/prisma ./prisma

# Copia o cliente Prisma gerado (caminho correto dentro do workspace)
COPY --from=builder /app/apps/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/apps/backend/node_modules/@prisma/client ./node_modules/@prisma/client

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
