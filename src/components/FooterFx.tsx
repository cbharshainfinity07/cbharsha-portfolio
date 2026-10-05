import { useEffect, useRef, useState, type ComponentType } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from 'motion/react'
import type { IconProps } from '@phosphor-icons/react'
import { profile } from '../content'

/*
  Giant outlined name (after the 21st.dev "Text Hover Effect"): the stroke draws itself in,
  and the cursor carries a spotlight that fills the letters with the accent.
*/
export function OutlineName() {
  const svg = useRef<SVGSVGElement>(null)
  const grad = useRef<SVGRadialGradientElement>(null)
  const [drawn, setDrawn] = useState(false)
  const text = profile.name.toUpperCase()

  useEffect(() => {
    const el = svg.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setDrawn(true), { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const move = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect()
    grad.current?.setAttribute('cx', `${((e.clientX - r.left) / r.width) * 100}%`)
    grad.current?.setAttribute('cy', `${((e.clientY - r.top) / r.height) * 100}%`)
  }

  return (
    <svg
      ref={svg}
      viewBox="0 0 1000 220"
      className="w-full select-none"
      onPointerMove={move}
      onPointerLeave={() => grad.current?.setAttribute('cx', '-50%')}
      aria-hidden
    >
      <defs>
        <radialGradient ref={grad} id="name-spot" gradientUnits="userSpaceOnUse" r="22%" cx="-50%" cy="50%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>
        <mask id="name-mask">
          <rect width="100%" height="100%" fill="url(#name-spot)" />
        </mask>
      </defs>
      <text
        x="50%"
        y="52%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="outline-draw fill-transparent stroke-white/40 font-sans text-[230px] font-bold tracking-[-0.04em]"
        strokeWidth="1.2"
        data-drawn={drawn || undefined}
      >
        {text}
      </text>
      <text
        x="50%"
        y="52%"
        textAnchor="middle"
        dominantBaseline="middle"
        mask="url(#name-mask)"
        className="fill-accent font-sans text-[230px] font-bold tracking-[-0.04em]"
      >
        {text}
      </text>
    </svg>
  )
}

/* macOS-style dock magnification for the social links */
function DockIcon({ mouseX, href, label, Icon }: { mouseX: MotionValue<number>; href: string; label: string; Icon: ComponentType<IconProps> }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const dist = useTransform(mouseX, (x) => {
    const r = ref.current?.getBoundingClientRect()
    return r ? x - r.left - r.width / 2 : Infinity
  })
  const size = useSpring(useTransform(dist, [-110, 0, 110], [44, 58, 44]), { stiffness: 260, damping: 20, mass: 0.3 })
  return (
    <motion.a
      ref={ref}
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      style={{ width: size, height: size }}
      className="grid shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-ink transition-colors hover:border-accent hover:bg-accent/10 hover:text-accent"
    >
      <Icon size={20} />
    </motion.a>
  )
}

export function Dock({ items }: { items: { href: string; label: string; Icon: ComponentType<IconProps> }[] }) {
  const reduce = useReducedMotion()
  const mouseX = useMotionValue(Infinity)
  return (
    <div
      className="flex h-[60px] items-center gap-1.5 px-0.5"
      onPointerMove={(e) => !reduce && e.pointerType === 'mouse' && mouseX.set(e.clientX)}
      onPointerLeave={() => mouseX.set(Infinity)}
    >
      {items.map((it) => (
        <DockIcon key={it.label} mouseX={mouseX} {...it} />
      ))}
    </div>
  )
}
