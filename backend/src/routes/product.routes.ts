import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { validate } from '../middleware/validate';
import { authenticateToken } from '../middleware/auth.middleware';
import { createProductSchema, updateProductSchema } from '../schemas';

const router = Router();
const controller = new ProductController();

// Note: Create product is nested under restaurant
// POST /api/v1/restaurants/:restaurantId/products - handled in restaurant routes

// GET /api/v1/products/:id
router.get('/:id', controller.getById);

// PUT /api/v1/products/:id
router.put('/:id', authenticateToken, validate(updateProductSchema), controller.update);

// DELETE /api/v1/products/:id
router.delete('/:id', authenticateToken, controller.delete);

// PATCH /api/v1/products/:id/availability
router.patch('/:id/availability', authenticateToken, controller.toggleAvailability);

export default router;
