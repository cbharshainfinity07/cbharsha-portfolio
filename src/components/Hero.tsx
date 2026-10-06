import { useEffect, useRef, useState } from 'react'
import { ArrowDown, FileText } from '@phosphor-icons/react'
import { copy, profile } from '../content'
import { flight, onFlight, scrollToTarget } from '../lib/flight'
import { useSceneOk } from '../lib/scene'
import { IconWell, Magnetic } from './Magnetic'
import { Decode } from './TextFx'

/*
  The particle name is the hero. Everything else is deliberately quiet and pushed to the edges:
  one centered mono line under the name, compact actions at the bottom, faint meta in the corners.
  Text arrives only after the particles have finished forming, so nothing competes with the intro.
*/
export function Hero() {
  const sceneOk = useSceneOk()
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setSettled(true), 2300)
    return () => clearTimeout(t)
  }, [])

  // follow the projected lower edge of the particle name; a gap that scales with the viewport keeps it clear on every device
  const roleRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let last = -1
    return onFlight(() => {
      const el = roleRef.current
      // past the hero, freeze so the line scrolls away with the page (target, not the eased stage, so a jump
      // straight to a section can't pin the line at the new scroll offset before the stage catches up)
      if (!el || flight.nameBottom < 0 || flight.target >= 0.12) return
      // nameBottom is viewport-relative; the line lives in the scrolling section, so add the scroll offset
      const y = flight.nameBottom + window.scrollY
      if (Math.abs(y - last) < 0.25) return
      last = y
      el.style.transform = `translate3d(0, ${(y + Math.max(14, window.innerHeight * 0.022)).toFixed(1)}px, 0)`
      el.style.opacity = '1'
    })
  }, [])

  const fade = (delay = 0) => ({
    className: `transition-[opacity,transform] duration-1000 ease-fluid ${settled ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`,
    style: { transitionDelay: `${delay}ms` },
  })

  return (
    <section id="top" className="relative flex min-h-[100dvh] flex-col pt-24">
      <h1 className="sr-only">
        {profile.fullName}, {profile.role}. {profile.intro}
      </h1>

      {sceneOk ? (
        /* one quiet line, pinned just under the particle name wherever the 3D scene draws it */
        <div ref={roleRef} className="pointer-events-none absolute inset-x-0 top-0 px-5 text-center opacity-0 transition-opacity duration-500">
          <Decode text={profile.role} className="t-mono text-[0.72rem] uppercase tracking-[0.18em] text-ink-muted md:text-[0.8rem]" delay={2300} />
        </div>
      ) : (
        /* no WebGL: the name as type, same place and weight as the particles */
        <div className="pointer-events-none absolute inset-x-0 top-[34%] px-5 text-center" aria-hidden>
          <p className="text-[clamp(4.5rem,19vw,15rem)] font-extrabold leading-[0.9] tracking-[-0.04em] text-ink [text-shadow:0_0_60px_rgb(233_180_92/0.35)]">
            {profile.particleName}
          </p>
          <p className="t-mono mt-6 text-[0.72rem] uppercase tracking-[0.18em] text-ink-muted md:text-[0.8rem]">{profile.role}</p>
        </div>
      )}
      <div className="flex-1" />

      <div className="mx-auto grid w-full max-w-[1400px] items-end gap-6 px-5 pb-8 md:px-10 md:pb-10 lg:grid-cols-3">
        <p {...fade(150)} className={`${fade(150).className} t-mono hidden max-w-[34ch] text-ink-faint lg:block`}>
          {profile.subIntro}
        </p>
        <div {...fade(0)} className={`${fade(0).className} flex justify-center gap-2.5`}>
          <Magnetic>
            <button
              className="group inline-flex h-12 items-center gap-2.5 whitespace-nowrap rounded-full bg-accent pl-5 pr-1.5 text-sm font-semibold text-[#0b0b0b] transition-colors duration-500 ease-fluid hover:bg-accent-soft"
              onClick={() => scrollToTarget('#work')}
            >
              See the work
              <IconWell dark>
                <ArrowDown size={15} weight="bold" />
              </IconWell>
            </button>
          </Magnetic>
          <Magnetic>
            <a
              className="group inline-flex h-12 items-center gap-2.5 whitespace-nowrap rounded-full border border-white/12 bg-white/[0.04] pl-5 pr-1.5 text-sm font-medium text-ink backdrop-blur-md transition-colors duration-500 ease-fluid hover:border-white/30"
              href={profile.resume}
              target="_blank"
              rel="noreferrer"
            >
              Resume
              <IconWell>
                <FileText size={15} />
              </IconWell>
            </a>
          </Magnetic>
        </div>
        <div {...fade(300)} className={`${fade(300).className} t-mono hidden flex-col items-end gap-1.5 text-right text-ink-faint lg:flex`}>
          {sceneOk && (
            <>
              <span className="[@media(pointer:coarse)]:hidden">{copy.hint}</span>
              <span className="hidden [@media(pointer:coarse)]:inline">{copy.hintTouch}</span>
            </>
          )}
          {profile.available && (
            <span className="flex items-center gap-2 text-ink-muted">
              <span className="size-1.5 rounded-full bg-emerald-400" style={{ animation: 'pulse-dot 2.4s ease-in-out infinite' }} />
              {profile.availability}
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
