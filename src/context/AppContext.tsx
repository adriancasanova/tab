import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Session, Consumer, Product, Table, Notification } from '../types';
import { api } from '../services/api';

const STORAGE_KEYS = {
    SESSION_ID: 'gastrosplit_session_id',
    USER_ID: 'gastrosplit_user_id', // To remember who 'I' am in the session
};

const RESTAURANT_SLUG = import.meta.env.VITE_RESTAURANT_SLUG || 'demo-restaurant';



interface AppContextType {
    session: Session | null;
    currentUser: Consumer | null;
    products: Product[];
    tables: Table[];
    allSessions: Session[];
    notifications: Notification[];
    restaurantId: string | null;
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [currentUser, setCurrentUser] = useState<Consumer | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
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
                const restaurant = await api.getRestaurant(RESTAURANT_SLUG);
                setRestaurantId(restaurant.id);
                setTables(restaurant.tables || []);

                // 2. Get Menu
                const menu = await api.getMenu(restaurant.id);
                setProducts(menu.products || []);

                // 3. Restore Session
                const savedSessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
                const savedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);

                if (savedSessionId) {
                    try {
                        const sessionData = await api.getSession(savedSessionId);
                        setSession(sessionData);

                        if (savedUserId) {
                            const me = sessionData.consumers.find(c => c.id === savedUserId);
                            if (me) setCurrentUser(me);
                        }
                    } catch (e) {
                        console.warn('Could not restore session', e);
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
            const newSession = await api.startSession(tableId, userData.name);
            setSession(newSession);

            // The creator is the first consumer
            const me = newSession.consumers[0]; // Assuming backend adds it as first
            setCurrentUser(me);

            localStorage.setItem(STORAGE_KEYS.SESSION_ID, newSession.id);
            localStorage.setItem(STORAGE_KEYS.USER_ID, me.id);
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
        try {
            const consumer = await api.addConsumer(sessionId, name);
            // We need to fetch the full session to update state
            const updatedSession = await api.getSession(sessionId);
            setSession(updatedSession);
            setCurrentUser(consumer);

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
        console.log('Call waiter from entrance');
    };

    // Admin
    const refreshData = async () => {
        if (!restaurantId) return;
        setIsLoading(true);
        try {
            // Refresh tables (via restaurant endpoint)
            const restaurant = await api.getRestaurant(RESTAURANT_SLUG);
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
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    // Stub Admin methods
    const addProduct = async (product: any) => { if (restaurantId) await api.createProduct(restaurantId, product); await refreshData(); };
    const updateProduct = async (product: Product) => { await api.updateProduct(product.id, product); await refreshData(); };
    const deleteProduct = async (id: string) => { await api.deleteProduct(id); await refreshData(); };
    const addTable = async (num: string) => { if (restaurantId) await api.createTable(restaurantId, num); await refreshData(); };
    const updateTable = async (_id: string, _num: string) => { /* Api missing update table number endpoint? */ };
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
            tables,
            allSessions,
            notifications,
            restaurantId,
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
            deleteTable: async () => { }, // Not implemented
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
