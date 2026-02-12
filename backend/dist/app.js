"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const error_handler_1 = require("./middleware/error-handler");
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
// Middleware
const isDev = env_1.config.nodeEnv === 'development';
// Middleware
// TODO: [SECURITY] Restrict CORS origin in production to specific frontend domain only.
// Currently allows '*' in development for easier local testing (localhost vs 127.0.0.1 vs port variations).
app.use((0, cors_1.default)({
    origin: isDev ? '*' : env_1.config.frontendUrl,
    credentials: true,
}));
app.use(express_1.default.json());
// Health check
app.get('/health', (_, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API Routes
app.use('/api/v1', routes_1.default);
// Error handling
app.use(error_handler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map