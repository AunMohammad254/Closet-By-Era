/**
 * Centralized error types for consistent error handling
 */

export class AppError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 400,
        public details?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'AppError';
    }
}

// Authentication errors
export class AuthError extends AppError {
    constructor(message: string = 'Authentication required', details?: Record<string, unknown>) {
        super(message, 'AUTH_ERROR', 401, details);
        this.name = 'AuthError';
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'You do not have permission to perform this action', details?: Record<string, unknown>) {
        super(message, 'UNAUTHORIZED', 403, details);
        this.name = 'UnauthorizedError';
    }
}

// Validation errors
export class ValidationError extends AppError {
    constructor(message: string, public fields?: Record<string, string>) {
        super(message, 'VALIDATION_ERROR', 400, { fields });
        this.name = 'ValidationError';
    }
}

// Rate limit errors
export class RateLimitError extends AppError {
    constructor(resetIn: number) {
        super(
            `Too many requests. Please try again in ${resetIn} seconds.`,
            'RATE_LIMIT_ERROR',
            429,
            { resetIn }
        );
        this.name = 'RateLimitError';
    }
}

// Database errors
export class DatabaseError extends AppError {
    constructor(message: string = 'A database error occurred', details?: Record<string, unknown>) {
        super(message, 'DATABASE_ERROR', 500, details);
        this.name = 'DatabaseError';
    }
}

// Not found errors
export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource') {
        super(`${resource} not found`, 'NOT_FOUND', 404);
        this.name = 'NotFoundError';
    }
}

/**
 * Type-safe error response for server actions
 */
export interface ActionResult<T = void> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code: string;
        details?: Record<string, unknown>;
    };
}

/**
 * Create a success result
 */
export function success<T>(data?: T): ActionResult<T> {
    return { success: true, data };
}

/**
 * Create an error result from an Error object
 */
export function failure(error: Error | AppError | string): ActionResult<never> {
    if (typeof error === 'string') {
        return {
            success: false,
            error: { message: error, code: 'UNKNOWN_ERROR' }
        };
    }

    if (error instanceof AppError) {
        return {
            success: false,
            error: {
                message: error.message,
                code: error.code,
                details: error.details
            }
        };
    }

    return {
        success: false,
        error: {
            message: error.message || 'An unexpected error occurred',
            code: 'UNKNOWN_ERROR'
        }
    };
}
