import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion, useMotionValue, useReducedMotion, useSpring, useTransform, useVelocity, type MotionValue } from 'motion/react'
import { ArrowRight, ArrowUpRight, GitFork, GithubLogo, Star } from '@phosphor-icons/react'
import { copy, profile, projects, type Project } from '../content'
import { IconWell, btnGhost, btnPrimary } from './Magnetic'
import { lenis } from '../lib/flight'
import { ProjectMark } from './ProjectMark'
import { Rise, SplitHeading } from './TextFx'

const GRADE = 'saturate(0.85) contrast(1.05) sepia(0.1)'
const EASE = [0.32, 0.72, 0, 1] as const

function ago(iso?: string) {
  if (!iso) return ''
  const d = Math.round((Date.now() - new Date(iso).getTime()) / 864e5)
  if (d < 1) return 'today'
  if (d < 30) return `${d} days ago`
  if (d < 365) return `${Math.round(d / 30)} months ago`
  return `${Math.round(d / 365)} years ago`
}

/*
  Project image with a designed fallback: if the screenshot or GitHub's generated card fails,
  show a poster built from the project's constellation mark and name instead of a broken image.
*/
function ProjectImage({ p, className = '', style }: { p: Project; className?: string; style?: React.CSSProperties }) {
  const [failed, setFailed] = useState(false)
  if (failed || !p.image)
    return (
      <div className={`relative grid place-items-center overflow-hidden bg-[#07080f] ${className}`} style={style}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgb(233_180_92/0.22),transparent_60%)]" />
        <div className="relative flex flex-col items-center gap-4 text-center">
          <ProjectMark name={p.slug} active size={88} />
          <span className="t-h3 !text-[1.6rem]">{p.title}</span>
          <span className="t-mono text-accent">{p.kind}</span>
        </div>
      </div>
    )
  return <img src={p.image} alt={`${p.title} preview`} loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} style={{ objectPosition: p.imagePosition, ...style }} />
}

/*
  Floating preview that follows the cursor across the list. It springs behind the pointer,
  leans into its velocity, and between projects the next image wipes up while racking from
  blur into focus (the site's "exposure" idea). Fine pointers only.
*/
function FloatingPreview({ items, active, x, y }: { items: Project[]; active: number | null; x: MotionValue<number>; y: MotionValue<number> }) {
  const sx = useSpring(x, { stiffness: 170, damping: 22, mass: 0.6 })
  const sy = useSpring(y, { stiffness: 170, damping: 22, mass: 0.6 })
  const vx = useVelocity(sx)
  const rotate = useTransform(vx, [-1800, 1800], [-9, 9], { clamp: true })
  return (
    <motion.div className="pointer-events-none fixed left-0 top-0 z-30 hidden md:block" style={{ x: sx, y: sy, rotate }} aria-hidden>
      <AnimatePresence>
        {active !== null && (
          <motion.div
            key="preview"
            className="bezel -translate-x-1/2 -translate-y-1/2 !rounded-[1.4rem] !p-1.5 shadow-[0_40px_80px_-20px_rgb(0_0_0/0.8)]"
            initial={{ opacity: 0, scale: 0.6, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.75, filter: 'blur(6px)', transition: { duration: 0.25 } }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0 }}
          >
            <div className="core relative h-[230px] w-[360px] overflow-hidden !rounded-[calc(1.4rem-0.375rem)]">
              {items.map((p, i) => (
                <motion.div
                  key={p.slug}
                  className="absolute inset-0"
                  initial={false}
                  animate={
                    i === active
                      ? { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, filter: `blur(0px) ${GRADE}` }
                      : { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.18, filter: `blur(14px) ${GRADE}` }
                  }
                  transition={{ duration: 0.75, ease: EASE }}
                >
                  <ProjectImage p={p} className="h-full w-full" />
                </motion.div>
              ))}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(3_4_9/0.45))]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function Details({ p }: { p: Project }) {
  return (
    <div className="grid gap-10 pb-12 pt-2 md:grid-cols-[1fr_1.1fr] md:gap-16 md:pl-[88px]">
      <div className="flex flex-col">
        <Rise text={p.blurb} className="t-lead max-w-[38ch] text-ink" step={16} />
        <ul className="mt-6 flex flex-wrap gap-2">
          {p.stack.map((s) => (
            <li key={s} className="t-mono rounded-full border border-white/12 px-3 py-1.5 text-ink-muted">
              {s}
            </li>
          ))}
        </ul>
        <dl className="t-mono mt-8 flex flex-wrap gap-x-8 gap-y-3 text-ink-faint">
          {!!p.stars && (
            <div className="flex items-center gap-2">
              <dt className="sr-only">Stars</dt>
              <Star size={14} weight="fill" className="text-accent" />
              <dd className="text-ink">{p.stars.toLocaleString()}</dd>
            </div>
          )}
          {!!p.forks && (
            <div className="flex items-center gap-2">
              <dt className="sr-only">Forks</dt>
              <GitFork size={14} />
              <dd className="text-ink">{p.forks.toLocaleString()}</dd>
            </div>
          )}
          {p.updated && (
            <div>
              <dt className="sr-only">Last updated</dt>
              <dd>Updated {ago(p.updated)}</dd>
            </div>
          )}
        </dl>
        <div className="mt-auto flex flex-wrap gap-3 pt-10">
          {p.live && (
            <a className={btnPrimary} href={p.live} target="_blank" rel="noreferrer">
              Visit live
              <IconWell dark>
                <ArrowUpRight size={16} weight="bold" />
              </IconWell>
            </a>
          )}
          {p.code && (
            <a className={btnGhost} href={p.code} target="_blank" rel="noreferrer">
              View code
              <IconWell>
                <GithubLogo size={16} />
              </IconWell>
            </a>
          )}
        </div>
      </div>
      <div className="bezel">
        <div className="core overflow-hidden">
          <ProjectImage p={p} className="aspect-[16/10] w-full" style={{ filter: GRADE }} />
        </div>
      </div>
    </div>
  )
}

/*
  "Exposures": a typographic index of projects (the hover-reveal list used by the best studio sites).
  Hover: the row's name condenses and thickens on the variable axes and slides in, its constellation
  mark draws itself, a gold wash sweeps the row, siblings dim, and the floating preview follows.
  Click: the row opens in place with the full story, stack, GitHub stats and links.
*/
export function Work() {
  const reduce = useReducedMotion()
  const [sort, setSort] = useState<'best' | 'recent'>('best')
  const [hover, setHover] = useState<number | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [fine, setFine] = useState(false)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  useEffect(() => setFine(window.matchMedia('(hover: hover) and (pointer: fine)').matches), [])

  // the nav's Work dropdown can open a specific project and fly to it
  useEffect(() => {
    const onOpen = (e: Event) => {
      const slug = (e as CustomEvent<string>).detail
      setOpen(slug)
      requestAnimationFrame(() => {
        const el = document.getElementById(`row-${slug}`)
        if (!el) return
        if (lenis) lenis.scrollTo(el, { offset: -110, duration: 1.6 })
        else el.scrollIntoView({ block: 'start' })
      })
    }
    window.addEventListener('open-project', onOpen)
    return () => window.removeEventListener('open-project', onOpen)
  }, [])

  const list = useMemo(() => {
    const arr = [...projects]
    if (sort === 'recent') arr.sort((a, b) => (b.updated ?? b.year).localeCompare(a.updated ?? a.year))
    else arr.sort((a, b) => (b.score ?? b.stars ?? 0) - (a.score ?? a.stars ?? 0))
    return arr
  }, [sort])

  const fromGithub = projects.some((p) => p.score !== undefined)
  // the handle comes from config, or from the imported repos themselves
  const handle = profile.githubUser || projects[0]?.code?.split('/')[3] || ''

  return (
    <section id="work" className="relative py-28 md:py-40">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <SplitHeading lines={[{ t: copy.work.title }, { t: copy.work.sub, muted: true }]} />
        <div className="mt-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <p className="t-mono flex items-center gap-2 text-ink-faint">
            <GithubLogo size={14} />
            {fromGithub ? `Pulled live from github.com/${handle}. Hover to preview, click to open.` : copy.work.note}
          </p>
          <LayoutGroup>
            <div className="glass flex w-max rounded-full p-1" role="tablist" aria-label="Sort projects">
              {(['best', 'recent'] as const).map((k) => (
                <button
                  key={k}
                  role="tab"
                  aria-selected={sort === k}
                  onClick={() => setSort(k)}
                  className={`relative h-9 rounded-full px-5 text-sm transition-colors duration-150 ${sort === k ? 'text-[#0b0b0b]' : 'text-ink-muted hover:text-ink'}`}
                >
                  {sort === k && <motion.span layoutId="sort-pill" className="absolute inset-0 rounded-full bg-accent" transition={{ type: 'spring', duration: 0.4, bounce: 0 }} />}
                  <span className="relative">{k === 'best' ? 'Best' : 'Recent'}</span>
                </button>
              ))}
            </div>
          </LayoutGroup>
        </div>

        <ul
          className="rows mt-14 border-t border-white/[0.08]"
          onPointerMove={(e) => {
            x.set(e.clientX + 230)
            y.set(e.clientY)
          }}
          onPointerLeave={() => setHover(null)}
        >
          {list.map((p, i) => {
            const isOpen = open === p.slug
            const isHot = hover === i || isOpen
            return (
              <motion.li key={p.slug} id={`row-${p.slug}`} layout={reduce ? false : 'position'} transition={{ type: 'spring', duration: 0.6, bounce: 0 }} className="row border-b border-white/[0.08]">
                <button
                  onPointerEnter={() => fine && setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  onClick={() => setOpen(isOpen ? null : p.slug)}
                  aria-expanded={isOpen}
                  aria-controls={`proj-${p.slug}`}
                  className="group/row relative grid w-full grid-cols-[auto_1fr_auto] items-center gap-5 overflow-hidden py-6 text-left md:grid-cols-[64px_1fr_200px_90px_60px_48px] md:gap-6 md:py-8"
                >
                  {/* gold wash sweeping in from the left */}
                  <span className="pointer-events-none absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-accent/[0.09] via-accent/[0.03] to-transparent transition-transform duration-700 ease-fluid group-hover/row:scale-x-100" />
                  <ProjectMark name={p.slug} active={isHot} />
                  <span
                    className="weighted relative truncate pb-1 text-[clamp(2rem,5.4vw,5rem)] leading-[1] tracking-[-0.045em] transition-[translate,color,--w,--s] duration-700 ease-fluid [--s:96] [--w:420] group-hover/row:translate-x-3 group-hover/row:[--s:78] group-hover/row:[--w:700]"
                    style={isOpen ? { ['--w' as string]: 700, ['--s' as string]: 78, color: 'var(--color-accent)' } : undefined}
                  >
                    {p.title}
                  </span>
                  <span className="t-mono relative hidden truncate text-ink-muted md:block">{p.kind}</span>
                  <span className="t-mono relative hidden items-center gap-1.5 text-ink-muted md:flex">
                    {!!p.stars && (
                      <>
                        <Star size={12} weight="fill" className="text-accent" />
                        {p.stars.toLocaleString()}
                      </>
                    )}
                  </span>
                  <span className="t-mono relative hidden text-ink-faint md:block">{p.year}</span>
                  <span
                    className={`relative grid size-12 place-items-center rounded-full border transition-[background-color,border-color,color] duration-300 ${isHot ? 'border-accent bg-accent text-[#0b0b0b]' : 'border-white/15 text-ink'}`}
                  >
                    <ArrowRight
                      size={18}
                      weight="bold"
                      className="transition-transform duration-500 ease-fluid"
                      style={{ transform: isOpen ? 'rotate(90deg)' : hover === i ? 'rotate(-45deg)' : 'none' }}
                    />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`proj-${p.slug}`}
                      key="d"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.6, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <Details p={p} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            )
          })}
        </ul>
      </div>
      {fine && !reduce && <FloatingPreview items={list} active={open ? null : hover} x={x} y={y} />}
    </section>
  )
}
