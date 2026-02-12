"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message,
        });
    }
    // Handle Prisma Unique Constraint Violation
    if (err.code === 'P2002') {
        const target = err.meta?.target;
        return res.status(400).json({
            success: false,
            error: `Duplicate value for unique field: ${target ? target.join(', ') : 'unknown'}`,
        });
    }
    console.error('Unexpected error:', err);
    return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error-handler.js.map