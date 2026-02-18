# ============================================================
# Stage 1: Builder
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++ openssl

COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

RUN npm install --workspace=apps/backend --legacy-peer-deps

COPY apps/backend ./apps/backend

RUN cd apps/backend && npx prisma generate

RUN cd apps/backend && npm run build

# ============================================================
# Stage 2: Production
# ============================================================
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache python3 make g++ openssl

ENV NODE_ENV=production

COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

RUN npm install --workspace=apps/backend --omit=dev --legacy-peer-deps

COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copia o binário prisma CLI correcto directamente do builder (versão 5.x)
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

WORKDIR /app/apps/backend

EXPOSE 3000

CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/src/main.js"]

