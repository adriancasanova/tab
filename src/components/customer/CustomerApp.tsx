import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Menu } from './Menu';
import { OrderSummary } from './OrderSummary';

export const CustomerApp: React.FC = () => {
    const { session, currentUser, callWaiter, requestBill, addConsumerToSession, leaveSession } = useApp();
    const [activeTab, setActiveTab] = useState<'menu' | 'bill'>('menu');
    const [showAddPerson, setShowAddPerson] = useState(false);
    const [newPersonName, setNewPersonName] = useState('');

    const handleAddPerson = () => {
        if (newPersonName.trim()) {
            addConsumerToSession(newPersonName.trim());
            setNewPersonName('');
            setShowAddPerson(false);
        }
    };

    return (
        <div className="page-container">
            {/* Header */}
            <header className="page-header">
                <div style={{ width: 60, height: 2, background: '#fff', margin: '0 auto var(--spacing-md)' }} />
                <h1 className="page-title">MESA {session?.tableId}</h1>
                <p className="page-subtitle">
                    {currentUser?.name} • {session?.consumers.length || 0} persona(s)
                </p>

                {/* People at table */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 'var(--spacing-sm)',
                    marginTop: 'var(--spacing-md)',
                    flexWrap: 'wrap'
                }}>
                    {session?.consumers.map((consumer) => (
                        <span
                            key={consumer.id}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                background: consumer.id === currentUser?.id ? 'var(--color-primary)' : 'var(--color-surface)',
                                color: consumer.id === currentUser?.id ? '#000' : 'var(--color-text)',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                            }}
                        >
                            {consumer.name} {consumer.id === currentUser?.id && '(Yo)'}
                        </span>
                    ))}
                    <button
                        onClick={() => setShowAddPerson(true)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            background: 'transparent',
                            border: '2px dashed var(--color-border)',
                            color: 'var(--color-text-muted)',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                        }}
                    >
                        + Agregar
                    </button>
                </div>
            </header>

            {/* Add Person Modal */}
            {showAddPerson && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100,
                    padding: 'var(--spacing-md)',
                }}>
                    <div style={{
                        background: 'var(--color-surface)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--spacing-xl)',
                        maxWidth: 400,
                        width: '100%',
                        textAlign: 'center',
                    }}>
                        <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Agregar Persona</h2>
                        <input
                            type="text"
                            placeholder="Nombre..."
                            value={newPersonName}
                            onChange={(e) => setNewPersonName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddPerson()}
                            className="form-input"
                            autoFocus
                        />
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-lg)' }}>
                            <button
                                onClick={() => setShowAddPerson(false)}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'transparent',
                                    border: '1px solid var(--color-border)',
                                    color: 'var(--color-text)',
                                    cursor: 'pointer',
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddPerson}
                                className="form-button"
                                style={{ flex: 1, marginTop: 0 }}
                            >
                                Agregar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <main style={{ paddingBottom: '120px' }}>
                {activeTab === 'menu' ? <Menu /> : <OrderSummary />}
            </main>

            {/* Bottom Navigation */}
            <div className="bottom-nav">
                <button
                    className={`nav-button ${activeTab === 'menu' ? 'active' : 'inactive'}`}
                    onClick={() => setActiveTab('menu')}
                >
                    MENÚ
                </button>
                <button
                    className={`nav-button ${activeTab === 'bill' ? 'active' : 'inactive'}`}
                    onClick={() => setActiveTab('bill')}
                >
                    MI CUENTA
                </button>
                <button
                    className="nav-button inactive"
                    onClick={callWaiter}
                >
                    🔔 MOZO
                </button>
                <button
                    className="nav-button inactive"
                    onClick={requestBill}
                >
                    💳 CUENTA
                </button>
                <button
                    className="nav-button inactive"
                    onClick={leaveSession}
                    style={{ color: '#d32f2f' }}
                >
                    SALIR
                </button>
            </div>
        </div>
    );
};
