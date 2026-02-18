# ============================================================
# Stage 1: Builder
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY apps/web/package*.json ./apps/web/

RUN npm install --workspace=apps/web

COPY apps/web ./apps/web

WORKDIR /app/apps/web

# URL do backend — injetada em build time pela Railway
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# ============================================================
# Stage 2: Production
# ============================================================
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

# O standalone já inclui tudo o que precisa
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3001

CMD ["node", "apps/web/server.js"]
