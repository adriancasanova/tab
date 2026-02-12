"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableController = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_handler_1 = require("../middleware/error-handler");
const event_service_1 = require("../services/event.service");
class TableController {
    async getById(req, res, next) {
        try {
            const id = req.params.id;
            const table = await database_1.default.table.findUnique({
                where: { id },
                include: {
                    sessions: {
                        where: { status: { in: ['ACTIVE', 'PAYMENT_PENDING'] } },
                        include: { consumers: true },
                    },
                },
            });
            if (!table) {
                throw new error_handler_1.AppError('Table not found', 404);
            }
            res.json({ success: true, data: table });
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const id = req.params.id;
            const { number } = req.body;
            const userId = req.user?.id;
            // Secure update: only if owner
            const table = await database_1.default.table.update({
                where: {
                    id,
                    restaurant: { ownerId: userId }
                },
                data: { number },
            });
            res.json({ success: true, data: table });
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        try {
            const id = req.params.id;
            const userId = req.user?.id;
            // Secure delete: only if owner
            await database_1.default.table.delete({
                where: {
                    id,
                    restaurant: { ownerId: userId }
                }
            });
            res.json({ success: true, message: 'Table deleted' });
        }
        catch (error) {
            next(error);
        }
    }
    async toggleEnabled(req, res, next) {
        try {
            const id = req.params.id;
            const userId = req.user?.id;
            const table = await database_1.default.table.findUnique({
                where: {
                    id,
                    restaurant: { ownerId: userId }
                }
            });
            if (!table) {
                throw new error_handler_1.AppError('Table not found or access denied', 404);
            }
            const updated = await database_1.default.table.update({
                where: { id },
                data: { isEnabled: !table.isEnabled },
            });
            res.json({ success: true, data: updated });
        }
        catch (error) {
            next(error);
        }
    }
    async startSession(req, res, next) {
        try {
            const tableId = req.params.tableId;
            const { consumerName } = req.body;
            // Check if table exists and is enabled
            const table = await database_1.default.table.findUnique({
                where: { id: tableId },
                include: {
                    sessions: {
                        where: { status: { in: ['ACTIVE', 'PAYMENT_PENDING'] } },
                        include: { consumers: true }
                    },
                },
            });
            if (!table) {
                throw new error_handler_1.AppError('Table not found', 404);
            }
            if (!table.isEnabled) {
                throw new error_handler_1.AppError('Table is not available', 400);
            }
            // Type the find logic correctly for Prisma relations
            const sessions = table.sessions || [];
            const activeSession = sessions.find((s) => s.status === 'ACTIVE');
            const paymentPendingSession = sessions.find((s) => s.status === 'PAYMENT_PENDING');
            if (paymentPendingSession) {
                throw new error_handler_1.AppError('La mesa está en proceso de pago y no acepta nuevos clientes', 400);
            }
            // If there's an active session, JOIN it instead of creating a new one
            if (activeSession) {
                // Check if user with same name already exists (optional, let's just add them)
                const consumer = await database_1.default.consumer.create({
                    data: {
                        sessionId: activeSession.id,
                        name: consumerName,
                    }
                });
                await event_service_1.EventService.publish(table.restaurantId, 'CONSUMER_JOINED', {
                    sessionId: activeSession.id,
                    consumerId: consumer.id,
                    name: consumerName,
                    tableNumber: table.number,
                });
                // Return the existing session with all current data
                const fullSession = await database_1.default.session.findUnique({
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
            const session = await database_1.default.session.create({
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
            await event_service_1.EventService.publish(table.restaurantId, 'SESSION_STARTED', {
                sessionId: session.id,
                tableId: table.id,
                tableNumber: table.number,
                firstConsumer: consumerName,
            });
            res.status(201).json({ success: true, data: session });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.TableController = TableController;
//# sourceMappingURL=table.controller.js.map