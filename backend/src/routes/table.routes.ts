import { Router } from 'express';
import { TableController } from '../controllers/table.controller';

const router = Router();
const controller = new TableController();

// GET /api/v1/tables/:id
router.get('/:id', controller.getById);

// PUT /api/v1/tables/:id
router.put('/:id', controller.update);

// DELETE /api/v1/tables/:id
router.delete('/:id', controller.delete);

// PATCH /api/v1/tables/:id/toggle
router.patch('/:id/toggle', controller.toggleEnabled);

// POST /api/v1/tables/:tableId/sessions - Start session at table
router.post('/:tableId/sessions', controller.startSession);

export default router;
