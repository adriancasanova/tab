import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';

export const AdminMetrics: React.FC = () => {
    const { allSessions, products, tables } = useApp();

    const stats = useMemo(() => {
        let totalRevenue = 0;
        let totalOrders = 0;
        const productSales: Record<string, { quantity: number, revenue: number }> = {};

        allSessions.forEach(session => {
            session.orders.forEach(order => {
                totalOrders++;
                order.items.forEach(item => {
                    const itemTotal = item.product.price * item.quantity;
                    totalRevenue += itemTotal;

                    if (productSales[item.productId]) {
                        productSales[item.productId].quantity += item.quantity;
                        productSales[item.productId].revenue += itemTotal;
                    } else {
                        productSales[item.productId] = { quantity: item.quantity, revenue: itemTotal };
                    }
                });
            });
        });

        const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        const topProducts = Object.entries(productSales)
            .map(([id, data]) => {
                const product = products.find(p => p.id === id);
                return {
                    id,
                    name: product?.name || 'Producto Desconocido',
                    image: product?.image,
                    quantity: data.quantity,
                    revenue: data.revenue
                };
            })
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        return {
            totalRevenue,
            totalOrders,
            averageTicket,
            topProducts
        };
    }, [allSessions, products]);

    const activeTablesCount = tables.filter(t => t.currentSessionId).length;
    const totalTablesCount = tables.length;

    // Helper for currency formatting
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="fade-in">
            {/* KPI Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-xl)'
            }}>
                {/* Revenue Card */}
                <div className="card" style={{ padding: 'var(--spacing-lg)', background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)' }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: 'var(--spacing-xs)' }}>
                        INGRESOS TOTALES
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#4caf50' }}>
                        {formatCurrency(stats.totalRevenue)}
                    </div>
                </div>

                {/* Orders Card */}
                <div className="card" style={{ padding: 'var(--spacing-lg)', background: 'var(--color-surface)' }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: 'var(--spacing-xs)' }}>
                        TOTAL PEDIDOS
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                        {stats.totalOrders}
                    </div>
                </div>

                {/* Avg Ticket Card */}
                <div className="card" style={{ padding: 'var(--spacing-lg)', background: 'var(--color-surface)' }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: 'var(--spacing-xs)' }}>
                        TICKET PROMEDIO
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {formatCurrency(stats.averageTicket)}
                    </div>
                </div>

                {/* Occupancy Card */}
                <div className="card" style={{ padding: 'var(--spacing-lg)', background: 'var(--color-surface)' }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: 'var(--spacing-xs)' }}>
                        OCUPACIÓN ACTUAL
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                        {activeTablesCount} <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>/ {totalTablesCount} mesas</span>
                    </div>
                </div>
            </div>

            {/* Top Products Section */}
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Productos Más Vendidos</h3>
            <div className="card" style={{ padding: 'var(--spacing-md)', background: 'var(--color-surface)' }}>
                {stats.topProducts.length === 0 ? (
                    <p className="text-muted text-center py-md">No hay datos de ventas aún.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                        {stats.topProducts.map((product, index) => (
                            <div key={product.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-md)',
                                padding: 'var(--spacing-sm)',
                                borderBottom: index < stats.topProducts.length - 1 ? '1px solid var(--color-border)' : 'none'
                            }}>
                                <div style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    background: 'var(--color-primary)',
                                    color: '#000',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700
                                }}>
                                    {index + 1}
                                </div>
                                {product.image && (
                                    <img src={product.image} alt={product.name} style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                                )}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600 }}>{product.name}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                        {product.quantity} unidades vendidas
                                    </div>
                                </div>
                                <div style={{ fontWeight: 600 }}>
                                    {formatCurrency(product.revenue)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
