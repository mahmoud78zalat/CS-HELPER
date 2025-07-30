# Single-stage build for Railway deployment
FROM node:20-alpine

WORKDIR /app

# Install Caddy
RUN apk add --no-cache caddy

# Copy package files and install dependencies
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
RUN echo "[Railway Docker] Environment variables:" && \
    echo "VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:0:30}..." && \
    echo "VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY:0:50}..." && \
    NODE_ENV=production npx vite build --config vite.config.railway.ts && \
    echo "[Railway Docker] Build completed:" && \
    ls -la dist/public/ && \
    echo "[Railway Docker] Cleaning up dev dependencies..." && \
    npm prune --production

# Expose port
EXPOSE $PORT

# Start Caddy
CMD ["sh", "-c", "echo '[Railway Docker] Starting Caddy on port $PORT' && caddy run --config Caddyfile --adapter caddyfile"]