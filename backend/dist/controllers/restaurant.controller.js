"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestaurantController = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_handler_1 = require("../middleware/error-handler");
const event_service_1 = require("../services/event.service");
class RestaurantController {
    async create(req, res, next) {
        try {
            const { name, slug, timezone } = req.body;
            const existing = await database_1.default.restaurant.findUnique({ where: { slug } });
            if (existing) {
                throw new error_handler_1.AppError('Restaurant with this slug already exists', 400);
            }
            const restaurant = await database_1.default.restaurant.create({
                data: { name, slug, timezone: timezone || 'America/Argentina/Buenos_Aires' },
            });
            res.status(201).json({ success: true, data: restaurant });
        }
        catch (error) {
            next(error);
        }
    }
    async getBySlug(req, res, next) {
        try {
            const { slug } = req.params;
            const restaurant = await database_1.default.restaurant.findUnique({
                // correcion propia String(slug)
                where: { slug: String(slug) },
                include: {
                    categories: { where: { isActive: true }, orderBy: { displayOrder: 'asc' } },
                    tables: true,
                },
            });
            if (!restaurant) {
                throw new error_handler_1.AppError('Restaurant not found', 404);
            }
            res.json({ success: true, data: restaurant });
        }
        catch (error) {
            next(error);
        }
    }
    async getMenu(req, res, next) {
        try {
            const { id } = req.params;
            const categories = await database_1.default.category.findMany({
                //correcion propia String(id)
                where: { restaurantId: String(id), isActive: true },
                include: {
                    products: {
                        where: { isAvailable: true },
                        orderBy: { name: 'asc' },
                    },
                },
                orderBy: { displayOrder: 'asc' },
            });
            // Also get all products for admin view
            const allProducts = await database_1.default.product.findMany({
                //correcion propia String(id)
                where: { restaurantId: String(id) },
                include: { category: true },
                orderBy: { name: 'asc' },
            });
            res.json({
                success: true,
                data: {
                    categories,
                    products: allProducts,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getActiveSessions(req, res, next) {
        try {
            const { id } = req.params;
            const restaurantId = String(id);
            const sessions = await database_1.default.session.findMany({
                where: {
                    table: { restaurantId: restaurantId },
                    status: { in: ['ACTIVE', 'PAYMENT_PENDING'] },
                },
                include: {
                    table: true,
                    consumers: true,
                    order: {
                        include: {
                            items: {
                                include: {
                                    product: true,
                                    consumers: { include: { consumer: true } },
                                },
                            },
                        },
                    },
                    serviceCalls: { where: { status: 'PENDING' } },
                },
                orderBy: { startedAt: 'desc' },
            });
            // Calculate totals for each session
            const sessionsWithTotals = sessions.map(session => {
                const orderItems = session.order?.items || [];
                const total = orderItems.reduce((sum, item) => {
                    return sum + Number(item.unitPrice) * item.quantity;
                }, 0);
                return {
                    ...session,
                    totalAmount: total,
                    pendingCallsCount: session.serviceCalls.length,
                };
            });
            res.json({ success: true, data: sessionsWithTotals });
        }
        catch (error) {
            next(error);
        }
    }
    async getNotifications(req, res, next) {
        try {
            const { id } = req.params;
            const restaurantId = String(id);
            // Get pending service calls as notifications (both session and entrance calls)
            // Using explicit type casting for Prisma 'OR' query to avoid TS issues with generated client
            const serviceCalls = await database_1.default.serviceCall.findMany({
                where: {
                    status: 'PENDING',
                    OR: [
                        { restaurantId: restaurantId },
                        { session: { table: { restaurantId: restaurantId } } }
                    ]
                }, // Cast to any to bypass strict type check if schema is slightly out of sync
                include: {
                    session: { include: { table: true } },
                },
                orderBy: { createdAt: 'desc' },
            });
            const notifications = serviceCalls.map((call) => {
                let message = '';
                let tableId = '';
                // Safely access session and table
                if (call.session && call.session.table) {
                    tableId = call.session.table.number;
                    message = call.type === 'WAITER'
                        ? `Mesa ${tableId} solicita mozo`
                        : `Mesa ${tableId} solicita la cuenta`;
                }
                else {
                    tableId = 'Entrada';
                    message = 'Cliente en Entrada solicita mozo';
                }
                return {
                    id: call.id,
                    type: call.type.toLowerCase(),
                    message,
                    sessionId: call.sessionId,
                    tableId,
                    timestamp: new Date(call.createdAt).getTime(),
                    read: false,
                };
            });
            res.json({ success: true, data: notifications });
        }
        catch (error) {
            next(error);
        }
    }
    // Create products under restaurant
    async createProduct(req, res, next) {
        try {
            const { id } = req.params;
            const restaurantId = String(id);
            const { categoryId, name, description, price, imageUrl, isAvailable } = req.body;
            const product = await database_1.default.product.create({
                data: {
                    restaurantId,
                    categoryId: String(categoryId),
                    name,
                    description: description || '',
                    price,
                    imageUrl,
                    isAvailable: isAvailable ?? true,
                },
                include: { category: true },
            });
            await event_service_1.EventService.publish(restaurantId, 'PRODUCT_CREATED', {
                productId: product.id,
                name: product.name,
                price: Number(product.price),
                category: product.category.name,
            });
            res.status(201).json({ success: true, data: product });
        }
        catch (error) {
            next(error);
        }
    }
    // Create tables under restaurant
    async createTable(req, res, next) {
        try {
            const { id } = req.params;
            const restaurantId = String(id);
            const { number } = req.body;
            const table = await database_1.default.table.create({
                data: { restaurantId, number },
            });
            await event_service_1.EventService.publish(restaurantId, 'TABLE_CREATED', {
                tableId: table.id,
                number: table.number,
            });
            res.status(201).json({ success: true, data: table });
        }
        catch (error) {
            next(error);
        }
    }
    // Create multiple tables
    async createMultipleTables(req, res, next) {
        try {
            const { id } = req.params;
            const restaurantId = String(id);
            const { from, to } = req.body;
            const tables = [];
            for (let i = from; i <= to; i++) {
                const table = await database_1.default.table.create({
                    data: { restaurantId, number: String(i) },
                });
                tables.push(table);
            }
            res.status(201).json({ success: true, data: tables });
        }
        catch (error) {
            next(error);
        }
    }
    // Create category
    async createCategory(req, res, next) {
        try {
            const { id } = req.params;
            const restaurantId = String(id);
            const { name, imageUrl, displayOrder } = req.body;
            const category = await database_1.default.category.create({
                data: {
                    restaurantId,
                    name,
                    imageUrl,
                    displayOrder: displayOrder ?? 0,
                },
            });
            res.status(201).json({ success: true, data: category });
        }
        catch (error) {
            next(error);
        }
    }
    async createServiceCall(req, res, next) {
        try {
            const { id } = req.params;
            const restaurantId = String(id);
            const { type } = req.body;
            const serviceCall = await database_1.default.serviceCall.create({
                data: {
                    restaurantId,
                    type: type || 'WAITER',
                },
            });
            await event_service_1.EventService.publish(restaurantId, 'WAITER_CALLED', {
                location: 'Entrance',
                callId: serviceCall.id
            });
            res.status(201).json({ success: true, data: serviceCall });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.RestaurantController = RestaurantController;
//# sourceMappingURL=restaurant.controller.js.map