"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const service_call_controller_1 = require("../controllers/service-call.controller");
const router = (0, express_1.Router)();
const controller = new service_call_controller_1.ServiceCallController();
// PATCH /api/v1/service-calls/:id/resolve
router.patch('/:id/resolve', controller.resolve);
exports.default = router;
//# sourceMappingURL=service-call.routes.js.map