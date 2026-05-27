import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { type CardSettings, type Orientation, FINISH_CONFIGS } from '@/types'

/* ─── Dimensions exactes ISO 7810 ID-1 ──────────────────────────────
   Largeur  : 85,7 mm   → CARD_W = 3.2 unités Three.js (référence)
   Hauteur  : 54,0 mm   → 54.0  × (3.2 / 85.7)
   Épaisseur: 0,76 mm   → 0.76  × (3.2 / 85.7)
   Rayon    : 3,18 mm   → 3.18  × (3.2 / 85.7)
─────────────────────────────────────────────────────────────────── */
const MM       = 3.2 / 85.7
const CARD_W   = 85.7 * MM    // = 3.2
const CARD_H   = 54.0 * MM    // ≈ 2.0164
const CARD_D   =  0.76 * MM   // ≈ 0.0284
const CORNER_R =  3.18 * MM   // ≈ 0.1188

/* ─── Dimensions selon orientation ─────────────────────────────── */
function getDims(o: Orientation) {
  const isV = o === 'vertical'
  return { cW: isV ? CARD_H : CARD_W, cH: isV ? CARD_W : CARD_H }
}

/* ─── Forme arrondie 2D (true credit-card shape) ────────────────────
   Utilise absarc pour des quarts de cercle parfaits.
   Le résultat est une Shape Three.js centrée sur l'origine.
─────────────────────────────────────────────────────────────────── */
function createCardShape(w: number, h: number, r: number): THREE.Shape {
  const hw = w / 2, hh = h / 2
  const shape = new THREE.Shape()
  shape.moveTo(-hw + r, hh)
  shape.lineTo( hw - r, hh)
  shape.absarc( hw - r,  hh - r, r,  Math.PI / 2,          0, true)
  shape.lineTo( hw,     -hh + r)
  shape.absarc( hw - r, -hh + r, r,  0,           -Math.PI / 2, true)
  shape.lineTo(-hw + r, -hh)
  shape.absarc(-hw + r, -hh + r, r, -Math.PI / 2,  Math.PI,     true)
  shape.lineTo(-hw,      hh - r)
  shape.absarc(-hw + r,  hh - r, r,  Math.PI,      Math.PI / 2, true)
  shape.closePath()
  return shape
}

/* ─── Géométries (recalculées si orientation change) ────────────── */
function buildGeos(w: number, h: number) {
  const shape = createCardShape(w, h, CORNER_R)

  /* Corps extrudé — tranche uniquement visible de côté */
  const bodyGeo = new THREE.ExtrudeGeometry(shape, {
    depth: CARD_D,
    bevelEnabled: false,
    curveSegments: 48,
  })
  bodyGeo.translate(0, 0, -CARD_D / 2)   // centrage sur Z

  /* Face recto/verso */
  const faceGeo = new THREE.ShapeGeometry(shape, 48)

  /* ShapeGeometry génère des UV = coordonnées XY brutes des vertices.
     La carte est centrée sur l'origine : X ∈ [-w/2, w/2], Y ∈ [-h/2, h/2].
     On normalise vers [0,1]×[0,1] pour que la texture couvre la face entière. */
  const uvs = faceGeo.attributes.uv as THREE.BufferAttribute
  for (let i = 0; i < uvs.count; i++) {
    uvs.setXY(i,
      (uvs.getX(i) + w / 2) / w,
      (uvs.getY(i) + h / 2) / h,
    )
  }
  uvs.needsUpdate = true

  return { bodyGeo, faceGeo }
}


/* ─── Loader universel PNG / JPG / SVG ──────────────────────────────
   Passe toujours par un canvas intermédiaire :
   • raster → taille naturelle (plafonnée à 4096 px)
   • SVG sans dimensions explicites → rendu 2048 × 2048
─────────────────────────────────────────────────────────────────── */
function loadImageAsTexture(
  src: string,
  onDone: (tex: THREE.Texture) => void,
  signal: { cancelled: boolean }
) {
  const img = new Image()
  img.onload = () => {
    if (signal.cancelled) return
    const w = img.naturalWidth  > 0 ? Math.min(img.naturalWidth,  4096) : 2048
    const h = img.naturalHeight > 0 ? Math.min(img.naturalHeight, 4096) : 2048
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace      = THREE.SRGBColorSpace
    tex.minFilter       = THREE.LinearMipmapLinearFilter
    tex.generateMipmaps = true
    tex.needsUpdate     = true
    onDone(tex)
  }
  img.src = src
}

/* ─── Card3D ─────────────────────────────────────────────────────── */
interface Card3DProps {
  settings: CardSettings
  tilt: { x: number; y: number }
}

export function Card3D({ settings, tilt }: Card3DProps) {
  const groupRef = useRef<THREE.Group>(null)
  const scaleVec = useRef(new THREE.Vector3(1, 1, 1))

  /* ── Orientation : geoOrientation pilote la géométrie ── */
  const [geoOrientation, setGeoOrientation] = useState<Orientation>(settings.orientation)
  const prevOrientationRef = useRef<Orientation>(settings.orientation)

  /* ── Flip animation sur Y ── */
  const flip = useRef({ active: false, t: 0, extraY: 0, midDone: false })

  useEffect(() => {
    if (settings.orientation !== prevOrientationRef.current) {
      prevOrientationRef.current = settings.orientation
      flip.current = { active: true, t: 0, extraY: 0, midDone: false }
    }
  }, [settings.orientation])

  /* ── Géométries (corps + face) — recalculées selon orientation ── */
  const { bodyGeo, faceGeo } = useMemo(() => {
    const { cW, cH } = getDims(geoOrientation)
    return buildGeos(cW, cH)
  }, [geoOrientation])

  useEffect(() => {
    return () => { bodyGeo.dispose(); faceGeo.dispose() }
  }, [bodyGeo, faceGeo])

  /* ── Textures utilisateur ── */
  const [frontTex, setFrontTex] = useState<THREE.Texture | null>(null)
  const [backTex,  setBackTex]  = useState<THREE.Texture | null>(null)

  useEffect(() => {
    if (!settings.frontImage) { setFrontTex(prev => { prev?.dispose(); return null }); return }
    const signal = { cancelled: false }
    loadImageAsTexture(settings.frontImage, (tex) => {
      setFrontTex(prev => { prev?.dispose(); return tex })
    }, signal)
    return () => { signal.cancelled = true }
  }, [settings.frontImage])

  useEffect(() => {
    if (!settings.backImage) { setBackTex(prev => { prev?.dispose(); return null }); return }
    const signal = { cancelled: false }
    loadImageAsTexture(settings.backImage, (tex) => {
      setBackTex(prev => { prev?.dispose(); return tex })
    }, signal)
    return () => { signal.cancelled = true }
  }, [settings.backImage])

  /* ── Animation frame ─────────────────────────────────────────── */
  useFrame((_, delta) => {
    const g = groupRef.current
    if (!g) return

    const f = flip.current
    if (f.active) {
      f.t = Math.min(1, f.t + delta / 0.48)
      if (f.t < 0.5) {
        f.extraY = f.t * 2 * (Math.PI / 2)
      } else {
        if (!f.midDone) {
          f.midDone = true
          setGeoOrientation(settings.orientation)
        }
        f.extraY = -(1 - f.t) * 2 * (Math.PI / 2)
      }
      if (f.t >= 1) { f.active = false; f.extraY = 0 }
    }

    if (settings.autoRotate) {
      g.rotation.y += delta * 0.7
    } else {
      const tx = THREE.MathUtils.degToRad(settings.rotX + tilt.x)
      const ty = THREE.MathUtils.degToRad(settings.rotY + tilt.y) + f.extraY
      const tz = THREE.MathUtils.degToRad(settings.rotZ)
      g.rotation.x += (tx - g.rotation.x) * 0.09
      g.rotation.y += (ty - g.rotation.y) * 0.09
      g.rotation.z += (tz - g.rotation.z) * 0.09
    }

    scaleVec.current.setScalar(settings.zoom)
    g.scale.lerp(scaleVec.current, 0.1)
  })

  const cfg = FINISH_CONFIGS[settings.finish]

  const faceMat = {
    metalness:       cfg.metalness * 0.5,
    roughness:       cfg.roughness,
    envMapIntensity: cfg.envMapIntensity,
  }

  const Z_FACE = CARD_D / 2 + 0.0002   // léger décalage anti z-fighting

  return (
    <group ref={groupRef}>

      {/* ── Corps (tranche) — ExtrudeGeometry centrée sur Z ──────── */}
      <mesh geometry={bodyGeo} castShadow>
        <meshStandardMaterial
          color={settings.edgeColor}
          metalness={cfg.metalness}
          roughness={cfg.roughness}
          envMapIntensity={cfg.envMapIntensity}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* ── Recto ────────────────────────────────────────────────── */}
      <mesh geometry={faceGeo} position={[0, 0, Z_FACE]}>
        <meshStandardMaterial
          key={frontTex?.uuid ?? 'front-blank'}
          color={frontTex ? '#ffffff' : '#080808'}
          map={frontTex ?? undefined}
          {...faceMat}
        />
      </mesh>

      {/* ── Verso (rotation Y 180° → normale vers -Z) ────────────── */}
      <mesh geometry={faceGeo} position={[0, 0, -Z_FACE]} rotation={[0, Math.PI, 0]}>
        <meshStandardMaterial
          key={backTex?.uuid ?? 'back-blank'}
          color={backTex ? '#ffffff' : '#080808'}
          map={backTex ?? undefined}
          {...faceMat}
        />
      </mesh>

    </group>
  )
}
