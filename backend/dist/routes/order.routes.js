"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const router = (0, express_1.Router)();
const controller = new order_controller_1.OrderController();
// GET /api/v1/orders/:id
router.get('/:id', controller.getById);
// PATCH /api/v1/orders/:id/status - Close order
router.patch('/:id/status', controller.updateStatus);
exports.default = router;
//# sourceMappingURL=order.routes.js.map