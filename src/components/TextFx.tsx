import { Fragment, useEffect, useRef, useState } from 'react'

type Line = { t: string; muted?: boolean }

function useReveal<T extends HTMLElement>(threshold = 0.35, delay = 0) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let t = 0
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        t = window.setTimeout(() => (el.dataset.in = ''), delay)
        io.disconnect()
      },
      { threshold },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      clearTimeout(t)
    }
  }, [threshold, delay])
  return ref
}

/*
  Variable-font heading.
  Enter: letters condense from wide + hairline + blurred into their set weight, in reading order.
  Hover: letters near the cursor swell heavier and wider (proximity on the wght/wdth axes).
*/
export function SplitHeading({
  lines,
  className = 't-h2',
  as: Tag = 'h2',
  delay = 0,
}: {
  lines: Line[]
  className?: string
  as?: 'h1' | 'h2' | 'h3'
  delay?: number
}) {
  const ref = useReveal<HTMLHeadingElement>(0.35, delay)
  const chars = useRef<HTMLSpanElement[]>([])
  const rects = useRef<DOMRect[]>([])
  const fine = useRef(false)

  useEffect(() => {
    fine.current =
      window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const measure = () => {
    rects.current = chars.current.map((c) => c.getBoundingClientRect())
  }
  const move = (e: React.PointerEvent) => {
    if (!fine.current) return
    if (!rects.current.length) measure()
    const R = 140
    chars.current.forEach((c, i) => {
      const r = rects.current[i]
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const t = Math.max(0, 1 - Math.hypot(dx, dy) / R)
      c.style.setProperty('--pw', (t * t).toFixed(3))
    })
  }
  const leave = () => {
    rects.current = []
    chars.current.forEach((c) => c.style.setProperty('--pw', '0'))
  }

  let n = 0
  chars.current = []
  const H = Tag as 'h2'
  return (
    <H ref={ref} className={`split ${className}`} aria-label={lines.map((l) => l.t).join(' ')} onPointerEnter={measure} onPointerMove={move} onPointerLeave={leave}>
      {lines.map((line, li) => (
        <span key={li} aria-hidden className={`block pb-[0.06em] ${line.muted ? 'muted-line' : ''}`}>
          {line.t.split(' ').map((word, wi, words) => (
            <Fragment key={wi}>
              <span className="inline-block whitespace-nowrap">
                {word.split('').map((ch, ci) => (
                  <span
                    key={ci}
                    ref={(el) => {
                      if (el) chars.current.push(el)
                    }}
                    className="ch inline-block"
                    style={{ ['--d' as string]: `${n++ * 24}ms` }}
                  >
                    {ch}
                  </span>
                ))}
              </span>
              {/* a real space between words: copy/paste and search engines read it correctly */}
              {wi < words.length - 1 ? ' ' : ''}
            </Fragment>
          ))}
        </span>
      ))}
    </H>
  )
}

// Words rise out of masks, one after another.
export function Rise({ text, className = '', as: Tag = 'p', delay = 0, step = 28 }: { text: string; className?: string; as?: 'p' | 'span'; delay?: number; step?: number }) {
  const ref = useReveal<HTMLParagraphElement>(0.2, delay)
  const T = Tag as 'p'
  const words = text.split(' ')
  return (
    <T ref={ref} className={`rise ${className}`} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden>
          <span className="wd">
            <span style={{ ['--d' as string]: `${i * step}ms` }}>{w}</span>
          </span>
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </T>
  )
}

// Mono labels decode from noise into text, left to right.
const GLYPHS = '01<>/=+*#%'
export function Decode({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) {
  const [out, setOut] = useState(() => text.replace(/\S/g, ' '))
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setOut(text)
      return
    }
    let raf = 0
    let timer = 0
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      timer = window.setTimeout(() => {
        const start = performance.now()
        const tick = (now: number) => {
          const p = (now - start) / 900
          const done = Math.floor(p * text.length)
          setOut(
            text
              .split('')
              .map((c, i) => (c === ' ' || i < done ? c : i < done + 6 ? GLYPHS[(Math.random() * GLYPHS.length) | 0] : ' '))
              .join(''),
          )
          if (p < 1) raf = requestAnimationFrame(tick)
          else setOut(text)
        }
        raf = requestAnimationFrame(tick)
      }, delay)
    })
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
  }, [text, delay])
  return (
    <span ref={ref} className={`whitespace-pre ${className}`} aria-label={text}>
      <span aria-hidden>{out}</span>
    </span>
  )
}

// Hover roll: each letter slides up and a copy rolls in from below. Parent needs `group`.
export function RollText({ text }: { text: string }) {
  return (
    <span className="relative inline-flex overflow-hidden" aria-label={text}>
      {text.split('').map((ch, i) => (
        <span key={i} aria-hidden className="roll relative inline-block" style={{ ['--d' as string]: `${i * 18}ms` }}>
          <span className="roll-a inline-block">{ch === ' ' ? ' ' : ch}</span>
          <span className="roll-b absolute left-0 top-full inline-block">{ch === ' ' ? ' ' : ch}</span>
        </span>
      ))}
    </span>
  )
}
