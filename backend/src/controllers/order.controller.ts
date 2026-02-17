import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/error-handler';

export class OrderController {
    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const order = await prisma.order.findUnique({
                where: { id: id as string },
                include: {
                    items: {
                        include: {
                            product: true,
                            consumers: { include: { consumer: true } },
                        },
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });

            if (!order) {
                throw new AppError('Order not found', 404);
            }

            res.json({ success: true, data: order });
        } catch (error) {
            next(error);
        }
    }

    async updateStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const validStatuses = ['OPEN', 'CLOSED'];
            if (!validStatuses.includes(status)) {
                throw new AppError('Invalid status', 400);
            }

            const order = await prisma.order.update({
                where: { id: id as string },
                data: { status },
            });

            res.json({ success: true, data: order });
        } catch (error) {
            next(error);
        }
    }

    async updateItemStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const validStatuses = ['PENDING', 'PREPARING', 'SERVED', 'CANCELLED'];
            if (!validStatuses.includes(status)) {
                throw new AppError('Invalid status. Must be one of: PENDING, PREPARING, SERVED, CANCELLED', 400);
            }

            const item = await prisma.orderItem.findUnique({ where: { id: id as string } });
            if (!item) {
                throw new AppError('Order item not found', 404);
            }

            const updated = await prisma.orderItem.update({
                where: { id: id as string },
                data: { status },
                include: { product: true },
            });

            res.json({ success: true, data: updated });
        } catch (error) {
            next(error);
        }
    }
}
