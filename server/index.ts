import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./simple-routes";
import { serveStatic, log } from "./vite";
import { validateRailwayEnvironment, optimizeForRailway } from "./railway-config";
import { createRailwayServer, startRailwayServer } from "./railway-startup";

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
        serveStatic(app);
      }
    } else {
      console.log('[Railway] Setting up production static file serving...');
      serveStatic(app);
    }

    // Start the Railway server
    await startRailwayServer(app);
    
  } catch (error) {
    console.error('[Railway] 💥 Critical startup error:', error);
    process.exit(1);
  }
})();
