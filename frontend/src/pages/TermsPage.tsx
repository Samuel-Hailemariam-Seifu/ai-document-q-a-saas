import { LegalPageLayout, LegalSection } from './legal/LegalPageLayout'
import { PRODUCT_NAME } from '../lib/brand'

export function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      description={`Rules for using ${PRODUCT_NAME}. Placeholder — not a binding agreement until counsel reviews.`}
    >
      <LegalSection title="The service">
        <p>
          {PRODUCT_NAME} lets you upload documents, ask questions, and review citation-backed answers in a
          workspace. Features and limits depend on your plan.
        </p>
      </LegalSection>

      <LegalSection title="Accounts">
        <p>
          You are responsible for safeguarding credentials and for activity under your account. Provide accurate
          registration information and keep it up to date.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>
          Do not upload unlawful content, attempt to disrupt the service, scrape beyond normal product use, or use
          the product to harm others. We may suspend accounts that violate these rules.
        </p>
        {/* TODO(legal): Expand prohibited-use list and enforcement process. */}
      </LegalSection>

      <LegalSection title="Content ownership">
        <p>
          You retain rights to documents you upload. You grant us a limited license to store, process, and display
          that content as needed to provide the service.
        </p>
      </LegalSection>

      <LegalSection title="Disclaimers">
        <p>
          Answers can be incomplete or incorrect. Always verify important decisions against the cited source
          passages. The service is provided &quot;as is&quot; without warranties to the extent permitted by law.
        </p>
        {/* TODO(legal): Liability caps, governing law, dispute venue. */}
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Terms questions: <span className="text-content">legal@example.com</span> {/* TODO(legal): real contact */}
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}
