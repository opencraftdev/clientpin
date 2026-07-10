'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

export function NavLink({
  href, exact = false, icon, children,
}: { href: string; exact?: boolean; icon?: ReactNode; children: ReactNode }) {
  const path = usePathname()
  const active = exact ? path === href : path === href || path.startsWith(href + '/')

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`ring-accent flex items-center gap-3 rounded-full px-3 py-2 text-[0.875rem] transition-colors ${
        active
          ? 'bg-accent-soft font-medium text-accent'
          : 'text-ink-dim hover:bg-surface-2 hover:text-ink'
      }`}
    >
      {icon && <span className="grid h-5 w-5 shrink-0 place-items-center">{icon}</span>}
      <span className="truncate">{children}</span>
    </Link>
  )
}
