import { useRef, useCallback, useState, useEffect } from 'react'
import {
  ImageUp, RotateCcw, Play, Pause, Sun, RefreshCcw, CreditCard,
  Pipette, Eye, Layers, Download, Move, ChevronDown, Shuffle,
} from 'lucide-react'
import { Slider }    from '@/components/ui/slider'
import { Switch }    from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Button }    from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { type CardSettings } from '@/types'

/* ─── Helpers ──────────────────────────────────────────────────────── */
function fmt(v: number, unit = '°') {
  const r = Math.round(v)
  return `${r > 0 ? '+' : ''}${r}${unit}`
}

function fmtPos(v: number) {
  const r = Math.round(v * 10) / 10
  return `${r > 0 ? '+' : ''}${r.toFixed(1)}`
}

/* ─── Section ──────────────────────────────────────────────────────── */
function Section({
  title, icon, children, defaultOpen = true,
}: {
  title: string
  icon:  React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="px-4 py-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 group"
      >
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground/40 [&_svg]:size-3.5">{icon}</span>
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
            {title}
          </span>
        </div>
        <ChevronDown
          className={cn(
            'size-3.5 text-muted-foreground/25 transition-transform duration-200 group-hover:text-muted-foreground/50',
            open ? 'rotate-0' : '-rotate-90',
          )}
        />
      </button>

      <div
        className={cn(
          'grid transition-all duration-200 ease-in-out',
          open ? 'grid-rows-[1fr] mt-4' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-4">{children}</div>
        </div>
      </div>
    </div>
  )
}

/* ─── SliderRow ────────────────────────────────────────────────────── */
function SliderRow({
  label, value, min, max, step = 1, unit = '°', format: fmtFn, onChange,
}: {
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

  function startEdit() { setInputVal(String(value)); setEditing(true) }

  function commitEdit(raw = inputVal) {
    const parsed = parseFloat(raw)
    if (!isNaN(parsed)) onChange(Math.min(max, Math.max(min, parsed)))
    setEditing(false)
  }

  useEffect(() => {
    if (editing) { inputRef.current?.focus(); inputRef.current?.select() }
  }, [editing])

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
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
            className="h-5 w-14 text-right text-[11px] font-mono tabular-nums rounded-lg border border-ring bg-background px-1.5 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        ) : (
          <button
            onClick={startEdit}
            className="text-[11px] text-muted-foreground/45 font-mono tabular-nums w-14 text-right cursor-text rounded-lg px-1.5 py-0.5 hover:bg-muted hover:text-muted-foreground transition-colors select-none"
          >
            {display}
          </button>
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

/* ─── Quick view icons ─────────────────────────────────────────────── */
function IsoLeftIcon() {
  return (
    <svg viewBox="0 0 32 20" fill="none" style={{ width: 28, height: 18 }}>
      <path d="M2 14.5 L2 6 L8 4 L8 12.5 Z" fill="currentColor" fillOpacity="0.5" />
      <rect x="8" y="4" width="21" height="12" rx="1.8" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}
function FrontIcon() {
  return (
    <svg viewBox="0 0 32 20" fill="none" style={{ width: 28, height: 18 }}>
      <rect x="4" y="4" width="24" height="12" rx="1.8" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}
function IsoRightIcon() {
  return (
    <svg viewBox="0 0 32 20" fill="none" style={{ width: 28, height: 18 }}>
      <rect x="3" y="4" width="21" height="12" rx="1.8" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.3" />
      <path d="M24 4 L30 6 L30 14.5 L24 12.5 Z" fill="currentColor" fillOpacity="0.5" />
    </svg>
  )
}

const VIEW_PRESETS = [
  { id: 'iso-left',  label: 'Left iso',  icon: IsoLeftIcon,  rotX: -18, rotY: -32, rotZ: 0 },
  { id: 'front',     label: 'Front',     icon: FrontIcon,    rotX:   0, rotY:   0, rotZ: 0 },
  { id: 'iso-right', label: 'Right iso', icon: IsoRightIcon, rotX: -18, rotY:  32, rotZ: 0 },
] as const

/* ─── Drop zone ────────────────────────────────────────────────────── */
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
      className="drop-zone relative rounded-xl border border-dashed border-border hover:border-muted-foreground/30 bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer overflow-hidden"
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
            <RefreshCcw className="size-4 text-white mb-1.5" />
            <span className="text-white text-xs font-medium">Change</span>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <ImageUp className="size-4 text-muted-foreground/35" />
          <div className="text-center">
            <p className="text-[11px] text-muted-foreground/55 font-medium">{label}</p>
            <p className="text-[10px] text-muted-foreground/30 mt-0.5">PNG · JPG · SVG</p>
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

/* ─── Background section ───────────────────────────────────────────── */
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

  const [solidHex, setSolidHex] = useState(!gradMode && value !== 'transparent' ? value : '#f0f0f5')
  const [c1,       setC1]       = useState(parsed?.c1    ?? '#1a1a1a')
  const [c2,       setC2]       = useState(parsed?.c2    ?? '#009FFF')
  const [angle,    setAngle]    = useState(parsed?.angle ?? 135)
  const [radial,   setRadial]   = useState(parsed?.radial ?? false)

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
      <ToggleGroup
        type="single"
        value={gradMode ? 'gradient' : 'solid'}
        onValueChange={(v) => {
          if (!v) return
          if (v === 'solid') onChange(solidHex)
          else if (!gradMode) fireGrad()
        }}
        variant="outline"
        spacing={0}
        className="w-full"
        size="sm"
      >
        <ToggleGroupItem
          value="solid"
          className="flex-1 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm"
        >
          Solid
        </ToggleGroupItem>
        <ToggleGroupItem
          value="gradient"
          className="flex-1 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm"
        >
          Gradient
        </ToggleGroupItem>
      </ToggleGroup>

      {!gradMode ? (
        /* ── Solid ── */
        <>
          <div className="flex gap-2">
            {BG_SOLID_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => { onChange(p.value); if (p.value !== 'transparent') setSolidHex(p.value) }}
                className={cn(
                  'flex-1 h-8 rounded-xl border-2 transition-all',
                  value === p.value
                    ? 'border-foreground/60 scale-110 shadow-md'
                    : 'border-border hover:border-muted-foreground/40 hover:scale-105',
                )}
                style={p.style}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div
              className="size-7 rounded-lg border border-border flex-shrink-0"
              style={{
                background: value === 'transparent'
                  ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 8px 8px'
                  : value,
              }}
            />
            <input
              type="text"
              value={solidHex}
              placeholder="#f0f0f5"
              onChange={(e) => setSolidHex(e.target.value)}
              onBlur={(e) => handleSolidHex(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSolidHex(solidHex)}
              className="flex-1 h-8 text-xs font-mono px-2.5 rounded-2xl border border-input bg-input/50 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring placeholder:text-muted-foreground/40 uppercase tracking-wider transition-all"
              maxLength={7}
            />
          </div>
        </>
      ) : (
        /* ── Gradient ── */
        <>
          {/* Two color pickers + swap */}
          <div className="flex items-center gap-2">
            <label className="relative flex-1 h-8 cursor-pointer group">
              <div
                className="absolute inset-0 rounded-xl border border-border shadow-sm group-hover:scale-[1.04] transition-transform"
                style={{ background: c1 }}
              />
              <input
                type="color" value={c1}
                onChange={(e) => { setC1(e.target.value); fireGrad(e.target.value, c2, angle, radial) }}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
            </label>

            <button
              onClick={() => { setC1(c2); setC2(c1); fireGrad(c2, c1, angle, radial) }}
              title="Swap colors"
              className="flex-shrink-0 size-7 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted transition-all text-[15px] leading-none"
            >
              ⇄
            </button>

            <label className="relative flex-1 h-8 cursor-pointer group">
              <div
                className="absolute inset-0 rounded-xl border border-border shadow-sm group-hover:scale-[1.04] transition-transform"
                style={{ background: c2 }}
              />
              <input
                type="color" value={c2}
                onChange={(e) => { setC2(e.target.value); fireGrad(c1, e.target.value, angle, radial) }}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
            </label>
          </div>

          {/* Preview strip */}
          <div
            className="h-4 w-full rounded-xl border border-border/50"
            style={{ background: buildGradValue(c1, c2, angle, radial) }}
          />

          {/* Direction buttons */}
          <ToggleGroup
            type="single"
            value={radial ? 'r' : String(angle)}
            onValueChange={(v) => {
              if (!v) return
              if (v === 'r') {
                setAngle(0); setRadial(true); fireGrad(c1, c2, 0, true)
              } else {
                const a = parseInt(v)
                setAngle(a); setRadial(false); fireGrad(c1, c2, a, false)
              }
            }}
            variant="outline"
            spacing={0}
            className="w-full"
            size="sm"
          >
            {GRAD_DIRS.map((d) => (
              <ToggleGroupItem
                key={d.radial ? 'r' : d.angle}
                value={d.radial ? 'r' : String(d.angle)}
                className="flex-1 text-sm data-[state=on]:bg-background data-[state=on]:shadow-sm"
              >
                {d.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </>
      )}
    </div>
  )
}

/* ─── Export tab ───────────────────────────────────────────────────── */
type ExportFormat = 'png' | 'jpg' | 'svg'

function ExportTab({
  settings, onChange, onExport,
}: {
  settings: CardSettings
  onChange: (p: Partial<CardSettings>) => void
  onExport: (opts: { format: ExportFormat; scale: number }) => void
}) {
  const [format, setFormat] = useState<ExportFormat>('png')
  const [scale,  setScale]  = useState(2)

  const exportLabel =
    format === 'svg' ? 'Export SVG' :
    format === 'jpg' ? 'Export JPG' : 'Export PNG'

  return (
    <>
      <Section title="Background" icon={<Layers />}>
        <BgSection value={settings.bgColor} onChange={(v) => onChange({ bgColor: v })} />
      </Section>

      <Separator />

      <Section title="Format" icon={<Download />}>
        <div className="space-y-4">
          {/* File type */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground/45 uppercase tracking-[0.1em] mb-2">
              File type
            </p>
            <ToggleGroup
              type="single"
              value={format}
              onValueChange={(v) => v && setFormat(v as ExportFormat)}
              variant="outline"
              spacing={0}
              className="w-full"
              size="sm"
            >
              <ToggleGroupItem value="png" className="flex-1 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm">PNG</ToggleGroupItem>
              <ToggleGroupItem value="jpg" className="flex-1 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm">JPG</ToggleGroupItem>
              <ToggleGroupItem value="svg" className="flex-1 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm">SVG</ToggleGroupItem>
            </ToggleGroup>
            {(format === 'jpg' || format === 'svg') && (
              <p className="text-[10px] text-muted-foreground/35 mt-1.5">
                {format === 'svg' ? 'SVG' : 'JPG'} does not support transparency.
              </p>
            )}
          </div>

          {/* Resolution */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground/45 uppercase tracking-[0.1em] mb-2">
              Resolution
            </p>
            <ToggleGroup
              type="single"
              value={String(scale)}
              onValueChange={(v) => v && setScale(Number(v))}
              variant="outline"
              spacing={0}
              className="w-full"
              size="sm"
            >
              {(['1', '2', '3', '4'] as const).map((s) => (
                <ToggleGroupItem
                  key={s} value={s}
                  className="flex-1 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm"
                >
                  ×{s}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <p className="text-[10px] text-muted-foreground/35 mt-1.5">
              ×{scale} = {scale === 1 ? 'screen size' : `${scale}× screen size`}
            </p>
          </div>
        </div>
      </Section>

      <Separator />

      {/* Export button */}
      <div className="px-4 py-5">
        <Button className="w-full gap-2" onClick={() => onExport({ format, scale })}>
          <Download className="size-3.5" />
          {exportLabel}
        </Button>
      </div>
    </>
  )
}

/* ─── ControlPanel ─────────────────────────────────────────────────── */
interface ControlPanelProps {
  settings:     CardSettings
  displayCount: 1 | 2 | 3
  onChange:     (patch: Partial<CardSettings>) => void
  onReset:      () => void
  onRandomize:  () => void
  onExport:     (opts: { format: 'png' | 'jpg' | 'svg'; scale: number }) => void
}

export function ControlPanel({
  settings, displayCount, onChange, onReset, onRandomize, onExport,
}: ControlPanelProps) {
  const [tab, setTab] = useState<'create' | 'export'>('create')

  return (
    <aside className="flex flex-col w-[278px] min-w-[278px] h-screen bg-background border-l border-border shadow-[-8px_0_24px_-8px_rgba(0,0,0,0.06)]">
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as 'create' | 'export')}
        className="flex flex-col h-full gap-0"
      >
        {/* ── Sticky tab header ── */}
        <div className="shrink-0 px-3 py-2.5 border-b border-border">
          <TabsList className="w-full">
            <TabsTrigger value="create" className="flex-1 text-xs">Create</TabsTrigger>
            <TabsTrigger value="export" className="flex-1 text-xs">Export</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Create tab ── */}
        <TabsContent value="create" className="flex-1 overflow-y-auto m-0 min-h-0">
          {/* Import */}
          <Section title="Import" icon={<CreditCard />}>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <p className="text-[11px] text-muted-foreground/55 mb-1.5 font-medium">Front</p>
                <DropZone
                  label="Front face"
                  image={settings.frontImage}
                  onLoad={(url) => onChange({ frontImage: url })}
                />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground/55 mb-1.5 font-medium">Back</p>
                <DropZone
                  label="Back face"
                  image={settings.backImage}
                  onLoad={(url) => onChange({ backImage: url })}
                />
              </div>
            </div>
          </Section>

          <Separator />

          {/* Edge */}
          <Section title="Edge" icon={<Pipette />}>
            <label className="relative flex items-center gap-3 cursor-pointer group">
              <div
                className="size-9 rounded-xl border border-border shadow-sm flex-shrink-0 transition-transform group-hover:scale-105 group-active:scale-95"
                style={{ backgroundColor: settings.edgeColor }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground/75">Edge color</p>
                <p className="text-[11px] font-mono text-muted-foreground/60 uppercase tracking-wider mt-0.5">
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

          {/* Rotation */}
          <Section title="Rotation" icon={<RotateCcw />}>
            <SliderRow label="X" value={settings.rotX} min={-90}  max={90}  onChange={(v) => onChange({ rotX: v })} />
            <SliderRow label="Y" value={settings.rotY} min={-180} max={180} onChange={(v) => onChange({ rotY: v })} />
            <SliderRow label="Z" value={settings.rotZ} min={-45}  max={45}  onChange={(v) => onChange({ rotZ: v })} />
            <SliderRow
              label="Zoom" value={settings.zoom} min={0.6} max={2.2} step={0.02} unit="×"
              onChange={(v) => onChange({ zoom: v })}
            />

            {/* Auto-rotate toggle */}
            <div className="flex items-center justify-between pt-0.5">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground/40">
                  {settings.autoRotate
                    ? <Pause className="size-3.5" />
                    : <Play  className="size-3.5" />}
                </span>
                <span className="text-xs text-muted-foreground font-medium">Auto-rotate</span>
              </div>
              <Switch
                checked={settings.autoRotate}
                onCheckedChange={(v) => onChange({ autoRotate: v })}
              />
            </div>
          </Section>

          <Separator />

          {/* Position */}
          <Section title="Position" icon={<Move />}>
            <SliderRow label="X" value={settings.posX ?? 0} min={-5} max={5} step={0.05} format={fmtPos} onChange={(v) => onChange({ posX: v })} />
            <SliderRow label="Y" value={settings.posY ?? 0} min={-3} max={3} step={0.05} format={fmtPos} onChange={(v) => onChange({ posY: v })} />
            <SliderRow label="Z" value={settings.posZ ?? 0} min={-2} max={2} step={0.05} format={fmtPos} onChange={(v) => onChange({ posZ: v })} />
            <p className="text-[10px] text-muted-foreground/35">
              ⌥ Alt + drag on canvas to move in XY
            </p>
          </Section>

          <Separator />

          {/* Quick views */}
          <Section title="Quick views" icon={<Eye />}>
            <div className="grid grid-cols-3 gap-2">
              {VIEW_PRESETS.map(({ id, label, icon: Icon, rotX, rotY, rotZ }) => (
                <Button
                  key={id}
                  variant="outline"
                  onClick={() => onChange({ rotX, rotY, rotZ, autoRotate: false })}
                  className="flex flex-col items-center h-auto py-2.5 px-1 gap-1.5 text-muted-foreground hover:text-foreground rounded-2xl"
                >
                  <Icon />
                  <span className="text-[10px] font-medium leading-none normal-case">{label}</span>
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={onRandomize}
              className="w-full text-xs text-muted-foreground hover:text-foreground gap-2 rounded-2xl"
            >
              <Shuffle className="size-3.5" />
              {displayCount === 1 ? 'Randomize' : `Randomize ${displayCount} cards`}
            </Button>
          </Section>

          <Separator />

          {/* Lighting */}
          <Section title="Lighting" icon={<Sun />}>
            <SliderRow
              label="Intensity"
              value={settings.lightIntensity}
              min={0} max={2} step={0.05} unit="×"
              onChange={(v) => onChange({ lightIntensity: v })}
            />
          </Section>

          <Separator />

          {/* Reset */}
          <Section title="Reset" icon={<RefreshCcw />}>
            <Button
              variant="outline"
              onClick={onReset}
              className="w-full text-xs text-muted-foreground hover:text-foreground gap-2 rounded-2xl"
            >
              <RefreshCcw className="size-3.5" />
              Default view
            </Button>
          </Section>

          {/* Footer */}
          <div className="h-10" />
          <div className="px-4 pb-5 pt-2">
            <p className="text-[10px] text-muted-foreground/25 text-center tracking-widest uppercase">
              CardistryStudio · 3D
            </p>
          </div>
        </TabsContent>

        {/* ── Export tab ── */}
        <TabsContent value="export" className="flex-1 overflow-y-auto m-0 min-h-0">
          <ExportTab settings={settings} onChange={onChange} onExport={onExport} />
        </TabsContent>
      </Tabs>
    </aside>
  )
}
