import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { flight } from '../lib/flight'
import { profile } from '../content'
import { noiseGLSL } from './noise'
import { sampleText } from './sampleText'

/* ---------- helpers ---------- */
type Key = [number, number]
const ease = (t: number) => t * t * (3 - 2 * t)
const curve = (keys: Key[], s: number) => {
  if (s <= keys[0][0]) return keys[0][1]
  for (let i = 0; i < keys.length - 1; i++) {
    const [a, va] = keys[i]
    const [b, vb] = keys[i + 1]
    if (s <= b) return va + (vb - va) * ease((s - a) / (b - a))
  }
  return keys[keys.length - 1][1]
}
const ss = THREE.MathUtils.smoothstep

/* Shared, frame-updated world state (no React renders) */
const world = { mouse: new THREE.Vector3(999, 999, 0), mouseOn: 0, burst: 0, intro: 0 }

/* ---------- stars: real-ish magnitudes, colour temperatures, twinkle ---------- */
function Stars({ count = 7000 }) {
  const ref = useRef<THREE.Points>(null!)
  const mat = useRef<THREE.ShaderMaterial>(null!)
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const mag = new Float32Array(count)
    const c = new THREE.Color()
    const temps = ['#9bb0ff', '#aabfff', '#cad7ff', '#f8f7ff', '#fff4ea', '#ffd2a1', '#ffcc6f']
    for (let i = 0; i < count; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(900 + Math.random() * 300)
      pos.set([v.x, v.y, v.z], i * 3)
      c.set(temps[Math.floor(Math.pow(Math.random(), 0.7) * temps.length)])
      col.set([c.r, c.g, c.b], i * 3)
      mag[i] = Math.pow(Math.random(), 6) // most stars faint, a few bright
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    g.setAttribute('aMag', new THREE.BufferAttribute(mag, 1))
    return g
  }, [count])
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])
  useFrame(({ camera, clock }) => {
    ref.current.position.copy(camera.position)
    mat.current.uniforms.uTime.value = clock.elapsedTime
  })
  return (
    <points ref={ref} geometry={geo} frustumCulled={false} renderOrder={-10}>
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexColors
        vertexShader={/* glsl */ `
          attribute float aMag; uniform float uTime; varying vec3 vC; varying float vA;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            float tw = 0.75 + 0.25 * sin(uTime * (1.0 + aMag * 3.0) + position.x * 0.13);
            gl_PointSize = 1.2 + aMag * 4.5;
            vC = color; vA = (0.35 + aMag * 1.6) * tw;
          }`}
        fragmentShader={/* glsl */ `
          varying vec3 vC; varying float vA;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.0, d);
            gl_FragColor = vec4(vC * vA * a, 1.0);
          }`}
      />
    </points>
  )
}

/* ---------- nebula: layered domain-warped gas, billboarded at depth for parallax ---------- */
function NebulaLayer({ z, scale, seed, tint, strength }: { z: number; scale: number; seed: number; tint: [string, string, string]; strength: number }) {
  const ref = useRef<THREE.Mesh>(null!)
  const mat = useRef<THREE.ShaderMaterial>(null!)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSeed: { value: seed },
      uA: { value: new THREE.Color(tint[0]) },
      uB: { value: new THREE.Color(tint[1]) },
      uC: { value: new THREE.Color(tint[2]) },
      uFade: { value: 1 },
    }),
    [seed, tint],
  )
  useFrame(({ camera, clock }) => {
    ref.current.quaternion.copy(camera.quaternion)
    const s = flight.stage
    mat.current.uniforms.uTime.value = clock.elapsedTime
    mat.current.uniforms.uFade.value = strength * (1 - ss(s, 0.7, 0.88) * 0.85)
  })
  return (
    <mesh ref={ref} position={[0, 0, z]} renderOrder={-9} frustumCulled={false}>
      <planeGeometry args={[scale, scale * 0.62]} />
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={/* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
        fragmentShader={/* glsl */ `
          uniform float uTime, uSeed, uFade; uniform vec3 uA, uB, uC; varying vec2 vUv;
          ${noiseGLSL}
          void main() {
            vec2 p = (vUv - 0.5) * vec2(3.2, 2.0);
            vec3 q = vec3(p, uSeed);
            float t = uTime * 0.012;
            vec3 w = vec3(fbm(q + vec3(0.0, 0.0, t)), fbm(q + vec3(5.2, 1.3, t)), 0.0);
            float n = fbm(q + 1.6 * w + vec3(t));
            float dust = fbm(q * 2.4 + 3.0 * w);
            float d = smoothstep(-0.05, 0.75, n);
            vec3 col = mix(uA, uB, smoothstep(0.1, 0.6, n));
            col = mix(col, uC, smoothstep(0.45, 0.9, w.x + n * 0.5));
            col *= 1.0 - smoothstep(0.1, 0.55, dust) * 0.75; // dark dust lanes
            float edge = smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x) * smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
            float a = d * d * edge * uFade;
            gl_FragColor = vec4(col * a, 1.0);
          }`}
      />
    </mesh>
  )
}

function Nebula() {
  // Narrowband-style palette: deep teal, hydrogen gold, rust. No AI purple.
  return (
    <group>
      <NebulaLayer z={-420} scale={1500} seed={1.7} tint={['#0b3b44', '#c88a3a', '#7a2e1c']} strength={0.55} />
      <NebulaLayer z={-300} scale={1100} seed={4.2} tint={['#0a2a33', '#e0a95a', '#3d6f73']} strength={0.32} />
      <NebulaLayer z={-200} scale={800} seed={8.9} tint={['#071d24', '#b9773a', '#20434a']} strength={0.2} />
    </group>
  )
}

/* ---------- the name that becomes a galaxy ---------- */
const NAME_COUNT = 26000
const GALAXY_EXTRA = 54000

function NameGalaxy() {
  const mat = useRef<THREE.ShaderMaterial>(null!)
  const { viewport, camera, size } = useThree()
  const [points, setPoints] = useState<Float32Array | null>(null)
  // lowest point of the sampled name, so the hero can sit its subtitle just under the real glyphs
  const nameMinY = useMemo(() => {
    if (!points) return 0
    let m = Infinity
    for (let i = 1; i < NAME_COUNT * 3; i += 3) m = Math.min(m, points[i])
    return m
  }, [points])
  const anchor = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    let alive = true
    document.fonts.load('800 200px "Bricolage Grotesque Variable"').finally(() => {
      if (alive) setPoints(sampleText(profile.particleName, NAME_COUNT))
    })
    return () => void (alive = false)
  }, [])

  const geo = useMemo(() => {
    if (!points) return null
    const total = NAME_COUNT + GALAXY_EXTRA
    const g = new THREE.BufferGeometry()
    const aName = new Float32Array(total * 3)
    const aGal = new Float32Array(total * 3)
    const aScat = new Float32Array(total * 3)
    const aData = new Float32Array(total * 4)
    const aCol = new Float32Array(total * 3)
    const core = new THREE.Color('#ffd9a8')
    const arm = new THREE.Color('#a9c8ff')
    const hii = new THREE.Color('#ff8a7a')
    const tmp = new THREE.Color()
    const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5
    for (let i = 0; i < total; i++) {
      const isName = i < NAME_COUNT
      if (isName) {
        aName.set([points[i * 3], points[i * 3 + 1], points[i * 3 + 2]], i * 3)
      } else {
        const v = new THREE.Vector3().randomDirection().multiplyScalar(40 + Math.random() * 120)
        aName.set([v.x, v.y, v.z - 40], i * 3)
      }
      // three-armed logarithmic spiral with a bright bulge
      const r = Math.pow(Math.random(), 1.7) * 48
      const armI = i % 3
      const spread = (0.35 + r * 0.03) * gauss()
      const theta = (armI / 3) * Math.PI * 2 + r * 0.19 + spread
      const thick = (1.4 - Math.min(r, 40) / 40) * 2.2 + 0.25
      aGal.set([Math.cos(theta) * r, gauss() * thick, Math.sin(theta) * r], i * 3)
      const sv = new THREE.Vector3().randomDirection().multiplyScalar(60 + Math.random() * 90)
      aScat.set([sv.x, sv.y, sv.z], i * 3)
      aData.set([Math.random(), isName ? 1 : 0, r, 0.5 + Math.pow(Math.random(), 3) * 2.2], i * 4)
      tmp.copy(core).lerp(arm, Math.min(1, r / 18))
      if (r > 10 && Math.random() < 0.04) tmp.copy(hii)
      aCol.set([tmp.r, tmp.g, tmp.b], i * 3)
    }
    g.setAttribute('position', new THREE.BufferAttribute(aName, 3))
    g.setAttribute('aGalaxy', new THREE.BufferAttribute(aGal, 3))
    g.setAttribute('aScatter', new THREE.BufferAttribute(aScat, 3))
    g.setAttribute('aData', new THREE.BufferAttribute(aData, 4))
    g.setAttribute('aColor', new THREE.BufferAttribute(aCol, 3))
    return g
  }, [points])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntro: { value: 0 },
      uMorph: { value: 0 },
      uNameScale: { value: 1 },
      uNameLift: { value: 0 },
      uMouse: { value: new THREE.Vector3(999, 999, 0) },
      uMouseOn: { value: 0 },
      uBurst: { value: 0 },
      uPixel: { value: 1 },
      uFade: { value: 1 },
    }),
    [],
  )

  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), [])
  const ray = useMemo(() => new THREE.Raycaster(), [])
  const ndc = useMemo(() => new THREE.Vector2(), [])

  useFrame(({ clock, gl }, dt) => {
    if (!mat.current) return
    const u = mat.current.uniforms
    const s = flight.stage
    world.intro = flight.reduced ? 1 : Math.min(1, world.intro + dt / 2.6)
    u.uTime.value = clock.elapsedTime
    u.uIntro.value = world.intro
    u.uMorph.value = ss(s, 0.06, 0.26)
    u.uNameScale.value = Math.min(1.13, viewport.aspect / 1.15)
    u.uNameLift.value = viewport.aspect < 0.9 ? 4 : 2.2
    // project the name's lower edge to screen space while the hero is on screen (any aspect ratio, any device);
    // at the very top the stage already reads ~0.07 because it is measured at mid-viewport
    if (points && s < 0.12) {
      anchor.set(0, nameMinY * u.uNameScale.value + u.uNameLift.value, 0).project(camera)
      flight.nameBottom = ((1 - anchor.y) / 2) * size.height
    }
    u.uPixel.value = gl.getPixelRatio()
    // step the galaxy back while the project list is on screen so the type stays crisp
    const workDim = ss(s, 0.3, 0.38) * (1 - ss(s, 0.55, 0.62))
    u.uFade.value = (1 - ss(s, 0.78, 0.92)) * (1 - workDim * 0.65)
    // cursor in world space on the name plane
    ndc.set(flight.pointer.x, -flight.pointer.y)
    ray.setFromCamera(ndc, camera)
    ray.ray.intersectPlane(plane, world.mouse)
    u.uMouse.value.lerp(world.mouse, 0.2)
    // no pointer yet (or a touch device between drags): the name stays whole instead of being pushed from screen centre
    world.mouseOn += ((flight.reduced || !flight.pointerActive ? 0 : 1) - world.mouseOn) * 0.05
    u.uMouseOn.value = world.mouseOn
    world.burst *= 0.94
    u.uBurst.value = world.burst
  })

  if (!geo) return null
  return (
    <points geometry={geo} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          uniform float uTime, uIntro, uMorph, uNameScale, uNameLift, uMouseOn, uBurst, uPixel, uFade;
          uniform vec3 uMouse;
          attribute vec3 aGalaxy; attribute vec3 aScatter; attribute vec4 aData; attribute vec3 aColor;
          varying vec3 vColor; varying float vAlpha;
          mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
          void main() {
            float rnd = aData.x; float isName = aData.y; float gr = aData.z;
            // 1. intro: particles fall out of the dark into the name
            float ti = smoothstep(rnd * 0.55, rnd * 0.55 + 0.45, uIntro);
            vec3 name = position * vec3(uNameScale, uNameScale, 1.0) + vec3(0.0, uNameLift * isName, 0.0);
            name += vec3(sin(uTime * 0.9 + rnd * 40.0), cos(uTime * 0.7 + rnd * 31.0), sin(uTime * 0.6 + rnd * 17.0)) * 0.07;
            if (isName < 0.5) name.xy = rot(uTime * 0.01 * (rnd - 0.5)) * name.xy;
            vec3 p1 = mix(aScatter, name, ti);
            // 2. cursor: particles part around the pointer like gas around a probe
            vec2 d = p1.xy - uMouse.xy;
            float f = exp(-dot(d, d) / 14.0) * uMouseOn * isName;
            p1.xy += normalize(d + 1e-4) * f * 3.2;
            p1.z += f * 4.0 * (rnd - 0.5);
            // click burst
            p1 += normalize(p1 + vec3(0.001)) * uBurst * (4.0 + rnd * 10.0) * isName;
            // 3. scroll: the name unravels into a spiral galaxy with differential rotation
            vec3 g = aGalaxy;
            g.xz = rot(uTime * 0.35 / (1.0 + gr * 0.12)) * g.xz;
            float tm = smoothstep(rnd * 0.45, rnd * 0.45 + 0.55, uMorph);
            vec3 p = mix(p1, g, tm);
            // a little swirl while morphing
            p.xz = rot(sin(tm * 3.14159) * (1.2 + rnd)) * p.xz;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            float size = aData.w * mix(1.0, 0.9, tm);
            gl_PointSize = size * uPixel * (34.0 / -mv.z) * 3.0;
            vec3 nameCol = mix(vec3(1.0, 0.93, 0.82), vec3(1.0, 0.78, 0.45), rnd * rnd);
            vColor = mix(isName > 0.5 ? nameCol : aColor * 0.8, aColor, tm);
            float baseA = isName > 0.5 ? 0.85 : 0.14;
            vAlpha = mix(baseA * mix(0.4, 1.0, uNameScale), 0.75, tm) * mix(0.25, 1.0, ti) * uFade;
          }`}
        fragmentShader={/* glsl */ `
          varying vec3 vColor; varying float vAlpha;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = exp(-d * d * 22.0);
            gl_FragColor = vec4(vColor * a * vAlpha, 1.0);
          }`}
      />
    </points>
  )
}

/* ---------- interstellar dust drifting past the lens; streaks with scroll speed ---------- */
function Dust({ count = 1600 }) {
  const ref = useRef<THREE.Points>(null!)
  const mat = useRef<THREE.ShaderMaterial>(null!)
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) pos.set([(Math.random() - 0.5) * 80, (Math.random() - 0.5) * 50, Math.random() * -60], i * 3)
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [count])
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uTravel: { value: 0 }, uPixel: { value: 1 } }), [])
  const travel = useRef(0)
  useFrame(({ camera, clock, gl }, dt) => {
    ref.current.position.copy(camera.position)
    ref.current.quaternion.copy(camera.quaternion)
    travel.current += (2 + Math.abs(flight.velocity) * 1.6) * dt * (flight.reduced ? 0 : 1)
    mat.current.uniforms.uTime.value = clock.elapsedTime
    mat.current.uniforms.uTravel.value = travel.current
    mat.current.uniforms.uPixel.value = gl.getPixelRatio()
  })
  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          uniform float uTravel, uPixel; varying float vA;
          void main() {
            vec3 p = position;
            p.z = mod(p.z + uTravel, 60.0) - 60.0;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = uPixel * 14.0 / -mv.z;
            vA = smoothstep(-60.0, -40.0, p.z) * smoothstep(-1.0, -8.0, p.z) * 0.5;
          }`}
        fragmentShader={/* glsl */ `
          varying float vA;
          void main() { float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vec3(0.9, 0.85, 0.75) * smoothstep(0.5, 0.0, d) * vA, 1.0); }`}
      />
    </points>
  )
}

/* ---------- black hole: ray-marched Schwarzschild lensing with a Doppler-beamed disk ---------- */
function BlackHole() {
  const mat = useRef<THREE.ShaderMaterial>(null!)
  const mesh = useRef<THREE.Mesh>(null!)
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uFade: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uLook: { value: new THREE.Vector2() } }),
    [],
  )
  const look = useRef(new THREE.Vector2())
  useFrame(({ clock, size }) => {
    const fade = ss(flight.stage, 0.76, 0.88)
    mesh.current.visible = fade > 0.002
    const u = mat.current.uniforms
    u.uFade.value = fade
    u.uTime.value = clock.elapsedTime
    u.uRes.value.set(size.width, size.height)
    look.current.lerp(new THREE.Vector2(flight.reduced ? 0 : flight.pointer.x, flight.reduced ? 0 : flight.pointer.y), 0.03)
    u.uLook.value.copy(look.current)
  })
  return (
    <mesh ref={mesh} frustumCulled={false} renderOrder={20}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        transparent
        depthTest={false}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={/* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`}
        fragmentShader={/* glsl */ `
          uniform float uTime, uFade; uniform vec2 uRes, uLook; varying vec2 vUv;
          ${noiseGLSL}
          float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
          vec3 starfield(vec3 d) {
            vec3 g = d * 160.0;
            vec3 id = floor(g);
            float h = hash(id);
            float core = smoothstep(0.22, 0.0, length(fract(g) - 0.5));
            float s = step(0.986, h) * core * (0.4 + 2.2 * pow(fract(h * 91.7), 4.0));
            return vec3(s) * mix(vec3(0.7, 0.8, 1.0), vec3(1.0, 0.85, 0.65), fract(h * 13.1));
          }
          void main() {
            vec2 uv = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
            // camera slightly above the disk plane, drifting with the cursor
            float yaw = uLook.x * 0.35 + uTime * 0.02;
            float pitch = 0.12 + uLook.y * 0.06;
            vec3 ro = vec3(sin(yaw) * 26.0, 26.0 * sin(pitch), -cos(yaw) * 26.0);
            vec3 fw = normalize(-ro);
            vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw));
            vec3 up = cross(fw, rt);
            vec3 rd = normalize(fw * 1.6 + uv.x * rt + uv.y * up);
            // shift the hole right on wide screens so text sits left
            ro += rt * (uRes.x > 900.0 ? -8.0 : 0.0);

            vec3 p = ro; vec3 v = rd;
            float h2 = pow(length(cross(p, v)), 2.0);
            vec3 col = vec3(0.0); float a = 0.0; bool hit = false;
            for (int i = 0; i < 160; i++) {
              float r2 = dot(p, p);
              if (r2 < 1.0) { hit = true; break; }
              if (r2 > 1600.0) break;
              float dt = 0.07 * max(1.0, sqrt(r2) * 0.5);
              vec3 acc = -1.5 * h2 * p / pow(r2, 2.5);
              vec3 pp = p;
              v += acc * dt; p += v * dt;
              if (pp.y * p.y < 0.0) {
                vec3 q = mix(pp, p, pp.y / (pp.y - p.y));
                float rq = length(q.xz);
                if (rq > 2.4 && rq < 9.5) {
                  float ang = atan(q.z, q.x);
                  float spin = uTime * 1.6 / pow(rq, 1.5);
                  float n = fbm(vec3(rq * 1.8, cos(ang - spin) * 2.0, sin(ang - spin) * 2.0));
                  float rings = 0.6 + 0.4 * sin(rq * 9.0 + n * 6.0);
                  float temp = 1.0 - smoothstep(2.4, 9.5, rq);
                  vec3 c = mix(vec3(0.9, 0.32, 0.08), vec3(1.0, 0.86, 0.62), temp);
                  c = mix(c, vec3(1.0, 0.97, 0.92), pow(temp, 3.0));
                  // relativistic beaming: the approaching side is brighter
                  vec3 orbit = normalize(vec3(-q.z, 0.0, q.x));
                  float beam = pow(1.0 + 0.55 * dot(orbit, -normalize(v)), 3.0);
                  float edge = smoothstep(2.4, 3.0, rq) * smoothstep(9.5, 6.5, rq);
                  float da = clamp(edge * (0.35 + 0.65 * n) * rings * 1.4, 0.0, 1.0);
                  col += (1.0 - a) * c * da * min(beam, 3.0) * 0.85;
                  a += (1.0 - a) * da;
                }
              }
            }
            if (!hit) col += (1.0 - a) * starfield(normalize(v));
            col = col / (1.0 + col * 0.35); // soft filmic shoulder so the disk never clips to white
            gl_FragColor = vec4(col, uFade);
            #include <colorspace_fragment>
          }`}
      />
    </mesh>
  )
}

/* ---------- camera path ---------- */
const CX: Key[] = [[0, 0], [0.1, 0], [0.26, -26], [0.45, -26], [0.62, 0], [1, 0]]
const CY: Key[] = [[0, 0], [0.1, 6], [0.26, 58], [0.45, 30], [0.62, 16], [1, 10]]
const CZ: Key[] = [[0, 62], [0.1, 60], [0.26, 38], [0.45, 72], [0.62, 118], [1, 170]]
const LX: Key[] = [[0, 0], [0.1, 0], [0.26, -26], [0.45, 14], [0.62, 0]]

function Rig() {
  const look = useMemo(() => new THREE.Vector3(), [])
  const p = useRef({ x: 0, y: 0 })
  useFrame(({ camera, clock }) => {
    const s = flight.stage
    const red = flight.reduced
    p.current.x += ((red ? 0 : flight.pointer.x) - p.current.x) * 0.03
    p.current.y += ((red ? 0 : flight.pointer.y) - p.current.y) * 0.03
    const breathe = red ? 0 : Math.sin(clock.elapsedTime * 0.25) * 0.6
    camera.position.set(curve(CX, s) + p.current.x * 3, curve(CY, s) - p.current.y * 2 + breathe, curve(CZ, s))
    look.set(curve(LX, s), 2 * (1 - ss(s, 0, 0.2)), 0)
    camera.lookAt(look)
    const cam = camera as THREE.PerspectiveCamera
    const fov = 45 + (red ? 0 : Math.min(Math.abs(flight.velocity) * 0.07, 7))
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov += (fov - cam.fov) * 0.12
      cam.updateProjectionMatrix()
    }
  })
  return null
}

/* click anywhere in the hero to scatter the name */
function useBurst() {
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (flight.stage > 0.05) return
      if ((e.target as HTMLElement).closest('a,button,input,[role=dialog]')) return
      world.burst = 1
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [])
}

export default function SpaceScene() {
  useBurst()
  // Adaptive quality: drop resolution on slower GPUs so motion stays smooth, raise it back if there is headroom.
  const [dpr, setDpr] = useState(1.5)
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <Canvas
        dpr={dpr}
        camera={{ fov: 45, near: 0.5, far: 3000, position: [0, 0, 62] }}
        gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
        onCreated={({ gl }) => gl.setClearColor('#030409')}
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} flipflops={3} onFallback={() => setDpr(1)} />
        <Rig />
        <Stars />
        <Nebula />
        <NameGalaxy />
        <Dust />
        <BlackHole />
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={1.15} luminanceThreshold={0.18} luminanceSmoothing={0.3} radius={0.75} />
          <Noise opacity={0.045} premultiply />
          <Vignette offset={0.25} darkness={0.75} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
