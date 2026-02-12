"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const restaurant_controller_1 = require("../controllers/restaurant.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const controller = new restaurant_controller_1.RestaurantController();
// PUBLIC routes (for customers)
router.get('/:slug', controller.getBySlug);
router.get('/:id/menu', controller.getMenu);
router.post('/:id/service-calls', controller.createServiceCall);
// PROTECTED Admin routes
router.use(auth_middleware_1.authenticateToken);
router.use(auth_middleware_1.requireActiveSubscription);
// GET /api/v1/restaurants/:id/active-sessions - Get active sessions (admin)
router.get('/:id/active-sessions', controller.getActiveSessions);
// GET /api/v1/restaurants/:id/notifications - Get pending notifications (admin)
router.get('/:id/notifications', controller.getNotifications);
// POST /api/v1/restaurants/:id/products - Create product
router.post('/:id/products', controller.createProduct);
// POST /api/v1/restaurants/:id/tables - Create single table
router.post('/:id/tables', controller.createTable);
// POST /api/v1/restaurants/:id/tables/batch - Create multiple tables
router.post('/:id/tables/batch', controller.createMultipleTables);
// POST /api/v1/restaurants/:id/categories - Create category
router.post('/:id/categories', controller.createCategory);
// POST /api/v1/restaurants - Create restaurant (though usually done via auth/register)
router.post('/', controller.create);
exports.default = router;
//# sourceMappingURL=restaurant.routes.js.map