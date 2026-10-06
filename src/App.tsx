import { Component, Suspense, lazy, useEffect, useState, type ReactNode } from 'react'
import { startFlight } from './lib/flight'
import { sceneFailed, useSceneOk } from './lib/scene'
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

// If the 3D scene throws, drop it and keep the page; without this one GPU error blanks the whole site.
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.warn('3D scene unavailable, using the static sky:', error)
    sceneFailed()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

// The no-WebGL sky: the same palette as the nebula, a scatter of stars, nothing that needs a GPU.
function StaticSky() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 bg-void"
      aria-hidden
      style={{
        backgroundImage: [
          'radial-gradient(1px 1px at 12% 18%, rgb(255 255 255 / 0.8), transparent)',
          'radial-gradient(1px 1px at 68% 32%, rgb(255 255 255 / 0.7), transparent)',
          'radial-gradient(1.5px 1.5px at 38% 72%, rgb(255 244 234 / 0.8), transparent)',
          'radial-gradient(1px 1px at 84% 78%, rgb(202 215 255 / 0.8), transparent)',
          'radial-gradient(1px 1px at 22% 58%, rgb(255 255 255 / 0.6), transparent)',
          'radial-gradient(1.5px 1.5px at 92% 12%, rgb(255 210 161 / 0.7), transparent)',
          'radial-gradient(ellipse 60% 45% at 30% 30%, rgb(200 138 58 / 0.22), transparent 70%)',
          'radial-gradient(ellipse 55% 50% at 75% 70%, rgb(61 111 115 / 0.2), transparent 70%)',
          'radial-gradient(ellipse 40% 35% at 60% 20%, rgb(224 169 90 / 0.14), transparent 70%)',
        ].join(','),
      }}
    />
  )
}

export default function App() {
  const [palette, setPalette] = useState(false)
  const sceneOk = useSceneOk()
  useEffect(() => startFlight(), [])

  return (
    <div className="grain">
      {sceneOk ? (
        <SceneBoundary>
          <Suspense fallback={null}>
            <SpaceScene />
          </Suspense>
        </SceneBoundary>
      ) : (
        <StaticSky />
      )}
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
