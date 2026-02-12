"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const table_controller_1 = require("../controllers/table.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const controller = new table_controller_1.TableController();
// PUBLIC routes (customer facing)
router.get('/:id', controller.getById);
router.post('/:tableId/sessions', controller.startSession);
// PROTECTED Admin routes
router.use(auth_middleware_1.authenticateToken);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);
router.patch('/:id/toggle', controller.toggleEnabled);
exports.default = router;
//# sourceMappingURL=table.routes.js.map