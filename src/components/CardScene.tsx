import { useEffect, useMemo, MutableRefObject } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { Card3D } from './Card3D'
import { type CardSettings } from '@/types'

/* ─── Background sphere ──────────────────────────────────────────── */
function SceneBackground() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512; canvas.height = 512
    const ctx = canvas.getContext('2d')!
    const grad = ctx.createRadialGradient(256, 256, 0, 256, 256, 390)
    grad.addColorStop(0,   '#f8f8fc')
    grad.addColorStop(0.5, '#f0f0f6')
    grad.addColorStop(1,   '#e4e4ee')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 512, 512)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])

  return (
    <mesh name="scene-bg">
      <sphereGeometry args={[28, 32, 32]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  )
}

/* ─── Custom gradient environment (no studio panels) ─────────────── */
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

/* ─── CardScene ──────────────────────────────────────────────────── */
export interface CardSceneProps {
  settings:  CardSettings
  tilt:      { x: number; y: number }
  glRef:     MutableRefObject<THREE.WebGLRenderer | null>
  sceneRef:  MutableRefObject<THREE.Scene | null>
  cameraRef: MutableRefObject<THREE.Camera | null>
}

export function CardScene({ settings, tilt, glRef, sceneRef, cameraRef }: CardSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.4], fov: 42, near: 0.1, far: 100 }}
      gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
      dpr={[1, 2]}
      shadows
    >
      {/* Named group — hidden during transparent export */}
      <group name="bg-layers">
        <SceneBackground />
        <ContactShadows
          position={[0, -1.75, 0]}
          opacity={0.16}
          scale={8}
          blur={3.5}
          far={2.8}
          color="#8888aa"
        />
      </group>

      <Lighting intensity={settings.lightIntensity} />
      <GradientEnvironment />
      <Card3D settings={settings} tilt={tilt} />

      <SceneHelper glRef={glRef} sceneRef={sceneRef} cameraRef={cameraRef} />
    </Canvas>
  )
}
