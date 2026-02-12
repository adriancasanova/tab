"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const database_1 = __importDefault(require("./config/database"));
const start = async () => {
    try {
        // Test database connection
        await database_1.default.$connect();
        console.log('✅ Database connected');
        app_1.default.listen(env_1.config.port, () => {
            console.log(`🚀 Server running on http://localhost:${env_1.config.port}`);
            console.log(`📋 Environment: ${env_1.config.nodeEnv}`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
// Graceful shutdown
process.on('SIGINT', async () => {
    await database_1.default.$disconnect();
    console.log('👋 Server shutdown gracefully');
    process.exit(0);
});
start();
//# sourceMappingURL=server.js.map