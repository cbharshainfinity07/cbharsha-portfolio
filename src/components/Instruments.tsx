import { useEffect, useRef } from 'react'
import { copy, experience, skills } from '../content'
import { Rise, SplitHeading } from './TextFx'
import { useInView } from './Magnetic'

/*
  Skills on a 3D sphere (Fibonacci distribution). Auto-rotates, drag/fling to spin with inertia.
  Positions are projected in JS and written straight to the DOM, no React renders per frame.
*/
function SkillSphere() {
  const box = useRef<HTMLDivElement>(null)
  const items = useRef<HTMLSpanElement[]>([])

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const n = skills.length
    const pts = skills.map((_, i) => {
      const y = 1 - (i / (n - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const t = i * Math.PI * (3 - Math.sqrt(5))
      return [Math.cos(t) * r, y, Math.sin(t) * r]
    })
    let ax = 0.3
    let ay = 0
    let vx = 0
    let vy = reduce ? 0 : 0.0035
    let drag: { x: number; y: number } | null = null
    let raf = 0

    const frame = () => {
      const el = box.current
      if (!el) return
      const R = el.clientWidth * 0.42
      if (!drag) {
        vx *= 0.95
        vy += ((reduce ? 0 : 0.0035) - vy) * 0.02
      }
      ax += vx
      ay += vy
      const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay)
      pts.forEach(([x, y, z], i) => {
        const x1 = x * cy + z * sy
        const z1 = -x * sy + z * cy
        const y2 = y * cx - z1 * sx
        const z2 = y * sx + z1 * cx
        const depth = (z2 + 1) / 2 // 0 back, 1 front
        const node = items.current[i]
        if (!node) return
        node.style.transform = `translate(-50%, -50%) translate3d(${x1 * R}px, ${y2 * R}px, 0) scale(${0.6 + depth * 0.55})`
        node.style.opacity = String(0.15 + depth * 0.85)
        node.style.zIndex = String(Math.round(depth * 100))
        node.style.filter = depth < 0.35 ? `blur(${(0.35 - depth) * 6}px)` : ''
      })
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    const el = box.current!
    const down = (e: PointerEvent) => {
      drag = { x: e.clientX, y: e.clientY }
      el.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (!drag) return
      vy = (e.clientX - drag.x) * 0.004
      vx = (e.clientY - drag.y) * -0.004
      drag = { x: e.clientX, y: e.clientY }
    }
    const up = () => (drag = null)
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
  }, [])

  return (
    <div
      ref={box}
      className="relative mx-auto aspect-square w-full max-w-[560px] cursor-grab touch-none select-none active:cursor-grabbing"
      role="img"
      aria-label={`Skills: ${skills.join(', ')}`}
    >
      <div className="absolute inset-[18%] rounded-full bg-[radial-gradient(circle,rgb(233_180_92/0.16),transparent_65%)]" />
      {skills.map((s, i) => (
        <span
          key={s}
          ref={(el) => {
            if (el) items.current[i] = el
          }}
          aria-hidden
          className="absolute left-1/2 top-1/2 whitespace-nowrap rounded-full border border-white/10 bg-[#0a0c14]/80 px-3.5 py-1.5 font-mono text-[13px] text-ink transition-[color,border-color] duration-150 will-change-transform hover:border-accent hover:text-accent"
        >
          {s}
        </span>
      ))}
    </div>
  )
}

export function Instruments() {
  const list = useInView<HTMLOListElement>()
  return (
    <section id="skills" className="relative py-28 md:py-40">
      <div className="mx-auto grid max-w-[1400px] items-center gap-16 px-5 md:grid-cols-2 md:px-10">
        <div className="md:order-2">
          <SkillSphere />
        </div>
        <div>
          <SplitHeading lines={[{ t: copy.skills.title }, { t: copy.skills.sub, muted: true }]} />
          <Rise text={copy.skills.body} className="t-lead mt-6 max-w-[34ch] text-ink-muted" step={20} />
          <ol ref={list} className="reveal mt-12 flex flex-col gap-3">
            {experience.map((e) => (
              <li key={e.role} className="group bezel !rounded-[1.5rem] !p-1 transition-colors duration-300 hover:!border-accent/40">
                <div className="core flex items-center justify-between gap-6 !rounded-[calc(1.5rem-0.25rem)] px-6 py-5">
                  <div>
                    <p className="weighted text-xl leading-tight tracking-[-0.02em] [--s:92] [--w:520] group-hover:[--s:82] group-hover:[--w:660]">{e.role}</p>
                    <p className="mt-1 text-sm text-ink-muted">
                      {e.org}
                      <span className="text-ink-faint">, {e.note}</span>
                    </p>
                  </div>
                  <p className="t-mono shrink-0 text-accent">{e.when}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
