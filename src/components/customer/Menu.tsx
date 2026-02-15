import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Product } from '../../types';

export const Menu: React.FC = () => {
    const { products, addItemToOrder, session, currentUser } = useApp();
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedConsumers, setSelectedConsumers] = useState<string[]>([]);
    const [quantity, setQuantity] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Group products by category
    const categories = products.reduce((acc, product) => {
        const categoryName = typeof product.category === 'object' ? product.category.name : product.category;

        if (!acc[categoryName]) {
            acc[categoryName] = [];
        }
        acc[categoryName].push(product);
        return acc;
    }, {} as Record<string, Product[]>);

    const categoryImages: Record<string, string> = {
        'Tragos': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
        'Comida': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
        'Bebidas': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=80',
        'Entradas': 'https://images.unsplash.com/photo-1541014741259-de529411b96a?auto=format&fit=crop&w=800&q=80',
        'Postres': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80',
    };

    const handleOpenProduct = (product: Product) => {
        setSelectedProduct(product);
        setSelectedConsumers(currentUser ? [currentUser.id] : []);
        setQuantity(1);
    };

    const toggleConsumer = (consumerId: string) => {
        setSelectedConsumers(prev =>
            prev.includes(consumerId)
                ? prev.filter(id => id !== consumerId)
                : [...prev, consumerId]
        );
    };

    const selectAllConsumers = () => {
        if (session) {
            setSelectedConsumers(session.consumers.map(c => c.id));
        }
    };

    const handleAddToCart = async () => {
        if (selectedProduct && selectedConsumers.length > 0) {
            try {
                await addItemToOrder(selectedProduct, quantity, selectedConsumers);
                setSelectedProduct(null);
                alert(`✓ ${quantity}x ${selectedProduct.name} agregado al pedido`);
            } catch (error) {
                console.error("Error adding item", error);
                alert("Hubo un error al agregar el item.");
            }
        }
    };

    const handleCategoryClick = (category: string) => {
        // If clicking the same category, deselect it (show all categories again)
        if (selectedCategory === category) {
            setSelectedCategory(null);
        } else {
            setSelectedCategory(category);
        }
    };

    // Filter products based on selected category
    const filteredCategories = selectedCategory
        ? { [selectedCategory]: categories[selectedCategory] }
        : categories;

    if (!products.length) {
        return <div className="text-center text-muted">Cargando menú...</div>;
    }

    return (
        <>
            {/* Category Cards */}
            <div className="category-grid">
                {/* "Ver Todo" card */}
                <div
                    className="category-card"
                    onClick={() => setSelectedCategory(null)}
                    style={{
                        border: selectedCategory === null ? '3px solid var(--color-primary)' : 'none',
                        cursor: 'pointer',
                    }}
                >
                    <div style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, var(--color-primary) 0%, #6b5b95 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <h3 className="category-card-title" style={{ color: '#000', fontSize: '1.5rem' }}>VER TODO</h3>
                    </div>
                </div>

                {Object.keys(categories).map((category) => (
                    <div
                        key={category}
                        className="category-card"
                        onClick={() => handleCategoryClick(category)}
                        style={{
                            border: selectedCategory === category ? '3px solid var(--color-primary)' : 'none',
                            cursor: 'pointer',
                        }}
                    >
                        <img
                            src={categoryImages[category] || categoryImages['Comida']}
                            alt={category}
                            className="category-card-image"
                        />
                        <div className="category-card-overlay">
                            <h3 className="category-card-title">{category.toUpperCase()}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Menu Items - Only show if a category is selected or "Ver Todo" */}
            {Object.entries(filteredCategories).map(([category, items]) => (
                <div key={category} className="menu-section">
                    <h2 className="menu-section-title">{category}</h2>
                    {items.map((product) => (
                        <div
                            key={product.id}
                            className="menu-item"
                            onClick={() => handleOpenProduct(product)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="menu-item-checkbox" />
                            <span className="menu-item-name">{product.name}</span>
                            <span className="menu-item-price">${product.price.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            ))}

            {/* Product Detail Modal */}
            {selectedProduct && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.95)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 100,
                        padding: 'var(--spacing-md)',
                    }}
                    onClick={() => setSelectedProduct(null)}
                >
                    <div
                        style={{
                            background: 'var(--color-surface)',
                            borderRadius: 'var(--radius-lg)',
                            maxWidth: 420,
                            width: '100%',
                            overflow: 'hidden',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={selectedProduct.imageUrl}
                            alt={selectedProduct.name}
                            style={{ width: '100%', height: 180, objectFit: 'cover' }}
                        />

                        <div style={{ padding: 'var(--spacing-lg)' }}>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-xs)' }}>
                                {selectedProduct.name}
                            </h2>
                            <p style={{ color: 'var(--color-primary)', fontSize: '1.25rem', fontWeight: 600 }}>
                                ${selectedProduct.price.toLocaleString()}
                            </p>
                            <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--spacing-sm)', fontSize: '0.875rem' }}>
                                {selectedProduct.description}
                            </p>

                            {/* Consumer Selection */}
                            <div style={{ marginTop: 'var(--spacing-lg)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                        ¿Para quién es?
                                    </p>
                                    <button
                                        onClick={selectAllConsumers}
                                        style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: 'var(--radius-sm)',
                                            border: '1px solid var(--color-primary)',
                                            background: 'transparent',
                                            color: 'var(--color-primary)',
                                            fontSize: '0.75rem',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        TODOS
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
                                    {session?.consumers?.map((c) => (
                                        <button
                                            key={c.id}
                                            onClick={() => toggleConsumer(c.id)}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                borderRadius: 'var(--radius-md)',
                                                border: selectedConsumers.includes(c.id)
                                                    ? '2px solid var(--color-primary)'
                                                    : '2px solid var(--color-border)',
                                                background: selectedConsumers.includes(c.id)
                                                    ? 'var(--color-primary)'
                                                    : 'transparent',
                                                color: selectedConsumers.includes(c.id) ? '#000' : 'var(--color-text)',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem',
                                                fontWeight: 500,
                                            }}
                                        >
                                            {c.id === currentUser?.id ? `${c.name} (Yo)` : c.name}
                                        </button>
                                    ))}
                                </div>
                                {selectedConsumers.length > 1 && (
                                    <p style={{ marginTop: 'var(--spacing-sm)', fontSize: '0.75rem', color: 'var(--color-primary)' }}>
                                        💡 Se dividirá entre {selectedConsumers.length} personas (${(selectedProduct.price / selectedConsumers.length).toLocaleString()} c/u)
                                    </p>
                                )}
                            </div>

                            {/* Quantity */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-border)',
                                        background: 'transparent',
                                        color: 'var(--color-text)',
                                        fontSize: '1.25rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    -
                                </button>
                                <span style={{ fontSize: '1.25rem', fontWeight: 600, minWidth: 40, textAlign: 'center' }}>{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-border)',
                                        background: 'transparent',
                                        color: 'var(--color-text)',
                                        fontSize: '1.25rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    +
                                </button>
                                <span style={{ marginLeft: 'auto', fontSize: '1.5rem', fontWeight: 700 }}>
                                    ${(selectedProduct.price * quantity).toLocaleString()}
                                </span>
                            </div>

                            {/* Add Button */}
                            <button
                                onClick={handleAddToCart}
                                disabled={selectedConsumers.length === 0}
                                className="form-button"
                                style={{
                                    marginTop: 'var(--spacing-lg)',
                                    opacity: selectedConsumers.length === 0 ? 0.5 : 1,
                                    cursor: selectedConsumers.length === 0 ? 'not-allowed' : 'pointer',
                                }}
                            >
                                AGREGAR AL PEDIDO
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
