import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'
import { type CardSettings, type Orientation } from '@/types'

const ORIENTATIONS: { key: Orientation; label: string }[] = [
  { key: 'horizontal', label: 'Horizontal' },
  { key: 'vertical',   label: 'Vertical'   },
]

interface BottomBarProps {
  settings:             CardSettings
  onChange:             (patch: Partial<CardSettings>) => void
  displayCount:         1 | 2 | 3
  onDisplayCountChange: (count: 1 | 2 | 3) => void
  onSavePose:           () => void
}

export function BottomBar({ settings, onChange, displayCount, onDisplayCountChange, onSavePose }: BottomBarProps) {
  const [countTooltip, setCountTooltip]   = useState(false)
  const [poseTooltip,  setPoseTooltip]    = useState(false)
  const [poseSaved,    setPoseSaved]      = useState(false)

  function cycleCount() {
    const next = displayCount === 1 ? 2 : displayCount === 2 ? 3 : 1
    onDisplayCountChange(next)
  }

  function handleSavePose() {
    onSavePose()
    setPoseSaved(true)
    setTimeout(() => setPoseSaved(false), 1500)
  }

  return (
    <div className="h-[72px] flex items-center justify-center gap-2 bg-[#141414] border-t border-white/[0.06] flex-shrink-0">

      {/* ── LEFT: Card count cycle ── */}
      <div className="relative">
        {countTooltip && (
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[#252525] border border-white/[0.08] text-white text-[10px] font-medium px-2 py-1 rounded-lg whitespace-nowrap pointer-events-none shadow-lg">
            {displayCount} card{displayCount > 1 ? 's' : ''}
          </div>
        )}
        <button
          onClick={cycleCount}
          onMouseEnter={() => setCountTooltip(true)}
          onMouseLeave={() => setCountTooltip(false)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#252525] border border-white/[0.1] text-white/55 hover:text-white/80 hover:bg-[#2e2e2e] transition-all active:scale-95"
        >
          <Icon name="style" size={18} />
        </button>
      </div>

      {/* ── CENTER: Orientation segmented control ── */}
      <div className="flex gap-0.5 p-1 bg-[#252525] rounded-full">
        {ORIENTATIONS.map((o) => {
          const active = settings.orientation === o.key
          return (
            <button
              key={o.key}
              onClick={() => onChange({ orientation: o.key })}
              className={cn(
                'px-4 py-[7px] rounded-full text-[13px] transition-all duration-200 select-none',
                active ? 'bg-[#141414] text-white font-semibold shadow-sm' : 'text-white/40 hover:text-white/65 font-medium',
              )}
            >
              {o.label}
            </button>
          )
        })}
      </div>

      {/* ── RIGHT: Save pose ── */}
      <div className="relative">
        {poseTooltip && !poseSaved && (
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[#252525] border border-white/[0.08] text-white text-[10px] font-medium px-2 py-1 rounded-lg whitespace-nowrap pointer-events-none shadow-lg">
            Save pose
          </div>
        )}
        {poseSaved && (
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[#9AE600] text-[#0d0d0d] text-[10px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap pointer-events-none shadow-lg">
            Saved!
          </div>
        )}
        <button
          onClick={handleSavePose}
          onMouseEnter={() => setPoseTooltip(true)}
          onMouseLeave={() => setPoseTooltip(false)}
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-full border transition-all active:scale-95',
            poseSaved
              ? 'bg-[#9AE600] border-[#9AE600] text-[#0d0d0d]'
              : 'bg-[#252525] border-white/[0.1] text-white/55 hover:text-white/80 hover:bg-[#2e2e2e]',
          )}
        >
          <Icon name="bookmark" size={18} filled={poseSaved} />
        </button>
      </div>

    </div>
  )
}
