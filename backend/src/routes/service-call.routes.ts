import { Router } from 'express';
import { ServiceCallController } from '../controllers/service-call.controller';

const router = Router();
const controller = new ServiceCallController();

// PATCH /api/v1/service-calls/:id/resolve
router.patch('/:id/resolve', controller.resolve);

export default router;
