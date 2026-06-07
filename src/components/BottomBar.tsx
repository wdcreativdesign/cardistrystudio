import { useState, useRef } from 'react'
import { Icon } from '@/components/ui/icon'
import { PosesPanel } from './PosesPanel'
import { SegControl } from '@/components/ui/SegControl'
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
    <div className="h-[72px] flex items-center justify-center gap-[8px] flex-shrink-0">

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
          className="size-[40px] flex items-center justify-center rounded-full bg-[#141414] text-white hover:brightness-110 transition-all active:scale-95"
        >
          <Icon name="style" size={20} />
        </button>
      </div>

      {/* ── CENTER: Orientation segmented control ── */}
      <div className="w-[220px]">
        <SegControl
          options={ORIENTATIONS}
          value={settings.orientation}
          onChange={(v) => onChange({ orientation: v })}
        />
      </div>

      {/* ── RIGHT: Poses panel ── */}
      <div className="relative">
        <button
          ref={posesButtonRef}
          onClick={() => setPosesOpen((o) => !o)}
          title="Saved poses"
          className="size-[40px] flex items-center justify-center rounded-full bg-[#141414] text-white hover:brightness-110 transition-all active:scale-95"
        >
          <Icon name="bookmark" size={20} filled={posesOpen} />
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
