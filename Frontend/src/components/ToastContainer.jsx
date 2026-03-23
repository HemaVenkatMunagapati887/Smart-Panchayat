// ============================================================
//  components/ToastContainer.jsx
//  Global toast notification system. Render once in main.
// ============================================================

import { useApp } from '../context/AppContext';

const ICONS = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info',
};

const COLORS = {
    success: { bg: '#d1fae5', border: '#6ee7b7', icon: '#059669', text: '#065f46' },
    error: { bg: '#fee2e2', border: '#fca5a5', icon: '#dc2626', text: '#7f1d1d' },
    warning: { bg: '#fef3c7', border: '#fde68a', icon: '#d97706', text: '#78350f' },
    info: { bg: '#dbeafe', border: '#93c5fd', icon: '#2563eb', text: '#1e3a8a' },
};

function Toast({ id, message, type }) {
    const { removeToast } = useApp();
    const c = COLORS[type] || COLORS.info;

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '14px 16px',
                borderRadius: 12,
                background: c.bg,
                border: `1px solid ${c.border}`,
                boxShadow: '0 4px 16px rgba(0,0,0,.12)',
                maxWidth: 380,
                width: '100%',
                animation: 'slideInRight 0.3s ease',
                position: 'relative',
            }}
        >
            <span
                className="material-symbols-outlined"
                style={{ fontSize: 22, color: c.icon, flexShrink: 0, marginTop: 1 }}
            >
                {ICONS[type]}
            </span>
            <div style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: c.text, lineHeight: 1.5 }}>
                {message}
            </div>
            <button
                onClick={() => removeToast(id)}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: c.icon, padding: 0, flexShrink: 0,
                    display: 'flex', alignItems: 'center',
                }}
                aria-label="Dismiss"
            >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
            </button>
        </div>
    );
}

export default function ToastContainer() {
    const { toasts } = useApp();

    if (!toasts.length) return null;

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                pointerEvents: 'none',
            }}
            aria-live="polite"
        >
            {toasts.map(t => (
                <div key={t.id} style={{ pointerEvents: 'auto' }}>
                    <Toast {...t} />
                </div>
            ))}
        </div>
    );
}
