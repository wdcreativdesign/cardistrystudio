import { useRef, useCallback, useState, useEffect } from 'react'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'
import { type CardSettings, type CameraMode, type Finish } from '@/types'

/* ─── Helpers ──────────────────────────────────────────────────── */
function fmt(v: number, unit = '°') {
  const rounded = Math.round(v)
  return `${rounded > 0 ? '+' : ''}${rounded}${unit}`
}

function fmtPos(v: number) {
  const r = Math.round(v * 10) / 10
  return `${r > 0 ? '+' : ''}${r.toFixed(1)}`
}

function fovToMm(fov: number): string {
  const fl = Math.round(21.63 / Math.tan((fov / 2) * (Math.PI / 180)))
  return `${fl}mm`
}

/* ─── Section ──────────────────────────────────────────────────── */
function Section({ title, children, defaultOpen = true }: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full h-[49px] flex items-center justify-between px-4 group"
      >
        <span className="text-[14px] font-medium text-white select-none">{title}</span>
        <Icon name="expand_more" size={20} className={cn('text-white/25 transition-transform duration-200', open ? 'rotate-0' : '-rotate-90')} />
      </button>
      <div className={cn(
        'grid transition-all duration-200 ease-in-out',
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
      )}>
        <div className="overflow-hidden">
          <div className="px-4 pb-4 space-y-4">{children}</div>
        </div>
      </div>
      <div className="h-px bg-white/[0.06]" />
    </div>
  )
}

/* ─── SliderRow ────────────────────────────────────────────────── */
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-white">{label}</span>
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
            className="text-[12px] font-medium text-white text-right w-16 h-6 rounded-[4px] px-1 bg-[#242424] border border-[#9ae600] focus:outline-none"
          />
        ) : (
          <span
            role="button"
            tabIndex={0}
            onClick={startEdit}
            onKeyDown={(e) => e.key === 'Enter' && startEdit()}
            title="Click to edit"
            className="text-[12px] font-medium text-white bg-[#242424] rounded-[4px] px-1 h-6 w-16 text-right cursor-text select-none hover:brightness-110 transition-colors inline-flex items-center justify-end"
          >
            {display}
          </span>
        )}
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} />
    </div>
  )
}

/* ─── Edge section ─────────────────────────────────────────────── */
function EdgeSection({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [hex, setHex] = useState(value.toUpperCase())
  const colorInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setHex(value.toUpperCase()) }, [value])

  function handleHexCommit(raw: string) {
    const v = raw.trim()
    const full = v.startsWith('#') ? v : `#${v}`
    if (/^#[0-9a-fA-F]{6}$/.test(full)) { onChange(full); setHex(full.toUpperCase()) }
    else setHex(value.toUpperCase())
  }

  return (
    <div className="flex items-center gap-3">
      {/* Color swatch — clicking opens native color picker */}
      <button
        type="button"
        onClick={() => colorInputRef.current?.click()}
        className="w-6 h-6 rounded-[5px] border border-white/15 flex-shrink-0 transition-transform hover:scale-110 active:scale-95"
        style={{ backgroundColor: value }}
      />
      <input
        ref={colorInputRef}
        type="color"
        value={value}
        onChange={(e) => { onChange(e.target.value); setHex(e.target.value.toUpperCase()) }}
        className="sr-only"
      />
      {/* Hex input */}
      <input
        type="text"
        value={hex}
        onChange={(e) => setHex(e.target.value.toUpperCase())}
        onBlur={(e) => handleHexCommit(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleHexCommit(hex)}
        className="flex-1 text-right text-[12px] font-medium text-white bg-[#242424] h-6 rounded-[4px] px-1 uppercase focus:outline-none focus:border focus:border-[#9ae600] transition-all"
        maxLength={7}
      />
    </div>
  )
}

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
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <div
      className="relative flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/[0.1] bg-white/[0.025] hover:bg-white/[0.04] hover:border-white/[0.18] transition-all cursor-pointer overflow-hidden"
      style={{ height: 90 }}
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {image ? (
        <>
          <img src={image} alt={label} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 hover:opacity-100 transition-opacity rounded-xl gap-1">
            <Icon name="refresh" size={18} className="text-white" />
            <span className="text-white text-[10px] font-medium">Change</span>
          </div>
        </>
      ) : (
        <>
          <Icon name="image" size={20} className="text-white" />
          <div className="text-center">
            <p className="text-[12px] text-white font-medium leading-tight">{label}</p>
            <p className="text-[12px] text-[#999] font-medium leading-tight">PNG, JPG, SVG</p>
          </div>
        </>
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

/* ─── Finishes ─────────────────────────────────────────────────── */
const FINISH_OPTIONS: { key: Finish; label: string }[] = [
  { key: 'metallic', label: 'Metal' },
  { key: 'plastic',  label: 'Plastic' },
  { key: 'matte',    label: 'Matte' },
]

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
    <div className="flex gap-0.5 p-1 bg-[#252525] rounded-full">
      {options.map((opt) => {
        const isDisabled = disabled?.includes(opt.value)
        const isActive   = value === opt.value
        return (
          <button
            key={opt.value}
            disabled={isDisabled}
            onClick={() => !isDisabled && onChange(opt.value)}
            className={cn(
              'flex-1 text-[14px] py-[7px] px-3 rounded-full transition-all',
              isActive && !isDisabled
                ? 'bg-[#141414] text-white font-semibold shadow-sm'
                : isDisabled
                  ? 'text-white/20 cursor-not-allowed font-medium'
                  : 'text-white/40 hover:text-white/60 font-medium cursor-pointer',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Background section (Export tab) ──────────────────────────── */
const BG_SOLID_PRESETS = [
  { value: '#1d1d1d',     style: { background: '#1d1d1d' } },
  { value: '#f0f0f5',     style: { background: '#f0f0f5' } },
  { value: 'transparent', style: { background: 'repeating-conic-gradient(#555 0% 25%, #333 0% 50%) 0 0 / 10px 10px' } },
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
  return radial ? `radial-gradient(circle, ${c1}, ${c2})` : `linear-gradient(${angle}deg, ${c1}, ${c2})`
}

function BgSection({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const gradMode = isGradValue(value)
  const parsed   = gradMode ? parseGradValue(value) : null

  const colorPickerRef = useRef<HTMLInputElement>(null)
  const [solidHex, setSolidHex] = useState(!gradMode && value !== 'transparent' ? value : '#1d1d1d')
  const [c1,     setC1]     = useState(parsed?.c1    ?? '#1a1a1a')
  const [c2,     setC2]     = useState(parsed?.c2    ?? '#9ae600')
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
    const v = raw.trim()
    const full = v.startsWith('#') ? v : `#${v}`
    if (/^#[0-9a-fA-F]{6}$/.test(full)) { onChange(full); setSolidHex(full) }
  }

  const hasBg = value !== 'transparent'

  function toggleBg(on: boolean) {
    if (on) onChange(gradMode ? buildGradValue(c1, c2, angle, radial) : solidHex)
    else onChange('transparent')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Include background color toggle */}
      <div className="flex items-center gap-4">
        <span className="flex-1 text-[12px] font-medium text-white">Include background color</span>
        <Switch checked={hasBg} onCheckedChange={toggleBg} />
      </div>

      {hasBg && <>
      {/* Mode toggle */}
      <PillToggle
        value={gradMode ? 'gradient' : 'solid'}
        options={[{ value: 'solid', label: 'Solid' }, { value: 'gradient', label: 'Gradient' }]}
        onChange={(v) => { if (v === 'gradient' && !gradMode) fireGrad(); else if (v === 'solid') onChange(solidHex) }}
      />

      {!gradMode ? (
        <>
          <div className="flex gap-2">
            {BG_SOLID_PRESETS.filter(p => p.value !== 'transparent').map((p) => (
              <button
                key={p.value}
                onClick={() => { onChange(p.value); setSolidHex(p.value) }}
                className={cn(
                  'w-8 h-8 rounded-[8px] flex-shrink-0 transition-all border-2',
                  value === p.value ? 'border-[#9ae600]' : 'border-transparent hover:border-white/20',
                )}
                style={p.style}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => colorPickerRef.current?.click()}
              className="w-6 h-6 rounded-[4px] border border-[#242424] flex-shrink-0 transition-transform hover:scale-110 active:scale-95"
              style={{ background: value === 'transparent' ? 'repeating-conic-gradient(#555 0% 25%, #333 0% 50%) 0 0 / 8px 8px' : value }}
            />
            <input
              ref={colorPickerRef}
              type="color"
              value={solidHex}
              onChange={(e) => { onChange(e.target.value); setSolidHex(e.target.value.toUpperCase()) }}
              className="sr-only"
            />
            <input
              type="text"
              value={solidHex}
              placeholder="#1d1d1d"
              onChange={(e) => setSolidHex(e.target.value)}
              onBlur={(e) => handleSolidHex(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSolidHex(solidHex)}
              className="flex-1 text-right text-[12px] font-medium text-white bg-[#242424] h-6 rounded-[4px] px-1 uppercase focus:outline-none focus:border focus:border-[#9ae600] transition-all"
              maxLength={7}
            />
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <label className="relative flex-1 h-9 cursor-pointer group">
              <div className="absolute inset-0 rounded-xl border border-white/10 shadow-sm group-hover:scale-[1.04] transition-transform" style={{ background: c1 }} />
              <input type="color" value={c1} onChange={(e) => { setC1(e.target.value); fireGrad(e.target.value, c2, angle, radial) }} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
            </label>
            <button
              onClick={() => { setC1(c2); setC2(c1); fireGrad(c2, c1, angle, radial) }}
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all text-[15px] leading-none"
            >⇄</button>
            <label className="relative flex-1 h-9 cursor-pointer group">
              <div className="absolute inset-0 rounded-xl border border-white/10 shadow-sm group-hover:scale-[1.04] transition-transform" style={{ background: c2 }} />
              <input type="color" value={c2} onChange={(e) => { setC2(e.target.value); fireGrad(c1, e.target.value, angle, radial) }} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
            </label>
          </div>
          <div className="h-[18px] w-full rounded-lg border border-white/[0.08]" style={{ background: buildGradValue(c1, c2, angle, radial) }} />
          <div className="flex gap-2">
            {GRAD_DIRS.map((d) => {
              const active = d.radial ? radial : !radial && angle === d.angle
              return (
                <button
                  key={d.radial ? 'r' : d.angle}
                  onClick={() => { setAngle(d.angle); setRadial(d.radial); fireGrad(c1, c2, d.angle, d.radial) }}
                  className={cn(
                    'flex-1 h-[33px] rounded-full text-[14px] font-medium border transition-all active:scale-95',
                    active ? 'border-[#9ae600] text-white bg-white/[0.04]' : 'border-[#242424] text-white hover:bg-white/[0.04]',
                  )}
                >{d.label}</button>
              )
            })}
          </div>
        </>
      )}
      </>}
    </div>
  )
}

/* ─── Export tab ────────────────────────────────────────────────── */
type ExportFormat = 'png' | 'jpg'
type CaptureResult = { dataUrl: string; cssW: number; cssH: number }

function ExportTab({
  settings, onChange, onExport, onCapturePreview,
}: {
  settings:         CardSettings
  onChange:         (p: Partial<CardSettings>) => void
  onExport:         (opts: { format: ExportFormat; scale: number; showShadow: boolean }) => void
  onCapturePreview: (opts?: { showShadow?: boolean }) => CaptureResult | null
}) {
  const [format,     setFormat]     = useState<ExportFormat>('png')
  const [scale,      setScale]      = useState(2)
  const [showShadow, setShowShadow] = useState(true)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [cssSize,    setCssSize]    = useState<{ w: number; h: number } | null>(null)

  const captureRef    = useRef(onCapturePreview)
  const showShadowRef = useRef(showShadow)
  useEffect(() => { captureRef.current    = onCapturePreview }, [onCapturePreview])
  useEffect(() => { showShadowRef.current = showShadow       }, [showShadow])

  function runCapture() {
    const result = captureRef.current({ showShadow: showShadowRef.current })
    if (result) { setPreviewUrl(result.dataUrl); setCssSize({ w: result.cssW, h: result.cssH }) }
  }

  useEffect(() => { const t = setTimeout(runCapture, 80); return () => clearTimeout(t) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setTimeout(runCapture, 350); return () => clearTimeout(t) }, [settings.bgColor, showShadow]) // eslint-disable-line react-hooks/exhaustive-deps

  const isTransparent = settings.bgColor === 'transparent'
  const exportW = cssSize ? Math.round(cssSize.w * scale) : null
  const exportH = cssSize ? Math.round(cssSize.h * scale) : null

  return (
    <div className="flex flex-col flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>

      {/* Preview */}
      <Section title="Preview">
        <div className="flex flex-col gap-2">
          <div
            className="relative h-[140px] w-full rounded-[8px] overflow-hidden border border-[#242424]"
            style={{
              background: isTransparent
                ? 'repeating-conic-gradient(#444 0% 25%, #333 0% 50%) 0 0 / 10px 10px'
                : '#1d1d1d',
            }}
          >
            {previewUrl ? (
              <>
                <img src={previewUrl} alt="Export preview" className="absolute inset-0 w-full h-full object-cover block" />
                <button onClick={runCapture} className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-[4px] bg-black/40 hover:bg-black/60 text-white/80 hover:text-white transition-all backdrop-blur-sm active:scale-90">
                  <Icon name="refresh" size={14} />
                </button>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon name="progress_activity" size={18} className="text-white/20 animate-spin" />
              </div>
            )}
          </div>
          {exportW != null && exportH != null && (
            <p className="text-[12px] font-medium text-white text-center truncate">
              cardistrystudio-{exportW}x{exportH}@{scale}x.png
            </p>
          )}
        </div>
      </Section>

      {/* Background */}
      <Section title="Background">
        <BgSection value={settings.bgColor} onChange={(v) => onChange({ bgColor: v })} />
      </Section>

      {/* Format */}
      <Section title="Format">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            {(['png', 'jpg'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={cn(
                  'flex-1 h-[33px] rounded-full text-[14px] font-medium transition-all active:scale-95',
                  format === f
                    ? 'border-2 border-[#9ae600] text-white'
                    : 'border border-[#242424] text-white hover:bg-white/[0.04]',
                )}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {([1, 2, 3, 4] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScale(s)}
                className={cn(
                  'flex-1 h-[33px] rounded-full text-[14px] font-medium transition-all active:scale-95',
                  scale === s
                    ? 'border-2 border-[#9ae600] text-white'
                    : 'border border-[#242424] text-white hover:bg-white/[0.04]',
                )}
              >
                ×{s}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Shadow">
        <div className="flex items-center gap-4">
          <span className="flex-1 text-[12px] font-medium text-white">Include drop shadow</span>
          <Switch checked={showShadow} onCheckedChange={setShowShadow} />
        </div>
      </Section>

      {/* Export button */}
      <div className="px-4 py-4">
        <button
          onClick={() => onExport({ format, scale, showShadow })}
          className="relative w-full flex items-center justify-center gap-2 bg-[#9AE600] hover:bg-[#aaff00] text-[#0d0d0d] text-[13px] font-semibold py-3 rounded-full transition-all active:scale-[0.98]"
        >
          <Icon name="download" size={18} />
          Export {format.toUpperCase()}
          <span className="absolute right-3.5 flex items-center gap-1 bg-black/15 rounded-lg px-2 py-1 text-[10px] text-[#0d0d0d]/60 font-medium">
            <Icon name="bolt" size={14} />5
          </span>
        </button>
      </div>
    </div>
  )
}

/* ─── ControlPanel ──────────────────────────────────────────────── */
interface ControlPanelProps {
  settings:         CardSettings
  displayCount:     1 | 2 | 3
  onChange:         (patch: Partial<CardSettings>) => void
  onReset:          () => void
  onRandomize:      () => void
  onExport:         (opts: { format: 'png' | 'jpg'; scale: number; showShadow: boolean }) => void
  onCapturePreview: (opts?: { showShadow?: boolean }) => CaptureResult | null
}

export function ControlPanel({ settings, displayCount, onChange, onReset, onRandomize, onExport, onCapturePreview }: ControlPanelProps) {
  const [tab, setTab] = useState<'create' | 'export'>('create')

  return (
    <aside className="flex flex-col w-[280px] min-w-[280px] h-screen bg-[#111] border-l border-[#242424]">

      {/* ── Navigation ── */}
      <div className="h-[72px] flex items-center px-4 border-b border-white/[0.06]">
        <div className="flex gap-0.5 p-1 bg-[#252525] rounded-full w-full">
          <button
            onClick={() => setTab('create')}
            className={cn(
              'flex-1 text-[14px] py-[7px] rounded-full transition-all',
              tab === 'create' ? 'bg-[#141414] text-white font-medium shadow-sm' : 'text-[#999] hover:text-white/60 font-medium',
            )}
          >
            Create
          </button>
          <button
            onClick={() => setTab('export')}
            className={cn(
              'flex-1 text-[14px] py-[7px] rounded-full transition-all',
              tab === 'export' ? 'bg-[#141414] text-white font-medium shadow-sm' : 'text-[#999] hover:text-white/60 font-medium',
            )}
          >
            Export
          </button>
        </div>
      </div>

      {/* ── Create tab ── */}
      {tab === 'create' && (
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>

          {/* Import */}
          <Section title="Import">
            <div className="grid grid-cols-2 gap-2">
              <DropZone label="Front Image" image={settings.frontImage} onLoad={(url) => onChange({ frontImage: url })} />
              <DropZone label="Back Image"  image={settings.backImage}  onLoad={(url) => onChange({ backImage:  url })} />
            </div>
          </Section>

          {/* Edge */}
          <Section title="Edge">
            <EdgeSection value={settings.edgeColor} onChange={(v) => onChange({ edgeColor: v })} />
          </Section>

          {/* Rotation */}
          <Section title="Rotation">
            <SliderRow label="X axis" value={settings.rotX} min={-90}  max={90}  onChange={(v) => onChange({ rotX: v })} />
            <SliderRow label="Y axis" value={settings.rotY} min={-180} max={180} onChange={(v) => onChange({ rotY: v })} />
            <SliderRow label="Z axis" value={settings.rotZ} min={-45}  max={45}  onChange={(v) => onChange({ rotZ: v })} />
          </Section>

          {/* Position */}
          <Section title="Position">
            <SliderRow label="X axis" value={settings.posX ?? 0} min={-5} max={5}   step={0.05} format={fmtPos} onChange={(v) => onChange({ posX: v })} />
            <SliderRow label="Y axis" value={settings.posY ?? 0} min={-3} max={3}   step={0.05} format={fmtPos} onChange={(v) => onChange({ posY: v })} />
            <SliderRow label="Z axis" value={settings.posZ ?? 0} min={-2} max={2}   step={0.05} format={fmtPos} onChange={(v) => onChange({ posZ: v })} />
            <SliderRow label="Zoom"   value={settings.zoom}      min={0.6} max={2.2} step={0.02} unit="×"       onChange={(v) => onChange({ zoom: v })} />
          </Section>

          {/* View */}
          <Section title="View">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                {([
                  { label: 'Left',  rotX: -18, rotY: -32, rotZ: 0 },
                  { label: 'Front', rotX:   0, rotY:   0, rotZ: 0 },
                  { label: 'Right', rotX: -18, rotY:  32, rotZ: 0 },
                ] as const).map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => onChange({ rotX: preset.rotX, rotY: preset.rotY, rotZ: preset.rotZ, autoRotate: false })}
                    className="flex-1 h-[33px] rounded-full text-[14px] font-medium border border-[#242424] text-white hover:bg-white/[0.04] transition-all active:scale-95"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <button
                onClick={onRandomize}
                className="w-full h-[33px] rounded-full text-[14px] font-medium border border-[#242424] text-white hover:bg-white/[0.04] transition-all active:scale-95"
              >
                Randomize
              </button>
            </div>
          </Section>

          {/* Camera */}
          <Section title="Camera">
            <PillToggle
              value={settings.cameraMode ?? 'perspective'}
              options={[
                { value: 'perspective', label: 'Perspective' },
                { value: 'isometric',   label: 'Isometric'   },
              ]}
              onChange={(v) => onChange({ cameraMode: v as CameraMode })}
            />
            {(settings.cameraMode ?? 'perspective') === 'perspective' && (
              <SliderRow
                label="Focal"
                value={settings.cameraFov ?? 42}
                min={10} max={90} step={1}
                format={fovToMm}
                onChange={(v) => onChange({ cameraFov: v })}
              />
            )}
            {settings.cameraMode === 'isometric' && (
              <p className="text-[11px] text-white/25 leading-relaxed">
                Orthographic — parallel lines stay parallel.
              </p>
            )}
          </Section>

          {/* Lights */}
          <Section title="Lights">
            <SliderRow label="Intensity" value={settings.lightIntensity} min={0} max={2} step={0.05} unit="×" onChange={(v) => onChange({ lightIntensity: v })} />
          </Section>

          <div className="h-8" />
        </div>
      )}

      {/* ── Export tab ── */}
      {tab === 'export' && (
        <ExportTab settings={settings} onChange={onChange} onExport={onExport} onCapturePreview={onCapturePreview} />
      )}

    </aside>
  )
}
