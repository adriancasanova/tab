import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import type { Session, OrderItem } from '../../types';
import { DateFilter } from '../common/DateFilter';

const STATUS_LABELS: Record<string, string> = {
    pending: '⏳ Pendiente',
    preparing: '🔥 Preparando',
    served: '✅ Servido',
    cancelled: '❌ Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
    pending: '#ff9800',
    preparing: '#2196f3',
    served: '#4caf50',
    cancelled: '#d32f2f',
};

const NEXT_STATUS: Record<string, string | null> = {
    pending: 'PREPARING',
    preparing: 'SERVED',
    served: null,
    cancelled: null,
};

const NEXT_STATUS_LABEL: Record<string, string> = {
    pending: '🔥 Marcar preparando',
    preparing: '✅ Marcar servido',
};

export const AdminOrders: React.FC = () => {
    const { filteredSessions, fetchSessionsByDate, refreshData } = useApp();
    const [searchFilter, setSearchFilter] = useState('');
    const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
    const [isHistorical, setIsHistorical] = useState(false);

    // Load today's data on mount
    useEffect(() => {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
        const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
        fetchSessionsByDate(from, to);
    }, []);

    const handleDateChange = (from: string, to: string) => {
        fetchSessionsByDate(from, to);
        // Check if filter is for today
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
        setIsHistorical(from !== todayStart || to !== todayEnd);
    };

    // For today: only active/payment_pending. For historical: all sessions with orders
    const displaySessions = filteredSessions
        .filter(s => {
            if (isHistorical) {
                return s.orders.length > 0 && s.orders.some(o => o.items.length > 0);
            }
            return (s.status === 'active' || s.status === 'payment_pending')
                && s.orders.length > 0 && s.orders.some(o => o.items.length > 0);
        })
        .sort((a, b) => b.startTime - a.startTime);

    // Apply table search filter
    const filteredDisplaySessions = searchFilter.trim()
        ? displaySessions.filter(s =>
            s.tableId.toLowerCase().includes(searchFilter.toLowerCase())
        )
        : displaySessions;

    const handleStatusChange = async (itemId: string, newStatus: string) => {
        setUpdatingItems(prev => new Set(prev).add(itemId));
        try {
            await api.updateOrderItemStatus(itemId, newStatus);
            await refreshData();
            // Refresh date-filtered data too
            const now = new Date();
            const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
            const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
            await fetchSessionsByDate(from, to);
        } catch (error: any) {
            console.error('Error updating item status:', error);
            alert(`Error: ${error.message || 'No se pudo actualizar el estado'}`);
        } finally {
            setUpdatingItems(prev => {
                const next = new Set(prev);
                next.delete(itemId);
                return next;
            });
        }
    };

    const getSessionTotal = (session: Session): number => {
        return session.orders.reduce((acc, order) =>
            acc + order.items.reduce((sum, item) =>
                sum + item.product.price * item.quantity, 0
            ), 0
        );
    };

    const getPendingCount = (session: Session): number => {
        return session.orders.reduce((acc, order) =>
            acc + order.items.filter(item => item.status === 'pending' || item.status === 'preparing').length, 0
        );
    };

    const SESSION_STATUS_LABELS: Record<string, string> = {
        active: 'Activa',
        payment_pending: 'Cuenta pedida',
        closed: 'Cerrada',
    };

    const SESSION_STATUS_COLORS: Record<string, string> = {
        active: 'var(--color-primary)',
        payment_pending: '#ff9800',
        closed: '#666',
    };

    return (
        <div className="menu-section">
            {/* Date Filter */}
            <DateFilter onChange={handleDateChange} />

            {/* Search bar */}
            <div style={{
                marginBottom: 'var(--spacing-lg)',
                display: 'flex',
                gap: 'var(--spacing-sm)',
                alignItems: 'center',
            }}>
                <input
                    type="text"
                    placeholder="🔍 Buscar por mesa..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="form-input"
                    style={{ flex: 1, margin: 0 }}
                />
                {searchFilter && (
                    <button
                        onClick={() => setSearchFilter('')}
                        style={{
                            padding: '0.5rem 0.75rem',
                            background: 'transparent',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                        }}
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Summary bar */}
            <div style={{
                display: 'flex',
                gap: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-lg)',
                flexWrap: 'wrap',
            }}>
                <div style={{
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    color: 'var(--color-text-muted)',
                }}>
                    🧾 {filteredDisplaySessions.length} mesa{filteredDisplaySessions.length !== 1 ? 's' : ''} con pedidos
                </div>
                <div style={{
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    color: '#ff9800',
                }}>
                    ⏳ {filteredDisplaySessions.reduce((acc, s) => acc + getPendingCount(s), 0)} items pendientes
                </div>
            </div>

            {/* Empty state */}
            {filteredDisplaySessions.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: 'var(--spacing-xl) var(--spacing-md)',
                    color: 'var(--color-text-muted)',
                }}>
                    <p style={{ fontSize: '2rem', marginBottom: 'var(--spacing-md)' }}>🧾</p>
                    <p style={{ fontSize: '1rem' }}>
                        {searchFilter
                            ? `No se encontraron pedidos para mesa "${searchFilter}"`
                            : isHistorical
                                ? 'No hay pedidos en este período'
                                : 'No hay pedidos activos en este momento'}
                    </p>
                    <p style={{ fontSize: '0.85rem', marginTop: 'var(--spacing-sm)' }}>
                        {isHistorical
                            ? 'Probá con otro rango de fechas'
                            : 'Los pedidos aparecerán aquí cuando los clientes ordenen desde sus mesas'}
                    </p>
                </div>
            ) : (
                /* Table cards */
                filteredDisplaySessions.map(session => {
                    const total = getSessionTotal(session);
                    const pendingCount = getPendingCount(session);
                    const isActive = session.status === 'active' || session.status === 'payment_pending';

                    return (
                        <div
                            key={session.id}
                            style={{
                                background: 'var(--color-surface)',
                                borderRadius: 'var(--radius-lg)',
                                marginBottom: 'var(--spacing-lg)',
                                border: pendingCount > 0 && isActive
                                    ? '2px solid var(--color-primary)'
                                    : '1px solid var(--color-border)',
                                overflow: 'hidden',
                                opacity: isActive ? 1 : 0.8,
                            }}
                        >
                            {/* Card header */}
                            <div style={{
                                padding: 'var(--spacing-md) var(--spacing-lg)',
                                background: pendingCount > 0 && isActive
                                    ? 'rgba(232, 197, 71, 0.08)'
                                    : 'transparent',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: '1px solid var(--color-border)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                    <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
                                        Mesa {session.tableId}
                                    </h3>
                                    <span style={{
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: 'var(--radius-sm)',
                                        background: SESSION_STATUS_COLORS[session.status] || '#666',
                                        color: '#000',
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                    }}>
                                        {SESSION_STATUS_LABELS[session.status] || session.status}
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
                                        ${total.toLocaleString()}
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                                        {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            {/* Consumers */}
                            <div style={{
                                padding: 'var(--spacing-sm) var(--spacing-lg)',
                                fontSize: '0.8rem',
                                color: 'var(--color-text-muted)',
                                borderBottom: '1px solid var(--color-border)',
                            }}>
                                👥 {session.consumers.map(c => c.name).join(', ')}
                            </div>

                            {/* Order items */}
                            <div style={{ padding: 'var(--spacing-sm) 0' }}>
                                {session.orders.flatMap(order =>
                                    order.items.sort((a, b) => b.timestamp - a.timestamp).map((item: OrderItem) => (
                                        <div
                                            key={item.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--spacing-sm)',
                                                padding: 'var(--spacing-sm) var(--spacing-lg)',
                                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                            }}
                                        >
                                            {/* Status indicator */}
                                            <div style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                background: STATUS_COLORS[item.status] || '#666',
                                                flexShrink: 0,
                                            }} />

                                            {/* Item info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                                                    <span style={{
                                                        fontWeight: 600,
                                                        fontSize: '0.9rem',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}>
                                                        {item.quantity}x {item.product.name}
                                                    </span>
                                                </div>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 'var(--spacing-sm)',
                                                    marginTop: 2,
                                                }}>
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        padding: '0.1rem 0.4rem',
                                                        borderRadius: 'var(--radius-sm)',
                                                        background: `${STATUS_COLORS[item.status]}22`,
                                                        color: STATUS_COLORS[item.status],
                                                        fontWeight: 600,
                                                    }}>
                                                        {STATUS_LABELS[item.status] || item.status}
                                                    </span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                        ${item.product.price} c/u
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Subtotal */}
                                            <span style={{
                                                fontWeight: 600,
                                                fontSize: '0.9rem',
                                                color: 'var(--color-text)',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                ${(item.product.price * item.quantity).toLocaleString()}
                                            </span>

                                            {/* Action button - only for active sessions */}
                                            {isActive && NEXT_STATUS[item.status] && (
                                                <button
                                                    onClick={() => handleStatusChange(item.id, NEXT_STATUS[item.status]!)}
                                                    disabled={updatingItems.has(item.id)}
                                                    style={{
                                                        padding: '0.3rem 0.6rem',
                                                        background: item.status === 'pending' ? '#ff980022' : '#2196f322',
                                                        border: `1px solid ${item.status === 'pending' ? '#ff9800' : '#2196f3'}`,
                                                        borderRadius: 'var(--radius-sm)',
                                                        color: item.status === 'pending' ? '#ff9800' : '#2196f3',
                                                        cursor: updatingItems.has(item.id) ? 'wait' : 'pointer',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 600,
                                                        whiteSpace: 'nowrap',
                                                        opacity: updatingItems.has(item.id) ? 0.6 : 1,
                                                    }}
                                                >
                                                    {updatingItems.has(item.id)
                                                        ? '...'
                                                        : NEXT_STATUS_LABEL[item.status] || 'Avanzar'
                                                    }
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};
