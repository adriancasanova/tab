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
}
