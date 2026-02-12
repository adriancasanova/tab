import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:3001/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Login failed');
            }

            login(data.data.token, data.data.user);

            // Redirect to admin dashboard or restaurant creation
            if (data.data.user.restaurantSlug) {
                navigate(`/${data.data.user.restaurantSlug}/admin`);
            } else {
                navigate('/create-restaurant');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fullscreen-bg">
            <img
                src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1920&q=80"
                alt="Login background"
                className="fullscreen-bg-image"
            />
            <div className="fullscreen-overlay" />

            <div className="centered-content" style={{ maxWidth: 450 }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                    <h1 className="form-title" style={{ letterSpacing: '0.2em' }}>GASTROSPLIT</h1>
                    <p style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.9rem', marginTop: -5 }}>
                        BUSINESS PORTAL
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="glass-morphism" style={{ padding: 'var(--spacing-xl)', borderRadius: 'var(--radius-lg)' }}>
                    <h2 style={{ marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}>Ingresar al Panel</h2>

                    {error && (
                        <div style={{
                            background: 'rgba(211, 47, 47, 0.1)',
                            border: '1px solid #d32f2f',
                            color: '#ff6b6b',
                            padding: 'var(--spacing-sm)',
                            borderRadius: 'var(--radius-sm)',
                            marginBottom: 'var(--spacing-md)',
                            fontSize: '0.85rem',
                            textAlign: 'center'
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="mb-lg">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="dueño@negocio.com"
                        />
                    </div>

                    <div className="mb-xl">
                        <label className="form-label">Contraseña</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        className="form-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'CARGANDO...' : 'INGRESAR'}
                    </button>

                    <div style={{ marginTop: 'var(--spacing-lg)', textAlign: 'center', fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>¿No tenés cuenta? </span>
                        <Link to="/register" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
                            Registrar Negocio
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
