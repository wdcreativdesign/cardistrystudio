import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { AlertTriangle } from 'lucide-react'
import { CardScene } from './components/CardScene'
import { ControlPanel } from './components/ControlPanel'
import { BottomBar } from './components/BottomBar'
import { Header } from './components/Header'
import { LeftPanel } from './components/LeftPanel'
import { type CardSettings, type CardPage, type Orientation } from './types'
import { contrastColor } from './lib/utils'
import { randomizePoses } from './lib/randomize'

/* ── Default card settings ───────────────────────────────────────── */
const DEFAULT_SETTINGS: CardSettings = {
  rotX: -8,
  rotY: 22,
  rotZ: 0,
  zoom: 1,
  posX: 0,
  posY: 0,
  posZ: 0,
  finish: 'metallic',
  orientation: 'vertical',
  edgeColor: '#009FFF',
  frontImage: null,
  backImage: null,
  autoRotate: false,
  lightIntensity: 1.15,
  bgColor: '#f0f0f5',
}

/* ── Camera Z per display count (mirrors CardScene) ─────────────── */
const CAM_Z_MAP: Record<number, number> = { 1: 5.4, 2: 8.5, 3: 12.0 }
const CAM_FOV_TAN = Math.tan((42 / 2) * (Math.PI / 180)) // tan(21°)

/* ── Stable initial page (fixed ID so restart is idempotent) ─────── */
const INIT_PAGE_ID = 'page-init'
const INIT_PAGE: CardPage = {
  id: INIT_PAGE_ID,
  name: 'Card 1',
  settings: DEFAULT_SETTINGS,
}

function makeId() {
  return Math.random().toString(36).slice(2, 9)
}

/* ── App ─────────────────────────────────────────────────────────── */
export default function App() {
  // ── Multi-page state ──
  const [pages, setPages]               = useState<CardPage[]>([INIT_PAGE])
  const [activePageId, setActivePageId] = useState<string>(INIT_PAGE_ID)
  const [displayCount, setDisplayCount] = useState<1 | 2 | 3>(1)
  const [tilt, setTilt]                 = useState({ x: 0, y: 0 })
  const [altHeld, setAltHeld]           = useState(false)
  const [pendingOrientation, setPendingOrientation] = useState<Orientation | null>(null)
  const [showReloadConfirm, setShowReloadConfirm]   = useState(false)

  // Derive active page & its settings
  const activePage = pages.find((p) => p.id === activePageId) ?? pages[0]
  const settings   = activePage.settings

  // Pages currently visible in the 3D scene (first N)
  const displayedPages = pages.slice(0, displayCount).map((p) => ({
    id:       p.id,
    settings: p.settings,
    isActive: p.id === activePageId,
  }))

  // ── Refs ──
  const glRef          = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef       = useRef<THREE.Scene | null>(null)
  const cameraRef      = useRef<THREE.Camera | null>(null)
  const isDragging     = useRef(false)
  const lastPointer    = useRef({ x: 0, y: 0 })
  const pointerStart   = useRef({ x: 0, y: 0 })
  const containerRef   = useRef<HTMLDivElement>(null)
  const displayCountRef = useRef(displayCount)
  const pagesRef        = useRef(pages)

  // Stable refs for use inside stable listeners / callbacks
  const settingsRef     = useRef(settings)
  const activePageIdRef = useRef(activePageId)
  useEffect(() => { settingsRef.current     = settings     }, [settings])
  useEffect(() => { activePageIdRef.current = activePageId }, [activePageId])
  useEffect(() => { displayCountRef.current = displayCount }, [displayCount])
  useEffect(() => { pagesRef.current        = pages        }, [pages])

  /* ── Alt key tracking — switches drag mode to translate ── */
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === 'Alt') { e.preventDefault(); setAltHeld(true)  } }
    const up   = (e: KeyboardEvent) => { if (e.key === 'Alt') setAltHeld(false) }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup',   up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  /* ── update: patches only the active page's settings ── */
  const update = useCallback((patch: Partial<CardSettings>) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === activePageIdRef.current
          ? { ...p, settings: { ...p.settings, ...patch } }
          : p,
      ),
    )
  }, [])

  /* ── Global paste handler (⌘V from Figma, etc.) ── */
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items ?? [])
      const imageItem = items.find((it) => it.type.startsWith('image/'))
      if (!imageItem) return
      e.preventDefault()
      const file = imageItem.getAsFile()
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string
        const pid = activePageIdRef.current
        setPages((prev) =>
          prev.map((p) => {
            if (p.id !== pid) return p
            const { frontImage, backImage } = p.settings
            if (!frontImage) return { ...p, settings: { ...p.settings, frontImage: dataUrl } }
            if (!backImage)  return { ...p, settings: { ...p.settings, backImage: dataUrl } }
            return                   { ...p, settings: { ...p.settings, frontImage: dataUrl } }
          }),
        )
      }
      reader.readAsDataURL(file)
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, []) // stable — reads via refs

  /* ── Orientation change — intercept when images are loaded ── */
  const handleChange = useCallback(
    (patch: Partial<CardSettings>) => {
      if (
        'orientation' in patch &&
        patch.orientation !== settings.orientation &&
        (settings.frontImage || settings.backImage)
      ) {
        setPendingOrientation(patch.orientation!)
      } else {
        update(patch)
      }
    },
    [settings.orientation, settings.frontImage, settings.backImage, update],
  )

  const confirmOrientationChange = useCallback(() => {
    if (!pendingOrientation) return
    update({ orientation: pendingOrientation, frontImage: null, backImage: null })
    setPendingOrientation(null)
  }, [pendingOrientation, update])

  const cancelOrientationChange = useCallback(() => {
    setPendingOrientation(null)
  }, [])

  /* ── Pristine check — true when nothing has been changed ── */
  const isPristine = useMemo(() => {
    if (pages.length !== 1) return false
    const s = pages[0].settings
    if (s.frontImage || s.backImage) return false
    const keys = [
      'rotX','rotY','rotZ','zoom','posX','posY','posZ',
      'finish','orientation','edgeColor','autoRotate','lightIntensity','bgColor',
    ] as const
    return keys.every((k) => (s[k] as unknown) === (DEFAULT_SETTINGS[k] as unknown))
  }, [pages])

  /* ── Logo click → reload (with guard if design is in progress) ── */
  const handleLogoClick = useCallback(() => {
    if (isPristine) {
      window.location.reload()
    } else {
      setShowReloadConfirm(true)
    }
  }, [isPristine])

  /* ── Reset active page (keeps images, finish & orientation) ── */
  const handleReset = useCallback(() => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === activePageId
          ? {
              ...p,
              settings: {
                ...DEFAULT_SETTINGS,
                frontImage:  p.settings.frontImage,
                backImage:   p.settings.backImage,
                finish:      p.settings.finish,
                orientation: p.settings.orientation,
              },
            }
          : p,
      ),
    )
  }, [activePageId])

  /* ── Randomize — generates collision-free poses for all displayed cards ── */
  const handleRandomize = useCallback(() => {
    const count = displayCountRef.current as 1 | 2 | 3
    const patches = randomizePoses(count)
    setPages((prev) => {
      const next = [...prev]
      patches.forEach((patch, i) => {
        if (!next[i]) return
        // Patch only pose fields — orientation, finish, colors, images untouched
        next[i] = { ...next[i], settings: { ...next[i].settings, ...patch } }
      })
      return next
    })
  }, [])

  /* ── Full restart — wipes all pages ── */
  const handleRestart = useCallback(() => {
    setPages([{ ...INIT_PAGE, settings: { ...DEFAULT_SETTINGS } }])
    setActivePageId(INIT_PAGE_ID)
    setDisplayCount(1)
  }, [])

  /* ── Display count change — ensures enough pages exist ── */
  const handleDisplayCountChange = useCallback((count: 1 | 2 | 3) => {
    setDisplayCount(count)
    setPages((prev) => {
      let next = prev
      if (prev.length < count) {
        next = [...prev]
        while (next.length < count) {
          next.push({
            id:       makeId(),
            name:     `Card ${next.length + 1}`,
            settings: { ...DEFAULT_SETTINGS },
          })
        }
      }
      // If active page is no longer in the visible range, switch to first
      const visibleIds = next.slice(0, count).map((p) => p.id)
      if (!visibleIds.includes(activePageIdRef.current)) {
        setActivePageId(next[0].id)
      }
      return next
    })
  }, [])

  /* ── Page management ── */
  const handleAddPage = useCallback(() => {
    const newPage: CardPage = {
      id:       makeId(),
      name:     `Card ${pagesRef.current.length + 1}`,
      settings: { ...DEFAULT_SETTINGS },
    }
    setPages((prev) => [...prev, newPage])
    setActivePageId(newPage.id)
    // Auto-increment display count up to 3
    setDisplayCount((prev) => Math.min(3, prev + 1) as 1 | 2 | 3)
  }, [])

  const handleDeletePage = useCallback(
    (id: string) => {
      if (pages.length <= 1) return
      const idx  = pages.findIndex((p) => p.id === id)
      const next = pages.filter((p) => p.id !== id)
      setPages(next)
      // Shrink display count if we removed a displayed card
      setDisplayCount((prev) => Math.min(prev, Math.max(1, next.length)) as 1 | 2 | 3)
      if (activePageId === id) {
        setActivePageId(next[Math.max(0, idx - 1)]?.id ?? next[0].id)
      }
    },
    [pages, activePageId],
  )

  const handleSelectPage = useCallback((id: string) => {
    setActivePageId(id)
  }, [])

  /* ── Export ── */
  const handleExport = useCallback((opts: { format: 'png' | 'jpg' | 'svg'; scale: number }) => {
    const gl     = glRef.current
    const scene  = sceneRef.current
    const camera = cameraRef.current
    if (!gl || !scene || !camera) return

    const isTransparent = settingsRef.current.bgColor === 'transparent'
    const cssW = gl.domElement.clientWidth
    const cssH = gl.domElement.clientHeight
    const origDpr = gl.getPixelRatio()

    // Scale up renderer for export
    gl.setPixelRatio(opts.scale)
    gl.setSize(cssW, cssH, false)

    let dataURL: string

    if (isTransparent) {
      const bgLayers = scene.getObjectByName('bg-layers')
      if (bgLayers) bgLayers.visible = false
      const savedColor = new THREE.Color()
      gl.getClearColor(savedColor)
      const savedAlpha = gl.getClearAlpha()
      gl.setClearColor(0x000000, 0)
      gl.clear()
      gl.render(scene, camera)
      dataURL = gl.domElement.toDataURL('image/png', 1.0)
      gl.setClearColor(savedColor, savedAlpha)
      if (bgLayers) bgLayers.visible = true
    } else if (opts.format === 'svg') {
      gl.render(scene, camera)
      const pngDataUrl = gl.domElement.toDataURL('image/png', 1.0)
      const w = gl.domElement.width
      const h = gl.domElement.height
      // Restore before returning
      gl.setPixelRatio(origDpr)
      gl.setSize(cssW, cssH, false)
      gl.render(scene, camera)
      const svgContent = [
        `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">`,
        `  <image href="${pngDataUrl}" width="${w}" height="${h}"/>`,
        `</svg>`,
      ].join('\n')
      const blob = new Blob([svgContent], { type: 'image/svg+xml' })
      const url  = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = 'cardistrystudio-export.svg'
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
      return
    } else {
      gl.render(scene, camera)
      const mimeType = opts.format === 'jpg' ? 'image/jpeg' : 'image/png'
      const quality  = opts.format === 'jpg' ? 0.95 : 1.0
      dataURL = gl.domElement.toDataURL(mimeType, quality)
    }

    // Restore renderer
    gl.setPixelRatio(origDpr)
    gl.setSize(cssW, cssH, false)
    gl.render(scene, camera)

    const ext  = isTransparent ? 'png' : opts.format
    const link = document.createElement('a')
    link.download = `cardistrystudio-export@${opts.scale}x.${ext}`
    link.href = dataURL
    link.click()
  }, [])

  /* ── Drag to rotate + click to select card ── */
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current  = true
    lastPointer.current = { x: e.clientX, y: e.clientY }
    pointerStart.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging.current) {
      const dx = e.clientX - lastPointer.current.x
      const dy = e.clientY - lastPointer.current.y
      lastPointer.current = { x: e.clientX, y: e.clientY }
      const pid = activePageIdRef.current

      if (e.altKey) {
        /* ── Alt held → translate active card in XY world space ── */
        const containerW = containerRef.current?.getBoundingClientRect().width  || 800
        const containerH = containerRef.current?.getBoundingClientRect().height || 600
        const camZ = CAM_Z_MAP[displayCountRef.current] ?? 5.4
        // World units per pixel = 2 * camZ * tan(fov/2) / containerPx
        const senX =  camZ * CAM_FOV_TAN * 2 / containerW
        const senY =  camZ * CAM_FOV_TAN * 2 / containerH
        setPages((prev) =>
          prev.map((p) => {
            if (p.id !== pid) return p
            return {
              ...p,
              settings: {
                ...p.settings,
                posX: p.settings.posX + dx * senX,
                posY: p.settings.posY - dy * senY, // screen Y inverted
              },
            }
          }),
        )
      } else {
        /* ── Default → rotate active card ── */
        setPages((prev) =>
          prev.map((p) => {
            if (p.id !== pid) return p
            let newY = p.settings.rotY + dx * 0.45
            while (newY >  180) newY -= 360
            while (newY < -180) newY += 360
            return {
              ...p,
              settings: {
                ...p.settings,
                autoRotate: false,
                rotY: newY,
                rotX: Math.max(-90, Math.min(90, p.settings.rotX - dy * 0.35)),
              },
            }
          }),
        )
      }
    } else if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const nx = ((e.clientX - rect.left) / rect.width  - 0.5) * 2
      const ny = ((e.clientY - rect.top)  / rect.height - 0.5) * 2
      setTilt({ x: ny * -4, y: nx * 4 })
    }
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Detect click (tiny movement) → select the card in that screen zone
    const count = displayCountRef.current
    if (count > 1) {
      const dx   = e.clientX - pointerStart.current.x
      const dy   = e.clientY - pointerStart.current.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 6 && containerRef.current) {
        const rect  = containerRef.current.getBoundingClientRect()
        const relX  = (e.clientX - rect.left) / rect.width
        let slot: number
        if (count === 2) slot = relX < 0.5 ? 0 : 1
        else             slot = relX < 1 / 3 ? 0 : relX < 2 / 3 ? 1 : 2
        const target = pagesRef.current[slot]
        if (target) setActivePageId(target.id)
      }
    }
    isDragging.current = false
  }, [])

  const onMouseLeave = useCallback(() => {
    isDragging.current = false
    setTilt({ x: 0, y: 0 })
  }, [])

  /* ── Render ── */
  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{
        background: settings.bgColor === 'transparent'
          ? 'repeating-conic-gradient(#d8d8d8 0% 25%, #f0f0f0 0% 50%) 0 0 / 20px 20px'
          : settings.bgColor
      }}
    >

      {/* ── Left floating panel ── */}
      <LeftPanel
        pages={pages}
        activePageId={activePageId}
        displayCount={displayCount}
        onSelect={handleSelectPage}
        onAdd={handleAddPage}
        onDelete={handleDeletePage}
      />

      {/* ── Canvas area ── */}
      <div className="flex-1 relative min-w-0">
        <Header
          onRestart={handleRestart}
          onLogoClick={handleLogoClick}
          logoColor={contrastColor(settings.bgColor)}
        />

        <div
          ref={containerRef}
          className={`absolute inset-0 select-none ${altHeld ? 'cursor-move' : 'canvas-drag'}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onMouseLeave={onMouseLeave}
        >
          <CardScene
            displayedPages={displayedPages}
            displayCount={displayCount}
            tilt={tilt}
            glRef={glRef}
            sceneRef={sceneRef}
            cameraRef={cameraRef}
          />
        </div>

        {/* ── Alt-drag hint — visible in multi-card mode ── */}
        {displayCount > 1 && (
          <div className={`absolute top-16 left-1/2 -translate-x-1/2 z-10 transition-all duration-200 pointer-events-none ${altHeld ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`}>
            <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-white/90 text-[11px] font-medium px-3 py-1.5 rounded-full">
              <span className="bg-white/20 rounded px-1.5 py-0.5 text-[10px] font-mono">⌥ Alt</span>
              <span>+ drag to move</span>
            </div>
          </div>
        )}

        <BottomBar
          settings={settings}
          onChange={handleChange}
          displayCount={displayCount}
          onDisplayCountChange={handleDisplayCountChange}
        />
      </div>

      {/* ── Right control panel ── */}
      <ControlPanel settings={settings} displayCount={displayCount} onChange={handleChange} onReset={handleReset} onRandomize={handleRandomize} onExport={handleExport} />

      {/* ── Reload confirmation dialog ── */}
      {showReloadConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
            onClick={() => setShowReloadConfirm(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-black/[0.07] p-6 w-[360px] mx-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle style={{ width: 18, height: 18 }} className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-black/85 mb-1.5">
                  Lose your progress?
                </h3>
                <p className="text-[13px] text-black/50 leading-relaxed">
                  Refreshing will reset your current design. Any unsaved work will be lost.
                </p>
              </div>
            </div>
            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => setShowReloadConfirm(false)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-black/55 hover:text-black/80 border border-black/10 hover:bg-black/[0.04] transition-all"
              >
                Keep editing
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl text-[13px] font-medium bg-[#1a1a1a] hover:bg-[#2d2d2d] text-white transition-all active:scale-[0.97]"
              >
                Refresh anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Orientation warning dialog ── */}
      {pendingOrientation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
            onClick={cancelOrientationChange}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-black/[0.07] p-6 w-[360px] mx-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle style={{ width: 18, height: 18 }} className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-black/85 mb-1.5">
                  Change orientation?
                </h3>
                <p className="text-[13px] text-black/50 leading-relaxed">
                  Switching to{' '}
                  <span className="font-medium text-black/65 capitalize">
                    {pendingOrientation}
                  </span>{' '}
                  will remove your imported images — they won't match the new card format.
                </p>
              </div>
            </div>
            <div className="flex gap-2.5 justify-end">
              <button
                onClick={cancelOrientationChange}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-black/55 hover:text-black/80 border border-black/10 hover:bg-black/[0.04] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmOrientationChange}
                className="px-4 py-2 rounded-xl text-[13px] font-medium bg-[#1a1a1a] hover:bg-[#2d2d2d] text-white transition-all active:scale-[0.97]"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
