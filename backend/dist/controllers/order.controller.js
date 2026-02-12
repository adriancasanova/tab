"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_handler_1 = require("../middleware/error-handler");
class OrderController {
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const order = await database_1.default.order.findUnique({
                where: { id },
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
                throw new error_handler_1.AppError('Order not found', 404);
            }
            res.json({ success: true, data: order });
        }
        catch (error) {
            next(error);
        }
    }
    async updateStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const validStatuses = ['OPEN', 'CLOSED'];
            if (!validStatuses.includes(status)) {
                throw new error_handler_1.AppError('Invalid status', 400);
            }
            const order = await database_1.default.order.update({
                where: { id },
                data: { status },
            });
            res.json({ success: true, data: order });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.OrderController = OrderController;
//# sourceMappingURL=order.controller.js.map