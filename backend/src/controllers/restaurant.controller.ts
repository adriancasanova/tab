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
                // correcion propia String(slug)
                where: { slug: String(slug) },
                include: {
                    categories: { where: { isActive: true }, orderBy: { displayOrder: 'asc' } },
                    tables: true,
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
            const allProducts = await prisma.product.findMany({
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
        } catch (error) {
            next(error);
        }
    }

    async getActiveSessions(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const restaurantId = String(id);

            const sessions = await prisma.session.findMany({
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

            // Map to frontend Session shape:
            // - Prisma `order` (singular) → frontend `orders` (array)
            // - Prisma `startedAt` → frontend `startTime`
            // - Ensure `status` is lowercase for frontend
            // - Map `serviceCalls` timestamps
            const sessionsForFrontend = sessions.map(session => {
                const orders = session.order ? [{
                    id: session.order.id,
                    sessionId: session.order.sessionId,
                    items: session.order.items.map((item: any) => ({
                        id: item.id,
                        productId: item.productId,
                        product: {
                            ...item.product,
                            price: Number(item.product.price),
                        },
                        quantity: item.quantity,
                        consumerIds: item.consumers?.map((c: any) => c.consumerId) || [],
                        status: item.status.toLowerCase(),
                        timestamp: new Date(item.createdAt).getTime(),
                    })),
                    status: session.order.status.toLowerCase(),
                    createdAt: new Date(session.order.createdAt).getTime(),
                }] : [];

                return {
                    id: session.id,
                    tableId: session.table.number,
                    businessId: session.table.restaurantId,
                    status: session.status.toLowerCase(),
                    startTime: new Date(session.startedAt).getTime(),
                    endTime: session.endedAt ? new Date(session.endedAt).getTime() : undefined,
                    consumers: session.consumers.map(c => ({
                        id: c.id,
                        sessionId: c.sessionId,
                        name: c.name,
                        isGuest: false,
                        visitCount: 1,
                    })),
                    orders,
                    serviceCalls: session.serviceCalls.map(sc => ({
                        id: sc.id,
                        sessionId: sc.sessionId || '',
                        type: sc.type.toLowerCase(),
                        status: sc.status.toLowerCase(),
                        timestamp: new Date(sc.createdAt).getTime(),
                    })),
                };
            });

            res.json({ success: true, data: sessionsForFrontend });
        } catch (error) {
            next(error);
        }
    }

    // Get sessions filtered by date range (all statuses)
    async getSessionsByDate(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const restaurantId = String(id);

            // Parse date range from query params, default to today
            const now = new Date();
            let fromDate: Date;
            let toDate: Date;

            if (req.query.from) {
                fromDate = new Date(req.query.from as string);
            } else {
                fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            }

            if (req.query.to) {
                toDate = new Date(req.query.to as string);
            } else {
                toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            }

            const sessions = await prisma.session.findMany({
                where: {
                    table: { restaurantId },
                    startedAt: {
                        gte: fromDate,
                        lte: toDate,
                    },
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
                    serviceCalls: true,
                },
                orderBy: { startedAt: 'desc' },
            });

            // Map to frontend shape (same as getActiveSessions)
            const sessionsForFrontend = sessions.map(session => {
                const orders = session.order ? [{
                    id: session.order.id,
                    sessionId: session.order.sessionId,
                    items: session.order.items.map((item: any) => ({
                        id: item.id,
                        productId: item.productId,
                        product: {
                            ...item.product,
                            price: Number(item.product.price),
                        },
                        quantity: item.quantity,
                        consumerIds: item.consumers?.map((c: any) => c.consumerId) || [],
                        status: item.status.toLowerCase(),
                        timestamp: new Date(item.createdAt).getTime(),
                    })),
                    status: session.order.status.toLowerCase(),
                    createdAt: new Date(session.order.createdAt).getTime(),
                }] : [];

                return {
                    id: session.id,
                    tableId: session.table.number,
                    businessId: session.table.restaurantId,
                    status: session.status.toLowerCase(),
                    startTime: new Date(session.startedAt).getTime(),
                    endTime: session.endedAt ? new Date(session.endedAt).getTime() : undefined,
                    consumers: session.consumers.map(c => ({
                        id: c.id,
                        sessionId: c.sessionId,
                        name: c.name,
                        isGuest: false,
                        visitCount: 1,
                    })),
                    orders,
                    serviceCalls: session.serviceCalls.map(sc => ({
                        id: sc.id,
                        sessionId: sc.sessionId || '',
                        type: sc.type.toLowerCase(),
                        status: sc.status.toLowerCase(),
                        timestamp: new Date(sc.createdAt).getTime(),
                    })),
                };
            });

            res.json({ success: true, data: sessionsForFrontend });
        } catch (error) {
            next(error);
        }
    }

    async getNotifications(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const restaurantId = String(id);

            // Build where clause based on whether date range is provided
            const hasDateFilter = req.query.from && req.query.to;
            const whereClause: any = {
                OR: [
                    { restaurantId: restaurantId },
                    { session: { table: { restaurantId: restaurantId } } }
                ],
            };

            if (hasDateFilter) {
                // Historical mode: return all statuses within date range
                whereClause.createdAt = {
                    gte: new Date(req.query.from as string),
                    lte: new Date(req.query.to as string),
                };
            } else {
                // Default mode: only pending
                whereClause.status = 'PENDING';
            }

            const serviceCalls = await prisma.serviceCall.findMany({
                where: whereClause,
                include: {
                    session: { include: { table: true } },
                },
                orderBy: { createdAt: 'desc' },
            });

            const notifications = serviceCalls.map((call: any) => {
                let message = '';
                let tableId = '';

                if (call.session && call.session.table) {
                    tableId = call.session.table.number;
                    message = call.type === 'WAITER'
                        ? `Mesa ${tableId} solicita mozo`
                        : `Mesa ${tableId} solicita la cuenta`;
                } else {
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
                    read: call.status === 'RESOLVED',
                    status: call.status.toLowerCase(),
                };
            });

            res.json({ success: true, data: notifications });
        } catch (error) {
            next(error);
        }
    }

    // Create products under restaurant
    async createProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const restaurantId = String(id);
            const { categoryId, name, description, price, imageUrl, isAvailable } = req.body;

            const productData: any = {
                restaurantId,
                name,
                description: description || '',
                price,
                imageUrl,
                isAvailable: isAvailable ?? true,
            };

            // Only include categoryId if it's provided and not empty
            if (categoryId && categoryId.trim() !== '') {
                productData.categoryId = String(categoryId);
            }

            const product = await prisma.product.create({
                data: productData,
                include: { category: true },
            });

            await EventService.publish(restaurantId, 'PRODUCT_CREATED', {
                productId: product.id,
                name: product.name,
                price: Number(product.price),
                category: product.category?.name || 'Sin categoría',
            });

            res.status(201).json({ success: true, data: product });
        } catch (error) {
            next(error);
        }
    }

    // Create tables under restaurant
    async createTable(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const restaurantId = String(id);
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
            const { id } = req.params;
            const restaurantId = String(id);
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
            const { id } = req.params;
            const restaurantId = String(id);
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

    async createServiceCall(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const restaurantId = String(id);
            const { type } = req.body;

            const serviceCall = await prisma.serviceCall.create({
                data: {
                    restaurantId, 
                    type: type || 'WAITER',
                } as any,
            });

            await EventService.publish(restaurantId, 'WAITER_CALLED', {
                location: 'Entrance',
                callId: serviceCall.id
            });

            res.status(201).json({ success: true, data: serviceCall });
        } catch (error) {
            next(error);
        }
    }
}
