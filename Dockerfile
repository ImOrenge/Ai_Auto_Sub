# Stage 1: Build dependencies and the application
FROM node:20 AS builder
WORKDIR /app

# Install system dependencies for native modules (canvas, etc.)
RUN apt-get update && apt-get install -y \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libpixman-1-dev \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps --no-audit

# Copy source and build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Providing build-time env vars to satisfy assertEnv in lib/env.ts
ENV NEXT_PUBLIC_SUPABASE_URL=https://jzoklqdfjqeshonnkywr.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6b2tscWRmanFlc2hvbm5reXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNjI1NTUsImV4cCI6MjA4MDkzODU1NX0.uDu3u90ohyxOXgcv9bOI5MhKuby8tap1z3tM0XxHwoM
ENV SUPABASE_SERVICE_ROLE_KEY=placeholder
ENV OPENAI_API_KEY=placeholder
RUN npm run build

# Stage 2: Runner
FROM node:20-slim AS runner
WORKDIR /app

# Install runtime dependencies (ffmpeg, canvas libraries, and Korean fonts)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libcairo2 \
    libpango-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    libpixman-1-0 \
    fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Create and use a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
USER nextjs

# Copy built artifacts from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy fonts for custom rendering (needed for subtitle effects)
COPY --from=builder --chown=nextjs:nodejs /app/lib/render/fonts ./lib/render/fonts

EXPOSE 8080

CMD ["node", "server.js"]
