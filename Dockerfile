# Multi-stage build for Railway deployment
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_ROLE_KEY

# Set environment variables for build
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
ENV SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}

# Build the application
RUN echo "[Docker Build] Environment check:" && \
    echo "[Docker Build] VITE_SUPABASE_URL:" $VITE_SUPABASE_URL && \
    echo "[Docker Build] VITE_SUPABASE_ANON_KEY length:" ${#VITE_SUPABASE_ANON_KEY} && \
    NODE_ENV=production npx vite build --config vite.config.railway.ts && \
    echo "[Docker Build] Build completed, checking output:" && \
    ls -la dist/public/

# Production stage with Caddy
FROM caddy:2-alpine

WORKDIR /app

# Copy Caddy configuration
COPY Caddyfile ./

# Copy built application from build stage
COPY --from=build /app/dist/public ./dist/public

# Expose port (Railway will set PORT env var)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/health || exit 1

# Start Caddy
CMD ["caddy", "run", "--config", "Caddyfile", "--adapter", "caddyfile"]