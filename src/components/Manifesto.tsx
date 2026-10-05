import { useEffect, useRef } from 'react'
import { manifesto } from '../content'
import { gsap } from '../lib/flight'

/*
  Pinned paragraph that "develops" like a long exposure: each word goes from a faint hairline
  to full weight in reading order, scrubbed by scroll. The weight change is the variable font's
  wght axis, so the letterforms themselves thicken rather than just fading in.
*/
export function Manifesto() {
  const wrap = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const mm = gsap.matchMedia()
    mm.add(
      { motion: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' },
      (ctx) => {
        const words = gsap.utils.toArray<HTMLElement>('.mw', el)
        if (ctx.conditions?.reduce) {
          gsap.set(words, { opacity: 1, '--w': 560 })
          return
        }
        gsap.fromTo(
          words,
          { opacity: 0.16, '--w': 220, '--s': 100 },
          {
            opacity: 1,
            '--w': 600,
            '--s': 86,
            stagger: 0.12,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top top', end: '+=170%', scrub: 0.7, pin: true },
          },
        )
      },
    )
    return () => mm.revert()
  }, [])

  // Highlight the key phrase in the accent, everything else in ink.
  const words = manifesto.split(' ')
  const accent = new Set(['long', 'exposure.'])
  return (
    <section id="about" ref={wrap} className="relative flex min-h-[100dvh] items-center">
      <div className="relative mx-auto w-full max-w-[1400px] px-5 md:px-10">
        <div className="pointer-events-none absolute -inset-y-24 left-0 w-[70%] bg-[radial-gradient(ellipse_at_left,rgb(3_4_9/0.85),transparent_70%)]" aria-hidden />
        <p
          className="relative max-w-[21ch] text-[clamp(2rem,4.4vw,4.3rem)] leading-[1.06] tracking-[-0.035em]"
          aria-label={manifesto}
        >
          {words.map((w, i) => (
            <span
              key={i}
              aria-hidden
              className={`mw inline-block whitespace-pre ${accent.has(w) && i < 6 ? 'text-accent' : ''}`}
              style={{ fontVariationSettings: '"wght" var(--w), "wdth" var(--s), "opsz" 72' }}
            >
              {w}{' '}
            </span>
          ))}
        </p>
      </div>
    </section>
  )
}
