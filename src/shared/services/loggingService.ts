/**
 * Logging Service
 * 
 * Centralized logging service for error tracking and analytics
 * 
 * TODO: Integrate with actual logging service (e.g., Sentry, LogRocket, etc.)
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogContext {
  userId?: string;
  schoolId?: string;
  role?: string;
  path?: string;
  [key: string]: any;
}

class LoggingService {
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Log a message with context
   */
  log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      level,
      message,
      timestamp,
      ...context,
    };

    // In development, log to console
    if (this.isDevelopment) {
      const consoleMethod = level === LogLevel.ERROR ? 'error' : 
                            level === LogLevel.WARN ? 'warn' : 
                            level === LogLevel.DEBUG ? 'debug' : 'log';
      console[consoleMethod]('[LoggingService]', logEntry);
    }

    // TODO: Send to logging service in production
    // Example:
    // if (!this.isDevelopment) {
    //   this.sendToLoggingService(logEntry);
    // }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: LogContext) {
    const errorContext = {
      ...context,
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      },
    };
    this.log(LogLevel.ERROR, message, errorContext);
  }

  /**
   * Log React error boundary error
   */
  logErrorBoundary(error: Error, errorInfo: React.ErrorInfo, context?: LogContext) {
    this.error('React Error Boundary caught error', error, {
      ...context,
      componentStack: errorInfo.componentStack,
    });
  }

  /**
   * Log API error
   */
  logApiError(url: string, error: Error, context?: LogContext) {
    this.error(`API Error: ${url}`, error, {
      ...context,
      url,
    });
  }

  /**
   * Log tenant boundary violation attempt
   */
  logTenantViolation(attemptedSchoolId: string, userSchoolId: string, context?: LogContext) {
    this.warn('Tenant boundary violation attempt', {
      ...context,
      attemptedSchoolId,
      userSchoolId,
    });
  }

  /**
   * Log permission denial
   */
  logPermissionDenial(resource: string, action: string, context?: LogContext) {
    this.warn('Permission denied', {
      ...context,
      resource,
      action,
    });
  }
}

export const loggingService = new LoggingService();
