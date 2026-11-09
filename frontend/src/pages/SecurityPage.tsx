import { LegalPageLayout, LegalSection } from './legal/LegalPageLayout'
import { PRODUCT_NAME } from '../lib/brand'

export function SecurityPage() {
  return (
    <LegalPageLayout
      title="Security"
      description={`How ${PRODUCT_NAME} approaches product security. High-level overview — not a certification.`}
    >
      <LegalSection title="Authentication">
        <p>
          Access requires an authenticated account. Passwords are stored hashed. Session tokens are required for
          API calls from the app.
        </p>
      </LegalSection>

      <LegalSection title="Workspace isolation">
        <p>
          Documents and chats are scoped to a workspace. Product APIs require workspace membership for reads and
          writes.
        </p>
      </LegalSection>

      <LegalSection title="Transport & storage">
        <p>
          Production deployments should serve the app and API over HTTPS. Uploaded files and derived embeddings are
          stored by the configured backend providers.
        </p>
        {/* TODO(legal): Document encryption at rest / in transit and hosting regions once finalized. */}
      </LegalSection>

      <LegalSection title="AI providers">
        <p>
          Question answering may call third-party model APIs with retrieved passages. Review provider data-handling
          terms for your deployment.
        </p>
        {/* TODO(confirm): Per-provider training and retention settings. */}
      </LegalSection>

      <LegalSection title="Reporting issues">
        <p>
          Suspected vulnerabilities: <span className="text-content">security@example.com</span>{' '}
          {/* TODO(legal): real security contact / disclosure policy */}
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}
