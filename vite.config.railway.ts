import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * Railway-specific Vite configuration
 * Includes environment variable handling for Railway deployment
 */
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  console.log('[Railway Build] Environment variables check:');
  console.log('[Railway Build] VITE_SUPABASE_URL:', env.VITE_SUPABASE_URL ? 'Present' : 'Missing');
  console.log('[Railway Build] VITE_SUPABASE_ANON_KEY:', env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing');
  console.log('[Railway Build] NODE_ENV:', process.env.NODE_ENV);
  console.log('[Railway Build] MODE:', mode);
  
  return {
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
    base: "/", // Critical: Must be "/" for Railway, not "./"
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
    define: {
      // Explicitly pass environment variables to build
      __VITE_SUPABASE_URL__: JSON.stringify(env.VITE_SUPABASE_URL),
      __VITE_SUPABASE_ANON_KEY__: JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      __SUPABASE_SERVICE_ROLE_KEY__: JSON.stringify(env.SUPABASE_SERVICE_ROLE_KEY),
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});