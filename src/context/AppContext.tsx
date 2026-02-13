import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Session, Consumer, Product, Category, Table, Notification } from '../types';
import { api } from '../services/api';

const STORAGE_KEYS = {
    SESSION_ID: 'gastrosplit_session_id',
    USER_ID: 'gastrosplit_user_id', // To remember who 'I' am in the session
    SESSION_TOKEN: 'gastrosplit_session_token',
};

const RESTAURANT_SLUG = import.meta.env.VITE_RESTAURANT_SLUG || 'demo-restaurant';



interface AppContextType {
    session: Session | null;
    currentUser: Consumer | null;
    products: Product[];
    categories: Category[];
    tables: Table[];
    allSessions: Session[];
    notifications: Notification[];
    restaurantId: string | null;
    restaurantSlug: string;
    isLoading: boolean;
    error: string | null;

    // Actions
    startSessionAtTable: (tableId: string, userData: { name: string }) => Promise<boolean>;
    startGuestSession: (userData: { name: string }) => Promise<void>; // Not fully supported by backend yet, will mock or error
    joinSession: (sessionId: string, name: string) => Promise<void>;
    addConsumerToSession: (name: string) => Promise<void>;
    leaveSession: () => void;

    // Order
    addItemToOrder: (product: Product, quantity: number, consumerIds: string[]) => Promise<void>;

    // Services
    callWaiter: () => Promise<void>;
    callWaiterWithoutSession: () => Promise<void>; // Mock for now
    requestBill: () => Promise<void>;

    // Admin
    refreshData: () => Promise<void>;
    addProduct: (product: any) => Promise<void>;
    updateProduct: (product: Product) => Promise<void>;
    deleteProduct: (productId: string) => Promise<void>;
    addTable: (number: string) => Promise<void>;
    updateTable: (tableId: string, number: string) => Promise<void>;
    toggleTableEnabled: (tableId: string) => Promise<void>;

    // Notifications
    markNotificationRead: (id: string) => void; // Local only for now or need endpoint
    resolveServiceCall: (sessionId: string, callId: string) => Promise<void>;

    // Helpers & Stubs (Legacy support)
    addMultipleTables: (from: number, to: number) => Promise<void>;
    deleteTable: (tableId: string) => Promise<void>;
    getEnabledTables: () => Table[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
    children: React.ReactNode;
    restaurantSlug?: string;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children, restaurantSlug }) => {
    // Use prop if provided, otherwise fallback to env var
    const activeSlug = restaurantSlug || RESTAURANT_SLUG;

    const [session, setSession] = useState<Session | null>(null);
    const [currentUser, setCurrentUser] = useState<Consumer | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [tables, setTables] = useState<Table[]>([]);
    const [allSessions, setAllSessions] = useState<Session[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial Load
    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            try {
                // 1. Get Restaurant & Tables
                const restaurant = await api.getRestaurant(activeSlug);
                setRestaurantId(restaurant.id);
                setTables(restaurant.tables || []);

                // 2. Get Menu
                const menu = await api.getMenu(restaurant.id);
                setProducts(menu.products || []);
                setCategories(menu.categories || []);

                // 3. Restore Session
                const token = localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);

                if (token) {
                    try {
                        const sessionData = await api.getCurrentSession(token);
                        setSession(sessionData);

                        // Restore current user from session data
                        // We still store USER_ID to know which consumer is "me"
                        const savedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
                        if (savedUserId) {
                            const me = sessionData.consumers.find(c => c.id === savedUserId);
                            if (me) setCurrentUser(me);
                        }
                    } catch (e) {
                        console.warn('Could not restore session', e);
                        localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
                        localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
                        localStorage.removeItem(STORAGE_KEYS.USER_ID);
                    }
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, []);

    // Helper to refresh session state
    const refreshSession = async () => {
        if (!session) return;
        try {
            const updated = await api.getSession(session.id);
            setSession(updated);
        } catch (e) {
            console.error('Error refreshing session', e);
        }
    };

    const startSessionAtTable = async (tableId: string, userData: { name: string }): Promise<boolean> => {
        try {
            setIsLoading(true);
            // Unified join/start logic
            const { token, session: newSession, consumer } = await api.joinSession(tableId, userData.name);

            setSession(newSession);
            setCurrentUser(consumer);

            localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, token);
            localStorage.setItem(STORAGE_KEYS.SESSION_ID, newSession.id);
            localStorage.setItem(STORAGE_KEYS.USER_ID, consumer.id);
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const startGuestSession = async (_userData: { name: string }) => {
        console.warn('Guest session not implemented in backend yet');
    };

    const joinSession = async (sessionId: string, name: string) => {
        // This method seems redundant with startSessionAtTable now being unified,
        // but if we join by SessionID specifically instead of TableID, we might need it.
        // For now, assuming standard flow uses startSessionAtTable (which calls API join).
        // If this is used for "Joining via link" that has session ID but not table ID, we'd need a backend change.
        // But our requirements said "Scans QR -> Table ID".
        // Let's repurpose it or deprecate. For safety, mapping to addConsumer but we really should use the join endpoint.
        // Actually, if we have sessionId, we are already "in" the table context?
        // Let's assume this is legacy or secondary.
        try {
            // NOTE: Ideally we use joinSession(tableId) instead. 
            // If we only have SessionID, we can't easily use the new secure flow without a new endpoint.
            // Retaining old logic but warning? Or maybe we don't need to change this if it works for strictly "adding consumer".
            // But we want persistence.
            // Let's stick to the plan: Minimal changes. 
            // If startSessionAtTable covers the QR flow, we are good.
            const consumer = await api.addConsumer(sessionId, name);
            const updatedSession = await api.getSession(sessionId);
            setSession(updatedSession);
            setCurrentUser(consumer);

            // We don't get a token here... that's a gap if this path is used.
            // But the main flow is QR Scan -> Table -> startSessionAtTable.
            localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
            localStorage.setItem(STORAGE_KEYS.USER_ID, consumer.id);
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const addConsumerToSession = async (name: string) => {
        if (!session) return;
        try {
            setIsLoading(true);
            await api.addConsumer(session.id, name);
            await refreshSession();
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const leaveSession = () => {
        setSession(null);
        setCurrentUser(null);
        localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
        localStorage.removeItem(STORAGE_KEYS.USER_ID);
    };

    const addItemToOrder = async (product: Product, quantity: number, consumerIds: string[]) => {
        if (!session) return;
        try {
            await api.addOrder(session.id, [{ productId: product.id, quantity, consumerIds }]);
            await refreshSession(); // Update local state
        } catch (err: any) {
            setError(err.message);
            alert('Error adding item: ' + err.message);
        }
    };

    const callWaiter = async () => {
        if (!session) return;
        try {
            await api.createServiceCall(session.id, 'WAITER');
            // Optimistic update or refresh?
            // Backend doesn't return the full session on call creation, usually.
            // Let's refresh to confirm.
            await refreshSession();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const requestBill = async () => {
        if (!session) return;
        try {
            await api.createServiceCall(session.id, 'BILL');
            await refreshSession();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const callWaiterWithoutSession = async () => {
        if (!restaurantId) return;
        try {
            await api.createServiceCallWithoutSession(restaurantId, 'WAITER');
        } catch (err: any) {
            console.error('Failed to call waiter from entrance:', err);
            setError(err.message);
        }
    };

    // Admin
    const refreshData = async () => {
        if (!restaurantId) return;
        setIsLoading(true);
        try {
            // Refresh tables (via restaurant endpoint)
            const restaurant = await api.getRestaurant(activeSlug);
            setTables(restaurant.tables || []);

            const activeSessions = await api.getActiveSessions(restaurantId);
            setAllSessions(activeSessions);

            const notifs = await api.getNotifications(restaurantId);
            // Map backend notifications to frontend shape if needed
            // For now assuming compatible or ignoring extra fields
            setNotifications(notifs);

            // Also refresh menu
            const menu = await api.getMenu(restaurantId);
            setProducts(menu.products || []);
            setCategories(menu.categories || []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    // Stub Admin methods
    const addProduct = async (product: any) => {
        if (!restaurantId) {
            throw new Error('No se encontró el ID del restaurante');
        }
        try {
            await api.createProduct(restaurantId, product);
            await refreshData();
        } catch (error) {
            console.error('Error creating product:', error);
            throw error;
        }
    };
    const updateProduct = async (product: Product) => { await api.updateProduct(product.id, product); await refreshData(); };
    const deleteProduct = async (id: string) => { await api.deleteProduct(id); await refreshData(); };
    const addTable = async (num: string) => { if (restaurantId) await api.createTable(restaurantId, num); await refreshData(); };
    const updateTable = async (id: string, num: string) => { await api.updateTable(id, num); await refreshData(); };
    const toggleTableEnabled = async (id: string) => { await api.toggleTable(id); await refreshData(); };

    const resolveServiceCall = async (_sessionId: string, callId: string) => {
        await api.resolveServiceCall(callId);
        await refreshData();
    };

    const markNotificationRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    return (
        <AppContext.Provider value={{
            session,
            currentUser,
            products,
            categories,
            tables,
            allSessions,
            notifications,
            restaurantId,
            restaurantSlug: activeSlug,
            isLoading,
            error,
            startSessionAtTable,
            startGuestSession,
            joinSession,
            addConsumerToSession,
            leaveSession,
            addItemToOrder,
            callWaiter,
            callWaiterWithoutSession,
            requestBill,
            refreshData,
            addProduct,
            updateProduct,
            deleteProduct,
            addTable,
            addMultipleTables: async (from: number, to: number) => {
                if (!restaurantId) return;
                setIsLoading(true);
                try {
                    // Loop execution for now
                    const promises = [];
                    for (let i = from; i <= to; i++) {
                        promises.push(api.createTable(restaurantId, i.toString()));
                    }
                    await Promise.all(promises);
                    await refreshData();
                } catch (e) {
                    console.error(e);
                } finally {
                    setIsLoading(false);
                }
            },
            updateTable,
            toggleTableEnabled,
            getEnabledTables: () => tables.filter(t => t.isEnabled), // Helper
            deleteTable: async (tableId: string) => {
                await api.deleteTable(tableId);
                await refreshData();
            },
            markNotificationRead,
            resolveServiceCall,
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
};
