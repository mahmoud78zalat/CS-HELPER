# Static site deployment with Caddy - Railway recommended approach
FROM caddy:alpine

# Set working directory
WORKDIR /app

# Install Node.js for building
RUN apk add --no-cache nodejs npm

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build the frontend application
RUN NODE_ENV=production npx vite build --config vite.config.railway.ts

# Copy Caddyfile
COPY Caddyfile /etc/caddy/Caddyfile

# Expose port
EXPOSE $PORT

# Start Caddy with our configuration
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]