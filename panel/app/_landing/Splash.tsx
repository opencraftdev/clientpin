import { Logo } from './parts'

// Shared splash visual — used by both the landing intro overlay and the
// App Router route fallback (app/loading.tsx) so they look identical.
export function SplashContent() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="pin-drop"><Logo size={32} /></div>
      <div className="h-[3px] w-32 overflow-hidden rounded-full bg-line">
        <div className="loadbar h-full w-1/3 rounded-full bg-accent" />
      </div>
      <p className="font-code text-[0.72rem] uppercase tracking-wide text-ink-mute">Loading…</p>
    </div>
  )
}

// Landing intro overlay. CSS-only fade (.splash) then visibility:hidden lets
// clicks through — no JS, never stuck.
export function Splash() {
  return (
    <div className="splash grid-paper pointer-events-none fixed inset-0 z-[100] grid place-items-center bg-bg">
      <SplashContent />
    </div>
  )
}
