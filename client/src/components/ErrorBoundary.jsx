import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="not-found" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="not-found__content" style={{ textAlign: 'center' }}>
            <h1 className="not-found__code">Oops</h1>
            <h2 className="not-found__title">Something went wrong</h2>
            <p className="not-found__desc" style={{ color: '#b3b3b3', maxWidth: 500, margin: '0 auto 32px' }}>
              {this.props.fallbackMessage || 'An unexpected error occurred. Please try refreshing the page.'}
            </p>
            <button
              className="not-found__btn"
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
              style={{ background: '#e50914', color: '#fff', border: 'none', padding: '13px 34px', borderRadius: 4, fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Refresh Page
            </button>
          </div>
        </section>
      )
    }

    return this.props.children
  }
}
