import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, Outlet } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CustomerApp } from './components/customer/CustomerApp';
import { AdminDashboard } from './components/business/AdminDashboard';
import CustomerRegistration from './components/customer/CustomerRegistration';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import CreateRestaurant from './components/auth/CreateRestaurant';
import './index.css';

// Pantalla de inicio: Escanear QR o llamar al mozo
const StartSession = () => {
    const { session, currentUser } = useApp();
    const { callWaiterWithoutSession } = useApp();
    const [waiterCalled, setWaiterCalled] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);

    if (session && currentUser) {
        return <Navigate to="/users" replace />;
    }

    const handleCallWaiter = () => {
        setIsLoading(true);
        callWaiterWithoutSession();
        setTimeout(() => {
            setIsLoading(false);
            setWaiterCalled(true);
        }, 500);
    };

    return (
        <div className="fullscreen-bg">
            <img
                src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1920&q=80"
                alt="Restaurant background"
                className="fullscreen-bg-image"
            />
            <div className="fullscreen-overlay" />

            <div className="centered-content">
                <h1 className="form-title" style={{ marginBottom: 'var(--spacing-xl)' }}>BIENVENIDO</h1>

                {/* QR Scan Message */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: 'var(--spacing-xl)',
                    padding: 'var(--spacing-lg)',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📱</div>
                    <p style={{ color: 'var(--color-text)', fontSize: '1.25rem', fontWeight: 500, marginBottom: 'var(--spacing-sm)' }}>
                        Escaneá el QR para acceder
                    </p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                        Encontrá el código QR en tu mesa
                    </p>
                </div>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)', width: '100%' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>o</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                </div>

                {/* Call Waiter Button */}
                {!waiterCalled ? (
                    <button
                        className="form-button"
                        onClick={handleCallWaiter}
                        disabled={isLoading}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-sm)', opacity: isLoading ? 0.7 : 1 }}
                    >
                        {isLoading ? (
                            <>
                                <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                LLAMANDO...
                            </>
                        ) : (
                            <>🔔 LLAMAR AL MOZO</>
                        )}
                    </button>
                ) : (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)', background: 'rgba(76, 175, 80, 0.1)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-sm)' }}>✅</div>
                        <p style={{ color: '#4caf50', fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>¡Mozo notificado!</p>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Un mozo se acercará con el código QR</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Protected route for customer area
const CustomerRoute = () => {
    const { session, currentUser } = useApp();
    if (!session || !currentUser) return <Navigate to="/" replace />;
    return <CustomerApp />;
}; 

// Protected route for admin area - requires auth
const AdminRoute = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const { slug } = useParams<{ slug: string }>();

    if (isLoading) {
        return (
            <div className="fullscreen-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: 'var(--color-text)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-md)' }}>⏳</div>
                    <p>Cargando...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <AppProvider restaurantSlug={slug}>
            <AdminDashboard />
        </AppProvider>
    );
};

// Protected route - requires auth
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="fullscreen-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: 'var(--color-text)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-md)' }}>⏳</div>
                    <p>Cargando...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

// Customer registration via QR code
const TableRegistration = () => {
    const { slug, tableNumber } = useParams<{ slug: string; tableNumber: string }>();

    return (
        <AppProvider restaurantSlug={slug}>
            <CustomerRegistration tableNumber={tableNumber} />
        </AppProvider>
    );
};

// Customer view for specific restaurant and table
/*const TableCustomerView = () => {
    const { slug } = useParams<{ slug: string }>();

    return (
        <AppProvider restaurantSlug={slug}>
            <CustomerRoute />
        </AppProvider>
    );
}; */


// Prueba para ver porque falla la redireccion ------------------------------
// Nuevo componente layout que comparte AppProvider
const TableLayout = () => {
    const { slug } = useParams<{ slug: string }>();
    return (
        <AppProvider restaurantSlug={slug}>
            <Outlet />
        </AppProvider>
    );
};
const CustomerRegistrationWithParams = () => {
    const { tableNumber } = useParams<{ tableNumber: string }>();
    return <CustomerRegistration tableNumber={String(tableNumber)} />;
};
// Fin de prueba --------------------------------------------

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Public customer routes - wrapped in AppProvider */}
                    <Route path="/" element={
                        <AppProvider>
                            <StartSession />
                        </AppProvider>
                    } />

                    {/* Auth routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected auth routes */}
                    <Route path="/create-restaurant" element={
                        <ProtectedRoute>
                            <CreateRestaurant />
                        </ProtectedRoute>
                    } />

                    {/* Multi-tenant routes */}
                    <Route path="/:slug/admin" element={<AdminRoute />} />
                    <Route path="/:slug/table/:tableNumber" element={<TableRegistration />} />
               {/* <Route path="/:slug/table/:tableNumber/users" element={<TableCustomerView />} /> */}     

                    {/* Legacy routes (for backwards compatibility) */}

                    <Route path="/customer-registration-anonimous" element={
                        <AppProvider>
                            <CustomerRegistration />
                        </AppProvider>
                    } />
                    <Route path="/users" element={
                        <AppProvider>
                            <CustomerRoute />
                        </AppProvider>
                    } />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />


                    {/* Prueba para ver porque falla la redireccion */}
                    <Route path="/:slug/table/:tableNumber" element={<TableLayout />}>
                        <Route index element={<CustomerRegistrationWithParams />} />
                        <Route path="users" element={<CustomerRoute />} />
                    </Route>

                    {/* Fin de prueba */}
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
