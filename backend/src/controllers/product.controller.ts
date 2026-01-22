import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/error-handler';
import { EventService } from '../services/event.service';

export class ProductController {
    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const product = await prisma.product.findUnique({
                where: { id },
                include: { category: true },
            });

            if (!product) {
                throw new AppError('Product not found', 404);
            }

            res.json({ success: true, data: product });
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { categoryId, name, description, price, imageUrl, isAvailable } = req.body;

            const product = await prisma.product.update({
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

            await EventService.publish(product.restaurantId, 'PRODUCT_UPDATED', {
                productId: product.id,
                name: product.name,
                price: Number(product.price),
                isAvailable: product.isAvailable,
            });

            res.json({ success: true, data: product });
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            await prisma.product.delete({ where: { id } });

            res.json({ success: true, message: 'Product deleted' });
        } catch (error) {
            next(error);
        }
    }

    async toggleAvailability(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const product = await prisma.product.findUnique({ where: { id } });
            if (!product) {
                throw new AppError('Product not found', 404);
            }

            const updated = await prisma.product.update({
                where: { id },
                data: { isAvailable: !product.isAvailable },
                include: { category: true },
            });

            await EventService.publish(product.restaurantId, 'PRODUCT_UPDATED', {
                productId: updated.id,
                name: updated.name,
                isAvailable: updated.isAvailable,
                action: 'availability_toggle',
            });

            res.json({ success: true, data: updated });
        } catch (error) {
            next(error);
        }
    }
}
