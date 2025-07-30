import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * Railway-specific Vite configuration
 * Excludes Replit-specific plugins that cause build failures
 */
export default defineConfig({
  plugins: [
    react(),
    // No Replit plugins for Railway deployment
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      external: [
        // Externalize Node.js built-ins that shouldn't be bundled
        'fs', 'path', 'os', 'crypto', 'util', 'stream',
        'node:fs', 'node:path', 'node:crypto', 'node:util'
      ]
    }
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});