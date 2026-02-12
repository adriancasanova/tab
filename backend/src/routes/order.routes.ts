import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';

const router = Router();
const controller = new OrderController();

// GET /api/v1/orders/:id
router.get('/:id', controller.getById);

// PATCH /api/v1/orders/:id/status - Close order
router.patch('/:id/status', controller.updateStatus);

export default router;
