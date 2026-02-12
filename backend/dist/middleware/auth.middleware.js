"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireFullAccess = exports.requireActiveSubscription = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const error_handler_1 = require("./error-handler");
const env_1 = require("../config/env");
const database_1 = __importDefault(require("../config/database"));
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            throw new error_handler_1.AppError('Authentication token required', 401);
        }
        const decoded = jsonwebtoken_1.default.verify(token, env_1.config.jwtSecret || 'your-secret-key');
        // Check if user still exists and get latest status
        const user = await database_1.default.user.findUnique({
            where: { id: decoded.id }
        });
        if (!user) {
            throw new error_handler_1.AppError('User not found or deactivated', 401);
        }
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            next(new error_handler_1.AppError('Token expired', 401));
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next(new error_handler_1.AppError('Invalid token', 401));
        }
        else {
            next(error);
        }
    }
};
exports.authenticateToken = authenticateToken;
const requireActiveSubscription = (req, res, next) => {
    if (!req.user) {
        return next(new error_handler_1.AppError('Auth required', 401));
    }
    if (req.user.status === 'INACTIVE') {
        return next(new error_handler_1.AppError('Su cuenta está inactiva. Por favor, contacte a soporte para renovar su suscripción.', 403));
    }
    next();
};
exports.requireActiveSubscription = requireActiveSubscription;
const requireFullAccess = (req, res, next) => {
    if (!req.user) {
        return next(new error_handler_1.AppError('Auth required', 401));
    }
    if (req.user.status !== 'ACTIVE') {
        return next(new error_handler_1.AppError('Esta función requiere una suscripción activa (Prueba terminada).', 403));
    }
    next();
};
exports.requireFullAccess = requireFullAccess;
//# sourceMappingURL=auth.middleware.js.map