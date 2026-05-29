import { useRef, useCallback, useState, useEffect } from 'react'
import {
  ImageUp, RotateCcw, Play, Pause, Sun, RefreshCcw, CreditCard, Pipette, Eye, Layers, Download, Move, ChevronDown, Shuffle, Zap,
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

function Section({ title, icon, children, defaultOpen = true }: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="px-5 py-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 group"
      >
        <div className="flex items-center gap-2">
          <span className="text-black/30">{icon}</span>
          <Label className="text-black/35 cursor-pointer select-none">{title}</Label>
        </div>
        <ChevronDown
          className={cn(
            'w-3 h-3 text-black/20 transition-transform duration-200 group-hover:text-black/40',
            open ? 'rotate-0' : '-rotate-90',
          )}
        />
      </button>
      <div className={cn(
        'grid transition-all duration-200 ease-in-out',
        open ? 'grid-rows-[1fr] mt-4' : 'grid-rows-[0fr]',
      )}>
        <div className="overflow-hidden">
          <div className="space-y-5">{children}</div>
        </div>
      </div>
    </div>
  )
}

function SliderRow({ label, value, min, max, step = 1, unit = '°', format: fmtFn, onChange }: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  format?: (v: number) => string
  onChange: (v: number) => void
}) {
  const [editing,  setEditing]  = useState(false)
  const [inputVal, setInputVal] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const display = fmtFn ? fmtFn(value) : fmt(value, unit)

  function startEdit() {
    setInputVal(String(value))
    setEditing(true)
  }

  function commitEdit(raw = inputVal) {
    const parsed = parseFloat(raw)
    if (!isNaN(parsed)) {
      onChange(Math.min(max, Math.max(min, parsed)))
    }
    setEditing(false)
  }

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-black/60 font-medium">{label}</span>
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={() => commitEdit()}
            onKeyDown={(e) => {
              if (e.key === 'Enter')  { e.preventDefault(); commitEdit() }
              if (e.key === 'Escape') setEditing(false)
            }}
            className="text-[11px] font-mono tabular-nums w-14 text-right rounded-md px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 focus:outline-none focus:border-blue-400"
          />
        ) : (
          <span
            role="button"
            tabIndex={0}
            onClick={startEdit}
            onKeyDown={(e) => e.key === 'Enter' && startEdit()}
            title="Click to edit"
            className="text-[11px] text-black/35 font-mono tabular-nums w-14 text-right cursor-text rounded-md px-1.5 py-0.5 hover:bg-black/[0.05] hover:text-black/55 transition-colors select-none"
          >
            {display}
          </span>
        )}
      </div>
      <Slider
        min={min} max={max} step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  )
}

function fmtPos(v: number) {
  const r = Math.round(v * 10) / 10
  return `${r > 0 ? '+' : ''}${r.toFixed(1)}`
}

/* ─── Quick view icons ──────────────────────────────────────────── */
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

  return (
    <div
      className="drop-zone relative rounded-xl border border-dashed border-black/12 bg-black/[0.025] hover:bg-black/[0.04] hover:border-black/20 transition-all cursor-pointer overflow-hidden"
      style={{ aspectRatio: '1.5874 / 1' }}
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over') }}
      onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
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
          <p className="text-[11px] text-black/45 font-medium">PNG · JPG · SVG</p>
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

/* ─── Background section ────────────────────────────────────────── */
const BG_SOLID_PRESETS = [
  { value: '#f0f0f5',     style: { background: '#f0f0f5' } },
  { value: '#1a1a1a',     style: { background: '#1a1a1a' } },
  { value: 'transparent', style: { background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 10px 10px' } },
  { value: '#009FFF',     style: { background: '#009FFF' } },
]

const GRAD_DIRS = [
  { angle:  45, radial: false, label: '↗' },
  { angle:  90, radial: false, label: '→' },
  { angle: 135, radial: false, label: '↘' },
  { angle: 180, radial: false, label: '↓' },
  { angle:   0, radial: true,  label: '◎' },
] as const

function isGradValue(v: string) {
  return v.startsWith('linear-gradient') || v.startsWith('radial-gradient')
}

function parseGradValue(v: string) {
  const lin = v.match(/linear-gradient\((\d+)deg,\s*(#[0-9a-fA-F]{6}),\s*(#[0-9a-fA-F]{6})\)/)
  if (lin) return { c1: lin[2], c2: lin[3], angle: parseInt(lin[1]), radial: false }
  const rad = v.match(/radial-gradient\(circle,\s*(#[0-9a-fA-F]{6}),\s*(#[0-9a-fA-F]{6})\)/)
  if (rad) return { c1: rad[1], c2: rad[2], angle: 0, radial: true }
  return null
}

function buildGradValue(c1: string, c2: string, angle: number, radial: boolean) {
  return radial
    ? `radial-gradient(circle, ${c1}, ${c2})`
    : `linear-gradient(${angle}deg, ${c1}, ${c2})`
}

function BgSection({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const gradMode = isGradValue(value)
  const parsed   = gradMode ? parseGradValue(value) : null

  const [solidHex, setSolidHex] = useState(
    !gradMode && value !== 'transparent' ? value : '#f0f0f5',
  )
  const [c1,     setC1]     = useState(parsed?.c1    ?? '#1a1a1a')
  const [c2,     setC2]     = useState(parsed?.c2    ?? '#009FFF')
  const [angle,  setAngle]  = useState(parsed?.angle ?? 135)
  const [radial, setRadial] = useState(parsed?.radial ?? false)

  useEffect(() => {
    if (isGradValue(value)) {
      const p = parseGradValue(value)
      if (p) { setC1(p.c1); setC2(p.c2); setAngle(p.angle); setRadial(p.radial) }
    } else if (value !== 'transparent') {
      setSolidHex(value)
    }
  }, [value])

  function fireGrad(nc1 = c1, nc2 = c2, na = angle, nr = radial) {
    onChange(buildGradValue(nc1, nc2, na, nr))
  }

  function handleSolidHex(raw: string) {
    const v    = raw.trim()
    const full = v.startsWith('#') ? v : `#${v}`
    if (/^#[0-9a-fA-F]{6}$/.test(full)) { onChange(full); setSolidHex(full) }
  }

  return (
    <div className="space-y-3">

      {/* Mode toggle */}
      <div className="flex gap-0.5 p-0.5 bg-black/[0.05] rounded-xl">
        <button
          onClick={() => onChange(solidHex)}
          className={cn(
            'flex-1 text-[11px] font-medium py-1.5 rounded-[10px] transition-all',
            !gradMode ? 'bg-white shadow-sm text-black/70' : 'text-black/35 hover:text-black/55',
          )}
        >
          Solid
        </button>
        <button
          onClick={() => { if (!gradMode) fireGrad() }}
          className={cn(
            'flex-1 text-[11px] font-medium py-1.5 rounded-[10px] transition-all',
            gradMode ? 'bg-white shadow-sm text-black/70' : 'text-black/35 hover:text-black/55',
          )}
        >
          Gradient
        </button>
      </div>

      {!gradMode ? (
        /* ── Solid ── */
        <>
          <div className="flex gap-2">
            {BG_SOLID_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => { onChange(p.value); if (p.value !== 'transparent') setSolidHex(p.value) }}
                className={cn(
                  'w-9 h-9 rounded-xl transition-all flex-shrink-0',
                  value === p.value
                    ? 'ring-2 ring-inset ring-black/50 shadow-sm'
                    : 'ring-1 ring-inset ring-black/10 hover:ring-black/25',
                )}
                style={p.style}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md border border-black/10 flex-shrink-0"
              style={{ background: value === 'transparent'
                ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 8px 8px'
                : value }}
            />
            <input
              type="text"
              value={solidHex}
              placeholder="#f0f0f5"
              onChange={(e) => setSolidHex(e.target.value)}
              onBlur={(e) => handleSolidHex(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSolidHex(solidHex)}
              className="flex-1 text-[11px] font-mono px-2.5 py-1.5 rounded-lg border border-black/10 bg-black/[0.025] focus:outline-none focus:border-black/25 focus:bg-white transition-all placeholder:text-black/20 uppercase"
              maxLength={7}
            />
          </div>
        </>
      ) : (
        /* ── Gradient ── */
        <>
          {/* Two color pickers + swap */}
          <div className="flex items-center gap-2">
            <label className="relative flex-1 h-9 cursor-pointer group">
              <div
                className="absolute inset-0 rounded-xl border border-black/10 shadow-sm group-hover:scale-[1.04] transition-transform"
                style={{ background: c1 }}
              />
              <input
                type="color"
                value={c1}
                onChange={(e) => { setC1(e.target.value); fireGrad(e.target.value, c2, angle, radial) }}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
            </label>

            <button
              onClick={() => { setC1(c2); setC2(c1); fireGrad(c2, c1, angle, radial) }}
              title="Swap colors"
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-black/30 hover:text-black/60 hover:bg-black/[0.05] transition-all text-[15px] leading-none"
            >
              ⇄
            </button>

            <label className="relative flex-1 h-9 cursor-pointer group">
              <div
                className="absolute inset-0 rounded-xl border border-black/10 shadow-sm group-hover:scale-[1.04] transition-transform"
                style={{ background: c2 }}
              />
              <input
                type="color"
                value={c2}
                onChange={(e) => { setC2(e.target.value); fireGrad(c1, e.target.value, angle, radial) }}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
            </label>
          </div>

          {/* Preview strip */}
          <div
            className="h-[18px] w-full rounded-lg border border-black/8"
            style={{ background: buildGradValue(c1, c2, angle, radial) }}
          />

          {/* Direction buttons */}
          <div className="flex gap-1">
            {GRAD_DIRS.map((d) => {
              const active = d.radial ? radial : !radial && angle === d.angle
              return (
                <button
                  key={d.radial ? 'r' : d.angle}
                  onClick={() => {
                    setAngle(d.angle); setRadial(d.radial)
                    fireGrad(c1, c2, d.angle, d.radial)
                  }}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg border text-[13px] transition-all',
                    active
                      ? 'bg-[#1a1a1a] text-white border-transparent'
                      : 'text-black/40 hover:text-black/65 border-black/10 hover:bg-black/[0.04]',
                  )}
                >
                  {d.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Pill toggle ───────────────────────────────────────────────── */
function PillToggle<T extends string>({
  value, options, disabled, onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  disabled?: T[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-0.5 p-0.5 bg-black/[0.05] rounded-xl">
      {options.map((opt) => {
        const isDisabled = disabled?.includes(opt.value)
        const isActive   = value === opt.value
        return (
          <button
            key={opt.value}
            disabled={isDisabled}
            onClick={() => !isDisabled && onChange(opt.value)}
            className={cn(
              'flex-1 text-[11px] font-medium py-1.5 rounded-[10px] transition-all',
              isActive && !isDisabled
                ? 'bg-white shadow-sm text-black/70'
                : isDisabled
                  ? 'text-black/20 cursor-not-allowed'
                  : 'text-black/35 hover:text-black/55 cursor-pointer',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Export tab ────────────────────────────────────────────────── */
type ExportFormat = 'png' | 'jpg'

function ExportTab({
  settings, onChange, onExport,
}: {
  settings: CardSettings
  onChange: (p: Partial<CardSettings>) => void
  onExport: (opts: { format: ExportFormat; scale: number }) => void
}) {
  const [format, setFormat] = useState<ExportFormat>('png')
  const [scale,  setScale]  = useState(2)

  const isTransparent  = settings.bgColor === 'transparent'
  const transpDisabled = isTransparent || format === 'jpg'

  function handleFormat(f: ExportFormat) {
    setFormat(f)
  }

  const exportLabel = format === 'jpg' ? 'Export JPG' : 'Export PNG'

  return (
    <div className="flex flex-col h-full">
      {/* Background */}
      <Section title="Background" icon={<Layers className="w-3.5 h-3.5" />}>
        <BgSection value={settings.bgColor} onChange={(v) => onChange({ bgColor: v })} />
      </Section>

      <Separator />

      {/* Format */}
      <Section title="Format" icon={<Download className="w-3.5 h-3.5" />}>
        <div className="space-y-4">
          <div>
            <p className="text-[12px] text-black/60 font-medium mb-2">File type</p>
            <PillToggle
              value={format}
              options={[
                { value: 'png', label: 'PNG' },
                { value: 'jpg', label: 'JPG' },
              ]}
              onChange={handleFormat}
            />
            {format === 'jpg' && (
              <p className="text-[10px] text-black/30 mt-1.5">
                JPG does not support transparency.
              </p>
            )}
          </div>

          <div>
            <p className="text-[12px] text-black/60 font-medium mb-2">Resolution</p>
            <PillToggle
              value={String(scale) as '1' | '2' | '3' | '4'}
              options={[
                { value: '1', label: '×1' },
                { value: '2', label: '×2' },
                { value: '3', label: '×3' },
                { value: '4', label: '×4' },
              ]}
              onChange={(v) => setScale(Number(v))}
            />
            <p className="text-[10px] text-black/30 mt-1.5">
              ×{scale} = {scale === 1 ? 'screen size' : `${scale}× screen size`}
            </p>
          </div>
        </div>
      </Section>

      <Separator />

      {/* Export button */}
      <div className="px-5 py-5">
        <button
          onClick={() => onExport({ format, scale })}
          className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#2d2d2d] text-white text-[13px] font-medium py-2.5 rounded-xl transition-all active:scale-[0.98]"
        >
          <Download className="w-3.5 h-3.5" />
          {exportLabel}
          <span className="ml-auto text-[11px] text-white/40 font-normal flex items-center gap-0.5">
            <Zap className="w-2.5 h-2.5" />5
          </span>
        </button>
      </div>
    </div>
  )
}

/* ─── ControlPanel ──────────────────────────────────────────────── */
interface ControlPanelProps {
  settings:      CardSettings
  displayCount:  1 | 2 | 3
  onChange:      (patch: Partial<CardSettings>) => void
  onReset:       () => void
  onRandomize:   () => void
  onExport:      (opts: { format: 'png' | 'jpg'; scale: number }) => void
}

export function ControlPanel({ settings, displayCount, onChange, onReset, onRandomize, onExport }: ControlPanelProps) {
  const [tab, setTab] = useState<'create' | 'export'>('create')

  return (
    <aside className="flex flex-col w-[278px] min-w-[278px] h-screen bg-white border-l border-black/[0.07] overflow-y-auto shadow-[-8px_0_24px_-8px_rgba(0,0,0,0.06)]">

      {/* ── Tabs ── */}
      <div className="p-2 border-b border-black/[0.07] sticky top-0 bg-white z-10">
        <div className="flex gap-0.5 p-0.5 bg-black/[0.05] rounded-xl">
          <button
            onClick={() => setTab('create')}
            className={cn(
              'flex-1 text-[12px] font-medium py-1.5 rounded-[10px] transition-all',
              tab === 'create'
                ? 'bg-white shadow-sm text-black/70'
                : 'text-black/35 hover:text-black/55',
            )}
          >
            Create
          </button>
          <button
            onClick={() => setTab('export')}
            className={cn(
              'flex-1 text-[12px] font-medium py-1.5 rounded-[10px] transition-all',
              tab === 'export'
                ? 'bg-white shadow-sm text-black/70'
                : 'text-black/35 hover:text-black/55',
            )}
          >
            Export
          </button>
        </div>
      </div>

      {/* ── Create tab ── */}
      {tab === 'create' && (
        <>
          <Section title="Import" icon={<CreditCard className="w-3.5 h-3.5" />}>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <p className="text-[12px] text-black/60 font-medium mb-1.5">Front</p>
                <DropZone label="Front face" image={settings.frontImage} onLoad={(url) => onChange({ frontImage: url })} />
              </div>
              <div>
                <p className="text-[12px] text-black/60 font-medium mb-1.5">Back</p>
                <DropZone label="Back face" image={settings.backImage} onLoad={(url) => onChange({ backImage: url })} />
              </div>
            </div>
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

          <Section title="Position" icon={<Move className="w-3.5 h-3.5" />}>
            <SliderRow label="Position X" value={settings.posX ?? 0} min={-5} max={5} step={0.05} format={fmtPos} onChange={(v) => onChange({ posX: v })} />
            <SliderRow label="Position Y" value={settings.posY ?? 0} min={-3} max={3} step={0.05} format={fmtPos} onChange={(v) => onChange({ posY: v })} />
            <SliderRow label="Position Z" value={settings.posZ ?? 0} min={-2} max={2} step={0.05} format={fmtPos} onChange={(v) => onChange({ posZ: v })} />
            <p className="text-[10px] text-black/25 pt-0.5">⌥ Alt + drag on canvas to move in XY</p>
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

            {/* Randomize button */}
            <button
              onClick={onRandomize}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-xl border border-black/10',
                'bg-black/[0.03] hover:bg-black/[0.07] hover:border-black/20',
                'text-black/40 hover:text-black/60 transition-all active:scale-[0.98]',
                'text-[11px] font-medium py-2.5',
              )}
            >
              <Shuffle className="w-3.5 h-3.5" />
              {displayCount === 1 ? 'Randomize' : `Randomize ${displayCount} cards`}
            </button>
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
              CardistryStudio · 3D Card Viewer
            </p>
          </div>
        </>
      )}

      {/* ── Export tab ── */}
      {tab === 'export' && (
        <ExportTab settings={settings} onChange={onChange} onExport={onExport} />
      )}
    </aside>
  )
}
