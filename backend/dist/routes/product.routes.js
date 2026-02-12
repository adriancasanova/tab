"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("../controllers/product.controller");
const validate_1 = require("../middleware/validate");
const schemas_1 = require("../schemas");
const router = (0, express_1.Router)();
const controller = new product_controller_1.ProductController();
// Note: Create product is nested under restaurant
// POST /api/v1/restaurants/:restaurantId/products - handled in restaurant routes
// GET /api/v1/products/:id
router.get('/:id', controller.getById);
// PUT /api/v1/products/:id
router.put('/:id', (0, validate_1.validate)(schemas_1.updateProductSchema), controller.update);
// DELETE /api/v1/products/:id
router.delete('/:id', controller.delete);
// PATCH /api/v1/products/:id/availability
router.patch('/:id/availability', controller.toggleAvailability);
exports.default = router;
//# sourceMappingURL=product.routes.js.map