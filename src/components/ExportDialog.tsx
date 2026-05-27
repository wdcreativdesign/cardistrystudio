import { useState } from 'react'
import { Download } from 'lucide-react'
import { cn } from '@/lib/utils'

type Format     = 'png' | 'jpg' | 'svg'
type Background = 'solid' | 'transparent'

export interface ExportOptions {
  format:     Format
  background: Background
}

interface ExportDialogProps {
  open:     boolean
  onClose:  () => void
  onExport: (opts: ExportOptions) => void
}

/* ── Pill toggle ──────────────────────────────────────────────────── */
function PillToggle<T extends string>({
  value,
  options,
  disabled,
  onChange,
}: {
  value:    T
  options:  { value: T; label: string }[]
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
              'flex-1 text-[12px] font-medium py-1.5 rounded-[10px] transition-all',
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

/* ── ExportDialog ─────────────────────────────────────────────────── */
export function ExportDialog({ open, onClose, onExport }: ExportDialogProps) {
  const [format,     setFormat]     = useState<Format>('png')
  const [background, setBackground] = useState<Background>('solid')

  if (!open) return null

  // JPG and SVG don't support transparency
  const transpDisabled = format === 'jpg' || format === 'svg'
  const effectiveBg: Background = transpDisabled ? 'solid' : background

  function handleFormat(f: Format) {
    setFormat(f)
    if (f === 'jpg' || f === 'svg') setBackground('solid')
  }

  function handleExport() {
    onExport({ format, background: effectiveBg })
    onClose()
  }

  const exportLabel =
    effectiveBg === 'transparent' ? 'Export PNG' :
    format === 'jpg'              ? 'Export JPG' :
    format === 'svg'              ? 'Export SVG' :
                                    'Export PNG'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-black/[0.07] p-6 w-[320px] mx-4 animate-in fade-in zoom-in-95 duration-150">

        <h3 className="text-[15px] font-semibold text-black/85 mb-5">Export</h3>

        {/* Format */}
        <div className="mb-4">
          <p className="text-[11px] font-medium text-black/35 uppercase tracking-wider mb-2">
            Format
          </p>
          <PillToggle
            value={format}
            options={[
              { value: 'png', label: 'PNG' },
              { value: 'jpg', label: 'JPG' },
              { value: 'svg', label: 'SVG' },
            ]}
            onChange={handleFormat}
          />
        </div>

        {/* Background */}
        <div className="mb-6">
          <p className="text-[11px] font-medium text-black/35 uppercase tracking-wider mb-2">
            Background
          </p>
          <PillToggle
            value={effectiveBg}
            options={[
              { value: 'solid',       label: 'With background' },
              { value: 'transparent', label: 'Transparent'     },
            ]}
            disabled={transpDisabled ? ['transparent'] : []}
            onChange={(v) => setBackground(v as Background)}
          />
          {transpDisabled && (
            <p className="text-[10px] text-black/30 mt-1.5">
              {format === 'svg' ? 'SVG' : 'JPG'} does not support transparency.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[13px] font-medium text-black/55 hover:text-black/80 border border-black/10 hover:bg-black/[0.04] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium bg-[#1a1a1a] hover:bg-[#2d2d2d] text-white transition-all active:scale-[0.97]"
          >
            <Download className="w-3.5 h-3.5" />
            {exportLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
