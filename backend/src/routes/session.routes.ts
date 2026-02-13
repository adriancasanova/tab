import { Router } from 'express';
import { SessionController } from '../controllers/session.controller';

const router = Router();
const controller = new SessionController();

// POST /api/v1/sessions/join - Join/Create session
router.post('/join', controller.join);

// GET /api/v1/sessions/current - Get current session
router.get('/current', controller.getCurrent);

// GET /api/v1/sessions/:id
router.get('/:id', controller.getById);

// POST /api/v1/sessions/:sessionId/consumers - Add consumer
router.post('/:sessionId/consumers', controller.addConsumer);

// PATCH /api/v1/sessions/:id/status - Update session status
router.patch('/:id/status', controller.updateStatus);

// GET /api/v1/sessions/:sessionId/totals - Get individual totals
router.get('/:sessionId/totals', controller.getTotals);

// POST /api/v1/sessions/:sessionId/orders - Add items to order
router.post('/:sessionId/orders', controller.addOrderItems);

// POST /api/v1/sessions/:sessionId/service-calls - Create service call
router.post('/:sessionId/service-calls', controller.createServiceCall);

export default router;
