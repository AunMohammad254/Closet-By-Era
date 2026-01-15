/**
 * Centralized Logger Utility
 * 
 * Provides environment-aware logging that:
 * - Only logs errors in production (no sensitive data leakage)
 * - Provides full debug output in development
 * - Sanitizes error objects to prevent data exposure
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
    action?: string;
    userId?: string;
    [key: string]: unknown;
}

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Sanitize error objects to prevent sensitive data leakage
 */
function sanitizeError(error: unknown): string {
    if (error instanceof Error) {
        // In production, only return the message, not the stack
        return isDevelopment
            ? `${error.message}\n${error.stack}`
            : error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return 'An unexpected error occurred';
}

/**
 * Format log message with timestamp and context
 */
function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

export const logger = {
    /**
     * Debug level - only logs in development
     */
    debug(message: string, context?: LogContext): void {
        if (isDevelopment) {
            console.log(formatMessage('debug', message, context));
        }
    },

    /**
     * Info level - only logs in development
     */
    info(message: string, context?: LogContext): void {
        if (isDevelopment) {
            console.info(formatMessage('info', message, context));
        }
    },

    /**
     * Warning level - logs in all environments
     */
    warn(message: string, context?: LogContext): void {
        console.warn(formatMessage('warn', message, context));
    },

    /**
     * Error level - logs sanitized errors in all environments
     */
    error(message: string, error?: unknown, context?: LogContext): void {
        const sanitizedError = error ? sanitizeError(error) : '';
        const fullMessage = sanitizedError
            ? `${message}: ${sanitizedError}`
            : message;
        console.error(formatMessage('error', fullMessage, context));
    },
};

// Export a no-op logger for testing
export const noopLogger = {
    debug: () => { },
    info: () => { },
    warn: () => { },
    error: () => { },
};
