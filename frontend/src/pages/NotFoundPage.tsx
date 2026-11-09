import { Link } from 'react-router-dom'
import { Icon } from '../components/common/Icon'
import { PRODUCT_NAME } from '../lib/brand'

export function NotFoundPage() {
  return (
    <div className="app-canvas bg-dot-grid flex min-h-screen items-center justify-center p-6 text-content">
      <div className="saas-card w-full max-w-md p-8 text-center">
        <p className="font-mono text-sm font-medium text-accent-text">404</p>
        <h1 className="saas-title mt-2">Page not found</h1>
        <p className="mt-3 text-sm text-content-muted">
          That URL doesn&apos;t exist in {PRODUCT_NAME}. Head back to the app or the home page.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link to="/app" className="saas-btn saas-btn-primary">
            <Icon name="dashboard" size={16} />
            Go to app
          </Link>
          <Link to="/" className="saas-btn saas-btn-secondary">
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}
