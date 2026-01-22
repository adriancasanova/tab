import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/error-handler';
import { EventService } from '../services/event.service';

export class RestaurantController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, slug, timezone } = req.body;

            const existing = await prisma.restaurant.findUnique({ where: { slug } });
            if (existing) {
                throw new AppError('Restaurant with this slug already exists', 400);
            }

            const restaurant = await prisma.restaurant.create({
                data: { name, slug, timezone: timezone || 'America/Argentina/Buenos_Aires' },
            });

            res.status(201).json({ success: true, data: restaurant });
        } catch (error) {
            next(error);
        }
    }

    async getBySlug(req: Request, res: Response, next: NextFunction) {
        try {
            const { slug } = req.params;

            const restaurant = await prisma.restaurant.findUnique({
                where: { slug },
                include: {
                    categories: { where: { isActive: true }, orderBy: { displayOrder: 'asc' } },
                    tables: { where: { isEnabled: true } },
                },
            });

            if (!restaurant) {
                throw new AppError('Restaurant not found', 404);
            }

            res.json({ success: true, data: restaurant });
        } catch (error) {
            next(error);
        }
    }

    async getMenu(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const categories = await prisma.category.findMany({
                where: { restaurantId: id, isActive: true },
                include: {
                    products: {
                        where: { isAvailable: true },
                        orderBy: { name: 'asc' },
                    },
                },
                orderBy: { displayOrder: 'asc' },
            });

            // Also get all products for admin view
            const allProducts = await prisma.product.findMany({
                where: { restaurantId: id },
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
        } catch (error) {
            next(error);
        }
    }

    async getActiveSessions(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const sessions = await prisma.session.findMany({
                where: {
                    table: { restaurantId: id },
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
                const total = session.order?.items.reduce((sum, item) => {
                    return sum + Number(item.unitPrice) * item.quantity;
                }, 0) || 0;

                return {
                    ...session,
                    totalAmount: total,
                    pendingCallsCount: session.serviceCalls.length,
                };
            });

            res.json({ success: true, data: sessionsWithTotals });
        } catch (error) {
            next(error);
        }
    }

    async getNotifications(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            // Get pending service calls as notifications
            const serviceCalls = await prisma.serviceCall.findMany({
                where: {
                    status: 'PENDING',
                    session: { table: { restaurantId: id } },
                },
                include: {
                    session: { include: { table: true } },
                },
                orderBy: { createdAt: 'desc' },
            });

            // Get recent orders (last hour)
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const recentOrders = await prisma.order.findMany({
                where: {
                    session: { table: { restaurantId: id } },
                    createdAt: { gte: oneHourAgo },
                },
                include: {
                    session: { include: { table: true } },
                    items: { include: { product: true } },
                },
                orderBy: { createdAt: 'desc' },
            });

            const notifications = [
                ...serviceCalls.map(call => ({
                    id: call.id,
                    type: call.type.toLowerCase(),
                    message: call.type === 'WAITER'
                        ? `Mesa ${call.session.table.number} solicita mozo`
                        : `Mesa ${call.session.table.number} solicita la cuenta`,
                    sessionId: call.sessionId,
                    tableId: call.session.table.number,
                    timestamp: call.createdAt.getTime(),
                    read: false,
                })),
            ];

            res.json({ success: true, data: notifications });
        } catch (error) {
            next(error);
        }
    }

    // Create products under restaurant
    async createProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: restaurantId } = req.params;
            const { categoryId, name, description, price, imageUrl, isAvailable } = req.body;

            const product = await prisma.product.create({
                data: {
                    restaurantId,
                    categoryId,
                    name,
                    description: description || '',
                    price,
                    imageUrl,
                    isAvailable: isAvailable ?? true,
                },
                include: { category: true },
            });

            await EventService.publish(restaurantId, 'PRODUCT_CREATED', {
                productId: product.id,
                name: product.name,
                price: Number(product.price),
                category: product.category.name,
            });

            res.status(201).json({ success: true, data: product });
        } catch (error) {
            next(error);
        }
    }

    // Create tables under restaurant
    async createTable(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: restaurantId } = req.params;
            const { number } = req.body;

            const table = await prisma.table.create({
                data: { restaurantId, number },
            });

            await EventService.publish(restaurantId, 'TABLE_CREATED', {
                tableId: table.id,
                number: table.number,
            });

            res.status(201).json({ success: true, data: table });
        } catch (error) {
            next(error);
        }
    }

    // Create multiple tables
    async createMultipleTables(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: restaurantId } = req.params;
            const { from, to } = req.body;

            const tables = [];
            for (let i = from; i <= to; i++) {
                const table = await prisma.table.create({
                    data: { restaurantId, number: String(i) },
                });
                tables.push(table);
            }

            res.status(201).json({ success: true, data: tables });
        } catch (error) {
            next(error);
        }
    }

    // Create category
    async createCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: restaurantId } = req.params;
            const { name, imageUrl, displayOrder } = req.body;

            const category = await prisma.category.create({
                data: {
                    restaurantId,
                    name,
                    imageUrl,
                    displayOrder: displayOrder ?? 0,
                },
            });

            res.status(201).json({ success: true, data: category });
        } catch (error) {
            next(error);
        }
    }
}
