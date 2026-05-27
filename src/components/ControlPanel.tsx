import { useRef, useCallback, useState, useEffect } from 'react'
import {
  ImageUp, RotateCcw, Play, Pause, Sun, RefreshCcw, CreditCard, Pipette, Eye,
} from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { type CardSettings } from '@/types'

/* ─── Helpers ──────────────────────────────────────────────────── */
function fmt(v: number, unit = '°') {
  const rounded = Math.round(v)
  return `${rounded > 0 ? '+' : ''}${rounded}${unit}`
}

function Section({ title, icon, children }: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="px-5 py-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-black/30">{icon}</span>
        <Label className="text-black/35">{title}</Label>
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  )
}

function SliderRow({ label, value, min, max, step = 1, unit = '°', onChange }: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-black/60 font-medium">{label}</span>
        <span className="text-[11px] text-black/35 font-mono tabular-nums w-12 text-right">
          {fmt(value, unit)}
        </span>
      </div>
      <Slider
        min={min} max={max} step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  )
}

/* ─── Vue rapide — icônes SVG ───────────────────────────────────── */
function IsoLeftIcon() {
  return (
    <svg viewBox="0 0 32 20" fill="none" style={{ width: 30, height: 19 }}>
      <path d="M2 14.5 L2 6 L8 4 L8 12.5 Z" fill="currentColor" fillOpacity="0.45" />
      <rect x="8" y="4" width="21" height="12" rx="1.8" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

function FrontIcon() {
  return (
    <svg viewBox="0 0 32 20" fill="none" style={{ width: 30, height: 19 }}>
      <rect x="4" y="4" width="24" height="12" rx="1.8" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

function IsoRightIcon() {
  return (
    <svg viewBox="0 0 32 20" fill="none" style={{ width: 30, height: 19 }}>
      <rect x="3" y="4" width="21" height="12" rx="1.8" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M24 4 L30 6 L30 14.5 L24 12.5 Z" fill="currentColor" fillOpacity="0.45" />
    </svg>
  )
}

const VIEW_PRESETS = [
  { id: 'iso-left',  label: 'Left iso',  icon: IsoLeftIcon,  rotX: -18, rotY: -32, rotZ: 0 },
  { id: 'front',     label: 'Front',     icon: FrontIcon,    rotX:   0, rotY:   0, rotZ: 0 },
  { id: 'iso-right', label: 'Right iso', icon: IsoRightIcon, rotX: -18, rotY:  32, rotZ: 0 },
] as const

/* ─── Drop zone ─────────────────────────────────────────────────── */
function DropZone({ label, image, onLoad }: {
  label: string
  image: string | null
  onLoad: (dataUrl: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'image/svg+xml') return
    const reader = new FileReader()
    reader.onload = (e) => onLoad(e.target?.result as string)
    reader.readAsDataURL(file)
  }, [onLoad])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.remove('drag-over')
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add('drag-over')
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-over')
  }, [])

  return (
    <div
      className="drop-zone relative rounded-xl border border-dashed border-black/12 bg-black/[0.025] hover:bg-black/[0.04] hover:border-black/20 transition-all cursor-pointer overflow-hidden"
      style={{ aspectRatio: '1.5874 / 1' }}
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {image ? (
        <>
          <img src={image} alt={label} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-xl">
            <RefreshCcw className="w-5 h-5 text-white mb-1.5" />
            <span className="text-white text-xs font-medium">Change</span>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <ImageUp className="w-5 h-5 text-black/25" />
          <div className="text-center">
            <p className="text-[11px] text-black/45 font-medium">{label}</p>
            <p className="text-[10px] text-black/25 mt-0.5">PNG · JPG · SVG</p>
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.svg"
        className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}

/* ─── Figma URL import ──────────────────────────────────────────── */
const INPUT_CLS = 'w-full text-[11px] px-2.5 py-2 rounded-lg border border-black/10 bg-black/[0.025] focus:outline-none focus:border-black/25 focus:bg-white transition-all placeholder:text-black/20'

function parseFigmaUrl(url: string): { fileId: string; nodeId: string } | null {
  try {
    const m = url.match(/figma\.com\/(?:file|design)\/([^/?]+)/)
    if (!m) return null
    const nodeId = new URL(url).searchParams.get('node-id')
    if (!nodeId) return null
    return { fileId: m[1], nodeId: nodeId.replace(/-/g, ':') }
  } catch { return null }
}

function FigmaImport({ onChange }: { onChange: (p: Partial<CardSettings>) => void }) {
  const [token,    setToken]    = useState(() => localStorage.getItem('fcs_figma_token') ?? '')
  const [frontUrl, setFrontUrl] = useState('')
  const [backUrl,  setBackUrl]  = useState('')
  const [loading,  setLoading]  = useState<'front' | 'back' | null>(null)
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => { localStorage.setItem('fcs_figma_token', token) }, [token])

  async function fetchFrame(url: string): Promise<string> {
    const parsed = parseFigmaUrl(url)
    if (!parsed) throw new Error('Invalid Figma URL — copy the frame link from Figma')
    const { fileId, nodeId } = parsed
    const res = await fetch(
      `https://api.figma.com/v1/images/${fileId}?ids=${encodeURIComponent(nodeId)}&format=png&scale=2`,
      { headers: { 'X-Figma-Token': token } }
    )
    if (res.status === 403) throw new Error('Token invalid or access denied')
    if (!res.ok) throw new Error(`Figma API error (${res.status})`)
    const data = await res.json()
    if (data.err) throw new Error(data.err)
    const imgUrl = data.images?.[nodeId]
    if (!imgUrl) throw new Error('Frame not found — check the URL')
    const blob = await (await fetch(imgUrl)).blob()
    return new Promise((resolve) => {
      const r = new FileReader()
      r.onload = (e) => resolve(e.target!.result as string)
      r.readAsDataURL(blob)
    })
  }

  async function apply(face: 'front' | 'back') {
    const url = face === 'front' ? frontUrl : backUrl
    if (!token) { setError('Enter your Figma personal access token'); return }
    if (!url)   { setError(`Paste the ${face} frame URL first`); return }
    setError(null); setLoading(face)
    try {
      const dataUrl = await fetchFrame(url)
      onChange(face === 'front' ? { frontImage: dataUrl } : { backImage: dataUrl })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally { setLoading(null) }
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-black/40 font-medium">Personal access token</span>
          <a
            href="https://www.figma.com/settings"
            target="_blank" rel="noopener noreferrer"
            className="text-[9px] text-black/30 hover:text-black/55 underline transition-colors"
          >
            Get token ↗
          </a>
        </div>
        <input
          type="password"
          placeholder="figd_••••••••••••••••"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className={cn(INPUT_CLS, 'font-mono tracking-widest')}
        />
      </div>

      <div>
        <p className="text-[10px] text-black/40 font-medium mb-1">Front frame</p>
        <div className="flex gap-1.5">
          <input
            type="text"
            placeholder="https://figma.com/design/…"
            value={frontUrl}
            onChange={(e) => setFrontUrl(e.target.value)}
            className={cn(INPUT_CLS, 'flex-1 min-w-0')}
          />
          <button
            onClick={() => apply('front')}
            disabled={loading !== null}
            className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-black/[0.05] hover:bg-black/[0.1] disabled:opacity-40 transition-all text-[13px] text-black/50"
          >
            {loading === 'front' ? <span className="animate-spin text-[10px]">◌</span> : '↓'}
          </button>
        </div>
      </div>

      <div>
        <p className="text-[10px] text-black/40 font-medium mb-1">Back frame</p>
        <div className="flex gap-1.5">
          <input
            type="text"
            placeholder="https://figma.com/design/…"
            value={backUrl}
            onChange={(e) => setBackUrl(e.target.value)}
            className={cn(INPUT_CLS, 'flex-1 min-w-0')}
          />
          <button
            onClick={() => apply('back')}
            disabled={loading !== null}
            className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-black/[0.05] hover:bg-black/[0.1] disabled:opacity-40 transition-all text-[13px] text-black/50"
          >
            {loading === 'back' ? <span className="animate-spin text-[10px]">◌</span> : '↓'}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-[10px] text-red-500/80 bg-red-50 px-2.5 py-1.5 rounded-lg leading-relaxed">
          {error}
        </p>
      )}

      <p className="text-[9px] text-black/20 leading-relaxed">
        In Figma: right-click a frame → Copy link to selection.
      </p>
    </div>
  )
}

/* ─── Import section with tabs ──────────────────────────────────── */
function ImportSection({ settings, onChange }: { settings: CardSettings; onChange: (p: Partial<CardSettings>) => void }) {
  const [tab, setTab] = useState<'image' | 'figma'>('image')

  return (
    <div>
      <div className="flex gap-0.5 p-0.5 bg-black/[0.05] rounded-xl mb-4">
        {(['image', 'figma'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 text-[11px] font-medium py-1.5 rounded-[10px] transition-all',
              tab === t
                ? 'bg-white shadow-sm text-black/70'
                : 'text-black/30 hover:text-black/50'
            )}
          >
            {t === 'image' ? 'Image' : 'Figma URL'}
          </button>
        ))}
      </div>

      {tab === 'image' ? (
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <p className="text-[11px] text-black/35 mb-1.5 font-medium">Front</p>
            <DropZone label="Front face" image={settings.frontImage} onLoad={(url) => onChange({ frontImage: url })} />
          </div>
          <div>
            <p className="text-[11px] text-black/35 mb-1.5 font-medium">Back</p>
            <DropZone label="Back face" image={settings.backImage} onLoad={(url) => onChange({ backImage: url })} />
          </div>
        </div>
      ) : (
        <FigmaImport onChange={onChange} />
      )}
    </div>
  )
}

/* ─── ControlPanel ──────────────────────────────────────────────── */
interface ControlPanelProps {
  settings: CardSettings
  onChange: (patch: Partial<CardSettings>) => void
  onReset: () => void
}

export function ControlPanel({ settings, onChange, onReset }: ControlPanelProps) {
  return (
    <aside className="flex flex-col w-[278px] min-w-[278px] h-screen bg-white border-l border-black/[0.07] overflow-y-auto shadow-[-8px_0_24px_-8px_rgba(0,0,0,0.06)]">

      <Section title="Import" icon={<CreditCard className="w-3.5 h-3.5" />}>
        <ImportSection settings={settings} onChange={onChange} />
      </Section>

      <Separator />

      <Section title="Edge" icon={<Pipette className="w-3.5 h-3.5" />}>
        <label className="relative flex items-center gap-3 cursor-pointer group">
          <div
            className="w-10 h-10 rounded-xl border border-black/10 shadow-sm flex-shrink-0 transition-transform group-hover:scale-105 group-active:scale-95"
            style={{ backgroundColor: settings.edgeColor }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-black/65">Edge color</p>
            <p className="text-[11px] font-mono text-black/35 uppercase tracking-wider mt-0.5">
              {settings.edgeColor}
            </p>
          </div>
          <input
            type="color"
            value={settings.edgeColor}
            onChange={(e) => onChange({ edgeColor: e.target.value })}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </label>
      </Section>

      <Separator />

      <Section title="Rotation" icon={<RotateCcw className="w-3.5 h-3.5" />}>
        <SliderRow label="Rotation X" value={settings.rotX} min={-90} max={90} onChange={(v) => onChange({ rotX: v })} />
        <SliderRow label="Rotation Y" value={settings.rotY} min={-180} max={180} onChange={(v) => onChange({ rotY: v })} />
        <SliderRow label="Rotation Z" value={settings.rotZ} min={-45} max={45} onChange={(v) => onChange({ rotZ: v })} />
        <SliderRow label="Zoom" value={settings.zoom} min={0.6} max={2.2} step={0.02} unit="×" onChange={(v) => onChange({ zoom: v })} />

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            {settings.autoRotate
              ? <Pause className="w-3.5 h-3.5 text-black/35" />
              : <Play  className="w-3.5 h-3.5 text-black/35" />
            }
            <span className="text-[12px] text-black/60 font-medium">Auto-rotate</span>
          </div>
          <Switch
            checked={settings.autoRotate}
            onCheckedChange={(v) => onChange({ autoRotate: v })}
          />
        </div>
      </Section>

      <Separator />

      <Section title="Quick views" icon={<Eye className="w-3.5 h-3.5" />}>
        <div className="grid grid-cols-3 gap-2">
          {VIEW_PRESETS.map(({ id, label, icon: Icon, rotX, rotY, rotZ }) => (
            <button
              key={id}
              onClick={() => onChange({ rotX, rotY, rotZ, autoRotate: false })}
              className={cn(
                'flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border border-black/10',
                'bg-black/[0.03] hover:bg-black/[0.07] hover:border-black/20',
                'text-black/40 hover:text-black/60 transition-all active:scale-95'
              )}
            >
              <Icon />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </button>
          ))}
        </div>
      </Section>

      <Separator />

      <Section title="Lighting" icon={<Sun className="w-3.5 h-3.5" />}>
        <SliderRow label="Intensity" value={settings.lightIntensity} min={0} max={2} step={0.05} unit="×" onChange={(v) => onChange({ lightIntensity: v })} />
      </Section>

      <Separator />

      <Section title="Reset" icon={<RefreshCcw className="w-3.5 h-3.5" />}>
        <button
          onClick={onReset}
          className={cn(
            'w-full flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-black/[0.03]',
            'hover:bg-black/[0.06] hover:border-black/15 transition-all text-black/50 hover:text-black/70',
            'text-[12px] font-medium py-2.5'
          )}
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Default view
        </button>
      </Section>

      <div className="flex-1 min-h-[40px]" />

      <div className="px-5 pb-5 pt-2">
        <p className="text-[10px] text-black/20 text-center tracking-wide">
          FloaCardStudio · 3D Card Viewer
        </p>
      </div>
    </aside>
  )
}
