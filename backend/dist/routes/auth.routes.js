"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const controller = new auth_controller_1.AuthController();
// Public routes
router.post('/register', controller.register);
router.post('/login', controller.login);
// Protected routes
router.get('/me', auth_middleware_1.authenticateToken, controller.me);
router.post('/create-restaurant', auth_middleware_1.authenticateToken, controller.createRestaurant);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map