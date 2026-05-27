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
    grad.addColorStop(0,    '#f8f8fc')
    grad.addColorStop(0.5,  '#f0f0f6')
    grad.addColorStop(1,    '#e4e4ee')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 512, 512)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])

  return (
    <mesh>
      <sphereGeometry args={[28, 32, 32]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  )
}

/* ─── Custom gradient environment (no studio panels) ─────────────── *
   Texture équirectangulaire peinte sur canvas :
   - fond gris clair neutre
   - point lumineux principal en haut à droite → reflet key light sur métal
   - fill doux en haut à gauche (légèrement bleuté)
   - rim subtil à l'arrière-gauche
   Résultat : reflections propres, gradient, sans aucune structure visible.
──────────────────────────────────────────────────────────────────── */
function GradientEnvironment() {
  const envMap = useMemo(() => {
    const W = 1024, H = 512
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')!

    // Base
    const base = ctx.createLinearGradient(0, 0, 0, H)
    base.addColorStop(0,   '#f0f0f8')
    base.addColorStop(0.5, '#e6e6f0')
    base.addColorStop(1,   '#d8d8e8')
    ctx.fillStyle = base
    ctx.fillRect(0, 0, W, H)

    // Key light — tache lumineuse haute-droite
    const key = ctx.createRadialGradient(W * 0.68, H * 0.06, 0, W * 0.68, H * 0.06, W * 0.44)
    key.addColorStop(0,    'rgba(255,255,255,0.95)')
    key.addColorStop(0.35, 'rgba(255,255,255,0.35)')
    key.addColorStop(1,    'rgba(255,255,255,0)')
    ctx.fillStyle = key
    ctx.fillRect(0, 0, W, H)

    // Fill light — haute-gauche, bleuté
    const fill = ctx.createRadialGradient(W * 0.08, H * 0.18, 0, W * 0.08, H * 0.18, W * 0.38)
    fill.addColorStop(0,  'rgba(190,210,255,0.5)')
    fill.addColorStop(1,  'rgba(190,210,255,0)')
    ctx.fillStyle = fill
    ctx.fillRect(0, 0, W, H)

    // Rim — arrière-gauche (opposite key)
    const rim = ctx.createRadialGradient(W * 0.1, H * 0.38, 0, W * 0.1, H * 0.38, W * 0.28)
    rim.addColorStop(0, 'rgba(215,222,255,0.32)')
    rim.addColorStop(1, 'rgba(215,222,255,0)')
    ctx.fillStyle = rim
    ctx.fillRect(0, 0, W, H)

    // Léger halo bas-centre (bounce sol)
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

/* ─── Export helper ──────────────────────────────────────────────── */
function ExportHelper({ glRef }: { glRef: MutableRefObject<THREE.WebGLRenderer | null> }) {
  const { gl } = useThree()
  useEffect(() => { glRef.current = gl }, [gl, glRef])
  return null
}

/* ─── Lighting ───────────────────────────────────────────────────── *
   3-point setup classique, équilibré pour les 3 finitions.
   L'intensité scale tous les niveaux.
──────────────────────────────────────────────────────────────────── */
function Lighting({ intensity: i }: { intensity: number }) {
  return (
    <>
      {/* Ambiance générale — très douce */}
      <ambientLight intensity={0.55 * i} color="#f2f2ff" />

      {/* Key — principale, haut-droite devant, blanc pur */}
      <directionalLight position={[5, 9, 5]} intensity={1.2 * i} color="#ffffff" />

      {/* Fill — gauche, deux fois moins fort, légèrement froid */}
      <directionalLight position={[-5, 3, 4]} intensity={0.3 * i} color="#dce8ff" />

      {/* Rim / séparation — depuis l'arrière haut */}
      <directionalLight position={[1, 5, -7]} intensity={0.2 * i} color="#eeeeff" />

      {/* Bounce sol — chaleur très subtile */}
      <pointLight position={[0, -2.5, 3]} intensity={0.12 * i} color="#fff6ee" decay={2} />
    </>
  )
}

/* ─── CardScene ──────────────────────────────────────────────────── */
interface CardSceneProps {
  settings: CardSettings
  tilt: { x: number; y: number }
  glRef: MutableRefObject<THREE.WebGLRenderer | null>
}

export function CardScene({ settings, tilt, glRef }: CardSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.4], fov: 42, near: 0.1, far: 100 }}
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      dpr={[1, 2]}
      shadows
    >
      <SceneBackground />
      <Lighting intensity={settings.lightIntensity} />
      <GradientEnvironment />
      <Card3D settings={settings} tilt={tilt} />

      <ContactShadows
        position={[0, -1.75, 0]}
        opacity={0.16}
        scale={8}
        blur={3.5}
        far={2.8}
        color="#8888aa"
      />

      <ExportHelper glRef={glRef} />
    </Canvas>
  )
}
