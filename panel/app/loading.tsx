import { SplashContent } from './_landing/Splash'

// App Router Suspense fallback — cascades to every async segment
// (/projects, /[slug], /onboarding). Same visual as the landing splash;
// Suspense unmounts it when the route is ready (no auto-fade here).
export default function Loading() {
  return (
    <div className="grid-paper grid min-h-screen place-items-center px-6">
      <SplashContent />
    </div>
  )
}
