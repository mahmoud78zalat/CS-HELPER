import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./simple-routes";
import { validateRailwayEnvironment, optimizeForRailway } from "./railway-config";
import { createRailwayServer, startRailwayServer } from "./railway-startup";
import path from "path";
import fs from "fs";

// Create Railway-optimized Express app
const app = createRailwayServer();

// Production logging function (no vite dependency)
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit", 
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const requestPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (requestPath.startsWith("/api")) {
      let logLine = `${req.method} ${requestPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log('[Railway] 🚂 Starting Railway production deployment...');
    
    // Configure for Railway deployment
    const config = validateRailwayEnvironment();
    optimizeForRailway();
    
    // Register API routes including debug endpoints
    registerRoutes(app);
    
    // Add Railway debug endpoints for production troubleshooting
    const { railwaySupabaseDebug, railwayHealthCheck } = await import('./railway-supabase-debug');
    app.get('/api/railway/supabase-debug', railwaySupabaseDebug);
    app.get('/api/railway/health', railwayHealthCheck);
    
    console.log('[Railway] ✅ Debug endpoints added: /api/railway/supabase-debug, /api/railway/health');
    
    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error('[Railway] Express error:', err);
      res.status(status).json({ message });
    });

    // Production static file serving (NO VITE DEPENDENCIES)
    console.log('[Railway] Setting up production static file serving...');
    const distPath = path.resolve(process.cwd(), "dist", "public");
    
    console.log('[Railway] Checking static files directory:', distPath);
    console.log('[Railway] Directory exists:', fs.existsSync(distPath));
    if (fs.existsSync(distPath)) {
      const files = fs.readdirSync(distPath);
      console.log('[Railway] Static files found:', files);
    }
    
    if (fs.existsSync(distPath)) {
      // Serve static files with proper headers and longer cache for assets
      app.use('/assets', express.static(path.join(distPath, 'assets'), {
        maxAge: '1y', // Cache assets for longer since they have content hashes
        etag: true,
        lastModified: true
      }));
      
      // Serve other static files (like favicon, etc.)
      app.use(express.static(distPath, {
        maxAge: '1d',
        etag: false,
        lastModified: false
      }));
      
      console.log('[Railway] ✅ Static files served from:', distPath);
      console.log('[Railway] ✅ Assets served from:', path.join(distPath, 'assets'));
      
      // Serve index.html for all non-API routes (SPA routing)
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
          return next();
        }
        
        console.log('[Railway] Serving index.html for route:', req.path);
        const indexPath = path.join(distPath, 'index.html');
        
        if (fs.existsSync(indexPath)) {
          // Set proper headers for HTML
          res.set({
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache'
          });
          res.sendFile(indexPath);
        } else {
          console.error('[Railway] index.html not found at:', indexPath);
          res.status(404).json({ error: 'Frontend not found' });
        }
      });
    } else {
      console.error('[Railway] ⚠️ Static build directory not found:', distPath);
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
          return next();
        }
        res.status(404).json({ error: 'Static files not built', path: distPath });
      });
    }

    // Start the Railway server
    await startRailwayServer(app);
    
  } catch (error) {
    console.error('[Railway] 💥 Critical startup error:', error);
    process.exit(1);
  }
})();