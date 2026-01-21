import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Session, Consumer, Product, Order, OrderItem, ServiceCall, Table } from '../types';

// Storage keys
const STORAGE_KEYS = {
    SESSION: 'gastrosplit_session',
    PRODUCTS: 'gastrosplit_products',
    ALL_SESSIONS: 'gastrosplit_all_sessions',
    TABLES: 'gastrosplit_tables',
};

// Default products
const DEFAULT_PRODUCTS: Product[] = [
    { id: 'p1', name: 'Pizza Margherita', description: 'Tomate, mozzarella, albahaca fresca.', price: 12000, category: 'Comida', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=80', isAvailable: true },
    { id: 'p2', name: 'Salmón Rosado', description: 'Grillado con vegetales de estación.', price: 25000, category: 'Comida', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=500&q=80', isAvailable: true },
    { id: 'p3', name: 'Cerveza IPA', description: 'Artesanal, lupulada y refrescante.', price: 5000, category: 'Bebidas', image: 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?auto=format&fit=crop&w=500&q=80', isAvailable: true },
    { id: 'p4', name: 'Tiramisú', description: 'Clásico postre italiano.', price: 6500, category: 'Postres', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=500&q=80', isAvailable: true },
    { id: 'p5', name: 'Agua Mineral', description: 'Con o sin gas, 500ml.', price: 2000, category: 'Bebidas', image: 'https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=500&q=80', isAvailable: true },
    { id: 'p6', name: 'Ensalada César', description: 'Lechuga, pollo, parmesano, croutones.', price: 9500, category: 'Entradas', image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=500&q=80', isAvailable: true },
];

interface AppState {
    session: Session | null;
    currentUser: Consumer | null;
    products: Product[];
    tables: Table[];
    allSessions: Session[];
    notifications: Notification[];
}

interface Notification {
    id: string;
    type: 'order' | 'waiter' | 'bill';
    message: string;
    sessionId: string;
    tableId: string;
    timestamp: number;
    read: boolean;
}

interface AppContextType extends AppState {
    // Session management
    startSessionAtTable: (tableId: string, userData: { name: string, age?: number, email?: string, phone?: string }) => boolean;
    startGuestSession: (userData: { name: string }) => void;
    joinSession: (name: string) => void;
    addConsumerToSession: (name: string) => void;
    leaveSession: () => void;

    // Orders
    addItemToOrder: (product: Product, quantity: number, consumerIds: string[]) => void;

    // Service
    callWaiter: () => void;
    callWaiterWithoutSession: () => void;
    requestBill: () => void;

    // Products (Admin)
    addProduct: (product: Omit<Product, 'id'>) => void;
    updateProduct: (product: Product) => void;
    deleteProduct: (productId: string) => void;

    // Tables (Admin)
    addTable: (tableNumber: string) => void;
    addMultipleTables: (from: number, to: number) => void;
    updateTable: (tableId: string, newNumber: string) => void;
    toggleTableEnabled: (tableId: string) => void;
    deleteTable: (tableId: string) => void;
    getEnabledTables: () => Table[];

    // Notifications
    markNotificationRead: (notificationId: string) => void;
    resolveServiceCall: (sessionId: string, callId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [currentUser, setCurrentUser] = useState<Consumer | null>(null);
    const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
    const [tables, setTables] = useState<Table[]>([]);
    const [allSessions, setAllSessions] = useState<Session[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        const savedSession = localStorage.getItem(STORAGE_KEYS.SESSION);
        const savedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
        const savedAllSessions = localStorage.getItem(STORAGE_KEYS.ALL_SESSIONS);
        const savedTables = localStorage.getItem(STORAGE_KEYS.TABLES);

        if (savedSession) {
            const parsed = JSON.parse(savedSession);
            setSession(parsed.session);
            setCurrentUser(parsed.currentUser);
        }
        if (savedProducts) {
            setProducts(JSON.parse(savedProducts));
        }
        if (savedAllSessions) {
            setAllSessions(JSON.parse(savedAllSessions));
        }
        if (savedTables) {
            setTables(JSON.parse(savedTables));
        }
    }, []);

    // Save to localStorage on changes
    useEffect(() => {
        if (session) {
            localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ session, currentUser }));
            setAllSessions(prev => {
                const existing = prev.findIndex(s => s.id === session.id);
                if (existing >= 0) {
                    const updated = [...prev];
                    updated[existing] = session;
                    return updated;
                }
                return [...prev, session];
            });
        }
    }, [session, currentUser]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    }, [products]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.ALL_SESSIONS, JSON.stringify(allSessions));
    }, [allSessions]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables));
    }, [tables]);

    // Session Management
    const startSessionAtTable = useCallback((tableId: string, userData: { name: string, age?: number, email?: string, phone?: string }): boolean => {
        // Check if table exists and is enabled
        const table = tables.find(t => t.id === tableId);
        if (!table || !table.isEnabled) {
            return false;
        }

        const newUser: Consumer = {
            id: crypto.randomUUID(),
            sessionId: '',
            name: userData.name,
            age: userData.age,
            email: userData.email,
            phone: userData.phone,
            isGuest: true,
            visitCount: 1,
        };

        const newSession: Session = {
            id: crypto.randomUUID(),
            tableId: table.number,
            businessId: 'biz_001',
            status: 'active',
            startTime: Date.now(),
            consumers: [newUser],
            orders: [],
            serviceCalls: [],
        };

        newUser.sessionId = newSession.id;

        // Update table with current session
        setTables(prev => prev.map(t =>
            t.id === tableId ? { ...t, currentSessionId: newSession.id } : t
        ));

        setSession(newSession);
        setCurrentUser(newUser);
        return true;
    }, [tables]);

    const startGuestSession = useCallback((userData: { name: string }) => {
        const newUser: Consumer = {
            id: crypto.randomUUID(),
            sessionId: '',
            name: userData.name,
            isGuest: true,
            visitCount: 1,
        };

        const newSession: Session = {
            id: crypto.randomUUID(),
            tableId: 'Pendiente',
            businessId: 'biz_001',
            status: 'active',
            startTime: Date.now(),
            consumers: [newUser],
            orders: [],
            serviceCalls: [],
        };

        newUser.sessionId = newSession.id;

        setSession(newSession);
        setCurrentUser(newUser);
    }, []);

    const joinSession = useCallback((name: string) => {
        if (!session) return;

        const newUser: Consumer = {
            id: crypto.randomUUID(),
            sessionId: session.id,
            name,
            isGuest: true,
            visitCount: 1,
        };

        setSession(prev => prev ? ({ ...prev, consumers: [...prev.consumers, newUser] }) : null);
        setCurrentUser(newUser);
    }, [session]);

    const addConsumerToSession = useCallback((name: string) => {
        if (!session) return;

        const newConsumer: Consumer = {
            id: crypto.randomUUID(),
            sessionId: session.id,
            name,
            isGuest: true,
            visitCount: 1,
        };

        setSession(prev => prev ? ({ ...prev, consumers: [...prev.consumers, newConsumer] }) : null);
    }, [session]);

    const leaveSession = useCallback(() => {
        setSession(null);
        setCurrentUser(null);
        localStorage.removeItem(STORAGE_KEYS.SESSION);
    }, []);

    // Orders
    const addItemToOrder = useCallback((product: Product, quantity: number, consumerIds: string[]) => {
        if (!session) return;

        const newItem: OrderItem = {
            id: crypto.randomUUID(),
            productId: product.id,
            product,
            quantity,
            consumerIds,
            status: 'pending',
            timestamp: Date.now(),
        };

        const newOrder: Order = {
            id: crypto.randomUUID(),
            sessionId: session.id,
            items: [newItem],
            status: 'open',
            createdAt: Date.now(),
        };

        setSession(prev => {
            if (!prev) return null;
            return { ...prev, orders: [...prev.orders, newOrder] };
        });

        const notification: Notification = {
            id: crypto.randomUUID(),
            type: 'order',
            message: `Nuevo pedido: ${quantity}x ${product.name}`,
            sessionId: session.id,
            tableId: session.tableId,
            timestamp: Date.now(),
            read: false,
        };
        setNotifications(prev => [notification, ...prev]);
    }, [session]);

    // Service
    const callWaiter = useCallback(() => {
        if (!session) return;

        const call: ServiceCall = {
            id: crypto.randomUUID(),
            sessionId: session.id,
            type: 'waiter',
            status: 'pending',
            timestamp: Date.now(),
        };

        setSession(prev => prev ? ({ ...prev, serviceCalls: [...prev.serviceCalls, call] }) : null);

        const notification: Notification = {
            id: crypto.randomUUID(),
            type: 'waiter',
            message: `Mesa ${session.tableId} solicita mozo`,
            sessionId: session.id,
            tableId: session.tableId,
            timestamp: Date.now(),
            read: false,
        };
        setNotifications(prev => [notification, ...prev]);
    }, [session]);

    const callWaiterWithoutSession = useCallback(() => {
        const notification: Notification = {
            id: crypto.randomUUID(),
            type: 'waiter',
            message: 'Un cliente en la entrada solicita un mozo con el QR',
            sessionId: 'entrance',
            tableId: 'Entrada',
            timestamp: Date.now(),
            read: false,
        };
        setNotifications(prev => [notification, ...prev]);
    }, []);

    const requestBill = useCallback(() => {
        if (!session) return;

        const call: ServiceCall = {
            id: crypto.randomUUID(),
            sessionId: session.id,
            type: 'bill',
            status: 'pending',
            timestamp: Date.now(),
        };

        setSession(prev => prev ? ({ ...prev, serviceCalls: [...prev.serviceCalls, call], status: 'payment_pending' }) : null);

        const notification: Notification = {
            id: crypto.randomUUID(),
            type: 'bill',
            message: `Mesa ${session.tableId} solicita la cuenta`,
            sessionId: session.id,
            tableId: session.tableId,
            timestamp: Date.now(),
            read: false,
        };
        setNotifications(prev => [notification, ...prev]);
    }, [session]);

    // Products (Admin)
    const addProduct = useCallback((productData: Omit<Product, 'id'>) => {
        const newProduct: Product = { ...productData, id: crypto.randomUUID() };
        setProducts(prev => [...prev, newProduct]);
    }, []);

    const updateProduct = useCallback((product: Product) => {
        setProducts(prev => prev.map(p => p.id === product.id ? product : p));
    }, []);

    const deleteProduct = useCallback((productId: string) => {
        setProducts(prev => prev.filter(p => p.id !== productId));
    }, []);

    // Tables (Admin)
    const addTable = useCallback((tableNumber: string) => {
        const newTable: Table = {
            id: crypto.randomUUID(),
            number: tableNumber,
            isEnabled: true,
            createdAt: Date.now(),
        };
        setTables(prev => [...prev, newTable]);
    }, []);

    const addMultipleTables = useCallback((from: number, to: number) => {
        const newTables: Table[] = [];
        for (let i = from; i <= to; i++) {
            newTables.push({
                id: crypto.randomUUID(),
                number: String(i),
                isEnabled: true,
                createdAt: Date.now(),
            });
        }
        setTables(prev => [...prev, ...newTables]);
    }, []);

    const updateTable = useCallback((tableId: string, newNumber: string) => {
        setTables(prev => prev.map(t => t.id === tableId ? { ...t, number: newNumber } : t));
    }, []);

    const toggleTableEnabled = useCallback((tableId: string) => {
        setTables(prev => prev.map(t => t.id === tableId ? { ...t, isEnabled: !t.isEnabled } : t));
    }, []);

    const deleteTable = useCallback((tableId: string) => {
        setTables(prev => prev.filter(t => t.id !== tableId));
    }, []);

    const getEnabledTables = useCallback(() => {
        return tables.filter(t => t.isEnabled);
    }, [tables]);

    // Notifications
    const markNotificationRead = useCallback((notificationId: string) => {
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    }, []);

    const resolveServiceCall = useCallback((sessionId: string, callId: string) => {
        setAllSessions(prev => prev.map(s => {
            if (s.id === sessionId) {
                return {
                    ...s,
                    serviceCalls: s.serviceCalls.map(c => c.id === callId ? { ...c, status: 'resolved' as const } : c),
                };
            }
            return s;
        }));
    }, []);

    return (
        <AppContext.Provider value={{
            session,
            currentUser,
            products,
            tables,
            allSessions,
            notifications,
            startSessionAtTable,
            startGuestSession,
            joinSession,
            addConsumerToSession,
            leaveSession,
            addItemToOrder,
            callWaiter,
            callWaiterWithoutSession,
            requestBill,
            addProduct,
            updateProduct,
            deleteProduct,
            addTable,
            addMultipleTables,
            updateTable,
            toggleTableEnabled,
            deleteTable,
            getEnabledTables,
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
