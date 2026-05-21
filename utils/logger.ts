/**
 * Logging Service for Sahibak App
 * 
 * Provides structured logging with different levels:
 * - error: For errors that need attention
 * - warn: For warnings that don't break functionality
 * - info: For informational messages
 * - debug: For debugging information (development only)
 * 
 * Environment-aware:
 * - Development: Shows all logs including debug
 * - Production: Shows only error and warn logs
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

class Logger {
  private isDevelopment = __DEV__;

  private formatMessage(entry: LogEntry): string {
    const { level, message, context, timestamp } = entry;
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) {
      return true; // Log everything in development
    }
    
    // In production, only log errors and warnings
    return level === 'error' || level === 'warn';
  }

  private createEntry(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
    return {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
    };
  }

  error(message: string, context?: Record<string, unknown>): void {
    const entry = this.createEntry('error', message, context);
    if (this.shouldLog('error')) {
      console.error(this.formatMessage(entry));
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    const entry = this.createEntry('warn', message, context);
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage(entry));
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    const entry = this.createEntry('info', message, context);
    if (this.shouldLog('info')) {
      console.info(this.formatMessage(entry));
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    const entry = this.createEntry('debug', message, context);
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage(entry));
    }
  }

  /**
   * Log error with stack trace
   */
  errorWithStack(error: Error, message?: string, context?: Record<string, unknown>): void {
    const fullMessage = message ? `${message}: ${error.message}` : error.message;
    const entry = this.createEntry('error', fullMessage, {
      ...context,
      stack: error.stack,
      name: error.name,
    });
    if (this.shouldLog('error')) {
      console.error(this.formatMessage(entry));
    }
  }

  /**
   * Log API errors
   */
  apiError(endpoint: string, error: unknown, context?: Record<string, unknown>): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.error(`API Error: ${endpoint}`, {
      ...context,
      errorMessage,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
  }

  /**
   * Log authentication errors
   */
  authError(action: string, error: unknown, context?: Record<string, unknown>): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.error(`Auth Error: ${action}`, {
      ...context,
      errorMessage,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
  }

  /**
   * Log Supabase errors specifically
   */
  supabaseError(operation: string, error: unknown, context?: Record<string, unknown>): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.error(`Supabase Error: ${operation}`, {
      ...context,
      errorMessage,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for use in other parts of the app
export type { LogLevel, LogEntry };