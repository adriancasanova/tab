"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const database_1 = __importDefault(require("../config/database"));
const error_handler_1 = require("../middleware/error-handler");
const event_service_1 = require("../services/event.service");
class ProductController {
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const product = await database_1.default.product.findUnique({
                where: { id },
                include: { category: true },
            });
            if (!product) {
                throw new error_handler_1.AppError('Product not found', 404);
            }
            res.json({ success: true, data: product });
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const { categoryId, name, description, price, imageUrl, isAvailable } = req.body;
            const product = await database_1.default.product.update({
                where: { id },
                data: {
                    ...(categoryId && { categoryId }),
                    ...(name && { name }),
                    ...(description !== undefined && { description }),
                    ...(price && { price }),
                    ...(imageUrl !== undefined && { imageUrl }),
                    ...(isAvailable !== undefined && { isAvailable }),
                },
                include: { category: true },
            });
            await event_service_1.EventService.publish(product.restaurantId, 'PRODUCT_UPDATED', {
                productId: product.id,
                name: product.name,
                price: Number(product.price),
                isAvailable: product.isAvailable,
            });
            res.json({ success: true, data: product });
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            await database_1.default.product.delete({ where: { id } });
            res.json({ success: true, message: 'Product deleted' });
        }
        catch (error) {
            next(error);
        }
    }
    async toggleAvailability(req, res, next) {
        try {
            const { id } = req.params;
            const product = await database_1.default.product.findUnique({ where: { id } });
            if (!product) {
                throw new error_handler_1.AppError('Product not found', 404);
            }
            const updated = await database_1.default.product.update({
                where: { id },
                data: { isAvailable: !product.isAvailable },
                include: { category: true },
            });
            await event_service_1.EventService.publish(product.restaurantId, 'PRODUCT_UPDATED', {
                productId: updated.id,
                name: updated.name,
                isAvailable: updated.isAvailable,
                action: 'availability_toggle',
            });
            res.json({ success: true, data: updated });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ProductController = ProductController;
//# sourceMappingURL=product.controller.js.map