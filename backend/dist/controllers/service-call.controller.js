"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceCallController = void 0;
const database_1 = __importDefault(require("../config/database"));
class ServiceCallController {
    async resolve(req, res, next) {
        try {
            const { id } = req.params;
            const serviceCall = await database_1.default.serviceCall.update({
                where: { id },
                data: {
                    status: 'RESOLVED',
                    resolvedAt: new Date(),
                },
            });
            res.json({ success: true, data: serviceCall });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ServiceCallController = ServiceCallController;
//# sourceMappingURL=service-call.controller.js.map