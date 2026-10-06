import { useSyncExternalStore } from 'react'

/*
  Whether the 3D scene can run. Starts from a WebGL capability probe and flips to false if the scene throws
  (context creation refused, shader compile failure on an odd GPU). The page then renders a static sky instead
  of going blank.
*/
function probe() {
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2') || c.getContext('webgl')
    gl?.getExtension('WEBGL_lose_context')?.loseContext() // hand the probe context straight back
    return !!gl
  } catch {
    return false
  }
}

let ok = typeof document !== 'undefined' && probe()
const subs = new Set<() => void>()

export function sceneFailed() {
  if (!ok) return
  ok = false
  subs.forEach((fn) => fn())
}

export function useSceneOk() {
  return useSyncExternalStore(
    (fn) => {
      subs.add(fn)
      return () => void subs.delete(fn)
    },
    () => ok,
  )
}
