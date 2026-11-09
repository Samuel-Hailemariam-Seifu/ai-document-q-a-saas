import { useState } from 'react'
import { Link } from 'react-router-dom'
import { uploadDocument } from '../../services/documents'
import { markOnboardingComplete } from '../../lib/onboarding'
import { Icon } from '../common/Icon'

const SAMPLE_TEXT = `DocuMind sample policy

Refunds are available within 14 days of purchase if the service has not been used beyond fair-use limits.
After 14 days, refunds are generally not provided.

Support hours are Monday–Friday, 9:00–17:00 UTC.
`

type Step = 1 | 2 | 3

export function OnboardingWizard({
  workspaceId,
  onDone,
  onUploaded,
}: {
  workspaceId: number
  onDone: () => void
  onUploaded?: () => void
}) {
  const [step, setStep] = useState<Step>(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const finish = () => {
    markOnboardingComplete(workspaceId)
    onDone()
  }

  const uploadSample = async () => {
    setBusy(true)
    setError(null)
    try {
      const file = new File([SAMPLE_TEXT], 'sample-policy.txt', { type: 'text/plain' })
      await uploadDocument(workspaceId, file)
      onUploaded?.()
      setStep(2)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="saas-card overflow-hidden">
      <div className="border-b border-subtle px-5 py-4">
        <p className="saas-label">First-run</p>
        <h2 className="saas-section-title mt-1">Get a cited answer in under a minute</h2>
        <p className="mt-1 text-sm text-content-muted">
          Step {step} of 3 — upload, ask, then verify the source.
        </p>
      </div>

      <div className="space-y-4 p-5">
        {step === 1 ? (
          <>
            <p className="text-sm text-content-secondary">
              Upload your own PDF/TXT/DOCX, or try a short sample policy document.
            </p>
            {error ? (
              <p className="flex items-center gap-2 text-sm text-rose-600 dark:text-rose-300">
                <Icon name="alert" size={14} />
                {error}
              </p>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="saas-btn saas-btn-primary"
                disabled={busy}
                onClick={() => void uploadSample()}
              >
                <Icon name={busy ? 'hourglass' : 'file'} size={16} />
                {busy ? 'Uploading…' : 'Try sample document'}
              </button>
              <Link to="/app/documents" className="saas-btn saas-btn-secondary">
                <Icon name="upload" size={16} />
                Upload my own
              </Link>
              <button type="button" className="saas-btn saas-btn-secondary" onClick={finish}>
                Skip for now
              </button>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <p className="text-sm text-content-secondary">
              Ask a question grounded in your documents. Citations will appear next to the answer.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                to={`/app/chat?q=${encodeURIComponent('What is the refund policy?')}`}
                className="saas-btn saas-btn-primary"
                onClick={() => setStep(3)}
              >
                <Icon name="sparkles" size={16} />
                Ask: What is the refund policy?
              </Link>
              <button type="button" className="saas-btn saas-btn-secondary" onClick={() => setStep(3)}>
                I already asked
              </button>
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <div className="rounded-lg border border-subtle bg-surface-muted p-4 text-sm text-content-secondary">
              <p className="font-medium text-content">Citations are the product</p>
              <p className="mt-1">
                Numbered markers like <span className="font-semibold text-accent">[1]</span> link each claim to a
                passage. Open a marker to read the source excerpt and verify before you trust the answer.
              </p>
            </div>
            <button type="button" className="saas-btn saas-btn-primary" onClick={finish}>
              <Icon name="checkMark" size={16} />
              Got it — take me to the app
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}
