# ============================================================
# Stage 1: Builder
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++ openssl

# Copia manifests da raiz e do backend
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

# Instala dependências
RUN npm install --workspace=apps/backend --legacy-peer-deps

# Copia schema Prisma e código fonte
COPY apps/backend ./apps/backend

# Gera cliente Prisma — vai para /app/node_modules/.prisma (raiz do monorepo)
RUN cd apps/backend && npx prisma generate

# Compila TypeScript
RUN cd apps/backend && npm run build

# ============================================================
# Stage 2: Production
# ============================================================
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache python3 make g++ openssl

ENV NODE_ENV=production

# Copia manifests
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

# Instala apenas dependências de produção
RUN npm install --workspace=apps/backend --omit=dev --legacy-peer-deps

# Copia build compilado
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Copia schema e migrações Prisma
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma

# Copia cliente Prisma da RAIZ do monorepo (onde realmente está)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

WORKDIR /app/apps/backend

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]

