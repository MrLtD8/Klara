ARG BUILD_FROM

# ── Steg 1: Bygg React-appen ─────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app
COPY app/package*.json ./
RUN npm ci
COPY app/ .
RUN npm run build

# ── Steg 2: Kör Node.js-server ───────────────────────────────
FROM node:18-alpine
WORKDIR /srv

# Installera express (enda beroende för servern)
RUN npm install express@4 --save --prefix /srv

# Kopiera det byggda React-bygget
COPY --from=builder /app/build ./public

# Kopiera servern
COPY server.js .

EXPOSE 3000
CMD ["node", "server.js"]
