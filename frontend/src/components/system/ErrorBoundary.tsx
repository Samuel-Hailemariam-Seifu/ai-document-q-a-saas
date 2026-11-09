import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Icon } from '../common/Icon'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI error boundary', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="app-canvas flex min-h-screen items-center justify-center p-6 text-content">
        <div className="saas-card w-full max-w-md p-6 text-center">
          <Icon name="alert" size={28} className="mx-auto text-danger" />
          <h1 className="saas-section-title mt-4">Something went wrong</h1>
          <p className="mt-2 text-sm text-content-muted">
            An unexpected error occurred in the interface. You can reload and continue.
          </p>
          <button
            type="button"
            className="saas-btn saas-btn-primary mt-5"
            onClick={() => window.location.assign('/app')}
          >
            Reload app
          </button>
        </div>
      </div>
    )
  }
}
