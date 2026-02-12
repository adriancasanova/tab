import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface SubscriptionGateProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    requireFullAccess?: boolean;
}

export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({
    children,
   // fallback,
    requireFullAccess = false
}) => {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated || !user) {
        return null;
    }

    // Block completely if inactive
    if (user.status === 'INACTIVE') {
        return (
            <div style={{
                padding: 'var(--spacing-xl)',
                background: 'rgba(211, 47, 47, 0.05)',
                border: '1px solid rgba(211, 47, 47, 0.2)',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
                margin: 'var(--spacing-lg) 0'
            }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-sm)' }}>💳</div>
                <h3>Suscripción Suspendida</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    Por favor, actualice su método de pago para continuar usando el servicio.
                </p>
                <button className="form-button" style={{ marginTop: 'var(--spacing-md)', maxWidth: 200 }}>
                    Renovar ahora
                </button>
            </div>
        );
    }

    // Check if full access is required but user is on trial
    if (requireFullAccess && user.status === 'TRIAL') {
        return (
            <div style={{ position: 'relative' }}>
                <div style={{ filter: 'blur(3px)', pointerEvents: 'none' }}>
                    {children}
                </div>
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.6)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-lg)',
                    zIndex: 10,
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-sm)' }}>💎</div>
                    <h4 style={{ margin: 0 }}>Función Premium</h4>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', maxWidth: 200 }}>
                        Esta herramienta requiere un plan **PRO** activo.
                    </p>
                    <button className="form-button" style={{ marginTop: 'var(--spacing-sm)', fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                        Subir a PRO
                    </button>
                </div>
            </div>
        );
    }

    // All checks passed
    return <>{children}</>;
};
