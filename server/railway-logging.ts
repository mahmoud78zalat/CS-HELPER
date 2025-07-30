/**
 * Enhanced Railway Logging System
 * Provides comprehensive logging for debugging Railway deployment issues
 */

export interface LogContext {
  requestId?: string;
  timestamp?: string;
  component?: string;
  userId?: string;
  sessionId?: string;
}

export class RailwayLogger {
  private static instance: RailwayLogger;
  private logBuffer: string[] = [];
  private maxBufferSize = 1000;

  private constructor() {}

  public static getInstance(): RailwayLogger {
    if (!RailwayLogger.instance) {
      RailwayLogger.instance = new RailwayLogger();
    }
    return RailwayLogger.instance;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const requestId = context?.requestId || 'global';
    const component = context?.component || 'railway';
    
    const formatted = `[${timestamp}] [${level.toUpperCase()}] [${component}:${requestId}] ${message}`;
    
    // Add to buffer for debugging
    this.addToBuffer(formatted);
    
    return formatted;
  }

  private addToBuffer(message: string): void {
    this.logBuffer.push(message);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  public info(message: string, context?: LogContext): void {
    console.log(this.formatMessage('info', message, context));
  }

  public warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  public error(message: string, error?: Error, context?: LogContext): void {
    const errorMessage = error ? `${message} - ${error.message}` : message;
    console.error(this.formatMessage('error', errorMessage, context));
    
    if (error?.stack) {
      console.error(`[Error Stack] ${error.stack}`);
    }
  }

  public debug(message: string, data?: any, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development' || process.env.RAILWAY_DEBUG === 'true') {
      const debugMessage = data ? `${message} - Data: ${JSON.stringify(data, null, 2)}` : message;
      console.debug(this.formatMessage('debug', debugMessage, context));
    }
  }

  public logRequest(req: any, context?: LogContext): void {
    const requestContext = {
      ...context,
      requestId: context?.requestId || Math.random().toString(36).substr(2, 9)
    };

    this.info(`${req.method} ${req.url}`, requestContext);
    this.debug('Request Headers', req.headers, requestContext);
    
    if (req.body && Object.keys(req.body).length > 0) {
      this.debug('Request Body', req.body, requestContext);
    }

    if (req.query && Object.keys(req.query).length > 0) {
      this.debug('Request Query', req.query, requestContext);
    }

    if (req.params && Object.keys(req.params).length > 0) {
      this.debug('Request Params', req.params, requestContext);
    }
  }

  public logResponse(res: any, duration: number, body?: any, context?: LogContext): void {
    this.info(`Response ${res.statusCode} (${duration}ms)`, context);
    
    if (body && typeof body === 'object') {
      this.debug('Response Body', body, context);
    } else if (body && typeof body === 'string' && body.length < 500) {
      this.debug('Response Body', { body }, context);
    }
  }

  public logEnvironment(): void {
    this.info('=== Railway Environment Check ===');
    
    const criticalEnvVars = [
      'NODE_ENV',
      'PORT', 
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SESSION_SECRET',
      'DATABASE_URL'
    ];

    criticalEnvVars.forEach(varName => {
      const value = process.env[varName];
      if (varName.includes('KEY') || varName.includes('SECRET') || varName.includes('URL')) {
        this.info(`${varName}: ${value ? '✓ SET (' + value.substring(0, 15) + '...)' : '✗ MISSING'}`);
      } else {
        this.info(`${varName}: ${value || 'NOT SET'}`);
      }
    });

    // List all Railway-related env vars
    const railwayVars = Object.keys(process.env).filter(key => 
      key.startsWith('RAILWAY_') || 
      key.startsWith('VITE_') ||
      key.startsWith('SUPABASE_') ||
      key.includes('SECRET') ||
      key === 'PORT' ||
      key === 'NODE_ENV'
    );

    this.info(`Available Railway vars: ${railwayVars.join(', ')}`);
    this.info('=== End Environment Check ===');
  }

  public logSystemInfo(): void {
    this.info('=== Railway System Information ===');
    this.info(`Node.js Version: ${process.version}`);
    this.info(`Platform: ${process.platform}`);
    this.info(`Architecture: ${process.arch}`);
    this.info(`Process PID: ${process.pid}`);
    this.info(`Uptime: ${process.uptime()} seconds`);
    
    const memUsage = process.memoryUsage();
    const memoryData = {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)} MB`
    };
    this.debug('Memory Usage', memoryData);
    this.info('=== End System Information ===');
  }

  public getLogBuffer(): string[] {
    return [...this.logBuffer];
  }

  public clearLogBuffer(): void {
    this.logBuffer = [];
  }

  public exportLogs(): string {
    return this.logBuffer.join('\n');
  }
}

// Create global logger instance
export const logger = RailwayLogger.getInstance();

// Express middleware for logging
export function createLoggingMiddleware() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    const requestId = Math.random().toString(36).substr(2, 9);
    const context = { requestId, component: 'express' };

    // Log the request
    logger.logRequest(req, context);

    // Override res.json to capture responses
    const originalJson = res.json;
    res.json = function(body: any) {
      const duration = Date.now() - start;
      logger.logResponse(res, duration, body, context);
      return originalJson.call(this, body);
    };

    // Override res.send to capture responses  
    const originalSend = res.send;
    res.send = function(body: any) {
      const duration = Date.now() - start;
      logger.logResponse(res, duration, body, context);
      return originalSend.call(this, body);
    };

    next();
  };
}

// Error logging middleware
export function createErrorLoggingMiddleware() {
  return (error: any, req: any, res: any, next: any) => {
    const context = { 
      requestId: Math.random().toString(36).substr(2, 9),
      component: 'error-handler'
    };

    logger.error('Express error caught', error, context);
    logger.debug('Error request details', {
      url: req.url,
      method: req.method,
      headers: req.headers,
      body: req.body
    }, context);

    const status = error.status || error.statusCode || 500;
    res.status(status).json({
      error: true,
      message: error.message || 'Internal Server Error',
      type: error.constructor.name,
      timestamp: new Date().toISOString(),
      requestId: context.requestId
    });
  };
}