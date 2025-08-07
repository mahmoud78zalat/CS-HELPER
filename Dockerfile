# Railway Express.js Full-Stack Deployment
FROM node:20-alpine

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

# Build both frontend and backend
RUN echo "[Railway Docker Build] Environment check:" && \
    echo "VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:0:50}..." && \
    echo "VITE_SUPABASE_ANON_KEY present: $(test -n "$VITE_SUPABASE_ANON_KEY" && echo yes || echo no)" && \
    echo "[Railway Docker Build] Building frontend..." && \
    npx vite build && \
    echo "[Railway Docker Build] Building backend..." && \
    npx esbuild server/index.production.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --external:vite --external:@replit/* --external:pg-native --external:cpu-features && \
    echo "[Railway Docker Build] Verifying build output:" && \
    ls -la dist/ && \
    test -f dist/public/index.html && echo "✅ Frontend built" || echo "❌ Frontend missing" && \
    test -f dist/index.production.js && echo "✅ Backend built" || echo "❌ Backend missing"

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Railway sets PORT environment variable
ENV PORT=3000

# Expose the port
EXPOSE $PORT

# Start the Express.js server
CMD ["node", "dist/index.production.js"]