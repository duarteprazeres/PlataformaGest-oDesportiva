# ============================================================
# Stage 1: Builder
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências de sistema necessárias para bcrypt e outros módulos nativos
RUN apk add --no-cache python3 make g++

# Copia manifests de dependências
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

# Instala todas as dependências (incluindo devDependencies para o build)
RUN npm install --workspace=apps/backend

# Copia código fonte do backend
COPY apps/backend ./apps/backend

WORKDIR /app/apps/backend

# Gera cliente Prisma
RUN npx prisma generate

# Compila TypeScript → JavaScript
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
RUN npm install --workspace=apps/backend --omit=dev

# Copia o build compilado
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Copia o schema Prisma e migrações (necessário para migrate deploy)
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma

# Copia o cliente Prisma gerado
COPY --from=builder /app/apps/backend/node_modules/.prisma ./apps/backend/node_modules/.prisma
COPY --from=builder /app/apps/backend/node_modules/@prisma ./apps/backend/node_modules/@prisma

WORKDIR /app/apps/backend

EXPOSE 3000

# Corre migrações e arranca — o path correto é dist/src/main
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]

