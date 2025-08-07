#!/bin/bash
echo "[Railway] Starting Caddy static server..."
echo "[Railway] PORT: $PORT"
echo "[Railway] PWD: $(pwd)"
echo "[Railway] Files available:"
ls -la
echo "[Railway] Checking dist/public:"
ls -la dist/public/ || echo "dist/public not found"
echo "[Railway] Starting Caddy..."
caddy run --config Caddyfile --adapter caddyfile