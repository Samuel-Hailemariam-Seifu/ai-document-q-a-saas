import { LegalPageLayout, LegalSection } from './legal/LegalPageLayout'
import { PRODUCT_NAME } from '../lib/brand'

export function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description={`How ${PRODUCT_NAME} handles account data, documents, and queries. Placeholder — not legal advice.`}
    >
      <LegalSection title="What we collect">
        <p>
          Account details you provide (name, email, password hash), workspace metadata, uploaded documents, and
          questions you ask so we can return cited answers.
        </p>
        {/* TODO(legal): Enumerate processors, retention windows, and subprocessors. */}
      </LegalSection>

      <LegalSection title="How we use data">
        <p>
          We use your data to authenticate you, process documents for retrieval, generate answers, enforce plan
          limits, and improve product reliability.
        </p>
        {/* TODO(confirm): Document whether provider contracts prohibit training on customer content for every LLM used. */}
        <p>
          Customer document content is used to answer your questions in your workspace. Training policy for model
          providers must be confirmed before making public claims about training.
        </p>
      </LegalSection>

      <LegalSection title="Sharing">
        <p>
          We do not sell personal information. Infrastructure and AI providers may process data solely to operate
          the service under their agreements with us.
        </p>
        {/* TODO(legal): List subprocessors and international transfer mechanisms. */}
      </LegalSection>

      <LegalSection title="Retention & deletion">
        <p>
          You can delete documents from a workspace. Account deletion and full export are planned product features;
          contact support for manual requests until those flows ship.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Privacy questions: <span className="text-content">privacy@example.com</span> {/* TODO(legal): real contact */}
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}
