import { useMemo } from 'react'

// Small deterministic PRNG so a project's mark never changes between builds.
function seeded(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/*
  Project logo: a constellation generated from the project's name.
  5-6 stars placed around an orbit, threaded in order, the brightest in gold.
  Every project gets a unique but related mark, so the set reads as one family.
  `active` draws the lines in and turns the mark (driven by the row's hover state).
*/
export function ProjectMark({ name, active = false, size = 56 }: { name: string; active?: boolean; size?: number }) {
  const { stars, path, ring } = useMemo(() => {
    const rnd = seeded(name)
    const n = 5 + Math.floor(rnd() * 2)
    const start = rnd() * Math.PI * 2
    const stars = Array.from({ length: n }, (_, i) => {
      const a = start + (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.9
      const r = 9 + rnd() * 9
      return { x: 24 + Math.cos(a) * r, y: 24 + Math.sin(a) * r, s: 0.9 + rnd() * 1.3 }
    })
    const bright = Math.floor(rnd() * n)
    stars[bright].s = 2.6
    const order = [...stars.keys()].sort((a, b) => stars[a].x - stars[b].x)
    const path = order.map((k, i) => `${i ? 'L' : 'M'}${stars[k].x.toFixed(2)} ${stars[k].y.toFixed(2)}`).join(' ')
    return { stars: stars.map((s, i) => ({ ...s, bright: i === bright })), path, ring: rnd() > 0.45 }
  }, [name])

  return (
    <span
      className={`relative grid shrink-0 place-items-center rounded-full border transition-[border-color,background-color,box-shadow] duration-500 ease-fluid ${
        active ? 'border-accent/50 bg-accent/[0.08] shadow-[0_0_40px_-8px_rgb(233_180_92/0.5)]' : 'border-white/10 bg-white/[0.03]'
      }`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        viewBox="0 0 48 48"
        className="transition-transform duration-[1200ms] ease-fluid"
        style={{ width: size * 0.82, height: size * 0.82, transform: active ? 'rotate(32deg) scale(1.06)' : 'rotate(0deg)' }}
      >
        {ring && <circle cx="24" cy="24" r="20" fill="none" stroke="rgb(238 240 243 / 0.14)" strokeWidth="0.6" strokeDasharray="1.5 2.5" />}
        <path
          d={path}
          fill="none"
          stroke={active ? '#e9b45c' : 'rgb(238 240 243 / 0.45)'}
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset={active ? 0 : 0.55}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.32,0.72,0,1), stroke 400ms' }}
        />
        {stars.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.s}
            fill={s.bright ? '#e9b45c' : '#eef0f3'}
            style={{
              filter: s.bright ? 'drop-shadow(0 0 3px rgb(233 180 92 / 0.9))' : undefined,
              opacity: s.bright || active ? 1 : 0.7,
              transition: 'opacity 400ms',
            }}
          />
        ))}
      </svg>
    </span>
  )
}
