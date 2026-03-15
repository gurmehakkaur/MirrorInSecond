# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# ── Frontend ──────────────────────────────────────────────────────────────────
WORKDIR /app/my-app

COPY my-app/package*.json ./
RUN npm ci

COPY my-app/ ./
RUN npm run build

# Confirm standalone was produced
RUN ls .next/standalone/server.js

# ── Backend ───────────────────────────────────────────────────────────────────
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci --omit=dev

COPY server/ ./

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# Backend (Express on port 4000 internally)
COPY --from=builder /app/server ./server

# Frontend — Next.js standalone + static assets + public
COPY --from=builder /app/my-app/.next/standalone/ ./frontend/
COPY --from=builder /app/my-app/.next/static/     ./frontend/.next/static/
COPY --from=builder /app/my-app/public/           ./frontend/public/

# Start script
COPY start.sh ./
RUN chmod +x start.sh

EXPOSE 8080

CMD ["sh", "start.sh"]
