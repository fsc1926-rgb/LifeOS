import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('LifeOS Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#070a12',
          color: '#f8fafc',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', marginBottom: '1.5rem'
          }}>
            ⚠️
          </div>
          <h2 style={{ fontWeight: 800, marginBottom: '0.75rem' }}>Qualcosa è andato storto</h2>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem', maxWidth: '400px' }}>
            Si è verificato un errore imprevisto. I tuoi dati sono al sicuro.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              border: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            🔄 Ricarica l'App
          </button>
          {this.state.error && (
            <details style={{ marginTop: '2rem', color: '#64748b', fontSize: '0.75rem', maxWidth: '500px' }}>
              <summary style={{ cursor: 'pointer' }}>Dettagli tecnici</summary>
              <pre style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
