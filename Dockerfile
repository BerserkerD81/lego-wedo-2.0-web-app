# ── Stage 1: build frontend ────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Native modules need python + make + g++
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: production runtime ────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install only production dependencies (rebuilds native modules for this arch)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built frontend and server source
COPY --from=builder /app/dist ./dist
COPY server ./server

# SQLite data will be mounted as a volume
RUN mkdir -p /app/data

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "server/index.js"]
