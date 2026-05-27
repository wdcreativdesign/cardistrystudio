import { useState, useRef, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import { AlertTriangle } from 'lucide-react'
import { CardScene } from './components/CardScene'
import { ControlPanel } from './components/ControlPanel'
import { BottomBar } from './components/BottomBar'
import { Header } from './components/Header'
import { LeftPanel } from './components/LeftPanel'
import { ExportDialog, type ExportOptions } from './components/ExportDialog'
import { type CardSettings, type CardPage, type Orientation } from './types'

/* ── Default card settings ───────────────────────────────────────── */
const DEFAULT_SETTINGS: CardSettings = {
  rotX: -8,
  rotY: 22,
  rotZ: 0,
  zoom: 1,
  finish: 'metallic',
  orientation: 'vertical',
  edgeColor: '#009FFF',
  frontImage: null,
  backImage: null,
  autoRotate: false,
  lightIntensity: 1.15,
}

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
  const [tilt, setTilt]                 = useState({ x: 0, y: 0 })
  const [pendingOrientation, setPendingOrientation] = useState<Orientation | null>(null)
  const [exportOpen, setExportOpen]     = useState(false)

  // Derive active page & its settings
  const activePage = pages.find((p) => p.id === activePageId) ?? pages[0]
  const settings   = activePage.settings

  // ── Refs ──
  const glRef        = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef     = useRef<THREE.Scene | null>(null)
  const cameraRef    = useRef<THREE.Camera | null>(null)
  const isDragging   = useRef(false)
  const lastPointer  = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Stable refs for use inside stable listeners / callbacks
  const settingsRef    = useRef(settings)
  const activePageIdRef = useRef(activePageId)
  useEffect(() => { settingsRef.current     = settings    }, [settings])
  useEffect(() => { activePageIdRef.current = activePageId }, [activePageId])

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

  /* ── Full restart — wipes all pages ── */
  const handleRestart = useCallback(() => {
    setPages([{ ...INIT_PAGE, settings: { ...DEFAULT_SETTINGS } }])
    setActivePageId(INIT_PAGE_ID)
  }, [])

  /* ── Page management ── */
  const handleAddPage = useCallback(() => {
    const newPage: CardPage = {
      id:       makeId(),
      name:     `Card ${pages.length + 1}`,
      settings: { ...DEFAULT_SETTINGS },
    }
    setPages((prev) => [...prev, newPage])
    setActivePageId(newPage.id)
  }, [pages.length])

  const handleDeletePage = useCallback(
    (id: string) => {
      if (pages.length <= 1) return
      const idx  = pages.findIndex((p) => p.id === id)
      const next = pages.filter((p) => p.id !== id)
      setPages(next)
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
  const handleExport = useCallback((opts: ExportOptions) => {
    const gl     = glRef.current
    const scene  = sceneRef.current
    const camera = cameraRef.current
    if (!gl || !scene || !camera) return

    let dataURL: string

    if (opts.background === 'transparent') {
      // Hide bg sphere + contact shadows, render with alpha clear, capture, restore
      const bgLayers = scene.getObjectByName('bg-layers')
      if (bgLayers) bgLayers.visible = false

      const savedColor = new THREE.Color()
      gl.getClearColor(savedColor)
      const savedAlpha = gl.getClearAlpha()

      gl.setClearColor(0x000000, 0)
      gl.clear()
      gl.render(scene, camera)

      dataURL = gl.domElement.toDataURL('image/png', 1.0)

      // Restore
      gl.setClearColor(savedColor, savedAlpha)
      if (bgLayers) bgLayers.visible = true
      gl.render(scene, camera)
    } else if (opts.format === 'svg') {
      // Embed the raster canvas inside an SVG wrapper
      const pngDataUrl = gl.domElement.toDataURL('image/png', 1.0)
      const w = gl.domElement.width
      const h = gl.domElement.height
      const svgContent = [
        `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">`,
        `  <image href="${pngDataUrl}" width="${w}" height="${h}"/>`,
        `</svg>`,
      ].join('\n')
      const blob = new Blob([svgContent], { type: 'image/svg+xml' })
      const url  = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = 'caistrystudio-export.svg'
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
      return
    } else {
      const mimeType = opts.format === 'jpg' ? 'image/jpeg' : 'image/png'
      const quality  = opts.format === 'jpg' ? 0.95         : 1.0
      dataURL = gl.domElement.toDataURL(mimeType, quality)
    }

    const ext  = opts.background === 'transparent' ? 'png' : opts.format
    const link = document.createElement('a')
    link.download = `caistrystudio-export.${ext}`
    link.href = dataURL
    link.click()
  }, [])

  /* ── Drag to rotate ── */
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true
    lastPointer.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging.current) {
      const dx = e.clientX - lastPointer.current.x
      const dy = e.clientY - lastPointer.current.y
      lastPointer.current = { x: e.clientX, y: e.clientY }
      const pid = activePageIdRef.current
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
    } else if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const nx = ((e.clientX - rect.left) / rect.width  - 0.5) * 2
      const ny = ((e.clientY - rect.top)  / rect.height - 0.5) * 2
      setTilt({ x: ny * -4, y: nx * 4 })
    }
  }, [])

  const onPointerUp  = useCallback(() => { isDragging.current = false }, [])
  const onMouseLeave = useCallback(() => {
    isDragging.current = false
    setTilt({ x: 0, y: 0 })
  }, [])

  /* ── Render ── */
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f0f0f5]">

      {/* ── Left floating panel ── */}
      <LeftPanel
        pages={pages}
        activePageId={activePageId}
        onSelect={handleSelectPage}
        onAdd={handleAddPage}
        onDelete={handleDeletePage}
      />

      {/* ── Canvas area ── */}
      <div className="flex-1 relative min-w-0">
        <Header onExport={() => setExportOpen(true)} onRestart={handleRestart} />

        <div
          ref={containerRef}
          className="absolute inset-0 canvas-drag select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onMouseLeave={onMouseLeave}
        >
          <CardScene
            settings={settings}
            tilt={tilt}
            glRef={glRef}
            sceneRef={sceneRef}
            cameraRef={cameraRef}
          />
        </div>

        <BottomBar settings={settings} onChange={handleChange} />
      </div>

      {/* ── Right control panel ── */}
      <ControlPanel settings={settings} onChange={handleChange} onReset={handleReset} />

      {/* ── Export dialog ── */}
      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={handleExport}
      />

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
