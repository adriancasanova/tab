import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register: React.FC = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        businessName: '',
        phone: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:3001/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Registration failed');
            }

            login(data.data.token, data.data.user);

            // Redirect to create restaurant flow
            navigate('/create-restaurant');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fullscreen-bg">
            <img
                src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1920&q=80"
                alt="Register background"
                className="fullscreen-bg-image"
            />
            <div className="fullscreen-overlay" />

            <div className="centered-content" style={{ maxWidth: 550 }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
                    <h1 className="form-title" style={{ letterSpacing: '0.2em' }}>GASTROSPLIT</h1>
                    <p style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                        NEW BUSINESS REGISTRATION
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="glass-morphism" style={{ padding: 'var(--spacing-xl)', borderRadius: 'var(--radius-lg)' }}>
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                        <div className="mb-md">
                            <label className="form-label">Nombre</label>
                            <input
                                type="text"
                                name="firstName"
                                className="form-input"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="mb-md">
                            <label className="form-label">Apellido</label>
                            <input
                                type="text"
                                name="lastName"
                                className="form-input"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-md">
                        <label className="form-label">Nombre del Negocio</label>
                        <input
                            type="text"
                            name="businessName"
                            className="form-input"
                            value={formData.businessName}
                            onChange={handleChange}
                            required
                            placeholder="Ej: La Parrilla de San Telmo"
                        />
                    </div>

                    <div className="mb-md">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-md">
                        <label className="form-label">Teléfono</label>
                        <input
                            type="text"
                            name="phone"
                            className="form-input"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-xl">
                        <label className="form-label">Contraseña</label>
                        <input
                            type="password"
                            name="password"
                            className="form-input"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="Mínimo 8 caracteres"
                        />
                    </div>

                    <button
                        type="submit"
                        className="form-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'CREANDO CUENTA...' : 'COMIENZA TU PRUEBA GRATIS'}
                    </button>

                    <div style={{ marginTop: 'var(--spacing-lg)', textAlign: 'center', fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>¿Ya tenés cuenta? </span>
                        <Link to="/login" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
                            Iniciar Sesión
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
