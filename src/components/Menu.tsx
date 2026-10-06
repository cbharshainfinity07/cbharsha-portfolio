import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { ArrowRight, ArrowUpRight, CaretDown, Check, Copy, Envelope, FileText, GithubLogo, LinkedinLogo, MagnifyingGlass, XLogo } from '@phosphor-icons/react'
import { profile, rankedProjects as projects } from '../content'
import { lenis, onFlight, scrollToTarget } from '../lib/flight'
import { CodeforcesIcon, LeetCodeIcon } from './BrandIcons'
import { ProjectMark } from './ProjectMark'

const SECTION_LABEL: Record<string, string> = { top: '', about: 'Manifesto', work: 'Exposures', skills: 'Instruments', contact: 'Contact' }
const SPRING = { type: 'spring', duration: 0.42, bounce: 0 } as const
type MenuKey = 'work' | 'connect'
const ORDER: MenuKey[] = ['work', 'connect']

export const openProject = (slug: string) => window.dispatchEvent(new CustomEvent('open-project', { detail: slug }))

/* ---------- dropdown contents ---------- */
const GRADE = 'saturate(0.88) contrast(1.05)'

/*
  Work mega menu: project list on the left, a live preview on the right.
  Hovering a project crossfades its real screenshot in, with a one-line story, stack and actions.
*/
function WorkPanel({ close }: { close: () => void }) {
  const [active, setActive] = useState(0)
  const p = projects[active]
  return (
    <div className="grid w-[780px] grid-cols-[290px_1fr] gap-2 p-2">
      <div className="flex flex-col">
        <p className="t-mono flex items-center justify-between px-3 pb-2 pt-2 text-[10px] uppercase tracking-[0.16em] text-ink-faint">
          Selected work <span>{String(projects.length).padStart(2, '0')}</span>
        </p>
        <LayoutGroup id="work-menu">
          {projects.map((pr, i) => (
            <button
              key={pr.slug}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => {
                close()
                openProject(pr.slug)
              }}
              className="relative flex items-center gap-3 rounded-2xl p-2.5 text-left"
            >
              {active === i && (
                <motion.span layoutId="work-active" className="absolute inset-0 rounded-2xl border border-white/[0.08] bg-white/[0.06]" transition={SPRING}>
                  <span className="absolute left-0 top-1/2 h-6 w-[2px] -translate-y-1/2 rounded-full bg-accent" />
                </motion.span>
              )}
              <span className="relative">
                <ProjectMark name={pr.slug} size={40} active={active === i} />
              </span>
              <span className="relative min-w-0">
                <span className={`block truncate text-[15px] font-medium transition-colors ${active === i ? 'text-ink' : 'text-ink-muted'}`}>{pr.title}</span>
                <span className="t-mono block truncate text-ink-faint">{pr.kind}</span>
              </span>
            </button>
          ))}
        </LayoutGroup>
        <div className="mt-auto flex items-center justify-between px-3 pb-1 pt-4">
          <button
            onClick={() => {
              close()
              scrollToTarget('#work')
            }}
            className="group flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            All exposures <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </button>
          <a href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub profile" className="text-ink-faint transition-colors hover:text-accent">
            <GithubLogo size={16} />
          </a>
        </div>
      </div>

      {/* live preview */}
      <div className="relative overflow-hidden rounded-[1.25rem] border border-white/[0.07] bg-white/[0.03]">
        <div className="relative aspect-[16/9] overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.img
              key={p.slug}
              src={p.image}
              alt={`${p.title} preview`}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: p.imagePosition, filter: GRADE }}
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d16] via-[#0b0d16]/10 to-transparent" />
          <span className="t-mono absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] text-ink-muted backdrop-blur-md">{p.year}</span>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={p.slug}
            className="relative px-5 pb-5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            <p className="-mt-3 text-2xl leading-none tracking-[-0.03em] [font-variation-settings:'wght'_640,'wdth'_84,'opsz'_48]">{p.title}</p>
            <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink-muted">{p.blurb}</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="t-mono truncate text-ink-faint">{p.stack.slice(0, 3).join('  /  ')}</span>
              <span className="flex shrink-0 gap-1.5">
                {p.live && (
                  <a
                    href={p.live}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 items-center gap-1 rounded-full border border-white/12 px-3 text-xs text-ink transition-colors hover:border-white/30"
                  >
                    Live <ArrowUpRight size={12} />
                  </a>
                )}
                <button
                  onClick={() => {
                    close()
                    openProject(p.slug)
                  }}
                  className="flex h-8 items-center gap-1 rounded-full bg-accent px-3 text-xs font-semibold text-[#0b0b0b] transition-colors hover:bg-accent-soft"
                >
                  Open <ArrowRight size={12} weight="bold" />
                </button>
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

/*
  Connect mega menu: profile tiles on the left, an availability card on the right with
  one-click email copy and a direct "write to me".
*/
function ConnectPanel() {
  const [copied, setCopied] = useState(false)
  const tiles: { label: string; sub: string; href: string; icon: ReactNode }[] = [
    { label: 'LinkedIn', sub: 'c-b-harshavardhan', href: profile.linkedin, icon: <LinkedinLogo size={20} /> },
    { label: 'GitHub', sub: profile.githubUser, href: profile.github, icon: <GithubLogo size={20} /> },
    { label: 'LeetCode', sub: 'cbharshainfinity07', href: profile.leetcode, icon: <LeetCodeIcon size={18} /> },
    { label: 'Codeforces', sub: 'cbharshainfinity07', href: profile.codeforces, icon: <CodeforcesIcon size={18} /> },
    { label: 'X', sub: '@cbhinfinity0202', href: profile.x, icon: <XLogo size={19} /> },
    { label: 'Resume', sub: 'PDF, 1 page', href: profile.resume, icon: <FileText size={20} /> },
  ]
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      window.location.href = `mailto:${profile.email}`
    }
  }
  return (
    <div className="grid w-[680px] grid-cols-[1fr_272px] gap-2 p-2">
      <div className="grid grid-cols-2 gap-1.5">
        {tiles.map((t) => (
          <a
            key={t.label}
            href={t.href}
            target="_blank"
            rel="noreferrer"
            className="group relative flex flex-col justify-between gap-6 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3.5 transition-[border-color,background-color] duration-200 hover:border-accent/35 hover:bg-accent/[0.05]"
          >
            <span className="flex items-start justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-white/[0.06] text-ink transition-colors group-hover:text-accent">{t.icon}</span>
              <ArrowUpRight size={14} className="text-ink-faint transition-[transform,color] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
            </span>
            <span>
              <span className="block text-[15px] font-medium text-ink">{t.label}</span>
              <span className="t-mono block truncate text-ink-faint">{t.sub}</span>
            </span>
          </a>
        ))}
      </div>

      <div className="relative flex flex-col overflow-hidden rounded-[1.25rem] border border-accent/20 bg-[radial-gradient(120%_80%_at_100%_0%,rgb(233_180_92/0.16),transparent_60%),rgb(255_255_255/0.025)] p-5">
        <span className="t-mono flex items-center gap-2 text-emerald-300/90">
          <span className="relative flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/60" />
            <span className="relative size-2 rounded-full bg-emerald-400" />
          </span>
          Available now
        </span>
        <p className="mt-4 text-[1.6rem] leading-[1.05] tracking-[-0.03em] [font-variation-settings:'wght'_620,'wdth'_84,'opsz'_48]">
          Open to SDE and AI internships.
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">I reply within a day. Email is the fastest way in.</p>
        <button
          onClick={copy}
          className="mt-auto flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-left transition-colors hover:border-white/25"
        >
          <span className="t-mono truncate text-ink">{copied ? 'Copied to clipboard' : profile.email}</span>
          <span className={`grid size-7 shrink-0 place-items-center rounded-lg ${copied ? 'bg-accent text-[#0b0b0b]' : 'bg-white/10 text-ink'}`}>
            {copied ? <Check size={14} weight="bold" /> : <Copy size={14} />}
          </span>
        </button>
        <a
          href={`mailto:${profile.email}`}
          className="mt-2 flex h-10 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-[#0b0b0b] transition-colors hover:bg-accent-soft"
        >
          <Envelope size={15} weight="bold" /> Write to me
        </a>
      </div>
    </div>
  )
}

/*
  Header: a floating glass island (not glued to the edge).
  Desktop: brand + live section label, links with a sliding hover highlight, Stripe-style dropdown
  that morphs size and slides content between menus, search field that opens the command menu,
  and a "Let's talk" call to action. Compacts once you scroll.
  Mobile: brand, search and a hamburger that opens a full-screen glass menu.
*/
export function Menu({ onPalette }: { onPalette: () => void }) {
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState('')
  const [menu, setMenu] = useState<MenuKey | null>(null)
  const [dir, setDir] = useState(0)
  const [hoverLink, setHoverLink] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [panelX, setPanelX] = useState(0)
  const [headerLeft, setHeaderLeft] = useState(0)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const ring = useRef<SVGCircleElement>(null)
  const header = useRef<HTMLElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const closeTimer = useRef(0)
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

  // live section label + scroll progress ring + compact state
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setSection(SECTION_LABEL[e.target.id] ?? '')),
      { rootMargin: '-45% 0px -45% 0px' },
    )
    Object.keys(SECTION_LABEL).forEach((id) => {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    })
    let last = false
    const off = onFlight(() => {
      const y = lenis ? lenis.scroll : window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight
      ring.current?.setAttribute('stroke-dashoffset', String(100 - Math.min(1, Math.max(0, max > 0 ? y / max : 0)) * 100))
      const now = y > 60
      if (now !== last) setScrolled((last = now))
    })
    return () => {
      io.disconnect()
      off()
    }
  }, [])

  useEffect(() => {
    if (open) lenis?.stop()
    else lenis?.start()
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      setMenu(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // measure the active panel so the shell can morph to its size
  useLayoutEffect(() => {
    if (!menu || !content.current) return
    const r = content.current.getBoundingClientRect()
    setSize({ w: r.width, h: r.height })
  }, [menu])

  const show = (key: MenuKey, trigger: HTMLElement) => {
    clearTimeout(closeTimer.current)
    if (menu && menu !== key) setDir(ORDER.indexOf(key) > ORDER.indexOf(menu) ? 1 : -1)
    else if (!menu) setDir(0)
    const hb = header.current!.getBoundingClientRect()
    const tb = trigger.getBoundingClientRect()
    setPanelX(tb.left + tb.width / 2 - hb.left)
    setHeaderLeft(hb.left)
    setMenu(key)
  }
  const hideSoon = () => {
    clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setMenu(null), 160)
  }
  // centre the panel under its trigger, but never let it leave the viewport
  const panelLeft = Math.max(12 - headerLeft, Math.min(panelX - size.w / 2, (typeof window !== 'undefined' ? window.innerWidth : 1440) - headerLeft - size.w - 12))

  const go = (id: string) => {
    setOpen(false)
    setMenu(null)
    requestAnimationFrame(() => scrollToTarget(`#${id}`))
  }

  const link = (id: string, label: string, dropdown?: MenuKey) => (
    <button
      key={label}
      onPointerEnter={(e) => {
        setHoverLink(label)
        if (dropdown) show(dropdown, e.currentTarget)
        else hideSoon()
      }}
      onFocus={(e) => dropdown && show(dropdown, e.currentTarget)}
      onClick={(e) => (dropdown ? (menu === dropdown ? setMenu(null) : show(dropdown, e.currentTarget)) : go(id))}
      aria-expanded={dropdown ? menu === dropdown : undefined}
      aria-haspopup={dropdown ? 'true' : undefined}
      className={`relative flex h-10 items-center gap-1 rounded-full px-4 text-sm transition-colors duration-150 ${menu === dropdown && dropdown ? 'text-ink' : 'text-ink-muted hover:text-ink'}`}
    >
      {hoverLink === label && <motion.span layoutId="nav-hover" className="absolute inset-0 rounded-full bg-white/[0.07]" transition={SPRING} />}
      <span className="relative">{label}</span>
      {dropdown && <CaretDown size={11} weight="bold" className={`relative transition-transform duration-300 ${menu === dropdown ? 'rotate-180' : ''}`} />}
    </button>
  )

  return (
    <>
      <header
        ref={header}
        onPointerLeave={() => {
          setHoverLink(null)
          hideSoon()
        }}
        className={`fixed left-1/2 z-50 w-[min(94vw,1040px)] -translate-x-1/2 transition-[top] duration-500 ease-fluid ${scrolled ? 'top-3' : 'top-5'}`}
      >
        <nav
          aria-label="Primary"
          className={`nav-glass flex items-center justify-between gap-2 rounded-full px-2 transition-[height,background-color,box-shadow] duration-500 ease-fluid ${scrolled ? 'nav-glass--solid h-14' : 'h-16'}`}
        >
          {/* brand */}
          <button onClick={() => (open ? setOpen(false) : scrollToTarget(0))} className="flex h-11 items-center gap-2.5 rounded-full pl-1.5 pr-3" aria-label="Back to top">
            <span className="relative grid size-9 place-items-center">
              <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
                <circle cx="18" cy="18" r="16" fill="none" stroke="rgb(255 255 255 / 0.1)" strokeWidth="1.6" />
                <circle ref={ring} cx="18" cy="18" r="16" fill="none" stroke="#e9b45c" strokeWidth="1.6" strokeLinecap="round" pathLength={100} strokeDasharray="100" strokeDashoffset="100" />
              </svg>
              <span className="size-2.5 rounded-full bg-accent shadow-[0_0_12px_rgb(233_180_92/0.8)]" />
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.01em]">{profile.name}</span>
            <AnimatePresence mode="popLayout" initial={false}>
              {section && (
                <motion.span
                  key={section}
                  initial={{ y: 12, opacity: 0, filter: 'blur(4px)' }}
                  animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                  exit={{ y: -12, opacity: 0, filter: 'blur(4px)' }}
                  transition={SPRING}
                  className="t-mono hidden text-ink-faint lg:inline"
                >
                  / {section}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* links */}
          <LayoutGroup id="nav">
            <div className="hidden items-center md:flex" onPointerLeave={() => setHoverLink(null)}>
              {link('work', 'Work', 'work')}
              {link('about', 'About')}
              {link('skills', 'Skills')}
              {link('contact', 'Connect', 'connect')}
            </div>
          </LayoutGroup>

          {/* actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onPalette}
              onPointerEnter={hideSoon}
              aria-label="Search and jump (command menu)"
              className="flex h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-sm sm:pr-1.5 md:h-10 text-ink-faint transition-colors duration-150 hover:border-white/20 hover:text-ink"
            >
              <MagnifyingGlass size={15} />
              <span className="hidden lg:inline">Search</span>
              <kbd className="t-mono hidden rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-ink-muted sm:inline [@media(pointer:coarse)]:hidden">
                {isMac ? '⌘' : 'Ctrl'} K
              </kbd>
            </button>
            <a
              href={`mailto:${profile.email}`}
              onPointerEnter={hideSoon}
              className="group hidden h-10 items-center gap-2 rounded-full bg-accent pl-3.5 pr-4 text-sm font-semibold text-[#0b0b0b] transition-colors duration-300 hover:bg-accent-soft md:flex"
            >
              <span className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-600/60" />
                <span className="relative size-2 rounded-full bg-emerald-700" />
              </span>
              Let's talk
            </a>
            <button
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="menu-overlay"
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="relative grid size-11 place-items-center rounded-full bg-white/[0.06] hover:bg-white/10 md:hidden"
            >
              <span className={`absolute h-px w-[16px] bg-ink transition-transform duration-500 ease-fluid ${open ? 'rotate-45' : '-translate-y-[3.5px]'}`} />
              <span className={`absolute h-px w-[16px] bg-ink transition-transform duration-500 ease-fluid ${open ? '-rotate-45' : 'translate-y-[3.5px]'}`} />
            </button>
          </div>
        </nav>

        {/* morphing dropdown */}
        <AnimatePresence>
          {menu && (
            <motion.div
              key="dropdown"
              className="absolute top-full pt-3"
              initial={{ opacity: 0, y: -6, scale: 0.97, x: panelLeft }}
              animate={{ opacity: 1, y: 0, scale: 1, x: panelLeft }}
              exit={{ opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.15 } }}
              transition={SPRING}
              style={{ transformOrigin: 'top center' }}
              onPointerEnter={() => clearTimeout(closeTimer.current)}
              onPointerLeave={hideSoon}
            >
              <motion.div
                className="menu-glass relative overflow-hidden rounded-[1.75rem]"
                animate={{ width: size.w || 'auto', height: size.h || 'auto' }}
                transition={SPRING}
              >
                <AnimatePresence mode="popLayout" initial={false} custom={dir}>
                  <motion.div
                    key={menu}
                    ref={content}
                    custom={dir}
                    className="absolute left-0 top-0"
                    initial={{ opacity: 0, x: dir * 48 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: dir * -48 }}
                    transition={SPRING}
                  >
                    {menu === 'work' ? <WorkPanel close={() => setMenu(null)} /> : <ConnectPanel />}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* mobile full-screen menu */}
      <div
        id="menu-overlay"
        className={`fixed inset-0 z-40 flex flex-col justify-end overflow-hidden bg-[#030409]/80 px-6 pb-16 backdrop-blur-3xl transition-opacity duration-500 ease-fluid md:px-16 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-hidden={!open}
      >
        <ul className="flex flex-col gap-2">
          {[
            ['work', 'Exposures'],
            ['skills', 'Instruments'],
            ['contact', 'Contact'],
          ].map(([id, label], i) => (
            <li key={id} className="overflow-hidden">
              <button
                onClick={() => go(id)}
                tabIndex={open ? 0 : -1}
                className={`weighted block text-left max-w-full text-[clamp(2.5rem,11vw,8rem)] leading-[1] tracking-[-0.05em] transition-[transform,opacity,color,--w,--s] duration-700 ease-fluid [--s:96] [--w:480] hover:text-accent hover:[--s:76] hover:[--w:780] ${open ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}
                style={{ transitionDelay: open ? `${100 + i * 60}ms` : '0ms' }}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
        <div
          className={`t-mono mt-10 flex flex-wrap gap-x-7 text-ink-muted transition-opacity duration-700 ease-fluid ${open ? 'opacity-100' : 'opacity-0'}`}
          style={{ transitionDelay: open ? '320ms' : '0ms' }}
        >
          {[
            ['Email', `mailto:${profile.email}`],
            ['GitHub', profile.github],
            ['LinkedIn', profile.linkedin],
            ['LeetCode', profile.leetcode],
            ['Codeforces', profile.codeforces],
            ['X', profile.x],
            ['Resume', profile.resume],
          ].map(([label, href]) => (
            <a key={label} href={href} tabIndex={open ? 0 : -1} className="inline-block py-3 hover:text-accent">
              {label}
            </a>
          ))}
        </div>
      </div>
    </>
  )
}
