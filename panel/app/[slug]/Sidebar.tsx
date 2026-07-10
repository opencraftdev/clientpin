const TABS = [
  { key: 'basic', label: 'Basic info', live: true },
  { key: 'board', label: 'Dev board', live: false },
  { key: 'confirm', label: 'Confirm', live: false },
  { key: 'qa', label: 'QA', live: true },
  { key: 'docs', label: 'Docs', live: false },
]
export function Sidebar({ active }: { active: string }) {
  return (
    <nav className="flex shrink-0 flex-col gap-1 md:w-52">
      <p className="px-3 pb-2 text-[0.6875rem] font-medium uppercase tracking-wide text-ink-mute">Client view</p>
      {TABS.map((t) => (
        <a key={t.key} href={t.live ? `#${t.key}` : undefined}
          className={`flex items-center justify-between rounded-lg px-3 py-2 text-[0.875rem] ${active === t.key ? 'bg-accent-soft font-medium text-accent' : t.live ? 'text-ink-dim hover:bg-surface-2' : 'cursor-default text-ink-mute'}`}>
          {t.label}{!t.live && <span className="text-[0.6875rem]">soon</span>}
        </a>
      ))}
    </nav>
  )
}
