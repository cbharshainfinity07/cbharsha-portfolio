import { Suspense, lazy, useEffect, useState } from 'react'
import { startFlight } from './lib/flight'
import { Hero } from './components/Hero'
import { Manifesto } from './components/Manifesto'
import { Work } from './components/Work'
import { Instruments } from './components/Instruments'
import { Contact } from './components/Contact'
import { Menu } from './components/Menu'
import { CommandPalette } from './components/CommandPalette'

const SpaceScene = lazy(() => import('./three/SpaceScene'))

/*
  Stage markers tell the 3D scene where each section sits (0 = hero, 1 = contact):
  name in particles -> spiral galaxy -> drifting past it -> deep field -> black hole.
*/
const Stage = ({ at }: { at: number }) => <div data-stage={at} aria-hidden />

export default function App() {
  const [palette, setPalette] = useState(false)
  useEffect(() => startFlight(), [])

  return (
    <div className="grain">
      <Suspense fallback={null}>
        <SpaceScene />
      </Suspense>
      <a
        href="#work"
        className="fixed left-4 top-4 z-[70] -translate-y-24 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-[#0b0b0b] transition-transform focus:translate-y-0"
      >
        Skip to work
      </a>
      <Menu onPalette={() => setPalette(true)} />
      <CommandPalette open={palette} setOpen={setPalette} />

      <main className="relative z-10">
        <Stage at={0} />
        <Hero />
        <Stage at={0.14} />
        <Manifesto />
        <Stage at={0.34} />
        <Work />
        <Stage at={0.6} />
        <Instruments />
        <Stage at={0.86} />
        <Contact />
      </main>
    </div>
  )
}
