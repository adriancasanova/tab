import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';

export const OrderSummary: React.FC = () => {
    const { session, currentUser } = useApp();

    const myShare = useMemo(() => {
        if (!session || !currentUser) return { total: 0, items: [] };

        let total = 0;
        const items: { name: string; quantity: number; sharePrice: number; isShared: boolean }[] = [];

        session.orders.forEach((order) => {
            order.items.forEach((item) => {
                if (item.consumerIds.includes(currentUser.id)) {
                    const splitFactor = item.consumerIds.length;
                    const priceShare = (item.product.price * item.quantity) / splitFactor;

                    total += priceShare;
                    items.push({
                        name: item.product.name,
                        quantity: item.quantity,
                        sharePrice: priceShare,
                        isShared: splitFactor > 1,
                    });
                }
            });
        });

        return { total, items };
    }, [session, currentUser]);

    const totalTable = useMemo(() => {
        if (!session) return 0;
        return session.orders.reduce((acc, order) => {
            return acc + order.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        }, 0);
    }, [session]);

    if (!session || session.orders.length === 0) {
        return (
            <div className="menu-section text-center">
                <p style={{ fontSize: '3rem', marginBottom: 'var(--spacing-sm)' }}>🍽️</p>
                <p className="text-muted">Tu mesa está vacía.</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-xs)' }}>
                    ¡Explora el menú y pide algo!
                </p>
            </div>
        );
    }

    return (
        <div className="menu-section">
            {/* Total Card */}
            <div className="summary-card">
                <p className="summary-label">Tu Total Estimado</p>
                <p className="summary-amount">${myShare.total.toLocaleString()}</p>
                <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', opacity: 0.7 }}>
                    <span>Total Mesa</span>
                    <span>${totalTable.toLocaleString()}</span>
                </div>
            </div>

            {/* Items List */}
            <h3 className="menu-section-title">DETALLE</h3>
            {myShare.items.map((item, idx) => (
                <div key={idx} className="summary-item">
                    <div className="summary-item-left">
                        <div className="summary-item-qty">{item.quantity}</div>
                        <div>
                            <p className="summary-item-name">{item.name}</p>
                            {item.isShared && (
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Compartido</p>
                            )}
                        </div>
                    </div>
                    <span className="summary-item-price">${item.sharePrice.toLocaleString()}</span>
                </div>
            ))}

            <button className="pay-button">Pagar mi Parte</button>
        </div>
    );
};
