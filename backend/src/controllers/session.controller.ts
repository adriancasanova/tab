import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/error-handler';
import { EventService } from '../services/event.service';

export class SessionController {
    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const session = await prisma.session.findUnique({
                where: { id },
                include: {
                    table: true,
                    consumers: { orderBy: { joinedAt: 'asc' } },
                    order: {
                        include: {
                            items: {
                                include: {
                                    product: true,
                                    consumers: { include: { consumer: true } },
                                },
                                orderBy: { createdAt: 'desc' },
                            },
                        },
                    },
                    serviceCalls: { orderBy: { createdAt: 'desc' } },
                },
            });

            if (!session) {
                throw new AppError('Session not found', 404);
            }

            // Transform to match frontend format
            const response = {
                id: session.id,
                tableId: session.table.number,
                businessId: session.table.restaurantId,
                status: session.status.toLowerCase(),
                startTime: session.startedAt.getTime(),
                endTime: session.endedAt?.getTime(),
                consumers: session.consumers.map(c => ({
                    id: c.id,
                    sessionId: c.sessionId,
                    name: c.name,
                    isGuest: true,
                    visitCount: 1,
                })),
                orders: session.order ? [{
                    id: session.order.id,
                    sessionId: session.order.sessionId,
                    items: session.order.items.map(item => ({
                        id: item.id,
                        productId: item.productId,
                        product: {
                            id: item.product.id,
                            name: item.product.name,
                            description: item.product.description,
                            price: Number(item.product.price),
                            category: '', // Would need category relation
                            image: item.product.imageUrl || '',
                            isAvailable: item.product.isAvailable,
                        },
                        quantity: item.quantity,
                        consumerIds: item.consumers.map(c => c.consumerId),
                        status: item.status.toLowerCase(),
                        timestamp: item.createdAt.getTime(),
                    })),
                    status: session.order.status.toLowerCase(),
                    createdAt: session.order.createdAt.getTime(),
                }] : [],
                serviceCalls: session.serviceCalls.map(call => ({
                    id: call.id,
                    sessionId: call.sessionId,
                    type: call.type.toLowerCase(),
                    status: call.status.toLowerCase(),
                    timestamp: call.createdAt.getTime(),
                })),
            };

            res.json({ success: true, data: response });
        } catch (error) {
            next(error);
        }
    }

    async addConsumer(req: Request, res: Response, next: NextFunction) {
        try {
            const { sessionId } = req.params;
            const { name } = req.body;

            const session = await prisma.session.findUnique({
                where: { id: sessionId },
                include: { table: true },
            });

            if (!session) {
                throw new AppError('Session not found', 404);
            }

            if (session.status === 'CLOSED') {
                throw new AppError('Session is closed', 400);
            }

            const consumer = await prisma.consumer.create({
                data: { sessionId, name },
            });

            await EventService.publish(session.table.restaurantId, 'CONSUMER_JOINED', {
                sessionId,
                consumerId: consumer.id,
                name: consumer.name,
            });

            res.status(201).json({ success: true, data: consumer });
        } catch (error) {
            next(error);
        }
    }

    async updateStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const validStatuses = ['ACTIVE', 'PAYMENT_PENDING', 'CLOSED'];
            if (!validStatuses.includes(status)) {
                throw new AppError('Invalid status', 400);
            }

            const session = await prisma.session.update({
                where: { id },
                data: {
                    status,
                    ...(status === 'CLOSED' && { endedAt: new Date() }),
                },
                include: { table: true },
            });

            if (status === 'CLOSED') {
                await EventService.publish(session.table.restaurantId, 'SESSION_CLOSED', {
                    sessionId: session.id,
                    tableNumber: session.table.number,
                    duration: session.endedAt ? session.endedAt.getTime() - session.startedAt.getTime() : 0,
                });
            }

            res.json({ success: true, data: session });
        } catch (error) {
            next(error);
        }
    }

    async getTotals(req: Request, res: Response, next: NextFunction) {
        try {
            const { sessionId } = req.params;

            const session = await prisma.session.findUnique({
                where: { id: sessionId },
                include: {
                    consumers: true,
                    order: {
                        include: {
                            items: {
                                include: {
                                    product: true,
                                    consumers: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!session) {
                throw new AppError('Session not found', 404);
            }

            // Calculate totals
            let sessionTotal = 0;
            const consumerTotals: Record<string, {
                consumerId: string;
                name: string;
                total: number;
                items: Array<{
                    productName: string;
                    quantity: number;
                    sharePrice: number;
                    isShared: boolean;
                }>;
            }> = {};

            // Initialize consumer totals
            session.consumers.forEach(consumer => {
                consumerTotals[consumer.id] = {
                    consumerId: consumer.id,
                    name: consumer.name,
                    total: 0,
                    items: [],
                };
            });

            // Calculate each item's contribution
            if (session.order) {
                session.order.items.forEach(item => {
                    const itemTotal = Number(item.unitPrice) * item.quantity;
                    sessionTotal += itemTotal;

                    const splitCount = item.consumers.length;
                    const sharePrice = itemTotal / splitCount;
                    const isShared = splitCount > 1;

                    item.consumers.forEach(({ consumerId }) => {
                        if (consumerTotals[consumerId]) {
                            consumerTotals[consumerId].total += sharePrice;
                            consumerTotals[consumerId].items.push({
                                productName: item.product.name,
                                quantity: item.quantity,
                                sharePrice,
                                isShared,
                            });
                        }
                    });
                });
            }

            res.json({
                success: true,
                data: {
                    sessionTotal,
                    consumerTotals: Object.values(consumerTotals),
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async addOrderItems(req: Request, res: Response, next: NextFunction) {
        try {
            const { sessionId } = req.params;
            const { items } = req.body;

            const session = await prisma.session.findUnique({
                where: { id: sessionId },
                include: { table: true, order: true },
            });

            if (!session) {
                throw new AppError('Session not found', 404);
            }

            if (session.status === 'CLOSED') {
                throw new AppError('Session is closed', 400);
            }

            if (session.status === 'PAYMENT_PENDING') {
                throw new AppError('Cannot add items after requesting bill', 400);
            }

            // Get or create order
            let order = session.order;
            if (!order) {
                order = await prisma.order.create({
                    data: { sessionId },
                });
            }

            // Add items
            const createdItems = [];
            for (const item of items) {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                });

                if (!product) {
                    throw new AppError(`Product ${item.productId} not found`, 404);
                }

                if (!product.isAvailable) {
                    throw new AppError(`Product ${product.name} is not available`, 400);
                }

                const orderItem = await prisma.orderItem.create({
                    data: {
                        orderId: order.id,
                        productId: item.productId,
                        quantity: item.quantity || 1,
                        unitPrice: product.price,
                        consumers: {
                            create: item.consumerIds.map((consumerId: string) => ({
                                consumerId,
                            })),
                        },
                    },
                    include: {
                        product: true,
                        consumers: { include: { consumer: true } },
                    },
                });

                createdItems.push(orderItem);

                // Publish event for shared items
                if (item.consumerIds.length > 1) {
                    await EventService.publish(session.table.restaurantId, 'ITEM_SHARED', {
                        orderItemId: orderItem.id,
                        productId: product.id,
                        productName: product.name,
                        consumerCount: item.consumerIds.length,
                    });
                }
            }

            await EventService.publish(session.table.restaurantId, 'ORDER_PLACED', {
                sessionId,
                orderId: order.id,
                itemCount: items.length,
                tableNumber: session.table.number,
            });

            res.status(201).json({ success: true, data: { order, items: createdItems } });
        } catch (error) {
            next(error);
        }
    }

    async createServiceCall(req: Request, res: Response, next: NextFunction) {
        try {
            const { sessionId } = req.params;
            const { type } = req.body;

            const session = await prisma.session.findUnique({
                where: { id: sessionId },
                include: { table: true },
            });

            if (!session) {
                throw new AppError('Session not found', 404);
            }

            const serviceCall = await prisma.serviceCall.create({
                data: { sessionId, type },
            });

            // If requesting bill, update session status
            if (type === 'BILL') {
                await prisma.session.update({
                    where: { id: sessionId },
                    data: { status: 'PAYMENT_PENDING' },
                });

                await EventService.publish(session.table.restaurantId, 'BILL_REQUESTED', {
                    sessionId,
                    tableNumber: session.table.number,
                });
            } else {
                await EventService.publish(session.table.restaurantId, 'WAITER_CALLED', {
                    sessionId,
                    tableNumber: session.table.number,
                });
            }

            res.status(201).json({ success: true, data: serviceCall });
        } catch (error) {
            next(error);
        }
    }
}
