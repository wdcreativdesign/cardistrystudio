import { useEffect, useRef, useMemo, MutableRefObject } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { Card3D } from './Card3D'
import { type CardSettings, type CameraMode } from '@/types'

/* ─── Background (flat color, unaffected by lighting) ───────────── */
function SceneBackground({ color }: { color: string }) {
  const { scene } = useThree()
  useEffect(() => {
    const bg = new THREE.Color(color)
    scene.background = bg
    return () => { scene.background = null }
  }, [color, scene])
  return null
}

/* ─── Custom gradient environment ────────────────────────────────── */
function GradientEnvironment() {
  const envMap = useMemo(() => {
    const W = 2048, H = 1024
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')!

    // Base sky — cool blue-white gradient
    const base = ctx.createLinearGradient(0, 0, 0, H)
    base.addColorStop(0,   '#eeeef8')
    base.addColorStop(0.4, '#e4e4f0')
    base.addColorStop(1,   '#d0d0e4')
    ctx.fillStyle = base
    ctx.fillRect(0, 0, W, H)

    // Primary key — bright studio light top-right
    const key = ctx.createRadialGradient(W * 0.70, H * 0.04, 0, W * 0.70, H * 0.04, W * 0.52)
    key.addColorStop(0,    'rgba(255,255,255,1.0)')
    key.addColorStop(0.12, 'rgba(255,255,255,0.95)')
    key.addColorStop(0.32, 'rgba(255,255,255,0.5)')
    key.addColorStop(0.6,  'rgba(255,255,255,0.18)')
    key.addColorStop(1,    'rgba(255,255,255,0)')
    ctx.fillStyle = key
    ctx.fillRect(0, 0, W, H)

    // Specular hot-spot — tight bright core for sharp reflections
    const hotspot = ctx.createRadialGradient(W * 0.68, H * 0.03, 0, W * 0.68, H * 0.03, W * 0.12)
    hotspot.addColorStop(0,   'rgba(255,255,255,1.0)')
    hotspot.addColorStop(0.5, 'rgba(255,255,255,0.6)')
    hotspot.addColorStop(1,   'rgba(255,255,255,0)')
    ctx.fillStyle = hotspot
    ctx.fillRect(0, 0, W, H)

    // Fill light — soft blue left side
    const fill = ctx.createRadialGradient(W * 0.06, H * 0.16, 0, W * 0.06, H * 0.16, W * 0.45)
    fill.addColorStop(0, 'rgba(180,205,255,0.65)')
    fill.addColorStop(0.5, 'rgba(180,205,255,0.2)')
    fill.addColorStop(1, 'rgba(180,205,255,0)')
    ctx.fillStyle = fill
    ctx.fillRect(0, 0, W, H)

    // Rim light — cool blue-white from behind-left
    const rim = ctx.createRadialGradient(W * 0.08, H * 0.35, 0, W * 0.08, H * 0.35, W * 0.30)
    rim.addColorStop(0, 'rgba(210,220,255,0.45)')
    rim.addColorStop(1, 'rgba(210,220,255,0)')
    ctx.fillStyle = rim
    ctx.fillRect(0, 0, W, H)

    // Ground bounce — warm tone from below
    const bounce = ctx.createRadialGradient(W * 0.5, H * 0.92, 0, W * 0.5, H * 0.92, W * 0.35)
    bounce.addColorStop(0, 'rgba(248,242,225,0.30)')
    bounce.addColorStop(1, 'rgba(248,242,225,0)')
    ctx.fillStyle = bounce
    ctx.fillRect(0, 0, W, H)

    const tex = new THREE.CanvasTexture(canvas)
    tex.mapping    = THREE.EquirectangularReflectionMapping
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])

  useEffect(() => () => { envMap.dispose() }, [envMap])

  return <Environment map={envMap} />
}

/* ─── Enable layer 1 on main camera (SelectionDots sont sur layer 1) */
function EnableLayer1() {
  const { camera } = useThree()
  useEffect(() => { camera.layers.enable(1) }, [camera])
  return null
}

/* ─── ACES filmic tone mapping ───────────────────────────────────── */
function ToneMapping() {
  const { gl } = useThree()
  useEffect(() => {
    gl.toneMapping         = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.05
    // Ensure WebGL clears to fully transparent so CSS gradients show through
    gl.setClearColor(new THREE.Color(0x000000), 0)
    gl.domElement.style.background = 'transparent'
  }, [gl])
  return null
}

/* ─── Scene helper — exposes gl / scene / camera refs ───────────── */
function SceneHelper({
  glRef,
  sceneRef,
  cameraRef,
}: {
  glRef:     MutableRefObject<THREE.WebGLRenderer | null>
  sceneRef:  MutableRefObject<THREE.Scene | null>
  cameraRef: MutableRefObject<THREE.Camera | null>
}) {
  const { gl, scene, camera } = useThree()
  useEffect(() => {
    glRef.current     = gl
    sceneRef.current  = scene
    cameraRef.current = camera
  }, [gl, scene, camera, glRef, sceneRef, cameraRef])
  return null
}

/* ─── Lighting ───────────────────────────────────────────────────── */
function Lighting({ intensity: i }: { intensity: number }) {
  return (
    <>
      {/* Ambient — slightly dimmer so specular stands out more */}
      <ambientLight intensity={0.42 * i} color="#f0f0ff" />
      {/* Key light — strong, top-right, matches env map hot-spot */}
      <directionalLight position={[5, 9, 5]}   intensity={1.6 * i}  color="#ffffff"  castShadow />
      {/* Fill — soft blue from left */}
      <directionalLight position={[-6, 3, 4]}  intensity={0.38 * i} color="#d8e8ff" />
      {/* Rim — cool backlight */}
      <directionalLight position={[1, 4, -8]}  intensity={0.22 * i} color="#e8eeff" />
      {/* Front specular accent — tight point light */}
      <pointLight       position={[2.5, 4, 6]}  intensity={0.55 * i} color="#ffffff"  decay={2} />
      {/* Ground warm bounce */}
      <pointLight       position={[0, -2.5, 3]} intensity={0.08 * i} color="#fff4e0"  decay={2} />
    </>
  )
}

/* ─── Camera controller — true ortho swap + FOV compensation ──────── */

const DEG     = Math.PI / 180
const BASE_FOV = 42
/** Base camera Z at reference FOV (42°), per card count */
const BASE_Z: Record<number, number> = { 1: 5.4, 2: 8.5, 3: 12.0 }

function CameraController({
  fov,
  mode,
  count,
}: {
  fov:   number
  mode:  CameraMode
  count: number
}) {
  const { camera, set, size } = useThree()

  /* Keep one instance of each camera type across renders */
  const perspRef = useRef<THREE.PerspectiveCamera | null>(null)
  const orthoRef = useRef<THREE.OrthographicCamera | null>(null)

  const baseZ  = BASE_Z[count] ?? 5.4
  /** Perspective: compensate Z so card stays the same visual size at any FOV */
  const perspZ = baseZ * Math.tan(BASE_FOV / 2 * DEG) / Math.tan(fov / 2 * DEG)
  /** Ortho: frustum half-height = visible world height at base camera distance */
  const halfH  = Math.tan(BASE_FOV / 2 * DEG) * baseZ
  const halfW  = halfH * (size.width / size.height)

  /* ── Capture the canvas's initial PerspectiveCamera once ── */
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera && !perspRef.current) {
      perspRef.current = camera
    }
  }, [camera])

  /* ── Smooth Z lerp (perspective only, handled in rAF) ── */
  useFrame(() => {
    if (mode === 'perspective') {
      camera.position.z += (perspZ - camera.position.z) * 0.07
    }
  })

  /* ── FOV update for perspective camera ── */
  useEffect(() => {
    const cam = perspRef.current
    if (!cam) return
    cam.fov = fov
    cam.updateProjectionMatrix()
  }, [fov])

  /* ── Swap camera type / update ortho frustum ── */
  useEffect(() => {
    if (mode === 'isometric') {
      if (!orthoRef.current) {
        /* Create the orthographic camera once */
        const ortho = new THREE.OrthographicCamera(
          -halfW, halfW, halfH, -halfH, 0.1, 500,
        )
        ortho.position.set(0, 0, 50)
        orthoRef.current = ortho
      } else {
        /* Update frustum on resize or card-count change */
        orthoRef.current.left   = -halfW
        orthoRef.current.right  =  halfW
        orthoRef.current.top    =  halfH
        orthoRef.current.bottom = -halfH
        orthoRef.current.updateProjectionMatrix()
      }
      set({ camera: orthoRef.current })
    } else {
      /* Restore the perspective camera */
      const cam = perspRef.current
      if (cam) {
        cam.position.z = perspZ   // snap to correct distance for current count/fov
        set({ camera: cam })
      }
    }
  }, [mode, halfW, halfH, set]) // halfW/H change with count+size, perspZ not needed here

  return null
}

/* ─── Card X positions per count ────────────────────────────────── */
const CARD_POSITIONS: Record<number, number[]> = {
  1: [0],
  2: [-1.4, 1.4],
  3: [-2.8, 0, 2.8],
}

/* ─── Types ──────────────────────────────────────────────────────── */
export interface DisplayedPage {
  id:       string
  settings: CardSettings
  isActive: boolean
}

export interface CardSceneProps {
  displayedPages: DisplayedPage[]
  displayCount:   1 | 2 | 3
  tilt:      { x: number; y: number }
  glRef:     MutableRefObject<THREE.WebGLRenderer | null>
  sceneRef:  MutableRefObject<THREE.Scene | null>
  cameraRef: MutableRefObject<THREE.Camera | null>
  onReady?:  () => void
}

/* ─── CardScene ──────────────────────────────────────────────────── */
export function CardScene({ displayedPages, displayCount, tilt, glRef, sceneRef, cameraRef, onReady }: CardSceneProps) {
  // Scene-level settings from the active card (or fallback to first)
  const activePage = displayedPages.find((p) => p.isActive) ?? displayedPages[0]
  const bgColor        = activePage?.settings.bgColor        ?? '#1d1d1d'
  const lightIntensity = activePage?.settings.lightIntensity ?? 1.15
  const cameraFov      = activePage?.settings.cameraFov      ?? 42
  const cameraMode     = activePage?.settings.cameraMode     ?? 'perspective'

  const positions = CARD_POSITIONS[displayCount] ?? [0]

  // Contact shadow scale grows with card count
  const shadowScale = displayCount === 1 ? 8 : displayCount === 2 ? 14 : 20

  return (
    <Canvas
      camera={{ position: [0, 0, 5.4], fov: 42, near: 0.1, far: 500 }}
      gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
      dpr={[1, 2]}
      shadows
      onCreated={() => requestAnimationFrame(() => onReady?.())}
    >
      {/* Background sphere — hidden during transparent export */}
      <group name="bg-layers">
        {bgColor !== 'transparent'
          && !bgColor.startsWith('linear-gradient')
          && !bgColor.startsWith('radial-gradient')
          && <SceneBackground color={bgColor} />
        }
      </group>

      {/* Contact shadow — independently togglable during export */}
      <group name="shadow-layer">
        <ContactShadows
          position={[0, -1.75, 0]}
          opacity={0.22}
          scale={shadowScale}
          blur={2.2}
          far={2.8}
          color="#000000"
        />
      </group>

      <EnableLayer1 />
      <ToneMapping />
      <Lighting intensity={lightIntensity} />
      <GradientEnvironment />

      {/* ── One Card3D per displayed page, spread along X axis + per-card offset ── */}
      {displayedPages.map((page, i) => (
        <group
          key={page.id}
          position={[
            (positions[i] ?? 0) + (page.settings.posX ?? 0),
            page.settings.posY ?? 0,
            page.settings.posZ ?? 0,
          ]}
        >
          <Card3D
            settings={page.settings}
            tilt={tilt}
            isActive={displayedPages.length > 1 && page.isActive}
          />
        </group>
      ))}

      <CameraController fov={cameraFov} mode={cameraMode} count={displayCount} />
      <SceneHelper glRef={glRef} sceneRef={sceneRef} cameraRef={cameraRef} />
    </Canvas>
  )
}
