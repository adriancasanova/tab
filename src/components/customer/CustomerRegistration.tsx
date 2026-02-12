import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

interface CustomerRegistrationProps {
    tableNumber?: string;
}

const CustomerRegistration: React.FC<CustomerRegistrationProps> = ({ tableNumber: propTableNumber }) => {
    const { tables, startSessionAtTable, startGuestSession, restaurantSlug, isLoading: isAppLoading } = useApp();
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const urlTableNumber = propTableNumber || searchParams.get('table');

    console.log('🔍 CustomerRegistration mounted:', {
        propTableNumber,
        urlTableNumber,
        restaurantSlug,
        searchParamsTable: searchParams.get('table')
    });

    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Show loading while tables are being fetched
    if (isAppLoading) {
        return (
            <div className="fullscreen-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="fullscreen-overlay" />
                <div style={{ textAlign: 'center', color: 'var(--color-text)', zIndex: 10 }}>
                    <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-md)' }}>⏳</div>
                    <p>Cargando mesa...</p>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Basic Validation
        if (!name.trim()) {
            setError('Por favor ingresá tu nombre');
            setIsLoading(false);
            return;
        }

        const tableNumberToUse = urlTableNumber;

        if (tableNumberToUse) {
            // Find table by number (compare as strings)
            const table = tables.find(t => String(t.number) === String(tableNumberToUse));

            if (!table) {
                console.log('Tables available:', tables.map(t => t.number));
                console.log('Looking for table number:', tableNumberToUse);
                setError(`Mesa ${tableNumberToUse} no encontrada`);
                setIsLoading(false);
                return;
            }

            if (!table.isEnabled) {
                setError('Esta mesa no está habilitada');
                setIsLoading(false);
                return;
            }

            // Attempt to start session at specific table
            const success = await startSessionAtTable(table.id, {
                name: name,
            });

            if (!success) {
                setError('La mesa ya está ocupada o no disponible');
                setIsLoading(false);
                return;
            }
        } else {
            // Start guest session without table
            await startGuestSession({
                name: name,
            });
        }

        // Success redirect - navigate to restaurant-specific customer view
        setTimeout(() => {
            console.log('🔍 Debug redirect:', {
                tableNumberToUse,
                restaurantSlug,
                urlTableNumber,
                propTableNumber
            });

            if (tableNumberToUse) {
                const targetUrl = `/${restaurantSlug}/table/${tableNumberToUse}/users`;
                console.log('✅ Redirecting to:', targetUrl);
                navigate(targetUrl);
            } else {
                console.log('⚠️ No table number, redirecting to /users');
                // Fallback for guest sessions (no table)
                navigate('/users');
            }
        }, 800);
    };

    return (
        <div className="fullscreen-bg">
            <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80"
                alt="Restaurant ambiance"
                className="fullscreen-bg-image"
            />
            <div className="fullscreen-overlay" />

            <div className="centered-content" style={{ maxWidth: '450px' }}>
                <h1 className="form-title">INGRESÁ TU NOMBRE </h1>
                <p className="text-muted mb-lg" style={{ fontSize: '0.9rem' }}>

                </p>

                <form onSubmit={handleSubmit} style={{ width: '100%' }}>

                    {/* Name */}
                    <div className="mb-xl">
                        <input
                            type="text"
                            name="name"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError('');
                            }}
                            placeholder="Ej: Juan Pérez"
                            className="form-input"
                            style={{ textAlign: 'left' }}
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div style={{
                            color: '#ff6b6b',
                            background: 'rgba(255, 107, 107, 0.1)',
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            marginBottom: 'var(--spacing-md)',
                            fontSize: '0.85rem'
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="form-button"
                        disabled={isLoading}
                        style={{ marginTop: 40 }}
                    >
                        {isLoading ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <span style={{
                                    display: 'inline-block',
                                    width: '16px',
                                    height: '16px',
                                    border: '2px solid currentColor',
                                    borderTopColor: 'transparent',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite',
                                }} />
                                INGRESANDO...
                            </span>
                        ) : 'COMENZAR'}
                    </button>

                </form>
            </div>
        </div>
    );
};

export default CustomerRegistration;
