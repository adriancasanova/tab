import { z } from 'zod';
export declare const createRestaurantSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        slug: z.ZodString;
        timezone: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const createCategorySchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        imageUrl: z.ZodOptional<z.ZodString>;
        displayOrder: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
    params: z.ZodObject<{
        restaurantId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const createProductSchema: z.ZodObject<{
    body: z.ZodObject<{
        categoryId: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        price: z.ZodNumber;
        imageUrl: z.ZodOptional<z.ZodString>;
        isAvailable: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>;
    params: z.ZodObject<{
        restaurantId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateProductSchema: z.ZodObject<{
    body: z.ZodObject<{
        categoryId: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodNumber>;
        imageUrl: z.ZodOptional<z.ZodString>;
        isAvailable: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>;
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const createTableSchema: z.ZodObject<{
    body: z.ZodObject<{
        number: z.ZodString;
    }, z.core.$strip>;
    params: z.ZodObject<{
        restaurantId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const createMultipleTablesSchema: z.ZodObject<{
    body: z.ZodObject<{
        from: z.ZodNumber;
        to: z.ZodNumber;
    }, z.core.$strip>;
    params: z.ZodObject<{
        restaurantId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const startSessionSchema: z.ZodObject<{
    body: z.ZodObject<{
        consumerName: z.ZodString;
    }, z.core.$strip>;
    params: z.ZodObject<{
        tableId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const addConsumerSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
    }, z.core.$strip>;
    params: z.ZodObject<{
        sessionId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const addOrderItemSchema: z.ZodObject<{
    body: z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
            productId: z.ZodString;
            quantity: z.ZodDefault<z.ZodNumber>;
            consumerIds: z.ZodArray<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    params: z.ZodObject<{
        sessionId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const createServiceCallSchema: z.ZodObject<{
    body: z.ZodObject<{
        type: z.ZodEnum<{
            WAITER: "WAITER";
            BILL: "BILL";
            OTHER: "OTHER";
        }>;
    }, z.core.$strip>;
    params: z.ZodObject<{
        sessionId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=index.d.ts.map