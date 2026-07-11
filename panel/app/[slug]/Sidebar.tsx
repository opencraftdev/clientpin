const TABS = [
  { key: 'basic', label: 'Basic info', live: true },
  { key: 'board', label: 'Dev board', live: false },
  { key: 'confirm', label: 'Confirm', live: false },
  { key: 'qa', label: 'QA pins', live: true },
  { key: 'docs', label: 'Docs', live: false },
]
export function Sidebar({ active }: { active: string }) {
  return (
    <nav className="flex shrink-0 flex-col gap-1 md:w-52">
      <p className="font-code px-3 pb-2 text-[0.65rem] font-semibold uppercase tracking-wide text-ink-mute">Sections</p>
      {TABS.map((t) => (
        <a key={t.key} href={t.live ? `#${t.key}` : undefined}
          className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[0.875rem] transition-colors ${active === t.key ? 'bg-accent-soft font-semibold text-accent' : t.live ? 'text-ink-dim hover:bg-surface-2 hover:text-ink' : 'cursor-default text-ink-mute'}`}>
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${active === t.key ? 'bg-accent' : 'bg-line-2'}`} />
          <span className="flex-1">{t.label}</span>
          {!t.live && <span className="font-code text-[0.6rem] uppercase tracking-wide">soon</span>}
        </a>
      ))}
    </nav>
  )
}
