import { useEffect, useMemo, MutableRefObject } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { Card3D } from './Card3D'
import { type CardSettings } from '@/types'

/* ─── Background sphere ──────────────────────────────────────────── */
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return { r, g, b }
}

function lighten(hex: string, amount = 0.12) {
  const { r, g, b } = hexToRgb(hex)
  const toHex = (v: number) => Math.round(Math.min(1, v + amount) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function SceneBackground({ color }: { color: string }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512; canvas.height = 512
    const ctx = canvas.getContext('2d')!
    const light = lighten(color, 0.1)
    const grad = ctx.createRadialGradient(256, 256, 0, 256, 256, 390)
    grad.addColorStop(0,   light)
    grad.addColorStop(0.6, color)
    grad.addColorStop(1,   color)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 512, 512)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [color])

  return (
    <mesh name="scene-bg">
      <sphereGeometry args={[28, 32, 32]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  )
}

/* ─── Custom gradient environment ────────────────────────────────── */
function GradientEnvironment() {
  const envMap = useMemo(() => {
    const W = 1024, H = 512
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')!

    const base = ctx.createLinearGradient(0, 0, 0, H)
    base.addColorStop(0,   '#f0f0f8')
    base.addColorStop(0.5, '#e6e6f0')
    base.addColorStop(1,   '#d8d8e8')
    ctx.fillStyle = base
    ctx.fillRect(0, 0, W, H)

    const key = ctx.createRadialGradient(W * 0.68, H * 0.06, 0, W * 0.68, H * 0.06, W * 0.44)
    key.addColorStop(0,    'rgba(255,255,255,0.95)')
    key.addColorStop(0.35, 'rgba(255,255,255,0.35)')
    key.addColorStop(1,    'rgba(255,255,255,0)')
    ctx.fillStyle = key
    ctx.fillRect(0, 0, W, H)

    const fill = ctx.createRadialGradient(W * 0.08, H * 0.18, 0, W * 0.08, H * 0.18, W * 0.38)
    fill.addColorStop(0, 'rgba(190,210,255,0.5)')
    fill.addColorStop(1, 'rgba(190,210,255,0)')
    ctx.fillStyle = fill
    ctx.fillRect(0, 0, W, H)

    const rim = ctx.createRadialGradient(W * 0.1, H * 0.38, 0, W * 0.1, H * 0.38, W * 0.28)
    rim.addColorStop(0, 'rgba(215,222,255,0.32)')
    rim.addColorStop(1, 'rgba(215,222,255,0)')
    ctx.fillStyle = rim
    ctx.fillRect(0, 0, W, H)

    const bounce = ctx.createRadialGradient(W * 0.5, H * 0.88, 0, W * 0.5, H * 0.88, W * 0.28)
    bounce.addColorStop(0, 'rgba(245,240,230,0.22)')
    bounce.addColorStop(1, 'rgba(245,240,230,0)')
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
      <ambientLight intensity={0.55 * i} color="#f2f2ff" />
      <directionalLight position={[5, 9, 5]}   intensity={1.2 * i}  color="#ffffff" />
      <directionalLight position={[-5, 3, 4]}  intensity={0.3 * i}  color="#dce8ff" />
      <directionalLight position={[1, 5, -7]}  intensity={0.2 * i}  color="#eeeeff" />
      <pointLight       position={[0, -2.5, 3]} intensity={0.12 * i} color="#fff6ee" decay={2} />
    </>
  )
}

/* ─── Camera rig — smooth zoom based on card count ───────────────── */
const CAMERA_Z: Record<number, number> = { 1: 5.4, 2: 8.5, 3: 12.0 }

function CameraRig({ count }: { count: number }) {
  const { camera } = useThree()
  const targetZ = CAMERA_Z[count] ?? 5.4
  useFrame(() => {
    camera.position.z += (targetZ - camera.position.z) * 0.07
  })
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
}

/* ─── CardScene ──────────────────────────────────────────────────── */
export function CardScene({ displayedPages, displayCount, tilt, glRef, sceneRef, cameraRef }: CardSceneProps) {
  // Scene-level settings from the active card (or fallback to first)
  const activePage = displayedPages.find((p) => p.isActive) ?? displayedPages[0]
  const bgColor       = activePage?.settings.bgColor       ?? '#f0f0f5'
  const lightIntensity = activePage?.settings.lightIntensity ?? 1.15

  const positions = CARD_POSITIONS[displayCount] ?? [0]

  // Contact shadow scale grows with card count
  const shadowScale = displayCount === 1 ? 8 : displayCount === 2 ? 14 : 20

  return (
    <Canvas
      camera={{ position: [0, 0, 5.4], fov: 42, near: 0.1, far: 100 }}
      gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
      dpr={[1, 2]}
      shadows
    >
      {/* Named group — hidden during transparent export */}
      <group name="bg-layers">
        {bgColor !== 'transparent'
          && !bgColor.startsWith('linear-gradient')
          && !bgColor.startsWith('radial-gradient')
          && <SceneBackground color={bgColor} />
        }
        <ContactShadows
          position={[0, -1.75, 0]}
          opacity={0.16}
          scale={shadowScale}
          blur={3.5}
          far={2.8}
          color="#8888aa"
        />
      </group>

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

      <CameraRig count={displayCount} />
      <SceneHelper glRef={glRef} sceneRef={sceneRef} cameraRef={cameraRef} />
    </Canvas>
  )
}
