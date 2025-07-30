# Railway Frontend Deployment - Static Files Only
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build arguments for environment variables (Railway passes these automatically)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_ROLE_KEY

# Set environment variables for build time
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
ENV SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
ENV NODE_ENV=production

# Build the frontend application
RUN echo "[Railway Docker Build] Environment check:" && \
    echo "VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:0:50}..." && \
    echo "VITE_SUPABASE_ANON_KEY present: $(test -n "$VITE_SUPABASE_ANON_KEY" && echo yes || echo no)" && \
    echo "[Railway Docker Build] Building frontend..." && \
    npx vite build --config vite.config.railway.ts && \
    echo "[Railway Docker Build] Verifying build output:" && \
    ls -la dist/public/ && \
    test -f dist/public/index.html && echo "✅ index.html created" || echo "❌ index.html missing"

# Production stage with Caddy web server
FROM caddy:2-alpine

WORKDIR /srv

# Copy Caddy configuration
COPY Caddyfile /etc/caddy/Caddyfile

# Copy built frontend from builder stage
COPY --from=builder /app/dist/public /srv

# Create health endpoint
RUN echo '{"status":"healthy","service":"bfl-customer-service"}' > /srv/health

# Railway sets PORT environment variable
ENV PORT=3000

# Create Caddy config that uses Railway's PORT variable - Fixed JSON escaping
RUN cat > /etc/caddy/Caddyfile << 'EOF'
# Railway Auto-Generated Caddy Config
:{$PORT:3000} {
  root * /srv
  try_files {path} /index.html
  file_server
  
  handle /health {
    header Content-Type application/json
    respond `{"status":"healthy","service":"railway-frontend","timestamp":"{time.now.unix}"}`
  }
  
  handle /api/health {
    header Content-Type application/json
    respond `{"status":"healthy","service":"railway-frontend","timestamp":"{time.now.unix}"}`
  }
  
  log {
    output stdout
    format console
  }
}
EOF

# Expose the port
EXPOSE $PORT

# Start Caddy web server
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]