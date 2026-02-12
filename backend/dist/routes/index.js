"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const restaurant_routes_1 = __importDefault(require("./restaurant.routes"));
const product_routes_1 = __importDefault(require("./product.routes"));
const table_routes_1 = __importDefault(require("./table.routes"));
const session_routes_1 = __importDefault(require("./session.routes"));
const order_routes_1 = __importDefault(require("./order.routes"));
const service_call_routes_1 = __importDefault(require("./service-call.routes"));
const router = (0, express_1.Router)();
router.use('/auth', auth_routes_1.default);
router.use('/restaurants', restaurant_routes_1.default);
router.use('/products', product_routes_1.default);
router.use('/tables', table_routes_1.default);
router.use('/sessions', session_routes_1.default);
router.use('/orders', order_routes_1.default);
router.use('/service-calls', service_call_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map