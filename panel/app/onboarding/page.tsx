import { OnboardingForm } from './OnboardingForm'
import { Logo } from '../_landing/parts'

export default function Onboarding() {
  return (
    <main className="grid-paper min-h-screen px-6 py-12">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between">
          <Logo size={26} />
          <span className="font-code text-[0.7rem] text-ink-mute">NEW PROJECT</span>
        </div>
        <h1 className="font-display mt-8 text-[1.875rem] font-bold leading-tight tracking-[-0.02em] text-ink">Create your first project</h1>
        <p className="mt-2 text-[1rem] text-ink-dim">You will get a shareable link and a connect code for the extension.</p>
        <div className="reg-marks mt-8 rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-7">
          <OnboardingForm />
        </div>
      </div>
    </main>
  )
}
