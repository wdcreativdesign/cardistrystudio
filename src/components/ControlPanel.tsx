import { useRef, useCallback, useState, useEffect } from 'react'
import { Slider } from '@/components/ui/slider'
import { SliderRow } from '@/components/SliderRow'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'
import { SegControl } from '@/components/ui/SegControl'
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
        <Icon name="expand_more" size={20} className={cn('text-white transition-transform duration-200', open ? 'rotate-0' : '-rotate-90')} />
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
      <SegControl
        options={[{ key: 'solid', label: 'Solid' }, { key: 'gradient', label: 'Gradient' }]}
        value={gradMode ? 'gradient' : 'solid'}
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

/* ─── Magnetic + Glowing Export Button ──────────────────────────── */
function AuroraExportButton({ format, onExport }: { format: ExportFormat; onExport: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const btnRef  = useRef<HTMLButtonElement>(null)
  const rafRef  = useRef<number | null>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const btn = btnRef.current
      if (!btn) return
      const rect = btn.getBoundingClientRect()
      const cx = rect.left + rect.width  / 2
      const cy = rect.top  + rect.height / 2
      // Magnetic pull — max 6px
      const dx = (e.clientX - cx) / (rect.width  / 2)
      const dy = (e.clientY - cy) / (rect.height / 2)
      btn.style.transform = `translate(${dx * 6}px, ${dy * 4}px)`
    })
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (btnRef.current) {
      btnRef.current.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.6s ease'
      btnRef.current.style.transform  = 'translate(0px, 0px)'
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      className="magnetic-wrap w-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={btnRef}
        onClick={onExport}
        className="magnetic-btn w-full flex items-center justify-center gap-2 text-[#111] text-[13px] font-semibold py-3 rounded-full"
      >
        <Icon name="download" size={18} />
        Export {format.toUpperCase()}
      </button>
    </div>
  )
}

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
      <div className="px-4 py-4 flex flex-col items-center gap-1.5">
        <AuroraExportButton format={format} onExport={() => onExport({ format, scale, showShadow })} />
        <p className="text-[11px] text-[#555] font-medium">Cost 5 tokens</p>
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
  tab:              'create' | 'export'
  onTabChange:      (tab: 'create' | 'export') => void
}

export function ControlPanel({ settings, displayCount, onChange, onReset, onRandomize, onExport, onCapturePreview, tab, onTabChange }: ControlPanelProps) {

  return (
    <aside className="flex flex-col w-[280px] min-w-[280px] bg-[#111] border-l border-[#242424]" style={{ marginTop: 72, height: 'calc(100vh - 72px)' }}>

      {/* ── Navigation ── */}
      <div className="h-[72px] flex items-center px-4 border-b border-white/[0.06]">
        <SegControl
          options={[
            { key: 'create', label: 'Moove' },
            { key: 'export', label: 'Export' },
          ]}
          value={tab}
          onChange={onTabChange}
        />
      </div>

      {/* ── Create tab ── */}
      {tab === 'create' && (
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>

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
            <SegControl
              options={[
                { key: 'perspective', label: 'Perspective' },
                { key: 'isometric',  label: 'Isometric'   },
              ]}
              value={settings.cameraMode ?? 'perspective'}
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
