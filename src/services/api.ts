import type {
    Product,
    Table,
    Session,
    Consumer,
    Order,
    ServiceCall,
    Notification
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
const RESTAURANT_SLUG = import.meta.env.VITE_RESTAURANT_SLUG || 'demo-restaurant';

// Helper for Fetch requests
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = localStorage.getItem('gs_token');

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options?.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        headers,
        ...options,
    });

    const data = await response.json();

    if (!data.success && !response.ok) {
        throw new Error(data.message || data.error || 'API Error');
    }

    return data.data;
}

export const api = {
    // Restaurant
    getRestaurant: async (slug: string = RESTAURANT_SLUG) => {
        return request<any>(`/restaurants/${slug}`);
    },

    getMenu: async (restaurantId: string) => {
        return request<{ categories: any[], products: Product[] }>(`/restaurants/${restaurantId}/menu`);
    },

    getActiveSessions: async (restaurantId: string) => {
        return request<Session[]>(`/restaurants/${restaurantId}/active-sessions`);
    },

    getNotifications: async (restaurantId: string) => {
        return request<Notification[]>(`/restaurants/${restaurantId}/notifications`);
    },

    // Tables
    createTable: async (restaurantId: string, number: string) => {
        return request<Table>(`/restaurants/${restaurantId}/tables`, {
            method: 'POST',
            body: JSON.stringify({ number }),
        });
    },

    toggleTable: async (tableId: string) => {
        return request<Table>(`/tables/${tableId}/toggle`, { method: 'PATCH' });
    },

    updateTable: async (tableId: string, number: string) => {
        return request<Table>(`/tables/${tableId}`, {
            method: 'PUT',
            body: JSON.stringify({ number }),
        });
    },

    deleteTable: async (tableId: string) => {
        return request<void>(`/tables/${tableId}`, {
            method: 'DELETE',
        });
    },

    // Sessions
    startSession: async (tableId: string, consumerName: string) => {
        return request<Session>(`/tables/${tableId}/sessions`, {
            method: 'POST',
            body: JSON.stringify({ consumerName }),
        });
    },

    getSession: async (sessionId: string) => {
        return request<Session>(`/sessions/${sessionId}`);
    },

    addConsumer: async (sessionId: string, name: string) => {
        return request<Consumer>(`/sessions/${sessionId}/consumers`, {
            method: 'POST',
            body: JSON.stringify({ name }),
        });
    },

    addOrder: async (sessionId: string, items: { productId: string; quantity: number; consumerIds: string[] }[]) => {
        return request<{ order: Order }>(`/sessions/${sessionId}/orders`, {
            method: 'POST',
            body: JSON.stringify({ items }),
        });
    },

    getTotals: async (sessionId: string) => {
        return request<{ sessionTotal: number, consumerTotals: any[] }>(`/sessions/${sessionId}/totals`);
    },

    updateSessionStatus: async (sessionId: string, status: string) => {
        return request<Session>(`/sessions/${sessionId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    },

    // Service Calls
    createServiceCall: async (sessionId: string, type: 'WAITER' | 'BILL') => {
        return request<ServiceCall>(`/sessions/${sessionId}/service-calls`, {
            method: 'POST',
            body: JSON.stringify({ type }),
        });
    },

    createServiceCallWithoutSession: async (restaurantId: string, type: 'WAITER' = 'WAITER') => {
        return request<ServiceCall>(`/restaurants/${restaurantId}/service-calls`, {
            method: 'POST',
            body: JSON.stringify({ type }),
        });
    },

    resolveServiceCall: async (callId: string) => {
        return request<ServiceCall>(`/service-calls/${callId}/resolve`, {
            method: 'PATCH'
        });
    },

    // Admin Products
    createProduct: async (restaurantId: string, product: any) => {
        return request<Product>(`/restaurants/${restaurantId}/products`, {
            method: 'POST',
            body: JSON.stringify(product),
        });
    },

    updateProduct: async (productId: string, data: any) => {
        return request<Product>(`/products/${productId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    toggleProductAvailability: async (productId: string) => {
        return request<Product>(`/products/${productId}/availability`, {
            method: 'PATCH',
        });
    },

    deleteProduct: async (productId: string) => {
        return request<void>(`/products/${productId}`, {
            method: 'DELETE',
        });
    }
};
