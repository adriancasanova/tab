import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const CreateRestaurant: React.FC = () => {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { user, updateUser } = useAuth();
    const navigate = useNavigate();

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setName(newName);
        // Auto-generate slug
        setSlug(newName.toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const token = localStorage.getItem('gs_token');
            const response = await fetch('http://localhost:3001/api/v1/auth/create-restaurant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, slug }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to create restaurant');
            }

            // Update user in context with new slug
            if (user) {
                updateUser({ ...user, restaurantSlug: slug });
            }

            navigate(`/${slug}/admin`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fullscreen-bg">
            <img
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80"
                alt="Create restaurant background"
                className="fullscreen-bg-image"
            />
            <div className="fullscreen-overlay" />

            <div className="centered-content" style={{ maxWidth: 500 }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                    <h1 className="form-title">TU RESTAURANTE</h1>
                    <p style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                        SETUP YOUR BUSINESS SPACE
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="glass-morphism" style={{ padding: 'var(--spacing-xl)', borderRadius: 'var(--radius-lg)' }}>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}>
                        Ingresá los detalles de tu primer local para comenzar.
                    </p>

                    {error && (
                        <div style={{
                            background: 'rgba(211, 47, 47, 0.1)',
                            border: '1px solid #d32f2f',
                            color: '#ff6b6b',
                            padding: 'var(--spacing-sm)',
                            borderRadius: 'var(--radius-sm)',
                            marginBottom: 'var(--spacing-md)',
                            fontSize: '0.85rem'
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="mb-lg">
                        <label className="form-label">Nombre del Restaurante</label>
                        <input
                            type="text"
                            className="form-input"
                            value={name}
                            onChange={handleNameChange}
                            required
                            placeholder="Ej: Gastro Bar Centro"
                        />
                    </div>

                    <div className="mb-xl">
                        <label className="form-label">URL Personalizada (Slug)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>gastrosplit.com/</span>
                            <input
                                type="text"
                                className="form-input"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                required
                                style={{ flex: 1 }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="form-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'CREANDO...' : 'CREAR Y CONTINUAR'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateRestaurant;
