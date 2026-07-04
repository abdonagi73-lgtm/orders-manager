/**
 * Structured Logger
 * All application logging goes through here.
 * Outputs structured JSON with request context for production tracing.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'audit';

interface LogContext {
  requestId?: string;
  companyId?: string;
  userId?: string;
  role?: string;
  [key: string]: unknown;
}

function log(level: LogLevel, message: string, ctx?: LogContext): void {
  const entry = {
    level,
    timestamp: new Date().toISOString(),
    message,
    ...ctx,
  };

  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  debug: (message: string, ctx?: LogContext) => log('debug', message, ctx),
  info:  (message: string, ctx?: LogContext) => log('info',  message, ctx),
  warn:  (message: string, ctx?: LogContext) => log('warn',  message, ctx),
  error: (message: string, ctx?: LogContext) => log('error', message, ctx),
  audit: (message: string, ctx?: LogContext) => log('audit', message, ctx),
};

export type { LogLevel, LogContext };
