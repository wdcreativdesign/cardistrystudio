import { useState, useRef, useCallback } from 'react'
import type * as THREE from 'three'
import { AlertTriangle } from 'lucide-react'
import { CardScene } from './components/CardScene'
import { ControlPanel } from './components/ControlPanel'
import { BottomBar } from './components/BottomBar'
import { Header } from './components/Header'
import { type CardSettings, type Orientation } from './types'

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

export default function App() {
  const [settings, setSettings] = useState<CardSettings>(DEFAULT_SETTINGS)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [pendingOrientation, setPendingOrientation] = useState<Orientation | null>(null)

  const glRef = useRef<THREE.WebGLRenderer | null>(null)
  const isDragging = useRef(false)
  const lastPointer = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const update = useCallback((patch: Partial<CardSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  /* ── Orientation change — intercept if images loaded ── */
  const handleChange = useCallback((patch: Partial<CardSettings>) => {
    if (
      'orientation' in patch &&
      patch.orientation !== settings.orientation &&
      (settings.frontImage || settings.backImage)
    ) {
      setPendingOrientation(patch.orientation!)
    } else {
      update(patch)
    }
  }, [settings.orientation, settings.frontImage, settings.backImage, update])

  const confirmOrientationChange = useCallback(() => {
    if (!pendingOrientation) return
    update({ orientation: pendingOrientation, frontImage: null, backImage: null })
    setPendingOrientation(null)
  }, [pendingOrientation, update])

  const cancelOrientationChange = useCallback(() => {
    setPendingOrientation(null)
  }, [])

  /* ── Reset (keeps images & finish) ── */
  const handleReset = useCallback(() => {
    setSettings((prev) => ({
      ...DEFAULT_SETTINGS,
      frontImage: prev.frontImage,
      backImage: prev.backImage,
      finish: prev.finish,
      orientation: prev.orientation,
    }))
  }, [])

  /* ── Full restart ── */
  const handleRestart = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
  }, [])

  const handleExport = useCallback(() => {
    const gl = glRef.current
    if (!gl) return
    const dataURL = gl.domElement.toDataURL('image/png', 1.0)
    const link = document.createElement('a')
    link.download = 'floacardstudio-export.png'
    link.href = dataURL
    link.click()
  }, [])

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
      setSettings((prev) => {
        let newY = prev.rotY + dx * 0.45
        while (newY > 180) newY -= 360
        while (newY < -180) newY += 360
        return {
          ...prev,
          autoRotate: false,
          rotY: newY,
          rotX: Math.max(-90, Math.min(90, prev.rotX - dy * 0.35)),
        }
      })
    } else if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2
      setTilt({ x: ny * -4, y: nx * 4 })
    }
  }, [])

  const onPointerUp = useCallback(() => { isDragging.current = false }, [])
  const onMouseLeave = useCallback(() => {
    isDragging.current = false
    setTilt({ x: 0, y: 0 })
  }, [])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f0f0f5]">
      <div className="flex-1 relative min-w-0">
        <Header onExport={handleExport} onRestart={handleRestart} />

        <div
          ref={containerRef}
          className="absolute inset-0 canvas-drag select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onMouseLeave={onMouseLeave}
        >
          <CardScene settings={settings} tilt={tilt} glRef={glRef} />
        </div>

        <BottomBar settings={settings} onChange={handleChange} />
      </div>

      <ControlPanel settings={settings} onChange={handleChange} onReset={handleReset} />

      {/* ── Orientation change warning dialog ── */}
      {pendingOrientation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
            onClick={cancelOrientationChange}
          />
          {/* Dialog */}
          <div className="relative bg-white rounded-2xl shadow-2xl border border-black/[0.07] p-6 w-[360px] mx-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-500" style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-black/85 mb-1.5">
                  Change orientation?
                </h3>
                <p className="text-[13px] text-black/50 leading-relaxed">
                  Switching to <span className="font-medium text-black/65 capitalize">{pendingOrientation}</span> will
                  remove your imported images — they won't match the new card format.
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
                className="px-4 py-2 rounded-xl text-[13px] font-medium bg-[#1a1a1a] text-white hover:bg-[#2d2d2d] transition-all active:scale-[0.97]"
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
