import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { type CardSettings, type ImageLayer, type Orientation, FINISH_CONFIGS } from '@/types'

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

/* ─── Composite N image layers → single THREE.Texture ──────────── */
function useCompositeTexture(layers: ImageLayer[], cardColor: string, placeholderSrc?: string): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(null)

  // Clé stable : cardColor + ids + blendModes + début de chaque data URL
  const key = cardColor + '|' + layers.map((l) => l.id + ':' + l.blendMode + ':' + (l.opacity ?? 100) + ':' + l.image.slice(0, 32)).join('|')

  useEffect(() => {
    if (layers.length === 0) {
      // Charger le placeholder si disponible, sinon laisser null
      if (!placeholderSrc) {
        setTex((prev) => { prev?.dispose(); return null })
        return
      }
      const signal = { cancelled: false }
      const img = new Image()
      img.onload = () => {
        if (signal.cancelled) return
        const canvas = document.createElement('canvas')
        canvas.width  = img.naturalWidth  || 2048
        canvas.height = img.naturalHeight || 2048
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const newTex = new THREE.CanvasTexture(canvas)
        newTex.colorSpace      = THREE.SRGBColorSpace
        newTex.minFilter       = THREE.LinearMipmapLinearFilter
        newTex.generateMipmaps = true
        newTex.needsUpdate     = true
        setTex((prev) => { prev?.dispose(); return newTex })
      }
      img.onerror = () => { if (!signal.cancelled) setTex((prev) => { prev?.dispose(); return null }) }
      img.src = placeholderSrc
      return () => { signal.cancelled = true }
    }

    const signal = { cancelled: false }

    Promise.all(
      layers.map(
        (l) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image()
            img.onload  = () => resolve(img)
            img.onerror = reject
            img.src     = l.image
          }),
      ),
    )
      .then((imgs) => {
        if (signal.cancelled) return
        const maxW = Math.max(...imgs.map((i) => (i.naturalWidth  > 0 ? Math.min(i.naturalWidth,  4096) : 2048)))
        const maxH = Math.max(...imgs.map((i) => (i.naturalHeight > 0 ? Math.min(i.naturalHeight, 4096) : 2048)))
        const canvas = document.createElement('canvas')
        canvas.width  = maxW
        canvas.height = maxH
        const ctx = canvas.getContext('2d')!
        // Remplir avec cardColor comme fond
        ctx.fillStyle = cardColor
        ctx.fillRect(0, 0, maxW, maxH)
        // Composer du bas vers le haut : index 0 = top de liste = dessiné en dernier (sur le dessus)
        const revImgs   = [...imgs].reverse()
        const revLayers = [...layers].reverse()
        revImgs.forEach((img, i) => {
          ctx.globalAlpha             = (revLayers[i].opacity ?? 100) / 100
          ctx.globalCompositeOperation = revLayers[i].blendMode ?? 'source-over'
          ctx.drawImage(img, 0, 0, maxW, maxH)
        })
        ctx.globalAlpha = 1 // reset
        ctx.globalCompositeOperation = 'source-over' // reset
        const newTex = new THREE.CanvasTexture(canvas)
        newTex.colorSpace      = THREE.SRGBColorSpace
        newTex.minFilter       = THREE.LinearMipmapLinearFilter
        newTex.generateMipmaps = true
        newTex.needsUpdate     = true
        setTex((prev) => { prev?.dispose(); return newTex })
      })
      .catch(() => { /* image invalide — on ignore */ })

    return () => { signal.cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return tex
}

/* ─── Selection dots (ondulating perimeter) ─────────────────────── */
const DOT_VERT = `
  attribute float aOffset;
  uniform float uTime;
  varying float vAlpha;
  void main() {
    float w1 = 0.5 + 0.5 * sin(aOffset * 28.0 - uTime * 5.5);
    float w2 = 0.5 + 0.5 * sin(aOffset * 14.0 + uTime * 3.8);
    float w3 = 0.5 + 0.5 * sin(aOffset * 48.0 - uTime * 8.0);
    float wave = w1 * 0.5 + w2 * 0.3 + w3 * 0.2;
    wave = wave * wave;
    vAlpha      = 0.05 + wave * 0.95;
    gl_PointSize = 1.2 + wave * 5.5;
    gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const DOT_FRAG = `
  varying float vAlpha;
  uniform vec3 uColor;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    if (length(c) > 0.5) discard;
    float soft = 1.0 - smoothstep(0.2, 0.5, length(c));
    gl_FragColor = vec4(uColor, vAlpha * soft);
  }
`

function buildPerimeterGeo(orientation: Orientation, edgeColor: string) {
  const { cW, cH } = getDims(orientation)
  const r  = CORNER_R * 1.06
  const hw = cW / 2 + 0.018
  const hh = cH / 2 + 0.018
  const step = 0.025
  const pts: number[] = [], off: number[] = []

  const addArc = (cx: number, cy: number, a0: number, a1: number) => {
    const n = Math.max(4, Math.round(Math.abs(a1 - a0) / 0.18))
    for (let i = 0; i <= n; i++) {
      const a = a0 + (a1 - a0) * (i / n)
      pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0); off.push(0)
    }
  }
  const addLine = (x0: number, y0: number, x1: number, y1: number) => {
    const dx = x1-x0, dy = y1-y0, len = Math.sqrt(dx*dx+dy*dy)
    const n = Math.max(2, Math.floor(len / step))
    for (let i = 0; i < n; i++) { const t = i/n; pts.push(x0+dx*t, y0+dy*t, 0); off.push(0) }
  }
  addArc(-(hw-r), -(hh-r), Math.PI,       Math.PI*1.5)
  addLine(-(hw-r), -hh,    (hw-r), -hh)
  addArc( (hw-r), -(hh-r), Math.PI*1.5,   0)
  addLine( hw,  -(hh-r),   hw,   (hh-r))
  addArc( (hw-r),  (hh-r), 0,            Math.PI*0.5)
  addLine( (hw-r),  hh,   -(hw-r),  hh)
  addArc(-(hw-r),  (hh-r), Math.PI*0.5,   Math.PI)
  addLine(-hw,  (hh-r),   -hw, -(hh-r))
  const total = pts.length / 3
  for (let i = 0; i < total; i++) off[i] = (i / total) * Math.PI * 2
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
  geo.setAttribute('aOffset',  new THREE.Float32BufferAttribute(off, 1))
  const hex = edgeColor.replace('#','')
  const color = new THREE.Color(
    parseInt(hex.slice(0,2),16)/255,
    parseInt(hex.slice(2,4),16)/255,
    parseInt(hex.slice(4,6),16)/255,
  )
  return { geo, color }
}

function SelectionDots({ edgeColor, orientation, z, active }: {
  edgeColor: string; orientation: Orientation; z: number; active: boolean
}) {
  const timeRef = useRef(0)
  const matRef  = useRef<THREE.ShaderMaterial>(null)
  const ptRef   = useRef<THREE.Points>(null)

  const { geo, color } = useMemo(
    () => buildPerimeterGeo(orientation, edgeColor),
    [orientation, edgeColor]
  )

  // Place dots on layer 1 — ContactShadows camera only renders layer 0
  useEffect(() => {
    if (ptRef.current) ptRef.current.layers.set(1)
  }, [])

  // Keep animation running at all times — visible prop handles show/hide
  useFrame((_, delta) => {
    timeRef.current += delta
    if (matRef.current) matRef.current.uniforms.uTime.value = timeRef.current
  })

  return (
    <points ref={ptRef} geometry={geo} position={[0, 0, z]}
      visible={active} renderOrder={10} castShadow={false} receiveShadow={false}
    >
      <shaderMaterial
        ref={matRef}
        vertexShader={DOT_VERT} fragmentShader={DOT_FRAG}
        uniforms={{ uTime: { value: 0 }, uColor: { value: color } }}
        transparent depthWrite={false} depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/* ─── Card3D ─────────────────────────────────────────────────────── */
interface Card3DProps {
  settings: CardSettings
  tilt:     { x: number; y: number }
  isActive?: boolean
}

export function Card3D({ settings, tilt, isActive = false }: Card3DProps) {
  const groupRef = useRef<THREE.Group>(null)
  const scaleVec = useRef(new THREE.Vector3(1, 1, 1))

  /* ── Glow material refs (3 front + 3 back) ── */
  const glowRefs  = useRef<(THREE.MeshBasicMaterial | null)[]>([])
  const glowClock = useRef(0)

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

  /* ── Texture puce (chargée une seule fois) ── */
  const [chipTex, setChipTex] = useState<THREE.Texture | null>(null)
  useEffect(() => {
    const signal = { cancelled: false }
    loadImageAsTexture('/chip.svg', (tex) => {
      if (!signal.cancelled) setChipTex(tex)
    }, signal)
    return () => { signal.cancelled = true }
  }, [])

  /* ── Textures utilisateur (composite multi-layers) ── */
  const frontTex = useCompositeTexture(settings.frontLayers, settings.cardColor, '/defaults/BaseFront.png')
  const backTex  = useCompositeTexture(settings.backLayers,  settings.cardColor, '/defaults/BaseBack.png')

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

    // (animation handled by SelectionDots shaderMaterial)
  })

  const cfg = FINISH_CONFIGS[settings.finish]
  const envMult = settings.envIntensity ?? 1.0

  /* ── Position puce — standard ISO 7810 / EMV ──────────────────────
     Carte horizontale : puce à ~12 mm du bord gauche, ~19 mm du bas
     Carte verticale   : même offset millimétrique en coordonnées locales
  ─────────────────────────────────────────────────────────────────── */
  const { cW, cH } = getDims(geoOrientation)
  /* ── Dimensions puce — mesures exactes depuis CardMesurement.ai ──
     Largeur  : 10.724 mm  (= 30.4 pt × 0.352778, ratio SVG 30.4×22.4 ✓)
     Hauteur  :  7.902 mm  (= 22.4 pt × 0.352778)
     Bord gauche :  9.666 mm depuis bord gauche carte
     Bord haut   : 18.644 mm depuis bord supérieur carte
  ─────────────────────────────────────────────────────────────────── */
  const CHIP_W = 10.724 * MM
  const CHIP_H =  7.902 * MM

  /* ── Position + rotation puce ────────────────────────────────────
     La carte verticale = carte horizontale tournée 90° CW.
     On calcule la position sur la carte horizontale puis on applique
     la rotation 90° CW : (x, y) → (y, -x).
  ─────────────────────────────────────────────────────────────────── */
  const chipX_h = -CARD_W / 2 + 9.666 * MM + CHIP_W / 2   // 9.666 mm du bord gauche
  const chipY_h =  CARD_H / 2 - 18.644 * MM - CHIP_H / 2  // 18.644 mm du bord haut

  const isVertical = geoOrientation === 'vertical'
  const chipX    = isVertical ?  chipY_h  : chipX_h
  const chipY    = isVertical ? -chipX_h  : chipY_h
  const chipRotZ = isVertical ? -Math.PI / 2 : 0

  const faceMat = {
    metalness:          cfg.metalness,
    roughness:          cfg.roughness,
    envMapIntensity:    cfg.envMapIntensity * envMult,
    clearcoat:          cfg.clearcoat,
    clearcoatRoughness: cfg.clearcoatRoughness,
  }

  const Z_FACE  = CARD_D / 2 + 0.0002   // léger décalage anti z-fighting
  const GLOW_ZF = Z_FACE - 0.003        // juste derrière la face avant
  const GLOW_ZB = -(Z_FACE - 0.003)     // juste derrière la face arrière

  return (
    <group ref={groupRef}>

      {/* ── Dots sélection ondulants ── */}
      <SelectionDots edgeColor={settings.edgeColor} orientation={geoOrientation} z={ CARD_D / 2 + 0.003} active={isActive} />
      <SelectionDots edgeColor={settings.edgeColor} orientation={geoOrientation} z={-CARD_D / 2 - 0.003} active={isActive} />


      {/* ── Corps (tranche) — ExtrudeGeometry centrée sur Z ──────── */}
      <mesh geometry={bodyGeo} castShadow>
        <meshPhysicalMaterial
          color={settings.edgeColor}
          metalness={cfg.metalness}
          roughness={cfg.roughness}
          envMapIntensity={cfg.envMapIntensity * envMult}
          clearcoat={cfg.clearcoat}
          clearcoatRoughness={cfg.clearcoatRoughness}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* ── Recto ────────────────────────────────────────────────── */}
      <mesh geometry={faceGeo} position={[0, 0, Z_FACE]}>
        <meshPhysicalMaterial
          key={frontTex?.uuid ?? 'front-blank'}
          color={frontTex ? '#ffffff' : settings.cardColor}
          map={frontTex ?? undefined}
          {...faceMat}
        />
      </mesh>

      {/* ── Verso (rotation Y 180° → normale vers -Z) ────────────── */}
      <mesh geometry={faceGeo} position={[0, 0, -Z_FACE]} rotation={[0, Math.PI, 0]}>
        <meshPhysicalMaterial
          key={backTex?.uuid ?? 'back-blank'}
          color={backTex ? '#ffffff' : settings.cardColor}
          map={backTex ?? undefined}
          {...faceMat}
        />
      </mesh>

      {/* ── Puce EMV — face avant uniquement ─────────────────────── */}
      {chipTex && (
        <mesh position={[chipX, chipY, Z_FACE + 0.0004]} rotation={[0, 0, chipRotZ]}>
          <planeGeometry args={[CHIP_W, CHIP_H]} />
          <meshPhysicalMaterial
            map={chipTex}
            transparent
            alphaTest={0.05}
            metalness={0.92}
            roughness={0.18}
            clearcoat={0.9}
            clearcoatRoughness={0.08}
            envMapIntensity={2.0}
          />
        </mesh>
      )}

    </group>
  )
}
