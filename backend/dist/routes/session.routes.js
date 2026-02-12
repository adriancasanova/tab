"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const session_controller_1 = require("../controllers/session.controller");
const router = (0, express_1.Router)();
const controller = new session_controller_1.SessionController();
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
exports.default = router;
//# sourceMappingURL=session.routes.js.map