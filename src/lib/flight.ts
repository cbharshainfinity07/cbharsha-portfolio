import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/*
  The "flight" is the single source of truth for the scroll journey.
  stage: 0 (hero) -> 1 (contact), interpolated between [data-stage] markers in the DOM,
  so the 3D scene stays in sync with sections no matter how long your content gets.
  Everything continuous lives in this mutable object, never in React state.
*/
export const flight = {
  stage: 0,
  target: 0,
  velocity: 0, // smoothed scroll velocity, px per frame
  pointer: { x: 0, y: 0 },
  reduced: false,
}

type Listener = () => void
const listeners = new Set<Listener>()
export function onFlight(fn: Listener) {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}

export let lenis: Lenis | null = null

export function scrollToTarget(target: string | number) {
  if (lenis) lenis.scrollTo(target, { duration: 1.8 })
  else if (typeof target === 'number') window.scrollTo({ top: target })
  else document.querySelector(target)?.scrollIntoView()
}

let markers: { y: number; stage: number }[] = []

function measure() {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-stage]'))
  markers = els
    .map((el) => ({ y: el.getBoundingClientRect().top + window.scrollY, stage: parseFloat(el.dataset.stage!) }))
    .sort((a, b) => a.y - b.y)
  const end = document.documentElement.scrollHeight - window.innerHeight
  markers.push({ y: end + window.innerHeight * 0.5, stage: 1 })
}

function stageAt(scrollY: number) {
  if (!markers.length) return 0
  const y = scrollY + window.innerHeight * 0.5
  if (y <= markers[0].y) return markers[0].stage
  for (let i = 0; i < markers.length - 1; i++) {
    const a = markers[i]
    const b = markers[i + 1]
    if (y >= a.y && y <= b.y) return a.stage + ((y - a.y) / Math.max(1, b.y - a.y)) * (b.stage - a.stage)
  }
  return 1
}

let started = false
export function startFlight() {
  if (started) return () => {}
  started = true
  flight.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!flight.reduced) {
    lenis = new Lenis({ autoRaf: false, lerp: 0.085 })
    lenis.on('scroll', ScrollTrigger.update)
  }
  const raf = (time: number) => lenis?.raf(time * 1000)
  gsap.ticker.add(raf)
  gsap.ticker.lagSmoothing(0)

  ScrollTrigger.addEventListener('refresh', measure)
  // Re-measure when content height changes (images, fonts), debounced to avoid refresh loops
  let lastH = 0
  let to = 0
  const ro = new ResizeObserver(() => {
    clearTimeout(to)
    to = window.setTimeout(() => {
      const h = document.body.scrollHeight
      if (Math.abs(h - lastH) > 4) { lastH = h; ScrollTrigger.refresh() }
    }, 250)
  })
  ro.observe(document.body)
  measure()

  const onPointer = (e: PointerEvent) => {
    flight.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    flight.pointer.y = (e.clientY / window.innerHeight) * 2 - 1
  }
  window.addEventListener('pointermove', onPointer, { passive: true })

  const tick = () => {
    const y = lenis ? lenis.scroll : window.scrollY
    flight.target = stageAt(y)
    flight.stage += (flight.target - flight.stage) * (flight.reduced ? 1 : 0.12)
    flight.velocity += ((lenis ? lenis.velocity : 0) - flight.velocity) * 0.12

    listeners.forEach((fn) => fn())
  }
  gsap.ticker.add(tick)

  return () => {
    gsap.ticker.remove(raf)
    gsap.ticker.remove(tick)
    ScrollTrigger.removeEventListener('refresh', measure)
    window.removeEventListener('pointermove', onPointer)
    ro.disconnect()
    lenis?.destroy()
    lenis = null
    started = false
  }
}

export { gsap, ScrollTrigger }
