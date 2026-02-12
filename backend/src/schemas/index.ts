import { z } from 'zod';

// Restaurant schemas
export const createRestaurantSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required'),
        slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
        timezone: z.string().optional(),
    }),
});

// Category schemas
export const createCategorySchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required'),
        imageUrl: z.string().url().optional(),
        displayOrder: z.number().int().optional(),
    }),
    params: z.object({
        restaurantId: z.string().uuid(),
    }),
});

// Product schemas
export const createProductSchema = z.object({
    body: z.object({
        categoryId: z.string(), // Relaxed to support seeded IDs like 'cat-bebidas'
        name: z.string().min(1, 'Name is required'),
        description: z.string().optional(),
        price: z.number().positive('Price must be positive'),
        imageUrl: z.string().url().optional(),
        isAvailable: z.boolean().optional(),
    }),
    params: z.object({
        restaurantId: z.string().uuid(),
    }),
});

export const updateProductSchema = z.object({
    body: z.object({
        categoryId: z.string().optional(), // Relaxed to support seeded IDs like 'cat-bebidas'
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        price: z.number().positive().optional(),
        imageUrl: z.string().url().optional(),
        isAvailable: z.boolean().optional(),
    }),
    params: z.object({
        id: z.string(), // Relaxed to support seeded IDs like 'prod-1'
    }),
});

// Table schemas
export const createTableSchema = z.object({
    body: z.object({
        number: z.string().min(1, 'Table number is required'),
    }),
    params: z.object({
        restaurantId: z.string().uuid(),
    }),
});

export const createMultipleTablesSchema = z.object({
    body: z.object({
        from: z.number().int().positive(),
        to: z.number().int().positive(),
    }),
    params: z.object({
        restaurantId: z.string().uuid(),
    }),
});

// Session schemas
export const startSessionSchema = z.object({
    body: z.object({
        consumerName: z.string().min(1, 'Consumer name is required'),
    }),
    params: z.object({
        tableId: z.string().uuid(),
    }),
});

export const addConsumerSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required'),
    }),
    params: z.object({
        sessionId: z.string().uuid(),
    }),
});

// Order schemas
export const addOrderItemSchema = z.object({
    body: z.object({
        items: z.array(z.object({
            productId: z.string().uuid(),
            quantity: z.number().int().positive().default(1),
            consumerIds: z.array(z.string().uuid()).min(1, 'At least one consumer required'),
        })).min(1, 'At least one item required'),
    }),
    params: z.object({
        sessionId: z.string().uuid(),
    }),
});

// Service call schemas
export const createServiceCallSchema = z.object({
    body: z.object({
        type: z.enum(['WAITER', 'BILL', 'OTHER']),
    }),
    params: z.object({
        sessionId: z.string().uuid(),
    }),
});
