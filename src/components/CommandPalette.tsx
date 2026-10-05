import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { LayoutGroup, motion } from 'motion/react'
import {
  ArrowElbowDownLeft,
  ArrowUp,
  ArrowUpRight,
  Briefcase,
  Copy,
  Envelope,
  FileText,
  GithubLogo,
  LinkedinLogo,
  MagnifyingGlass,
  Planet,
  Sparkle,
  XLogo,
} from '@phosphor-icons/react'
import { profile, rankedProjects as projects } from '../content'
import { scrollToTarget } from '../lib/flight'
import { CodeforcesIcon, LeetCodeIcon } from './BrandIcons'
import { openProject } from './Menu'
import { ProjectMark } from './ProjectMark'

type Item = { label: string; sub?: string; group: string; icon: ReactNode; external?: boolean; keywords?: string; run: () => void }

const tile = (node: ReactNode) => (
  <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-ink">{node}</span>
)

/*
  Command menu (Ctrl/Cmd + K). Frosted glass panel with a gold edge glow, icon tiles,
  a selection highlight that glides between rows, and keyboard hints in the footer.
  Opening is deliberately instant: keyboard-triggered, used often, so it must feel immediate.
*/
export function CommandPalette({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

  const items = useMemo<Item[]>(() => {
    const go = (t: string | number) => () => scrollToTarget(t)
    const link = (u: string) => () => window.open(u, '_blank', 'noopener')
    return [
      { label: 'Exposures', sub: 'Selected work', group: 'Navigate', icon: tile(<Briefcase size={17} />), keywords: 'work projects', run: go('#work') },
      { label: 'Manifesto', sub: 'How I think about software', group: 'Navigate', icon: tile(<Sparkle size={17} />), keywords: 'about', run: go('#about') },
      { label: 'Instruments', sub: 'Skills and experience', group: 'Navigate', icon: tile(<Planet size={17} />), keywords: 'skills stack experience', run: go('#skills') },
      { label: 'Contact', sub: 'Say hello', group: 'Navigate', icon: tile(<Envelope size={17} />), run: go('#contact') },
      { label: 'Back to the top', group: 'Navigate', icon: tile(<ArrowUp size={17} />), keywords: 'home hero', run: go(0) },
      ...projects.map((p) => ({
        label: p.title,
        sub: p.kind,
        group: 'Projects',
        icon: <ProjectMark name={p.slug} size={36} />,
        keywords: p.stack.join(' '),
        run: () => openProject(p.slug),
      })),
      { label: 'Copy email', sub: profile.email, group: 'Actions', icon: tile(<Copy size={17} />), run: () => void navigator.clipboard?.writeText(profile.email) },
      { label: 'Download resume', sub: 'PDF', group: 'Actions', icon: tile(<FileText size={17} />), external: true, keywords: 'cv', run: link(profile.resume) },
      { label: 'GitHub', sub: profile.githubUser, group: 'Profiles', icon: tile(<GithubLogo size={17} />), external: true, run: link(profile.github) },
      { label: 'LinkedIn', sub: 'C B Harshavardhan', group: 'Profiles', icon: tile(<LinkedinLogo size={17} />), external: true, run: link(profile.linkedin) },
      { label: 'LeetCode', sub: 'cbharshainfinity07', group: 'Profiles', icon: tile(<LeetCodeIcon size={15} />), external: true, run: link(profile.leetcode) },
      { label: 'Codeforces', sub: 'cbharshainfinity07', group: 'Profiles', icon: tile(<CodeforcesIcon size={15} />), external: true, run: link(profile.codeforces) },
      { label: 'X', sub: '@cbhinfinity0202', group: 'Profiles', icon: tile(<XLogo size={16} />), external: true, run: link(profile.x) },
    ]
  }, [])

  const results = items.filter((it) => `${it.label} ${it.sub ?? ''} ${it.keywords ?? ''} ${it.group}`.toLowerCase().includes(q.trim().toLowerCase()))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(!open)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  useEffect(() => {
    if (!open) return
    setQ('')
    setI(0)
    requestAnimationFrame(() => input.current?.focus())
  }, [open])

  // keep the selected row in view while arrowing
  useEffect(() => {
    list.current?.querySelector(`[data-idx="${i}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [i])

  const choose = (it?: Item) => {
    if (!it) return
    setOpen(false)
    it.run()
  }

  if (!open) return null
  let lastGroup = ''
  return (
    <div className="fixed inset-0 z-[65] flex items-start justify-center px-4 pt-[14vh]">
      <div className="absolute inset-0 bg-[#030409]/45 backdrop-blur-[6px]" onClick={() => setOpen(false)} />
      <div
        role="dialog"
        aria-modal
        aria-label="Command menu"
        className="cmd-glass relative flex max-h-[70vh] w-full max-w-[600px] flex-col overflow-hidden rounded-[1.75rem] text-ink"
      >
        {/* gold glow along the top edge */}
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-40 w-2/3 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />

        <label className="relative flex items-center gap-3 border-b border-white/[0.07] px-5">
          <MagnifyingGlass size={19} className="text-ink-muted" />
          <span className="sr-only">Search</span>
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setI(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setI((v) => Math.min(v + 1, results.length - 1))
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                setI((v) => Math.max(v - 1, 0))
              }
              if (e.key === 'Enter') choose(results[i])
            }}
            placeholder="Search projects, sections, profiles..."
            className="h-16 flex-1 bg-transparent text-[17px] text-ink outline-none placeholder:text-ink-faint focus-visible:outline-none"
          />
          <kbd className="t-mono rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] text-ink-muted">esc</kbd>
        </label>

        <LayoutGroup id="cmd">
          <ul ref={list} className="relative flex-1 overflow-y-auto overscroll-contain p-2" data-lenis-prevent>
            {results.length === 0 && (
              <li className="flex flex-col items-center gap-2 px-3 py-12 text-center">
                <MagnifyingGlass size={22} className="text-ink-faint" />
                <span className="text-sm text-ink-muted">Nothing matches "{q}"</span>
                <span className="t-mono text-ink-faint">Try "vaani", "resume" or "github"</span>
              </li>
            )}
            {results.map((it, idx) => {
              const header = it.group !== lastGroup ? (lastGroup = it.group) : null
              const active = idx === i
              return (
                <li key={it.group + it.label}>
                  {header && <p className="t-mono px-3 pb-1.5 pt-3 text-[10px] uppercase tracking-[0.16em] text-ink-faint">{header}</p>}
                  <button
                    data-idx={idx}
                    onMouseMove={() => i !== idx && setI(idx)}
                    onClick={() => choose(it)}
                    className="relative flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left"
                  >
                    {active && (
                      <motion.span
                        layoutId="cmd-active"
                        className="absolute inset-0 rounded-2xl border border-white/[0.08] bg-white/[0.07]"
                        transition={{ type: 'spring', duration: 0.25, bounce: 0 }}
                      >
                        <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-accent" />
                      </motion.span>
                    )}
                    <span className="relative">{it.icon}</span>
                    <span className="relative min-w-0 flex-1">
                      <span className={`block truncate text-[15px] ${active ? 'text-ink' : 'text-ink/85'}`}>{it.label}</span>
                      {it.sub && <span className="t-mono block truncate text-ink-faint">{it.sub}</span>}
                    </span>
                    <span className="relative flex items-center gap-2 text-ink-faint">
                      {it.external && <ArrowUpRight size={14} />}
                      {active && (
                        <kbd className="grid size-6 place-items-center rounded-md border border-white/10 bg-white/[0.06] text-ink-muted">
                          <ArrowElbowDownLeft size={12} />
                        </kbd>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </LayoutGroup>

        <div className="t-mono flex items-center justify-between gap-4 border-t border-white/[0.07] bg-white/[0.02] px-5 py-3 text-[11px] text-ink-faint">
          <span className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="rounded border border-white/10 px-1">↑</kbd>
              <kbd className="rounded border border-white/10 px-1">↓</kbd> navigate
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="rounded border border-white/10 px-1">↵</kbd> open
            </span>
            <span className="hidden items-center gap-1.5 sm:flex">
              <kbd className="rounded border border-white/10 px-1">{isMac ? '⌘' : 'Ctrl'} K</kbd> toggle
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-accent shadow-[0_0_8px_rgb(233_180_92/0.8)]" />
            {profile.name}
          </span>
        </div>
      </div>
    </div>
  )
}
