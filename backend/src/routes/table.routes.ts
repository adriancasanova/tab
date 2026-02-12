import { Router } from 'express';
import { TableController } from '../controllers/table.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const controller = new TableController();

// PUBLIC routes (customer facing)
router.get('/:id', controller.getById);
router.post('/:tableId/sessions', controller.startSession);

// PROTECTED Admin routes
router.use(authenticateToken);

router.put('/:id', controller.update);
router.delete('/:id', controller.delete);
router.patch('/:id/toggle', controller.toggleEnabled);

export default router;
