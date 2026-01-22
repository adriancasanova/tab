export type UserRole = 'business' | 'customer';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isAvailable: boolean;
}

export interface Consumer {
  id: string;
  sessionId: string;
  name: string; // "Yo", "Invitado 1", o nombre real
  isGuest: boolean;
  avatar?: string;
  // Analytics fields (optional/inferred)
  email?: string;
  phone?: string;
  age?: number;
  gender?: 'M' | 'F' | 'X' | 'N/A';
  ageRange?: '18-24' | '25-34' | '35-44' | '45+' | 'unknown';
  visitCount: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  consumerIds: string[]; // IDs of consumers sharing this item
  status: 'pending' | 'preparing' | 'served' | 'cancelled';
  timestamp: number;
}

export interface Order {
  id: string;
  sessionId: string;
  items: OrderItem[];
  status: 'open' | 'closed';
  createdAt: number;
}

export interface Session {
  id: string;
  tableId: string;
  businessId: string;
  status: 'active' | 'payment_pending' | 'closed'; // payment_pending to lock orders
  startTime: number;
  endTime?: number;
  consumers: Consumer[];
  orders: Order[];
  serviceCalls: ServiceCall[];
}

export interface ServiceCall {
  id: string;
  sessionId: string;
  type: 'waiter' | 'bill' | 'other';
  status: 'pending' | 'resolved';
  timestamp: number;
}

export interface Notification {
  id: string;
  type: 'order' | 'waiter' | 'bill';
  message: string;
  sessionId: string;
  tableId: string;
  timestamp: number;
  read: boolean;
}

// Business Analytics Types
export interface DailyStats {
  date: string;
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  topProducts: { productId: string; count: number }[];
  busyHours: { hour: number; count: number }[];
}

// Table Management
export interface Table {
  id: string;
  number: string;
  isEnabled: boolean;
  currentSessionId?: string;
  createdAt: number;
}
