import type { ReactNode } from 'react'
import { IconDownload } from './parts'

export const DOWNLOAD_URL = 'https://drive.google.com/uc?export=download&id=1KPrkWQXwmlLgAT621heuGEkvugY_-RgI'

const STEPS: ReactNode[] = [
  <>Download the <code className="font-code">.zip</code> and unzip it. Keep the folder, deleting it removes the extension.</>,
  <>Open <code className="font-code border border-line bg-surface-2 px-1.5 py-0.5 text-accent">chrome://extensions</code> in your browser.</>,
  <>Turn on <b className="font-semibold text-ink">Developer mode</b> (toggle, top right).</>,
  <>Click <b className="font-semibold text-ink">Load unpacked</b> and select the <code className="font-code">clientpin</code> folder.</>,
  <>Pin ClientPin to your toolbar, open it, and paste the connect code.</>,
]

/** The numbered install steps, shared by the landing and the dashboard empty state. */
export function InstallSteps({ className = '' }: { className?: string }) {
  return (
    <ol className={`flex flex-col gap-3 ${className}`}>
      {STEPS.map((step, i) => (
        <li key={i} className="flex items-start gap-4 border border-line bg-surface p-4 text-left">
          <span className="grid h-7 w-7 shrink-0 place-items-center bg-accent text-[0.8125rem] font-semibold text-accent-ink">{i + 1}</span>
          <span className="pt-0.5 text-[0.9375rem] leading-relaxed text-ink-dim">{step}</span>
        </li>
      ))}
    </ol>
  )
}

/** The coral hard-offset download button, reused wherever we point at the build. */
export function DownloadButton({ label = 'Download ClientPin (.zip)', className = '' }: { label?: string; className?: string }) {
  return (
    <a href={DOWNLOAD_URL} target="_blank" rel="noreferrer"
      className={`shadow-edge inline-flex items-center gap-2 bg-accent px-6 py-3.5 text-[1rem] font-semibold text-accent-ink transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none ${className}`}>
      <IconDownload /> {label}
    </a>
  )
}
