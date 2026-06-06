import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { Icon } from '@/components/ui/icon'
import { type User } from '@supabase/supabase-js'
import { CardScene } from './components/CardScene'
import { ControlPanel } from './components/ControlPanel'
import { BottomBar } from './components/BottomBar'
import { Header } from './components/Header'
import { LeftPanel } from './components/LeftPanel'
import { BuyCreditsModal } from './components/BuyCreditsModal'
import { RoadmapModal } from './components/RoadmapModal'
import { FeedbackPromptModal } from './components/FeedbackPromptModal'
import { SmallScreenBlock } from './components/SmallScreenBlock'
import { LoginModal } from './components/LoginModal'
import { type CardSettings, type CardPage, type Workspace, type Orientation, type SavedPose } from './types'
import { contrastColor } from './lib/utils'
import { randomizePoses } from './lib/randomize'
import { supabase } from './lib/supabase'
import { useCredits, EXPORT_COST } from './hooks/useCredits'
import { trackExport, trackOpenBuyCredits, trackPurchase, trackSignOut, identifyUser, trackRandomize, trackReset, trackDisplayCountChange, trackOrientationChange, trackImageUpload, trackTabSwitch, trackCameraModeChange, trackAddWorkspace } from './lib/analytics'
import { DEFAULT_FRONT_URL } from './constants'

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
  orientation: 'horizontal',
  edgeColor: '#9AE600',
  frontImage: DEFAULT_FRONT_URL,
  backImage: null,
  autoRotate: false,
  lightIntensity: 1.15,
  bgColor: '#1d1d1d',
  cameraFov:  42,
  cameraMode: 'perspective',
}

/* ── Fixed export canvas size (independent of browser window) ────── */
const EXPORT_W = 1600
const EXPORT_H = 1000

/* ── Camera Z per display count (mirrors CardScene) ─────────────── */
const CAM_Z_MAP: Record<number, number> = { 1: 5.4, 2: 8.5, 3: 12.0 }
const CAM_FOV_TAN = Math.tan((42 / 2) * (Math.PI / 180))

/* ── Initial workspace ───────────────────────────────────────────── */
const INIT_PAGE_ID = 'page-init'
const INIT_WS_ID   = 'ws-init'

async function loadDefaultCardImage(): Promise<string | null> {
  try {
    const res = await fetch('/default-card.png')
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string ?? null)
      reader.readAsDataURL(blob)
    })
  } catch { return null }
}

function makeInitWorkspace(): Workspace {
  const page: CardPage = { id: INIT_PAGE_ID, name: 'Card 1', settings: { ...DEFAULT_SETTINGS } }
  return { id: INIT_WS_ID, name: 'Workspace 1', displayCount: 1, pages: [page], activePageId: INIT_PAGE_ID }
}

function makeId() { return Math.random().toString(36).slice(2, 9) }

/* ── LocalStorage persistence ────────────────────────────────────── */
const LS_WORKSPACES = 'cs-workspaces'
const LS_ACTIVE_WS  = 'cs-active-ws'

/* Migre les vieilles valeurs par défaut vers les nouvelles */
function migrateWorkspaces(workspaces: Workspace[]): Workspace[] {
  return workspaces.map((ws) => ({
    ...ws,
    pages: ws.pages.map((p) => ({
      ...p,
      settings: {
        ...p.settings,
        bgColor:   p.settings.bgColor   === '#f0f0f5' ? '#1d1d1d' : p.settings.bgColor,
        edgeColor: p.settings.edgeColor === '#009FFF' ? '#9AE600' : p.settings.edgeColor,
      },
    })),
  }))
}

function loadWorkspaces(): { workspaces: Workspace[]; activeWorkspaceId: string } {
  try {
    const raw = localStorage.getItem(LS_WORKSPACES)
    const id  = localStorage.getItem(LS_ACTIVE_WS)
    if (raw) {
      const workspaces: Workspace[] = migrateWorkspaces(JSON.parse(raw))
      return { workspaces, activeWorkspaceId: id ?? workspaces[0]?.id ?? INIT_WS_ID }
    }
  } catch { /* ignore */ }
  return { workspaces: [makeInitWorkspace()], activeWorkspaceId: INIT_WS_ID }
}

function saveWorkspaces(workspaces: Workspace[], activeWorkspaceId: string) {
  try {
    localStorage.setItem(LS_WORKSPACES, JSON.stringify(workspaces))
    localStorage.setItem(LS_ACTIVE_WS,  activeWorkspaceId)
  } catch {
    // Quota exceeded (images too heavy) — retry without images
    try {
      const slim = workspaces.map((ws) => ({
        ...ws,
        pages: ws.pages.map((p) => ({
          ...p,
          settings: { ...p.settings, frontImage: null, backImage: null },
        })),
      }))
      localStorage.setItem(LS_WORKSPACES, JSON.stringify(slim))
      localStorage.setItem(LS_ACTIVE_WS,  activeWorkspaceId)
    } catch { /* give up */ }
  }
}

function clearWorkspaces() {
  localStorage.removeItem(LS_WORKSPACES)
  localStorage.removeItem(LS_ACTIVE_WS)
}

/* ── Canvas skeleton ─────────────────────────────────────────────── */
function cardSilhouetteColor(bgColor: string): string {
  if (bgColor === 'transparent') return 'rgba(0,0,0,0.06)'
  if (bgColor.startsWith('linear') || bgColor.startsWith('radial')) return 'rgba(255,255,255,0.10)'
  // Luminance from hex
  const r = parseInt(bgColor.slice(1, 3), 16)
  const g = parseInt(bgColor.slice(3, 5), 16)
  const b = parseInt(bgColor.slice(5, 7), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.5 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.10)'
}

function CanvasSkeleton({
  bgColor,
  isVertical,
  ready,
}: {
  bgColor:    string
  isVertical: boolean
  ready:      boolean
}) {
  const bg = bgColor === 'transparent'
    ? 'repeating-conic-gradient(#d8d8d8 0% 25%, #f0f0f0 0% 50%) 0 0 / 20px 20px'
    : bgColor

  const silhouette = cardSilhouetteColor(bgColor)

  /* Card aspect ratio ISO 7810 : 85.6 × 53.98 mm */
  const cardW = isVertical ? '22vh' : '50vh'
  const cardH = isVertical ? '34vh' : '32vh'

  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-500 pointer-events-none"
      style={{ background: bg, opacity: ready ? 0 : 1 }}
    >
      <div
        className="animate-pulse"
        style={{
          width:        cardW,
          height:       cardH,
          borderRadius: '1.8vh',
          background:   silhouette,
          boxShadow:    '0 28px 56px -8px rgba(85,102,170,0.12)',
        }}
      />
    </div>
  )
}

/* ── Dot parallax background ─────────────────────────────────────── */
function DotBackground() {
  const ref = useRef<HTMLDivElement>(null)
  const raf = useRef<number | null>(null)
  const target = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function onMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect()
      // Normalize to -1 → 1
      const nx = (e.clientX - rect.left) / rect.width  * 2 - 1
      const ny = (e.clientY - rect.top)  / rect.height * 2 - 1
      target.current = { x: nx * 14, y: ny * 10 }
    }

    function onLeave() {
      target.current = { x: 0, y: 0 }
    }

    function tick() {
      // Lerp toward target
      current.current.x += (target.current.x - current.current.x) * 0.06
      current.current.y += (target.current.y - current.current.y) * 0.06
      if (el) el.style.transform = `translate(${current.current.x}px, ${current.current.y}px)`
      raf.current = requestAnimationFrame(tick)
    }

    el.parentElement?.addEventListener('mousemove', onMove)
    el.parentElement?.addEventListener('mouseleave', onLeave)
    raf.current = requestAnimationFrame(tick)

    return () => {
      el.parentElement?.removeEventListener('mousemove', onMove)
      el.parentElement?.removeEventListener('mouseleave', onLeave)
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [])

  return (
    <div
      ref={ref}
      className="absolute pointer-events-none"
      style={{
        inset: '-30px',
        zIndex: 5,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.13) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 55%, rgba(0,0,0,0.7) 78%, black 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 55%, rgba(0,0,0,0.7) 78%, black 100%)',
      }}
    />
  )
}

/* ── Gradient helper — peint un fond dégradé sur un ctx 2D ─────── */
function drawGradientRect(ctx: CanvasRenderingContext2D, bgColor: string, w: number, h: number) {
  const lin = bgColor.match(/linear-gradient\((\d+)deg,\s*(#[0-9a-fA-F]{6}),\s*(#[0-9a-fA-F]{6})\)/)
  if (lin) {
    const angle = parseInt(lin[1])
    const c1 = lin[2], c2 = lin[3]
    const rad = (angle * Math.PI) / 180
    const dX = Math.sin(rad), dY = -Math.cos(rad)
    const len = Math.abs(w * dX) + Math.abs(h * dY)
    const x1 = w / 2 - dX * len / 2, y1 = h / 2 - dY * len / 2
    const x2 = w / 2 + dX * len / 2, y2 = h / 2 + dY * len / 2
    const g = ctx.createLinearGradient(x1, y1, x2, y2)
    g.addColorStop(0, c1); g.addColorStop(1, c2)
    ctx.fillStyle = g
  } else {
    const rad = bgColor.match(/radial-gradient\(circle,\s*(#[0-9a-fA-F]{6}),\s*(#[0-9a-fA-F]{6})\)/)
    if (rad) {
      const c1 = rad[1], c2 = rad[2]
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 2)
      g.addColorStop(0, c1); g.addColorStop(1, c2)
      ctx.fillStyle = g
    } else {
      ctx.fillStyle = bgColor
    }
  }
  ctx.fillRect(0, 0, w, h)
}

/* ── App ─────────────────────────────────────────────────────────── */
export default function App() {
  const _init = loadWorkspaces()
  const [workspaces,         setWorkspaces]         = useState<Workspace[]>(_init.workspaces)
  const [activeWorkspaceId,  setActiveWorkspaceId]  = useState<string>(_init.activeWorkspaceId)
  const [tilt,               setTilt]               = useState({ x: 0, y: 0 })
  const [altHeld,            setAltHeld]            = useState(false)
  const [pendingOrientation, setPendingOrientation] = useState<Orientation | null>(null)
  const [showReloadConfirm,  setShowReloadConfirm]  = useState(false)
  const [screenTooSmall,     setScreenTooSmall]     = useState(window.innerWidth < 790)
  const [showBuyCredits,     setShowBuyCredits]     = useState(false)
  const [showLoginModal,     setShowLoginModal]     = useState(false)
  const [controlPanelTab,   setControlPanelTab]   = useState<'create' | 'export'>('create')
  const returnToExportRef = useRef(false)
  const [showRoadmap,        setShowRoadmap]        = useState(false)
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false)

  const triggerFeedbackIfNeeded = useCallback(() => {
    const count = (parseInt(localStorage.getItem('cs_export_count') ?? '0', 10)) + 1
    localStorage.setItem('cs_export_count', String(count))
    // Show after 1st export, then every 3 (1, 4, 7, 10…)
    if (count === 1 || (count - 1) % 3 === 0) {
      setTimeout(() => setShowFeedbackPrompt(true), 1200)
    }
  }, [])
  const [creditSuccess,      setCreditSuccess]      = useState(false)
  const [sceneReady,         setSceneReady]         = useState(false)
  const [skeletonGone,       setSkeletonGone]       = useState(false)

  useEffect(() => {
    const check = () => setScreenTooSmall(window.innerWidth < 790)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleSceneReady = useCallback(() => {
    setSceneReady(true)
    setTimeout(() => setSkeletonGone(true), 650)
  }, [])


  /* ── Current user ── */
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showLoginToast, setShowLoginToast] = useState(false)
  const [showLogoutToast, setShowLogoutToast] = useState(false)
  const loginToastShownRef = useRef(false)
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user ?? null)
      if (event === 'SIGNED_IN') {
        if (session?.user) identifyUser(session.user.id, session.user.email)
        // Only show toast once per session (tab switching re-fires SIGNED_IN)
        if (!loginToastShownRef.current) {
          loginToastShownRef.current = true
          setShowLoginToast(true)
          setTimeout(() => setShowLoginToast(false), 3500)
        }
        if (returnToExportRef.current) {
          setControlPanelTab('export')
          returnToExportRef.current = false
        }
      }
      if (event === 'SIGNED_OUT') {
        loginToastShownRef.current = false
        setShowLogoutToast(true)
        setTimeout(() => setShowLogoutToast(false), 3500)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  /* ── Credits ── */
  const { balance: credits, loading: creditsLoading } = useCredits(currentUser?.id)

  // En dev : crédits fictifs illimités (affiche ∞ dans le header)
  const displayCredits = import.meta.env.DEV
    ? 10000
    : (currentUser?.id ? credits : null)

  /* ── Handle ?credits=ok return from Stripe ── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('credits') === 'ok') {
      trackPurchase('unknown', 0)   // pack details not available on return
      setCreditSuccess(true)
      window.history.replaceState({}, '', window.location.pathname)
      setTimeout(() => setCreditSuccess(false), 4000)
    }
  }, [])

  /* ── Derived from active workspace ── */
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0]
  const { pages, displayCount, activePageId } = activeWorkspace
  const activePage    = pages.find((p) => p.id === activePageId) ?? pages[0]
  const settings      = activePage.settings
  const displayedPages = pages.slice(0, displayCount).map((p) => ({
    id:       p.id,
    settings: p.settings,
    isActive: p.id === activePageId,
  }))

  /* ── Refs (stable for use inside callbacks) ── */
  const glRef        = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef     = useRef<THREE.Scene | null>(null)
  const cameraRef    = useRef<THREE.Camera | null>(null)
  const isDragging   = useRef(false)
  const lastPointer  = useRef({ x: 0, y: 0 })
  const pointerStart = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  /* ── Drag throttle — bufferise les deltas, flush 1× par frame ── */
  const dragBuf = useRef<Partial<{ rotX: number; rotY: number; posX: number; posY: number; autoRotate: boolean }>>({})
  const dragRaf = useRef<number | null>(null)

  const settingsRef        = useRef(settings)
  const activeWsRef        = useRef(activeWorkspace)
  const activeWsIdRef      = useRef(activeWorkspaceId)

  useEffect(() => { settingsRef.current   = settings        }, [settings])
  useEffect(() => { activeWsRef.current   = activeWorkspace }, [activeWorkspace])
  useEffect(() => { activeWsIdRef.current = activeWorkspaceId }, [activeWorkspaceId])

  /* ── Persist workspaces to localStorage (debounced 400ms) ── */
  useEffect(() => {
    const t = setTimeout(() => saveWorkspaces(workspaces, activeWorkspaceId), 400)
    return () => clearTimeout(t)
  }, [workspaces, activeWorkspaceId])

  /* ── Helper: mutate only the active workspace ── */
  const patchWs = useCallback((fn: (ws: Workspace) => Workspace) => {
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === activeWsIdRef.current ? fn(w) : w)),
    )
  }, [])

  /* ── Helper: patch active card's settings ── */
  const update = useCallback((patch: Partial<CardSettings>) => {
    patchWs((ws) => ({
      ...ws,
      pages: ws.pages.map((p) =>
        p.id === ws.activePageId ? { ...p, settings: { ...p.settings, ...patch } } : p,
      ),
    }))
  }, [patchWs])

  /* ── Saved poses (persisted in localStorage) ── */
  const [savedPoses, setSavedPoses] = useState<SavedPose[]>(() => {
    try { return JSON.parse(localStorage.getItem('cs-saved-poses') ?? '[]') } catch { return [] }
  })
  useEffect(() => {
    localStorage.setItem('cs-saved-poses', JSON.stringify(savedPoses))
  }, [savedPoses])

  const handleSavePose   = useCallback((pose: SavedPose) => setSavedPoses((p) => [...p, pose]), [])
  const handleDeletePose = useCallback((id: string) => setSavedPoses((p) => p.filter((x) => x.id !== id)), [])
  const handleRenamePose = useCallback((id: string, name: string) =>
    setSavedPoses((p) => p.map((x) => x.id === id ? { ...x, name } : x)), [])
  const handleApplyPose  = useCallback((pose: SavedPose) => {
    update({ rotX: pose.rotX, rotY: pose.rotY, rotZ: pose.rotZ, zoom: pose.zoom, posX: pose.posX, posY: pose.posY, posZ: pose.posZ, autoRotate: pose.autoRotate })
  }, [update])

  /* ── Bloquer clic droit (protection contre save-image) ── */
  useEffect(() => {
    const block = (e: MouseEvent) => e.preventDefault()
    document.addEventListener('contextmenu', block)
    return () => document.removeEventListener('contextmenu', block)
  }, [])

  /* ── Alt key tracking ── */
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === 'Alt') { e.preventDefault(); setAltHeld(true) } }
    const up   = (e: KeyboardEvent) => { if (e.key === 'Alt') setAltHeld(false) }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup',   up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  /* ── Global paste handler ── */
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
        trackImageUpload('paste')
        patchWs((ws) => ({
          ...ws,
          pages: ws.pages.map((p) => {
            if (p.id !== ws.activePageId) return p
            const { frontImage, backImage } = p.settings
            if (!frontImage) return { ...p, settings: { ...p.settings, frontImage: dataUrl } }
            if (!backImage)  return { ...p, settings: { ...p.settings, backImage: dataUrl } }
            return                   { ...p, settings: { ...p.settings, frontImage: dataUrl } }
          }),
        }))
      }
      reader.readAsDataURL(file)
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [patchWs])

  /* ── Orientation change intercept ── */
  const handleChange = useCallback(
    (patch: Partial<CardSettings>) => {
      if ('cameraMode' in patch && patch.cameraMode) trackCameraModeChange(patch.cameraMode)
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
    trackOrientationChange(pendingOrientation)
    update({ orientation: pendingOrientation, frontImage: null, backImage: null })
    setPendingOrientation(null)
  }, [pendingOrientation, update])

  const cancelOrientationChange = useCallback(() => setPendingOrientation(null), [])

  /* ── Pristine check ── */
  const isPristine = useMemo(() => {
    if (workspaces.length !== 1) return false
    const ws = workspaces[0]
    if (ws.pages.length !== 1 || ws.displayCount !== 1) return false
    const s = ws.pages[0].settings
    if ((s.frontImage && s.frontImage !== DEFAULT_FRONT_URL) || s.backImage) return false
    const keys = [
      'rotX','rotY','rotZ','zoom','posX','posY','posZ',
      'finish','orientation','edgeColor','autoRotate','lightIntensity','bgColor',
    ] as const
    return keys.every((k) => (s[k] as unknown) === (DEFAULT_SETTINGS[k] as unknown))
  }, [workspaces])

  /* ── Logo click ── */
  const handleLogoClick = useCallback(() => {
    if (isPristine) window.location.reload()
    else setShowReloadConfirm(true)
  }, [isPristine])

  /* ── Reset active card ── */
  const handleReset = useCallback(() => {
    trackReset()
    patchWs((ws) => ({
      ...ws,
      pages: ws.pages.map((p) =>
        p.id === ws.activePageId
          ? { ...p, settings: {
              ...DEFAULT_SETTINGS,
              frontImage:  p.settings.frontImage,
              backImage:   p.settings.backImage,
              finish:      p.settings.finish,
              orientation: p.settings.orientation,
            }}
          : p,
      ),
    }))
  }, [patchWs])

  /* ── Randomize poses ── */
  const handleRandomize = useCallback(() => {
    trackRandomize()
    const count = activeWsRef.current.displayCount as 1 | 2 | 3
    const patches = randomizePoses(count)
    patchWs((ws) => {
      const next = [...ws.pages]
      patches.forEach((patch, i) => {
        if (!next[i]) return
        next[i] = { ...next[i], settings: { ...next[i].settings, ...patch } }
      })
      return { ...ws, pages: next }
    })
  }, [patchWs])

  /* ── Full restart ── */
  const handleRestart = useCallback(() => {
    clearWorkspaces()
    setWorkspaces([makeInitWorkspace()])
    setActiveWorkspaceId(INIT_WS_ID)
  }, [])

  /* ── Display count change (within active workspace) ── */
  const handleDisplayCountChange = useCallback((count: 1 | 2 | 3) => {
    trackDisplayCountChange(count)
    patchWs((ws) => {
      const pages = [...ws.pages]
      while (pages.length < count) {
        pages.push({ id: makeId(), name: `Card ${pages.length + 1}`, settings: { ...DEFAULT_SETTINGS } })
      }
      const visibleIds   = pages.slice(0, count).map((p) => p.id)
      const activePageId = visibleIds.includes(ws.activePageId) ? ws.activePageId : pages[0].id
      return { ...ws, displayCount: count, pages, activePageId }
    })
  }, [patchWs])

  /* ── Select card within workspace ── */
  const handleSelectPage = useCallback((id: string) => {
    patchWs((ws) => ({ ...ws, activePageId: id }))
  }, [patchWs])

  /* ── Workspace management ── */
  const handleAddWorkspace = useCallback(() => {
    trackAddWorkspace()
    const page: CardPage = { id: makeId(), name: 'Card 1', settings: { ...DEFAULT_SETTINGS } }
    const ws: Workspace  = {
      id:           makeId(),
      name:         `Workspace ${workspaces.length + 1}`,
      displayCount: 1,
      pages:        [page],
      activePageId: page.id,
    }
    setWorkspaces((prev) => [...prev, ws])
    setActiveWorkspaceId(ws.id)
  }, [workspaces.length])

  const handleDeleteWorkspace = useCallback((id: string) => {
    setWorkspaces((prev) => {
      if (prev.length <= 1) return prev
      const next = prev.filter((w) => w.id !== id)
      if (activeWsIdRef.current === id) setActiveWorkspaceId(next[0].id)
      return next
    })
  }, [])

  const handleSelectWorkspace = useCallback((id: string) => {
    setActiveWorkspaceId(id)
  }, [])

  /* ── Capture preview (used by ExportTab thumbnail) ── */
  const capturePreview = useCallback((opts?: { showShadow?: boolean }): { dataUrl: string; cssW: number; cssH: number } | null => {
    const gl     = glRef.current
    const scene  = sceneRef.current
    const camera = cameraRef.current
    if (!gl || !scene || !camera) return null

    const isTransparent = settingsRef.current.bgColor === 'transparent'
    const showShadow    = opts?.showShadow ?? true

    /* Save renderer state */
    const origDpr = gl.getPixelRatio()
    const origW   = gl.domElement.clientWidth
    const origH   = gl.domElement.clientHeight

    /* Save + update camera aspect for fixed export dimensions */
    let savedAspect: number | null = null
    let savedOrthoLeft: number | null = null
    let savedOrthoRight: number | null = null
    if (camera instanceof THREE.PerspectiveCamera) {
      savedAspect   = camera.aspect
      camera.aspect = EXPORT_W / EXPORT_H
      camera.updateProjectionMatrix()
    } else if (camera instanceof THREE.OrthographicCamera) {
      savedOrthoLeft  = camera.left
      savedOrthoRight = camera.right
      const halfH = (camera.top - camera.bottom) / 2
      const halfW = halfH * (EXPORT_W / EXPORT_H)
      camera.left  = -halfW
      camera.right =  halfW
      camera.updateProjectionMatrix()
    }

    /* Render at fixed export ratio (scale 1 for speed) */
    gl.setPixelRatio(1)
    gl.setSize(EXPORT_W, EXPORT_H, false)

    const bgLayers    = scene.getObjectByName('bg-layers')
    const shadowLayer = scene.getObjectByName('shadow-layer')

    /* Hide selection dots — they live on layer 1, disable it on the camera */
    camera.layers.disable(1)

    if (shadowLayer && !showShadow) shadowLayer.visible = false

    let dataUrl: string

    const bgColor    = settingsRef.current.bgColor
    const isGradient = bgColor.startsWith('linear-gradient') || bgColor.startsWith('radial-gradient')

    if (isTransparent) {
      if (bgLayers) bgLayers.visible = false
      const savedColor = new THREE.Color()
      gl.getClearColor(savedColor)
      const savedAlpha = gl.getClearAlpha()
      gl.setClearColor(0x000000, 0)
      gl.clear()
      gl.render(scene, camera)
      dataUrl = gl.domElement.toDataURL('image/png', 0.85)
      gl.setClearColor(savedColor, savedAlpha)
      if (bgLayers) bgLayers.visible = true
    } else if (isGradient) {
      gl.setClearColor(0x000000, 0)
      gl.clear()
      gl.render(scene, camera)
      const comp = document.createElement('canvas')
      comp.width  = EXPORT_W
      comp.height = EXPORT_H
      const ctx = comp.getContext('2d')!
      drawGradientRect(ctx, bgColor, EXPORT_W, EXPORT_H)
      // drawImage depuis le canvas WebGL directement = synchrone, pas besoin de toDataURL
      ctx.drawImage(gl.domElement, 0, 0, EXPORT_W, EXPORT_H)
      dataUrl = comp.toDataURL('image/png', 0.85)
    } else {
      gl.render(scene, camera)
      dataUrl = gl.domElement.toDataURL('image/png', 0.85)
    }

    /* Restore shadow + selection layer */
    if (shadowLayer) shadowLayer.visible = true
    camera.layers.enable(1)

    /* Restore renderer + camera */
    gl.setPixelRatio(origDpr)
    gl.setSize(origW, origH, false)
    if (camera instanceof THREE.PerspectiveCamera && savedAspect !== null) {
      camera.aspect = savedAspect
      camera.updateProjectionMatrix()
    } else if (camera instanceof THREE.OrthographicCamera && savedOrthoLeft !== null && savedOrthoRight !== null) {
      camera.left  = savedOrthoLeft
      camera.right = savedOrthoRight
      camera.updateProjectionMatrix()
    }
    gl.render(scene, camera)

    return { dataUrl, cssW: EXPORT_W, cssH: EXPORT_H }
  }, [])

  /* ── Export (raw WebGL, appelé après vérification crédits) ── */
  const doExport = useCallback((opts: { format: 'png' | 'jpg'; scale: number; showShadow: boolean }) => {
    const gl     = glRef.current
    const scene  = sceneRef.current
    const camera = cameraRef.current
    if (!gl || !scene || !camera) return

    const isTransparent = settingsRef.current.bgColor === 'transparent'

    /* Save original renderer state */
    const origDpr = gl.getPixelRatio()
    const origW   = gl.domElement.clientWidth
    const origH   = gl.domElement.clientHeight

    /* Save + update camera aspect ratio for fixed export dimensions */
    let savedAspect: number | null = null
    let savedOrthoLeft: number | null = null
    let savedOrthoRight: number | null = null
    if (camera instanceof THREE.PerspectiveCamera) {
      savedAspect   = camera.aspect
      camera.aspect = EXPORT_W / EXPORT_H
      camera.updateProjectionMatrix()
    } else if (camera instanceof THREE.OrthographicCamera) {
      savedOrthoLeft  = camera.left
      savedOrthoRight = camera.right
      const halfH = (camera.top - camera.bottom) / 2
      const halfW = halfH * (EXPORT_W / EXPORT_H)
      camera.left  = -halfW
      camera.right =  halfW
      camera.updateProjectionMatrix()
    }

    const bgLayers    = scene.getObjectByName('bg-layers')
    const shadowLayer  = scene.getObjectByName('shadow-layer')

    /* Hide selection dots — disable layer 1 on camera */
    camera.layers.disable(1)

    /* Resize to fixed export dimensions */
    gl.setPixelRatio(opts.scale)
    gl.setSize(EXPORT_W, EXPORT_H, false)

    /* Apply shadow visibility */
    if (shadowLayer && !opts.showShadow) shadowLayer.visible = false

    let dataURL: string

    const bgColor    = settingsRef.current.bgColor
    const isGradient = bgColor.startsWith('linear-gradient') || bgColor.startsWith('radial-gradient')

    if (isTransparent) {
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
    } else if (isGradient) {
      /* Render scene transparent, then composite gradient + scene on a 2D canvas */
      const savedColor = new THREE.Color()
      gl.getClearColor(savedColor)
      const savedAlpha = gl.getClearAlpha()
      gl.setClearColor(0x000000, 0)
      gl.clear()
      gl.render(scene, camera)
      const sceneDataUrl = gl.domElement.toDataURL('image/png', 1.0)
      gl.setClearColor(savedColor, savedAlpha)

      const exportW = EXPORT_W * opts.scale
      const exportH = EXPORT_H * opts.scale
      const comp = document.createElement('canvas')
      comp.width  = exportW
      comp.height = exportH
      const ctx = comp.getContext('2d')!
      drawGradientRect(ctx, bgColor, exportW, exportH)
      const img = new Image()
      img.src = sceneDataUrl
      img.onload = () => {
        ctx.drawImage(img, 0, 0, exportW, exportH)
        const mimeType = opts.format === 'jpg' ? 'image/jpeg' : 'image/png'
        const quality  = opts.format === 'jpg' ? 0.95 : 1.0
        const finalUrl = comp.toDataURL(mimeType, quality)
        const ext  = opts.format
        const link = document.createElement('a')
        link.download = `cardistrystudio-export-${EXPORT_W}x${EXPORT_H}@${opts.scale}x.${ext}`
        link.href = finalUrl; link.click()
      }
      /* Restore canvas size + camera early for gradient path */
      gl.setPixelRatio(origDpr)
      gl.setSize(origW, origH, false)
      if (camera instanceof THREE.PerspectiveCamera && savedAspect !== null) {
        camera.aspect = savedAspect; camera.updateProjectionMatrix()
      } else if (camera instanceof THREE.OrthographicCamera && savedOrthoLeft !== null && savedOrthoRight !== null) {
        camera.left = savedOrthoLeft; camera.right = savedOrthoRight; camera.updateProjectionMatrix()
      }
      gl.render(scene, camera)
      if (shadowLayer) shadowLayer.visible = true
      camera.layers.enable(1)
      trackExport(opts.format, opts.scale)
      triggerFeedbackIfNeeded()
      return
    } else {
      gl.render(scene, camera)
      const mimeType = opts.format === 'jpg' ? 'image/jpeg' : 'image/png'
      const quality  = opts.format === 'jpg' ? 0.95 : 1.0
      dataURL = gl.domElement.toDataURL(mimeType, quality)
    }

    /* Restore shadow + selection layer */
    if (shadowLayer) shadowLayer.visible = true
    camera.layers.enable(1)

    /* Restore canvas size + camera */
    gl.setPixelRatio(origDpr)
    gl.setSize(origW, origH, false)
    if (camera instanceof THREE.PerspectiveCamera && savedAspect !== null) {
      camera.aspect = savedAspect
      camera.updateProjectionMatrix()
    } else if (camera instanceof THREE.OrthographicCamera && savedOrthoLeft !== null && savedOrthoRight !== null) {
      camera.left  = savedOrthoLeft
      camera.right = savedOrthoRight
      camera.updateProjectionMatrix()
    }
    gl.render(scene, camera)

    const ext  = isTransparent ? 'png' : opts.format
    trackExport(ext, opts.scale)
    triggerFeedbackIfNeeded()
    const link = document.createElement('a')
    link.download = `cardistrystudio-export-${EXPORT_W}x${EXPORT_H}@${opts.scale}x.${ext}`
    link.href = dataURL; link.click()
  }, [])

  /* ── Export avec vérification crédits ── */
  const handleExport = useCallback(async (opts: { format: 'png' | 'jpg'; scale: number; showShadow: boolean }) => {
    // No authenticated user — prompt login (always, even in dev)
    if (!currentUser) { returnToExportRef.current = true; setShowLoginModal(true); return }

    // Dev mode — bypass credit logic only
    if (import.meta.env.DEV) { doExport(opts); return }

    // Still loading balance — don't open modal, just wait
    if (creditsLoading) return

    if ((credits ?? 0) < EXPORT_COST) {
      trackOpenBuyCredits()
      setShowBuyCredits(true)
      return
    }

    const { error } = await supabase.rpc('spend_credits', {
      p_user_id: currentUser.id,
      p_amount:  EXPORT_COST,
      p_reason:  'export',
    })

    if (error) {
      console.error('spend_credits error:', error)
      setShowBuyCredits(true)
      return
    }

    doExport(opts)
  }, [currentUser, credits, creditsLoading, doExport])

  /* ── Drag / rotate / translate ── */
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current   = true
    lastPointer.current  = { x: e.clientX, y: e.clientY }
    pointerStart.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  /* Flush drag buffer → React state, 1× par animation frame max */
  const flushDrag = useCallback(() => {
    dragRaf.current = null
    const patch = dragBuf.current
    if (!Object.keys(patch).length) return
    dragBuf.current = {}
    const activeId = activeWsRef.current.activePageId
    patchWs((ws) => ({
      ...ws,
      pages: ws.pages.map((p) =>
        p.id !== activeId ? p : { ...p, settings: { ...p.settings, ...patch } }
      ),
    }))
  }, [patchWs])

  const scheduleDragFlush = useCallback(() => {
    if (!dragRaf.current) dragRaf.current = requestAnimationFrame(flushDrag)
  }, [flushDrag])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging.current) {
      const dx = e.clientX - lastPointer.current.x
      const dy = e.clientY - lastPointer.current.y
      lastPointer.current = { x: e.clientX, y: e.clientY }

      if (e.altKey) {
        const containerW = containerRef.current?.getBoundingClientRect().width  || 800
        const containerH = containerRef.current?.getBoundingClientRect().height || 600
        const camZ = CAM_Z_MAP[activeWsRef.current.displayCount] ?? 5.4
        const senX = camZ * CAM_FOV_TAN * 2 / containerW
        const senY = camZ * CAM_FOV_TAN * 2 / containerH
        /* Accumule sur les valeurs déjà dans le buffer (ou dans le settings courant) */
        const baseX = dragBuf.current.posX ?? activeWsRef.current.pages.find(p => p.id === activeWsRef.current.activePageId)?.settings.posX ?? 0
        const baseY = dragBuf.current.posY ?? activeWsRef.current.pages.find(p => p.id === activeWsRef.current.activePageId)?.settings.posY ?? 0
        dragBuf.current.posX = baseX + dx * senX
        dragBuf.current.posY = baseY - dy * senY
      } else {
        const activePage = activeWsRef.current.pages.find(p => p.id === activeWsRef.current.activePageId)
        const baseY = dragBuf.current.rotY ?? activePage?.settings.rotY ?? 0
        const baseX = dragBuf.current.rotX ?? activePage?.settings.rotX ?? 0
        let newY = baseY + dx * 0.45
        while (newY >  180) newY -= 360
        while (newY < -180) newY += 360
        dragBuf.current.rotY       = newY
        dragBuf.current.rotX       = Math.max(-90, Math.min(90, baseX - dy * 0.35))
        dragBuf.current.autoRotate = false
      }
      scheduleDragFlush()
    } else if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const nx = ((e.clientX - rect.left) / rect.width  - 0.5) * 2
      const ny = ((e.clientY - rect.top)  / rect.height - 0.5) * 2
      setTilt({ x: ny * -4, y: nx * 4 })
    }
  }, [scheduleDragFlush])

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const ws = activeWsRef.current
    if (ws.displayCount > 1) {
      const dx   = e.clientX - pointerStart.current.x
      const dy   = e.clientY - pointerStart.current.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 6 && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const relX = (e.clientX - rect.left) / rect.width
        let slot: number
        if (ws.displayCount === 2) slot = relX < 0.5 ? 0 : 1
        else                       slot = relX < 1/3  ? 0 : relX < 2/3 ? 1 : 2
        const target = ws.pages[slot]
        if (target) patchWs((w) => ({ ...w, activePageId: target.id }))
      }
    }
    isDragging.current = false
  }, [patchWs])

  const onMouseLeave = useCallback(() => {
    isDragging.current = false
    setTilt({ x: 0, y: 0 })
    /* Flush immédiat si un RAF était en attente */
    if (dragRaf.current) { cancelAnimationFrame(dragRaf.current); dragRaf.current = null; flushDrag() }
  }, [flushDrag])

  /* ── Render ── */
  if (screenTooSmall) return <SmallScreenBlock currentUser={currentUser} />

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#141414]">

      {/* ── Left panel — workspaces ── */}
      <LeftPanel
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelect={handleSelectWorkspace}
        onAdd={handleAddWorkspace}
        onDelete={handleDeleteWorkspace}
        savedPoses={savedPoses}
        currentSettings={settings}
        onSavePose={handleSavePose}
        onApplyPose={handleApplyPose}
        onDeletePose={handleDeletePose}
        onRenamePose={handleRenamePose}
      />

      {/* ── Canvas column (header + viewport) ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Header bar ── */}
        <Header
          onRestart={handleRestart}
          onReset={handleReset}
          onRoadmap={() => setShowRoadmap(true)}
          onLogoClick={handleLogoClick}
          credits={displayCredits}
          onBuyCredits={() => setShowBuyCredits(true)}
          onSignIn={() => setShowLoginModal(true)}
          userEmail={currentUser?.email ?? null}
        />

        {/* ── Canvas viewport ── */}
        <div
          className="flex-1 relative min-w-0 overflow-hidden"
          style={{
            background: settings.bgColor === 'transparent'
              ? 'repeating-conic-gradient(#2a2a2a 0% 25%, #222 0% 50%) 0 0 / 20px 20px'
              : settings.bgColor,
          }}
        >
          {/* Dot parallax background */}
          <DotBackground />
          {/* Skeleton */}
          {!skeletonGone && (
            <CanvasSkeleton
              bgColor={settings.bgColor}
              isVertical={settings.orientation === 'vertical'}
              ready={sceneReady}
            />
          )}

          <div
            ref={containerRef}
            className={`absolute inset-0 select-none ${altHeld ? 'cursor-move' : 'canvas-drag'}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onContextMenu={(e) => e.preventDefault()}
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
              onReady={handleSceneReady}
            />
          </div>

          {displayCount > 1 && (
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-10 transition-all duration-200 pointer-events-none ${altHeld ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`}>
              <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-white/90 text-[11px] font-medium px-3 py-1.5 rounded-full">
                <span className="bg-white/20 rounded px-1.5 py-0.5 text-[10px] font-mono">⌥ Alt</span>
                <span>+ drag to move</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Bottom bar — barre fixe sous le canvas ── */}
        <BottomBar
          settings={settings}
          onChange={handleChange}
          displayCount={displayCount}
          onDisplayCountChange={handleDisplayCountChange}
          savedPoses={savedPoses}
          onSavePose={handleSavePose}
          onApplyPose={handleApplyPose}
          onDeletePose={handleDeletePose}
          onRenamePose={handleRenamePose}
        />
      </div>

      {/* ── Right control panel ── */}
      <ControlPanel
        settings={settings}
        displayCount={displayCount}
        onChange={handleChange}
        onReset={handleReset}
        onRandomize={handleRandomize}
        onExport={handleExport}
        onCapturePreview={capturePreview}
        tab={controlPanelTab}
        onTabChange={(tab) => { trackTabSwitch(tab); setControlPanelTab(tab) }}
      />

      {/* ── Reload confirm dialog ── */}
      {showReloadConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setShowReloadConfirm(false)} />
          <div className="relative bg-[#111] border border-[#242424] rounded-[24px] shadow-[0px_8px_12px_rgba(0,0,0,0.32)] p-6 w-[380px] mx-4 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between w-full">
              <div className="flex flex-col gap-2 w-[277px]">
                <p className="text-[16px] font-medium text-white leading-normal">Lose your progress?</p>
                <p className="text-[14px] font-medium text-[#999] leading-normal">Refreshing will reset your current design.<br/>Any unsaved work will be lost.</p>
              </div>
              <button onClick={() => setShowReloadConfirm(false)} className="text-white hover:text-white/60 transition-colors flex-shrink-0">
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="flex gap-4 w-full">
              <button onClick={() => setShowReloadConfirm(false)} className="flex-1 h-[41px] flex items-center justify-center px-6 rounded-full bg-[#242424] text-white text-[16px] font-medium hover:bg-[#2e2e2e] transition-colors">Keep editing</button>
              <button onClick={() => window.location.reload()} className="flex-1 h-[41px] flex items-center justify-center px-6 rounded-full bg-[#9ae600] text-[#111] text-[16px] font-medium hover:bg-[#aaff00] transition-colors active:scale-[0.97]">Refresh anyway</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Orientation warning dialog ── */}
      {pendingOrientation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={cancelOrientationChange} />
          <div className="relative bg-[#111] border border-[#242424] rounded-[24px] shadow-[0px_8px_12px_rgba(0,0,0,0.32)] p-6 w-[380px] mx-4 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between w-full">
              <div className="flex flex-col gap-2 w-[277px]">
                <p className="text-[16px] font-medium text-white leading-normal">Change orientation?</p>
                <p className="text-[14px] font-medium text-[#999] leading-normal">
                  Switching to <span className="capitalize">{pendingOrientation}</span> will remove your imported images – they won't match the new card format.
                </p>
              </div>
              <button onClick={cancelOrientationChange} className="text-white hover:text-white/60 transition-colors flex-shrink-0">
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="flex gap-4 w-full">
              <button onClick={cancelOrientationChange} className="flex-1 h-[41px] flex items-center justify-center px-6 rounded-full bg-[#242424] text-white text-[16px] font-medium hover:bg-[#2e2e2e] transition-colors">Cancel</button>
              <button onClick={confirmOrientationChange} className="flex-1 h-[41px] flex items-center justify-center px-6 rounded-full bg-[#9ae600] text-[#111] text-[16px] font-medium hover:bg-[#aaff00] transition-colors active:scale-[0.97]">Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Roadmap modal ── */}
      {showRoadmap && <RoadmapModal onClose={() => setShowRoadmap(false)} />}

      {/* ── Feedback prompt after export ── */}
      {showFeedbackPrompt && (
        <FeedbackPromptModal
          currentUser={currentUser}
          onClose={() => setShowFeedbackPrompt(false)}
        />
      )}

      {/* ── Login modal ── */}
      {showLoginModal && (
        <LoginModal
          reason="export"
          onClose={() => setShowLoginModal(false)}
        />
      )}

      {/* ── Buy credits modal ── */}
      {showBuyCredits && (
        <BuyCreditsModal
          currentBalance={displayCredits ?? 0}
          onClose={() => setShowBuyCredits(false)}
        />
      )}

      {/* ── Login success toast ── */}
      {showLoginToast && (
        <div style={{animation: 'toastDropDown 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards'}} className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2.5 bg-[#1e1e1e] border border-white/[0.07] text-white px-4 py-3 rounded-xl shadow-xl text-[13px] font-medium">
            <Icon name="check_circle" size={18} filled className="text-[#9ae600] flex-shrink-0" />
            Connecté avec succès !
          </div>
        </div>
      )}

      {/* ── Logout toast ── */}
      {showLogoutToast && (
        <div style={{animation: 'toastDropDown 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards'}} className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2.5 bg-[#1e1e1e] border border-white/[0.07] text-white px-4 py-3 rounded-xl shadow-xl text-[13px] font-medium">
            <Icon name="logout" size={18} className="text-white/50 flex-shrink-0" />
            Déconnecté avec succès
          </div>
        </div>
      )}

      {/* ── Credits purchase success toast ── */}
      {creditSuccess && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2.5 bg-[#1e1e1e] border border-white/[0.07] text-white px-4 py-3 rounded-xl shadow-xl text-[13px] font-medium">
            <Icon name="check_circle" size={18} filled className="text-emerald-400 flex-shrink-0" />
            Crédits ajoutés avec succès !
          </div>
        </div>
      )}
    </div>
  )
}
