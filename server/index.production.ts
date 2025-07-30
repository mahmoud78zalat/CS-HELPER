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
    
    // Register API routes
    registerRoutes(app);
    
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

    // Start the Railway server
    await startRailwayServer(app);
    
  } catch (error) {
    console.error('[Railway] 💥 Critical startup error:', error);
    process.exit(1);
  }
})();