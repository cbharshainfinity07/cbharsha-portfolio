import { useEffect, useState } from 'react'
import { ArrowDown, FileText } from '@phosphor-icons/react'
import { copy, profile } from '../content'
import { scrollToTarget } from '../lib/flight'
import { IconWell, Magnetic } from './Magnetic'
import { Decode } from './TextFx'

/*
  The particle name is the hero. Everything else is deliberately quiet and pushed to the edges:
  one centered mono line under the name, compact actions at the bottom, faint meta in the corners.
  Text arrives only after the particles have finished forming, so nothing competes with the intro.
*/
export function Hero() {
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setSettled(true), 2300)
    return () => clearTimeout(t)
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

      {/* one quiet line, centered under the particle name (positioned against the viewport, not leftover space) */}
      <div className="pointer-events-none absolute inset-x-0 top-[44%] px-5 text-center md:top-[61%]">
        <Decode text={profile.role} className="t-mono text-[0.72rem] uppercase tracking-[0.18em] text-ink-muted md:text-[0.8rem]" delay={2300} />
      </div>
      <div className="flex-1" />

      <div className="mx-auto grid w-full max-w-[1400px] items-end gap-6 px-5 pb-8 md:grid-cols-3 md:px-10 md:pb-10">
        <p {...fade(150)} className={`${fade(150).className} t-mono hidden max-w-[34ch] text-ink-faint md:block`}>
          {profile.subIntro}
        </p>
        <div {...fade(0)} className={`${fade(0).className} flex justify-center gap-2.5`}>
          <Magnetic>
            <button
              className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-accent pl-5 pr-1.5 text-sm font-semibold text-[#0b0b0b] transition-colors duration-500 ease-fluid hover:bg-accent-soft"
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
              className="group inline-flex h-12 items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.04] pl-5 pr-1.5 text-sm font-medium text-ink backdrop-blur-md transition-colors duration-500 ease-fluid hover:border-white/30"
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
        <div {...fade(300)} className={`${fade(300).className} t-mono hidden flex-col items-end gap-1.5 text-right text-ink-faint md:flex`}>
          <span>{copy.hint}</span>
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
