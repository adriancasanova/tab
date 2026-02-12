"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServiceCallSchema = exports.addOrderItemSchema = exports.addConsumerSchema = exports.startSessionSchema = exports.createMultipleTablesSchema = exports.createTableSchema = exports.updateProductSchema = exports.createProductSchema = exports.createCategorySchema = exports.createRestaurantSchema = void 0;
const zod_1 = require("zod");
// Restaurant schemas
exports.createRestaurantSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Name is required'),
        slug: zod_1.z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
        timezone: zod_1.z.string().optional(),
    }),
});
// Category schemas
exports.createCategorySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Name is required'),
        imageUrl: zod_1.z.string().url().optional(),
        displayOrder: zod_1.z.number().int().optional(),
    }),
    params: zod_1.z.object({
        restaurantId: zod_1.z.string().uuid(),
    }),
});
// Product schemas
exports.createProductSchema = zod_1.z.object({
    body: zod_1.z.object({
        categoryId: zod_1.z.string(), // Relaxed to support seeded IDs like 'cat-bebidas'
        name: zod_1.z.string().min(1, 'Name is required'),
        description: zod_1.z.string().optional(),
        price: zod_1.z.number().positive('Price must be positive'),
        imageUrl: zod_1.z.string().url().optional(),
        isAvailable: zod_1.z.boolean().optional(),
    }),
    params: zod_1.z.object({
        restaurantId: zod_1.z.string().uuid(),
    }),
});
exports.updateProductSchema = zod_1.z.object({
    body: zod_1.z.object({
        categoryId: zod_1.z.string().optional(), // Relaxed to support seeded IDs like 'cat-bebidas'
        name: zod_1.z.string().min(1).optional(),
        description: zod_1.z.string().optional(),
        price: zod_1.z.number().positive().optional(),
        imageUrl: zod_1.z.string().url().optional(),
        isAvailable: zod_1.z.boolean().optional(),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string(), // Relaxed to support seeded IDs like 'prod-1'
    }),
});
// Table schemas
exports.createTableSchema = zod_1.z.object({
    body: zod_1.z.object({
        number: zod_1.z.string().min(1, 'Table number is required'),
    }),
    params: zod_1.z.object({
        restaurantId: zod_1.z.string().uuid(),
    }),
});
exports.createMultipleTablesSchema = zod_1.z.object({
    body: zod_1.z.object({
        from: zod_1.z.number().int().positive(),
        to: zod_1.z.number().int().positive(),
    }),
    params: zod_1.z.object({
        restaurantId: zod_1.z.string().uuid(),
    }),
});
// Session schemas
exports.startSessionSchema = zod_1.z.object({
    body: zod_1.z.object({
        consumerName: zod_1.z.string().min(1, 'Consumer name is required'),
    }),
    params: zod_1.z.object({
        tableId: zod_1.z.string().uuid(),
    }),
});
exports.addConsumerSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Name is required'),
    }),
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid(),
    }),
});
// Order schemas
exports.addOrderItemSchema = zod_1.z.object({
    body: zod_1.z.object({
        items: zod_1.z.array(zod_1.z.object({
            productId: zod_1.z.string().uuid(),
            quantity: zod_1.z.number().int().positive().default(1),
            consumerIds: zod_1.z.array(zod_1.z.string().uuid()).min(1, 'At least one consumer required'),
        })).min(1, 'At least one item required'),
    }),
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid(),
    }),
});
// Service call schemas
exports.createServiceCallSchema = zod_1.z.object({
    body: zod_1.z.object({
        type: zod_1.z.enum(['WAITER', 'BILL', 'OTHER']),
    }),
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid(),
    }),
});
//# sourceMappingURL=index.js.map