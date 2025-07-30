# Use Node.js 20 LTS (matching your project setup)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files (only package.json and package-lock.json for npm)
COPY package.json package-lock.json* ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build the application with Railway-specific configuration
RUN NODE_ENV=production npx vite build --config vite.config.railway.ts && \
    npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist \
    --external:@replit/* --external:pg-native --external:cpu-features --external:vite

# Remove dev dependencies after build
RUN npm prune --production

# Expose port
EXPOSE 8080

# Start the application using Railway-specific startup script
CMD ["node", "railway-start.js"]