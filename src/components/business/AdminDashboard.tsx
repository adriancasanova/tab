import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminMetrics } from './AdminMetrics';

export const AdminDashboard: React.FC = () => {
    const {
        products,
        tables,
        allSessions,
        notifications,
        addProduct,
        updateProduct,
        deleteProduct,
        addTable,
        addMultipleTables,
        updateTable,
        toggleTableEnabled,
        deleteTable,
        markNotificationRead,
    } = useApp();

    const [activeTab, setActiveTab] = useState<'notifications' | 'tables' | 'products' | 'manage-tables' | 'metrics'>('metrics');

    // Product form state
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<typeof products[0] | null>(null);
    const [productForm, setProductForm] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        image: '',
        isAvailable: true,
    });

    // Table form state
    const [tableNumber, setTableNumber] = useState('');
    const [multiTableFrom, setMultiTableFrom] = useState('');
    const [multiTableTo, setMultiTableTo] = useState('');
    const [editingTableId, setEditingTableId] = useState<string | null>(null);
    const [editingTableNumber, setEditingTableNumber] = useState('');

    const unreadCount = notifications.filter(n => !n.read).length;
    const activeSessions = allSessions.filter(s => s.status === 'active' || s.status === 'payment_pending');

    // Product handlers
    const handleProductSubmit = () => {
        if (!productForm.name || !productForm.price) return;

        if (editingProduct) {
            updateProduct({
                ...editingProduct,
                name: productForm.name,
                description: productForm.description,
                price: Number(productForm.price),
                category: productForm.category,
                image: productForm.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80',
                isAvailable: productForm.isAvailable,
            });
        } else {
            addProduct({
                name: productForm.name,
                description: productForm.description,
                price: Number(productForm.price),
                category: productForm.category,
                image: productForm.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80',
                isAvailable: productForm.isAvailable,
            });
        }

        resetProductForm();
    };

    const resetProductForm = () => {
        setProductForm({ name: '', description: '', price: '', category: '', image: '', isAvailable: true });
        setEditingProduct(null);
        setShowProductForm(false);
    };

    const startEditProduct = (product: typeof products[0]) => {
        setEditingProduct(product);
        setProductForm({
            name: product.name,
            description: product.description,
            price: String(product.price),
            category: product.category,
            image: product.image,
            isAvailable: product.isAvailable,
        });
        setShowProductForm(true);
    };

    // Table handlers
    const handleAddSingleTable = () => {
        if (tableNumber.trim()) {
            addTable(tableNumber.trim());
            setTableNumber('');
        }
    };

    const handleAddMultipleTables = () => {
        const from = parseInt(multiTableFrom);
        const to = parseInt(multiTableTo);
        if (!isNaN(from) && !isNaN(to) && from <= to) {
            addMultipleTables(from, to);
            setMultiTableFrom('');
            setMultiTableTo('');
        }
    };

    const handleSaveTableEdit = (tableId: string) => {
        if (editingTableNumber.trim()) {
            updateTable(tableId, editingTableNumber.trim());
        }
        setEditingTableId(null);
        setEditingTableNumber('');
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <h1 className="page-title">PANEL ADMIN</h1>
                <p className="page-subtitle">GastroSplit - Gestión del Negocio</p>
            </header>

            {/* Tabs */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-xl)', flexWrap: 'wrap' }}>
                <button onClick={() => setActiveTab('metrics')} className={`nav-button ${activeTab === 'metrics' ? 'active' : 'inactive'}`}>
                    📊 Métricas
                </button>
                <button onClick={() => setActiveTab('notifications')} className={`nav-button ${activeTab === 'notifications' ? 'active' : 'inactive'}`}>
                    🔔 Notificaciones {unreadCount > 0 && `(${unreadCount})`}
                </button>
                <button onClick={() => setActiveTab('tables')} className={`nav-button ${activeTab === 'tables' ? 'active' : 'inactive'}`}>
                    🪑 Mesas Activas ({activeSessions.length})
                </button>
                <button onClick={() => setActiveTab('manage-tables')} className={`nav-button ${activeTab === 'manage-tables' ? 'active' : 'inactive'}`}>
                    ⚙️ Gestionar Mesas ({tables.length})
                </button>
                <button onClick={() => setActiveTab('products')} className={`nav-button ${activeTab === 'products' ? 'active' : 'inactive'}`}>
                    🍽️ Productos ({products.length})
                </button>
            </div>

            {/* Metrics Tab */}
            {activeTab === 'metrics' && <AdminMetrics />}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
                <div className="menu-section">
                    {notifications.length === 0 ? (
                        <p className="text-center text-muted">No hay notificaciones</p>
                    ) : (
                        notifications.map(notification => (
                            <div
                                key={notification.id}
                                onClick={() => markNotificationRead(notification.id)}
                                style={{
                                    padding: 'var(--spacing-md)',
                                    background: notification.read ? 'var(--color-surface)' : 'var(--color-primary)',
                                    color: notification.read ? 'var(--color-text)' : '#000',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: 'var(--spacing-sm)',
                                    cursor: 'pointer',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600 }}>Mesa {notification.tableId}</span>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                        {new Date(notification.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                                <p style={{ marginTop: 'var(--spacing-xs)', fontSize: '0.875rem' }}>{notification.message}</p>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Active Tables Tab */}
            {activeTab === 'tables' && (
                <div className="menu-section">
                    {activeSessions.length === 0 ? (
                        <p className="text-center text-muted">No hay mesas activas</p>
                    ) : (
                        activeSessions.map(sess => {
                            const totalOrders = sess.orders.reduce((acc, order) =>
                                acc + order.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0), 0
                            );
                            const pendingCalls = sess.serviceCalls.filter(c => c.status === 'pending');

                            return (
                                <div key={sess.id} style={{
                                    padding: 'var(--spacing-lg)',
                                    background: 'var(--color-surface)',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: 'var(--spacing-md)',
                                    border: pendingCalls.length > 0 ? '2px solid var(--color-primary)' : 'none',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ fontSize: '1.25rem' }}>Mesa {sess.tableId}</h3>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: 'var(--radius-sm)',
                                            background: sess.status === 'payment_pending' ? '#ff9800' : 'var(--color-primary)',
                                            color: '#000',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                        }}>
                                            {sess.status === 'payment_pending' ? 'CUENTA PEDIDA' : 'ACTIVA'}
                                        </span>
                                    </div>
                                    <div style={{ marginTop: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                        <p>👥 {sess.consumers.length} persona(s): {sess.consumers.map(c => c.name).join(', ')}</p>
                                        <p>🧾 {sess.orders.length} pedido(s) - Total: ${totalOrders.toLocaleString()}</p>
                                        {pendingCalls.length > 0 && (
                                            <p style={{ color: 'var(--color-primary)', fontWeight: 600 }}>⚠️ {pendingCalls.length} llamado(s) pendiente(s)</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Manage Tables Tab */}
            {activeTab === 'manage-tables' && (
                <div className="menu-section">
                    {/* Add single table */}
                    <div style={{ background: 'var(--color-surface)', padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-lg)' }}>
                        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Agregar Mesa Individual</h3>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                            <input
                                type="text"
                                placeholder="Número de mesa..."
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                                className="form-input"
                                style={{ flex: 1 }}
                            />
                            <button onClick={handleAddSingleTable} className="form-button" style={{ marginTop: 0 }}>
                                AGREGAR
                            </button>
                        </div>
                    </div>

                    {/* Add multiple tables */}
                    <div style={{ background: 'var(--color-surface)', padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-lg)' }}>
                        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Agregar Múltiples Mesas</h3>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                            <span>Desde</span>
                            <input
                                type="number"
                                placeholder="1"
                                value={multiTableFrom}
                                onChange={(e) => setMultiTableFrom(e.target.value)}
                                className="form-input"
                                style={{ width: 80 }}
                            />
                            <span>hasta</span>
                            <input
                                type="number"
                                placeholder="40"
                                value={multiTableTo}
                                onChange={(e) => setMultiTableTo(e.target.value)}
                                className="form-input"
                                style={{ width: 80 }}
                            />
                            <button onClick={handleAddMultipleTables} className="form-button" style={{ marginTop: 0 }}>
                                CREAR
                            </button>
                        </div>
                    </div>

                    {/* Tables list */}
                    <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Mesas Existentes ({tables.length})</h3>
                    {tables.length === 0 ? (
                        <p className="text-center text-muted">No hay mesas creadas. Agregá mesas arriba.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 'var(--spacing-sm)' }}>
                            {tables.sort((a, b) => parseInt(a.number) - parseInt(b.number)).map(table => (
                                <div key={table.id} style={{
                                    padding: 'var(--spacing-md)',
                                    background: table.isEnabled ? 'var(--color-surface)' : '#333',
                                    borderRadius: 'var(--radius-md)',
                                    textAlign: 'center',
                                    opacity: table.isEnabled ? 1 : 0.6,
                                }}>
                                    {editingTableId === table.id ? (
                                        <div>
                                            <input
                                                type="text"
                                                value={editingTableNumber}
                                                onChange={(e) => setEditingTableNumber(e.target.value)}
                                                className="form-input"
                                                style={{ marginBottom: 'var(--spacing-xs)' }}
                                                autoFocus
                                            />
                                            <button onClick={() => handleSaveTableEdit(table.id)} style={{
                                                padding: '0.25rem 0.5rem',
                                                background: 'var(--color-primary)',
                                                border: 'none',
                                                borderRadius: 'var(--radius-sm)',
                                                color: '#000',
                                                cursor: 'pointer',
                                                fontSize: '0.75rem',
                                            }}>
                                                Guardar
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>#{table.number}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-sm)' }}>
                                                {table.isEnabled ? '✓ Habilitada' : '✗ Deshabilitada'}
                                            </p>
                                            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                                <button onClick={() => { setEditingTableId(table.id); setEditingTableNumber(table.number); }} style={{
                                                    padding: '0.25rem 0.5rem',
                                                    background: 'transparent',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: 'var(--radius-sm)',
                                                    color: 'var(--color-text)',
                                                    cursor: 'pointer',
                                                    fontSize: '0.75rem',
                                                }}>
                                                    ✏️
                                                </button>
                                                <button onClick={() => toggleTableEnabled(table.id)} style={{
                                                    padding: '0.25rem 0.5rem',
                                                    background: 'transparent',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: 'var(--radius-sm)',
                                                    color: table.isEnabled ? '#ff9800' : 'var(--color-primary)',
                                                    cursor: 'pointer',
                                                    fontSize: '0.75rem',
                                                }}>
                                                    {table.isEnabled ? '🚫' : '✓'}
                                                </button>
                                                <button onClick={() => deleteTable(table.id)} style={{
                                                    padding: '0.25rem 0.5rem',
                                                    background: 'transparent',
                                                    border: '1px solid #d32f2f',
                                                    borderRadius: 'var(--radius-sm)',
                                                    color: '#d32f2f',
                                                    cursor: 'pointer',
                                                    fontSize: '0.75rem',
                                                }}>
                                                    🗑️
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
                <div className="menu-section">
                    <button onClick={() => setShowProductForm(true)} className="form-button" style={{ marginBottom: 'var(--spacing-lg)' }}>
                        + AGREGAR PRODUCTO
                    </button>

                    {products.map(product => (
                        <div key={product.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-md)',
                            padding: 'var(--spacing-md)',
                            background: 'var(--color-surface)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--spacing-sm)',
                        }}>
                            <img src={product.image} alt={product.name} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                            <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: 600 }}>{product.name}</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{product.category}</p>
                            </div>
                            <span style={{ fontWeight: 600 }}>${product.price.toLocaleString()}</span>
                            <button onClick={() => startEditProduct(product)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}>✏️</button>
                            <button onClick={() => deleteProduct(product.id)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', color: '#d32f2f', cursor: 'pointer' }}>🗑️</button>
                        </div>
                    ))}
                </div>
            )}

            {/* Product Form Modal */}
            {showProductForm && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100,
                    padding: 'var(--spacing-md)',
                    overflowY: 'auto',
                }}>
                    <div style={{
                        background: 'var(--color-surface)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--spacing-xl)',
                        maxWidth: 500,
                        width: '100%',
                    }}>
                        <h2 style={{ marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}>
                            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            <input type="text" placeholder="Nombre del producto" value={productForm.name} onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))} className="form-input" />
                            <input type="text" placeholder="Descripción" value={productForm.description} onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))} className="form-input" />
                            <input type="number" placeholder="Precio" value={productForm.price} onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))} className="form-input" />
                            <input type="text" placeholder="Categoría" value={productForm.category} onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))} className="form-input" />
                            <input type="text" placeholder="URL de imagen (opcional)" value={productForm.image} onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.value }))} className="form-input" />
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                <input type="checkbox" checked={productForm.isAvailable} onChange={(e) => setProductForm(prev => ({ ...prev, isAvailable: e.target.checked }))} />
                                Disponible
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-xl)' }}>
                            <button onClick={resetProductForm} style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)', cursor: 'pointer' }}>
                                Cancelar
                            </button>
                            <button onClick={handleProductSubmit} className="form-button" style={{ flex: 1, marginTop: 0 }}>
                                {editingProduct ? 'Guardar' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Back button */}
            <div style={{ position: 'fixed', top: 'var(--spacing-md)', right: 'var(--spacing-md)', zIndex: 100 }}>
                <a href="/users" className="form-button" style={{ textDecoration: 'none', display: 'inline-block', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                    Vista Cliente ↗
                </a>
            </div>
        </div>
    );
};
