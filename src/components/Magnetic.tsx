import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { useEffect, useRef, type ReactNode } from 'react'

// Magnetic pull toward the cursor. Motion values only, no React re-renders.
export function Magnetic({ children, strength = 0.3, className }: { children: ReactNode; strength?: number; className?: string }) {
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 180, damping: 16, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 180, damping: 16, mass: 0.4 })
  return (
    <motion.div
      className={className ?? 'inline-block'}
      style={{ x: sx, y: sy }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== 'mouse') return
        const r = e.currentTarget.getBoundingClientRect()
        x.set((e.clientX - r.left - r.width / 2) * strength)
        y.set((e.clientY - r.top - r.height / 2) * strength)
      }}
      onPointerLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      {children}
    </motion.div>
  )
}

// Button-in-button: the trailing icon lives in its own circle and leans toward the cursor on hover.
export const btnPrimary =
  'group inline-flex h-14 items-center gap-3 whitespace-nowrap rounded-full bg-accent pl-6 pr-2 text-[15px] font-semibold text-[#0b0b0b] transition-colors duration-500 ease-fluid hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent'
export const btnGhost =
  'group inline-flex h-14 items-center gap-3 whitespace-nowrap rounded-full border border-white/12 bg-white/[0.04] pl-6 pr-2 text-[15px] font-medium text-ink transition-colors duration-500 ease-fluid hover:border-white/30 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent'
export function IconWell({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <span
      className={`grid size-10 place-items-center rounded-full transition-transform duration-500 ease-fluid group-hover:-translate-y-px group-hover:translate-x-1 group-hover:scale-105 ${dark ? 'bg-black/10' : 'bg-white/10'}`}
    >
      {children}
    </span>
  )
}

// Adds data-in when the element scrolls into view (pairs with .reveal / .split in CSS).
export function useInView<T extends HTMLElement>(threshold = 0.25) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.dataset.in = ''
          io.disconnect()
        }
      },
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return ref
}
