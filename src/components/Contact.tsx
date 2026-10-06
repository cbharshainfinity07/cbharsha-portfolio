import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUp, ArrowUpRight, Check, Copy, GithubLogo, LinkedinLogo, XLogo } from '@phosphor-icons/react'
import { copy as words, profile } from '../content'
import { scrollToTarget } from '../lib/flight'
import { IconWell, Magnetic, btnGhost, btnPrimary } from './Magnetic'
import { Rise, SplitHeading } from './TextFx'
import { Dock, OutlineName } from './FooterFx'
import { CodeforcesIcon, LeetCodeIcon } from './BrandIcons'

// A small star burst from the copy button: feedback you can feel.
function Burst() {
  const parts = Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2 + Math.random() * 0.4
    const d = 46 + Math.random() * 50
    return { x: Math.cos(a) * d, y: Math.sin(a) * d, s: 2 + Math.random() * 4, c: i % 3 ? '#e9b45c' : '#fff6e6' }
  })
  return (
    <span className="pointer-events-none absolute left-1/2 top-1/2" aria-hidden>
      {parts.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{ width: p.s, height: p.s, background: p.c, marginLeft: -p.s / 2, marginTop: -p.s / 2, boxShadow: `0 0 8px ${p.c}` }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.3 }}
          transition={{ duration: 0.9 + Math.random() * 0.3, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </span>
  )
}

// Sits in front of the ray-traced black hole (rendered in the 3D scene, right side on desktop).
export function Contact() {
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle')
  const [burst, setBurst] = useState(0)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied('ok')
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) setBurst((b) => b + 1)
    } catch {
      setCopied('fail')
    }
    setTimeout(() => setCopied('idle'), 2200)
  }
  const socials = [
    { href: profile.github, label: 'GitHub', Icon: GithubLogo },
    { href: profile.linkedin, label: 'LinkedIn', Icon: LinkedinLogo },
    { href: profile.x, label: 'X', Icon: XLogo },
    { href: profile.leetcode, label: 'LeetCode', Icon: LeetCodeIcon },
    { href: profile.codeforces, label: 'Codeforces', Icon: CodeforcesIcon },
  ]
  return (
    <section id="contact" className="relative flex min-h-[100dvh] flex-col">
      <div className="relative mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center px-5 py-32 md:px-10">
        {/* desktop: the hole sits to the right, a soft wash on the left is enough; portrait: it sits right behind the copy */}
        <div className="pointer-events-none absolute inset-y-0 -left-10 w-[75%] bg-[radial-gradient(ellipse_at_left,rgb(3_4_9/0.8),transparent_65%)] max-lg:right-0 max-lg:w-auto max-lg:bg-[radial-gradient(ellipse_75%_40%_at_35%_50%,rgb(3_4_9/0.86),rgb(3_4_9/0.5)_55%,transparent_80%)]" aria-hidden />
        <SplitHeading className="t-display relative max-w-[12ch]" lines={[{ t: words.contact.title }, { t: words.contact.sub, muted: true }]} />
        <Rise text={words.contact.body} className="t-lead relative mt-8 max-w-[34ch] text-ink-muted" step={22} delay={300} />
        <div className="relative mt-10 flex flex-wrap items-center gap-3">
          <Magnetic>
            <a className={`${btnPrimary} beam`} href={`mailto:${profile.email}`}>
              {words.contact.cta}
              <IconWell dark>
                <ArrowUpRight size={16} weight="bold" />
              </IconWell>
            </a>
          </Magnetic>
          <button onClick={copy} className={`${btnGhost} relative font-mono !text-sm`} aria-live="polite">
            {burst > 0 && <Burst key={burst} />}
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={copied}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                {copied === 'ok' ? 'Copied to clipboard' : copied === 'fail' ? 'Copy failed, select it instead' : profile.email}
              </motion.span>
            </AnimatePresence>
            <IconWell>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={copied === 'ok' ? 'check' : 'copy'}
                  className="grid place-items-center"
                  initial={{ scale: 0.25, opacity: 0, filter: 'blur(4px)' }}
                  animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                  exit={{ scale: 0.25, opacity: 0, filter: 'blur(4px)' }}
                  transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
                >
                  {copied === 'ok' ? <Check size={16} weight="bold" className="text-accent" /> : <Copy size={16} />}
                </motion.span>
              </AnimatePresence>
            </IconWell>
          </button>
        </div>
      </div>
      <footer className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-5 py-8 md:px-10 lg:flex-row lg:items-center lg:justify-between">
        {/* each item sits on its own small frosted pill: legible over the disk, the hole stays visible around them */}
        <div className="footer-glass w-max rounded-full p-1.5">
          <Dock items={socials} />
        </div>
        <p className="footer-glass t-mono max-w-full rounded-2xl px-4 py-2.5 text-ink-muted lg:w-max lg:rounded-full">
          © {new Date().getFullYear()} <span className="text-ink">{profile.fullName}</span>. {words.footer}
        </p>
        <button
          onClick={() => scrollToTarget(0)}
          className="footer-glass group inline-flex w-max items-center gap-2 whitespace-nowrap rounded-full py-2 pl-4 pr-2 text-sm text-ink hover:text-accent"
        >
          Back to the top
          <span className="grid size-7 place-items-center rounded-full bg-white/10 transition-transform duration-500 ease-fluid group-hover:-translate-y-0.5">
            <ArrowUp size={14} />
          </span>
        </button>
      </footer>
      <div className="mx-auto w-full max-w-[1400px] px-5 pb-6 md:px-10">
        <OutlineName />
      </div>
    </section>
  )
}
