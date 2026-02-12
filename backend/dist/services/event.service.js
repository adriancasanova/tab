"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventService = void 0;
const database_1 = __importDefault(require("../config/database"));
class EventService {
    static async publish(restaurantId, eventType, payload) {
        try {
            await database_1.default.domainEvent.create({
                data: {
                    restaurantId,
                    eventType,
                    payload: payload,
                },
            });
        }
        catch (error) {
            // Log error but don't fail the main operation
            console.error('Failed to publish domain event:', error);
        }
    }
}
exports.EventService = EventService;
//# sourceMappingURL=event.service.js.map