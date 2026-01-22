import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/error-handler';
import { EventService } from '../services/event.service';

export class TableController {
    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const table = await prisma.table.findUnique({
                where: { id },
                include: {
                    sessions: {
                        where: { status: { in: ['ACTIVE', 'PAYMENT_PENDING'] } },
                        include: { consumers: true },
                    },
                },
            });

            if (!table) {
                throw new AppError('Table not found', 404);
            }

            res.json({ success: true, data: table });
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { number } = req.body;

            const table = await prisma.table.update({
                where: { id },
                data: { number },
            });

            res.json({ success: true, data: table });
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            await prisma.table.delete({ where: { id } });

            res.json({ success: true, message: 'Table deleted' });
        } catch (error) {
            next(error);
        }
    }

    async toggleEnabled(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const table = await prisma.table.findUnique({ where: { id } });
            if (!table) {
                throw new AppError('Table not found', 404);
            }

            const updated = await prisma.table.update({
                where: { id },
                data: { isEnabled: !table.isEnabled },
            });

            res.json({ success: true, data: updated });
        } catch (error) {
            next(error);
        }
    }

    async startSession(req: Request, res: Response, next: NextFunction) {
        try {
            const { tableId } = req.params;
            const { consumerName } = req.body;

            // Check if table exists and is enabled
            const table = await prisma.table.findUnique({
                where: { id: tableId },
                include: {
                    sessions: { where: { status: 'ACTIVE' } },
                },
            });

            if (!table) {
                throw new AppError('Table not found', 404);
            }

            if (!table.isEnabled) {
                throw new AppError('Table is not available', 400);
            }

            // Check for existing active session
            if (table.sessions.length > 0) {
                throw new AppError('Table already has an active session', 400);
            }

            // Create session with first consumer
            const session = await prisma.session.create({
                data: {
                    tableId,
                    consumers: {
                        create: { name: consumerName },
                    },
                },
                include: {
                    table: true,
                    consumers: true,
                },
            });

            await EventService.publish(table.restaurantId, 'SESSION_STARTED', {
                sessionId: session.id,
                tableId: table.id,
                tableNumber: table.number,
                firstConsumer: consumerName,
            });

            res.status(201).json({ success: true, data: session });
        } catch (error) {
            next(error);
        }
    }
}
