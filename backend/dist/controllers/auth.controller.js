"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const error_handler_1 = require("../middleware/error-handler");
const env_1 = require("../config/env");
class AuthController {
    async register(req, res, next) {
        try {
            const { email, password, firstName, lastName, businessName, phone } = req.body;
            const existing = await database_1.default.user.findUnique({ where: { email } });
            if (existing) {
                throw new error_handler_1.AppError('Email already registered', 400);
            }
            const passwordHash = await bcrypt_1.default.hash(password, 12);
            const trialEndsAt = new Date();
            trialEndsAt.setDate(trialEndsAt.getDate() + (parseInt(process.env.TRIAL_PERIOD_DAYS || '15')));
            const user = await database_1.default.user.create({
                data: {
                    email,
                    passwordHash,
                    firstName,
                    lastName,
                    businessName,
                    phone,
                    status: 'TRIAL',
                    trialEndsAt
                }
            });
            // Automatically create a restaurant for the new owner
            const slug = businessName.toLowerCase()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
            const restaurant = await database_1.default.restaurant.create({
                data: {
                    name: businessName,
                    slug: `${slug}-${Math.floor(Math.random() * 1000)}`, // avoid collision
                    ownerId: user.id
                }
            });
            const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, env_1.config.jwtSecret || 'your-secret-key', { expiresIn: '7d' });
            res.status(201).json({
                success: true,
                data: {
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        businessName: user.businessName,
                        status: user.status,
                        restaurantSlug: restaurant.slug
                    }
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const user = await database_1.default.user.findUnique({
                where: { email },
                include: { restaurants: { take: 1 } }
            });
            if (!user) {
                throw new error_handler_1.AppError('Invalid credentials', 401);
            }
            const validPassword = await bcrypt_1.default.compare(password, user.passwordHash);
            if (!validPassword) {
                throw new error_handler_1.AppError('Invalid credentials', 401);
            }
            // Update last login
            await database_1.default.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() }
            });
            const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, env_1.config.jwtSecret || 'your-secret-key', { expiresIn: '7d' });
            res.json({
                success: true,
                data: {
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        businessName: user.businessName,
                        status: user.status,
                        restaurantSlug: user.restaurants[0]?.slug
                    }
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    async me(req, res, next) {
        try {
            const user = await database_1.default.user.findUnique({
                where: { id: req.user.id },
                include: { restaurants: { take: 1 } }
            });
            if (!user) {
                throw new error_handler_1.AppError('User not found', 404);
            }
            res.json({
                success: true,
                data: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    businessName: user.businessName,
                    status: user.status,
                    role: user.role,
                    trialEndsAt: user.trialEndsAt,
                    restaurantSlug: user.restaurants[0]?.slug
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    async createRestaurant(req, res, next) {
        try {
            const { name, slug } = req.body;
            const userId = req.user.id;
            const existing = await database_1.default.restaurant.findUnique({ where: { slug } });
            if (existing) {
                throw new error_handler_1.AppError('Slug is already taken', 400);
            }
            const restaurant = await database_1.default.restaurant.create({
                data: {
                    name,
                    slug,
                    ownerId: userId
                }
            });
            res.status(201).json({ success: true, data: restaurant });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map