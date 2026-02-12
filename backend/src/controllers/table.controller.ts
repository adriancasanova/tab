import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/error-handler';
import { EventService } from '../services/event.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class TableController {
    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;

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

    async update(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const { number } = req.body;
            const userId = req.user?.id;

            // Secure update: only if owner
            const table = await prisma.table.update({
                where: { 
                    id,
                    restaurant: { ownerId: userId }
                } as any,
                data: { number },
            });

            res.json({ success: true, data: table });
        } catch (error) {
            next(error);
        }
    }

    async delete(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const userId = req.user?.id;

            // Secure delete: only if owner
            await prisma.table.delete({ 
                where: { 
                    id,
                    restaurant: { ownerId: userId }
                } as any
            });

            res.json({ success: true, message: 'Table deleted' });
        } catch (error) {
            next(error);
        }
    }

    async toggleEnabled(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const userId = req.user?.id;

            const table = await prisma.table.findUnique({ 
                where: { 
                    id,
                    restaurant: { ownerId: userId }
                } as any
            });
            
            if (!table) {
                throw new AppError('Table not found or access denied', 404);
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
            const tableId = req.params.tableId as string;
            const { consumerName } = req.body;

            // Check if table exists and is enabled
            const table = await prisma.table.findUnique({
                where: { id: tableId },
                include: {
                    sessions: { 
                        where: { status: { in: ['ACTIVE', 'PAYMENT_PENDING'] } },
                        include: { consumers: true }
                    },
                },
            });

            if (!table) {
                throw new AppError('Table not found', 404);
            }

            if (!table.isEnabled) {
                throw new AppError('Table is not available', 400);
            }

            // Type the find logic correctly for Prisma relations
            const sessions = (table as any).sessions || [];
            const activeSession = sessions.find((s: any) => s.status === 'ACTIVE');
            const paymentPendingSession = sessions.find((s: any) => s.status === 'PAYMENT_PENDING');

            if (paymentPendingSession) {
                throw new AppError('La mesa está en proceso de pago y no acepta nuevos clientes', 400);
            }

            // If there's an active session, JOIN it instead of creating a new one
            if (activeSession) {
                // Check if user with same name already exists (optional, let's just add them)
                const consumer = await prisma.consumer.create({
                    data: {
                        sessionId: activeSession.id,
                        name: consumerName,
                    }
                });

                await EventService.publish(table.restaurantId, 'CONSUMER_JOINED', {
                    sessionId: activeSession.id,
                    consumerId: consumer.id,
                    name: consumerName,
                    tableNumber: table.number,
                });

                // Return the existing session with all current data
                const fullSession = await prisma.session.findUnique({
                    where: { id: activeSession.id },
                    include: { table: true, consumers: true }
                });

                return res.status(200).json({ 
                    success: true, 
                    message: 'Te has unido a la mesa compartida',
                    data: fullSession 
                });
            }

            // Create NEW session if none active
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
