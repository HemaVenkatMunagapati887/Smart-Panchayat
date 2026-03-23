// ============================================================
//  components/ErrorBoundary.jsx
//  Catches render-time JS errors and shows a fallback UI.
// ============================================================

import { Component } from 'react';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('[ErrorBoundary]', error, info);
    }

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f0faf2',
                padding: 40,
                textAlign: 'center',
            }}>
                <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 72, color: '#dc2626', marginBottom: 24, opacity: 0.8 }}
                >
                    error
                </span>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
                    Something went wrong
                </h1>
                <p style={{ color: '#6b7280', fontSize: 14, maxWidth: 420, marginBottom: 28, lineHeight: 1.6 }}>
                    An unexpected error occurred. This has been logged. Please refresh the page or go back home.
                </p>
                <p style={{
                    background: '#fee2e2', borderRadius: 8, padding: '10px 16px',
                    fontSize: 12, color: '#7f1d1d', fontFamily: 'monospace',
                    maxWidth: 540, wordBreak: 'break-word', marginBottom: 28,
                }}>
                    {this.state.error?.message || 'Unknown error'}
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '10px 24px', borderRadius: 10, fontWeight: 700,
                            background: 'var(--primary-500)', color: '#fff', border: 'none', cursor: 'pointer',
                        }}
                    >
                        Reload Page
                    </button>
                    <button
                        onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
                        style={{
                            padding: '10px 24px', borderRadius: 10, fontWeight: 700,
                            background: '#fff', color: '#374151', border: '1.5px solid #d1d5db', cursor: 'pointer',
                        }}
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }
}
