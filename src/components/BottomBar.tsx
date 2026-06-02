import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'
import { PosesPanel } from './PosesPanel'
import { type CardSettings, type Orientation, type SavedPose } from '@/types'

const ORIENTATIONS: { key: Orientation; label: string }[] = [
  { key: 'horizontal', label: 'Horizontal' },
  { key: 'vertical',   label: 'Vertical'   },
]

interface BottomBarProps {
  settings:             CardSettings
  onChange:             (patch: Partial<CardSettings>) => void
  displayCount:         1 | 2 | 3
  onDisplayCountChange: (count: 1 | 2 | 3) => void
  savedPoses:           SavedPose[]
  onSavePose:           (pose: SavedPose) => void
  onApplyPose:          (pose: SavedPose) => void
  onDeletePose:         (id: string) => void
  onRenamePose:         (id: string, name: string) => void
}

export function BottomBar({ settings, onChange, displayCount, onDisplayCountChange, savedPoses, onSavePose, onApplyPose, onDeletePose, onRenamePose }: BottomBarProps) {
  const [countTooltip, setCountTooltip] = useState(false)
  const [posesOpen,    setPosesOpen]    = useState(false)
  const posesButtonRef = useRef<HTMLButtonElement>(null)

  function cycleCount() {
    const next = displayCount === 1 ? 2 : displayCount === 2 ? 3 : 1
    onDisplayCountChange(next)
  }

  return (
    <div className="h-[72px] flex items-center justify-center gap-2 bg-[#111] border-t border-[#242424] flex-shrink-0">

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

      {/* ── RIGHT: Poses panel ── */}
      <div className="relative">
        <button
          ref={posesButtonRef}
          onClick={() => setPosesOpen((o) => !o)}
          title="Saved poses"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#252525] border border-white/[0.1] text-white/55 hover:text-white/80 hover:bg-[#2e2e2e] transition-all active:scale-95"
        >
          <Icon name="bookmark" size={18} filled={posesOpen} />
        </button>

        {posesOpen && (
          <div className="absolute bottom-full right-0 mb-3 z-50">
            <PosesPanel
              savedPoses={savedPoses}
              currentSettings={settings}
              onSave={onSavePose}
              onApply={onApplyPose}
              onDelete={onDeletePose}
              onRename={onRenamePose}
              onClose={() => setPosesOpen(false)}
              anchorRef={posesButtonRef}
            />
          </div>
        )}
      </div>

    </div>
  )
}
