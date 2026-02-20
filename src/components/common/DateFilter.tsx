import React, { useState, useMemo } from 'react';

type DatePreset = 'today' | 'yesterday' | 'week' | 'custom';

interface DateFilterProps {
    onChange: (from: string, to: string) => void;
}

export const DateFilter: React.FC<DateFilterProps> = ({ onChange }) => {
    const [activePreset, setActivePreset] = useState<DatePreset>('today');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');

    const today = useMemo(() => {
        const d = new Date();
        return d.toISOString().split('T')[0]; // YYYY-MM-DD
    }, []);

    const getRange = (preset: DatePreset): { from: string; to: string } => {
        const now = new Date();
        switch (preset) {
            case 'today': {
                const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
                const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                return { from: start.toISOString(), to: end.toISOString() };
            }
            case 'yesterday': {
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                const start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0);
                const end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
                return { from: start.toISOString(), to: end.toISOString() };
            }
            case 'week': {
                const weekAgo = new Date(now);
                weekAgo.setDate(weekAgo.getDate() - 7);
                const start = new Date(weekAgo.getFullYear(), weekAgo.getMonth(), weekAgo.getDate(), 0, 0, 0);
                const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                return { from: start.toISOString(), to: end.toISOString() };
            }
            case 'custom': {
                if (customFrom && customTo) {
                    const start = new Date(customFrom + 'T00:00:00');
                    const end = new Date(customTo + 'T23:59:59.999');
                    return { from: start.toISOString(), to: end.toISOString() };
                }
                // Fallback to today
                return getRange('today');
            }
        }
    };

    const handlePresetClick = (preset: DatePreset) => {
        setActivePreset(preset);
        if (preset !== 'custom') {
            const { from, to } = getRange(preset);
            onChange(from, to);
        }
    };

    const handleCustomApply = () => {
        if (customFrom && customTo) {
            const start = new Date(customFrom + 'T00:00:00');
            const end = new Date(customTo + 'T23:59:59.999');
            onChange(start.toISOString(), end.toISOString());
        }
    };

    const presetButtonStyle = (isActive: boolean): React.CSSProperties => ({
        padding: '0.4rem 0.8rem',
        borderRadius: 'var(--radius-md)',
        border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
        background: isActive ? 'rgba(232, 197, 71, 0.15)' : 'transparent',
        color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
        cursor: 'pointer',
        fontSize: '0.8rem',
        fontWeight: isActive ? 600 : 400,
        transition: 'all 0.2s ease',
    });

    return (
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <div style={{
                display: 'flex',
                gap: 'var(--spacing-xs)',
                alignItems: 'center',
                flexWrap: 'wrap',
            }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginRight: 'var(--spacing-xs)' }}>
                    📅 Período:
                </span>
                <button
                    onClick={() => handlePresetClick('today')}
                    style={presetButtonStyle(activePreset === 'today')}
                >
                    Hoy
                </button>
                <button
                    onClick={() => handlePresetClick('yesterday')}
                    style={presetButtonStyle(activePreset === 'yesterday')}
                >
                    Ayer
                </button>
                <button
                    onClick={() => handlePresetClick('week')}
                    style={presetButtonStyle(activePreset === 'week')}
                >
                    Última semana
                </button>
                <button
                    onClick={() => handlePresetClick('custom')}
                    style={presetButtonStyle(activePreset === 'custom')}
                >
                    Personalizado
                </button>
            </div>

            {activePreset === 'custom' && (
                <div style={{
                    display: 'flex',
                    gap: 'var(--spacing-sm)',
                    alignItems: 'center',
                    marginTop: 'var(--spacing-sm)',
                    flexWrap: 'wrap',
                }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Desde:</label>
                    <input
                        type="date"
                        value={customFrom}
                        max={today}
                        onChange={(e) => setCustomFrom(e.target.value)}
                        className="form-input"
                        style={{ width: 'auto', margin: 0, padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                    />
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Hasta:</label>
                    <input
                        type="date"
                        value={customTo}
                        max={today}
                        onChange={(e) => setCustomTo(e.target.value)}
                        className="form-input"
                        style={{ width: 'auto', margin: 0, padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                    />
                    <button
                        onClick={handleCustomApply}
                        disabled={!customFrom || !customTo}
                        style={{
                            padding: '0.35rem 0.75rem',
                            background: customFrom && customTo ? 'var(--color-primary)' : 'var(--color-surface)',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            color: customFrom && customTo ? '#000' : 'var(--color-text-muted)',
                            cursor: customFrom && customTo ? 'pointer' : 'not-allowed',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                        }}
                    >
                        Aplicar
                    </button>
                </div>
            )}
        </div>
    );
};
