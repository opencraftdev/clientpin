import { OnboardingForm } from './OnboardingForm'

export default function Onboarding() {
  return (
    <main className="mx-auto max-w-lg px-6 py-14">
      <h1 className="text-[1.5rem] font-semibold tracking-tight text-ink">Create your first project</h1>
      <p className="mt-1 text-[0.9375rem] text-ink-dim">You'll get a shareable link and a connect code for the extension.</p>
      <div className="mt-8"><OnboardingForm appUrl={process.env.NEXT_PUBLIC_APP_URL!} /></div>
    </main>
  )
}
