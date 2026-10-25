import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("MyFriend AI Error caught by boundary:", error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('persona_echo_personas');
      localStorage.removeItem('persona_echo_histories');
      localStorage.removeItem('persona_echo_auth_user');
    } catch (e) {
      console.warn("Could not clear storage:", e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          width: '100vw',
          backgroundColor: '#090d16',
          color: '#f3f4f6',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: 500,
            background: 'rgba(30, 41, 59, 0.7)',
            padding: 32,
            borderRadius: 16,
            border: '1px solid rgba(0, 242, 254, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🤖</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00f2fe', marginBottom: 8 }}>
              MyFriend AI Auto-Recovery
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#9ca3af', marginBottom: 20 }}>
              An outdated browser cache or local storage entry was detected. Click below to reset to clean defaults and reload.
            </p>
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              padding: 12,
              borderRadius: 8,
              fontSize: '0.75rem',
              color: '#fca5a5',
              fontFamily: 'monospace',
              marginBottom: 20,
              textAlign: 'left',
              overflowX: 'auto'
            }}>
              {this.state.error?.message || "Unknown client error"}
            </div>
            <button
              onClick={this.handleReset}
              style={{
                padding: '12px 24px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #00f2fe 0%, #8b5cf6 100%)',
                color: '#000',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Reset Cache & Reload App 🚀
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
