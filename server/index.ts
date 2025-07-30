import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./simple-routes";
import { validateRailwayEnvironment, optimizeForRailway } from "./railway-config";
import { createRailwayServer, startRailwayServer } from "./railway-startup";

// Production-safe vite imports
let serveStatic: any = null;
let log: any = console.log;

// Load vite only in development
async function loadViteIfNeeded() {
  if (process.env.NODE_ENV === 'development') {
    try {
      const viteModule = await import("./vite");
      serveStatic = viteModule.serveStatic;
      log = viteModule.log;
      console.log('[Railway] Vite modules loaded for development');
    } catch (error) {
      console.log('[Railway] Vite not available - using production fallbacks');
    }
  }
}

// Create Railway-optimized Express app
const app = createRailwayServer();

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
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
    console.log('[Railway] 🚂 Starting Railway deployment...');
    
    // Configure for Railway deployment
    const config = validateRailwayEnvironment();
    optimizeForRailway();
    
    // Load Vite only if needed (development mode)
    await loadViteIfNeeded();
    
    // Register API routes BEFORE Vite setup
    registerRoutes(app);
    
    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error('[Railway] Express error:', err);
      res.status(status).json({ message });
    });

    // Setup development/production serving
    if (process.env.NODE_ENV === "development") {
      console.log('[Railway] Setting up development mode with Vite...');
      try {
        const server = await import("http").then(http => http.createServer(app));
        const { setupVite } = await import("./vite");
        await setupVite(app, server);
      } catch (error) {
        console.error('[Railway] Vite setup failed, falling back to static serving:', error);
        if (serveStatic) {
          serveStatic(app);
        } else {
          console.log('[Railway] No static server available');
        }
      }
    } else {
      console.log('[Railway] Setting up production static file serving...');
      if (serveStatic) {
        serveStatic(app);
      } else {
        // Production fallback static server using express.static
        const path = await import("path");
        const fs = await import("fs");
        const distPath = path.resolve(process.cwd(), "dist", "public");
        
        if (fs.existsSync(distPath)) {
          app.use(express.static(distPath));
          console.log('[Railway] ✅ Static files served from:', distPath);
          
          // Serve index.html for all non-API routes (SPA routing)
          app.get('*', (req, res) => {
            if (!req.path.startsWith('/api')) {
              res.sendFile(path.join(distPath, 'index.html'));
            }
          });
        } else {
          console.log('[Railway] ⚠️ Static build directory not found:', distPath);
        }
      }
    }

    // Start the Railway server
    await startRailwayServer(app);
    
  } catch (error) {
    console.error('[Railway] 💥 Critical startup error:', error);
    process.exit(1);
  }
})();
