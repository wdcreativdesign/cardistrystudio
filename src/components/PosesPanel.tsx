import { useState, useRef, useEffect } from 'react'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { type SavedPose, type CardSettings } from '@/types'

/* ── Pose row ────────────────────────────────────────────────────── */
function PoseRow({
  pose,
  onApply,
  onDelete,
  onRename,
}: {
  pose:     SavedPose
  onApply:  () => void
  onDelete: () => void
  onRename: (name: string) => void
}) {
  const [editing,  setEditing]  = useState(false)
  const [draft,    setDraft]    = useState(pose.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) inputRef.current?.select() }, [editing])

  function commit() {
    const trimmed = draft.trim()
    if (trimmed) onRename(trimmed)
    else setDraft(pose.name)
    setEditing(false)
  }

  return (
    <div className="group flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/[0.04] transition-colors">
      {/* Name / inline edit */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(pose.name); setEditing(false) } }}
            className="w-full text-[12px] font-medium text-white/80 bg-transparent outline-none border-b border-white/20 pb-px"
          />
        ) : (
          <button
            onClick={() => { setDraft(pose.name); setEditing(true) }}
            className="text-left w-full"
          >
            <p className="text-[12px] font-medium text-white/75 truncate leading-none">{pose.name}</p>
            <p className="text-[10px] text-white/25 mt-0.5 tabular-nums">
              X{pose.rotX}° Y{pose.rotY}° Z{pose.rotZ}°
            </p>
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {editing ? (
          <button onClick={commit} className="p-1 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors">
            <Icon name="check" size={16} />
          </button>
        ) : (
          <>
            <button
              onClick={onApply}
              title="Apply pose"
              className="p-1 rounded-lg text-white/35 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
            >
              <Icon name="replay" size={16} />
            </button>
            <button
              onClick={onDelete}
              title="Delete"
              className="p-1 rounded-lg text-white/25 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Icon name="delete" size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ── PosesPanel ──────────────────────────────────────────────────── */
interface PosesPanelProps {
  savedPoses:      SavedPose[]
  currentSettings: CardSettings
  onSave:          (pose: SavedPose) => void
  onApply:         (pose: SavedPose) => void
  onDelete:        (id: string) => void
  onRename:        (id: string, name: string) => void
  onClose:         () => void
  anchorRef:       React.RefObject<HTMLButtonElement | null>
}

export function PosesPanel({
  savedPoses,
  currentSettings,
  onSave,
  onApply,
  onDelete,
  onRename,
  onClose,
  anchorRef,
}: PosesPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  /* Close on outside click */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose, anchorRef])

  function handleSaveCurrent() {
    const pose: SavedPose = {
      id:         Math.random().toString(36).slice(2, 9),
      name:       `Pose ${savedPoses.length + 1}`,
      rotX:       currentSettings.rotX,
      rotY:       currentSettings.rotY,
      rotZ:       currentSettings.rotZ,
      zoom:       currentSettings.zoom,
      posX:       currentSettings.posX,
      posY:       currentSettings.posY,
      posZ:       currentSettings.posZ,
      autoRotate: currentSettings.autoRotate,
    }
    onSave(pose)
  }

  return (
    <div
      ref={panelRef}
      className={cn(
        'absolute left-full ml-3 top-0 z-50',
        'w-[220px]',
        'bg-[#1e1e1e]/95 backdrop-blur-xl',
        'rounded-2xl border border-white/[0.07]',
        'shadow-[0_12px_40px_-8px_rgba(0,0,0,0.18),0_4px_12px_-4px_rgba(0,0,0,0.08)]',
        'p-2',
        'animate-in fade-in slide-in-from-top-2 duration-150',
      )}
    >
      {/* Header */}
      <div className="px-2 py-1.5 mb-1">
        <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wide">Saved Poses</p>
      </div>

      {/* List */}
      {savedPoses.length === 0 ? (
        <div className="px-2 py-4 text-center">
          <p className="text-[11px] text-white/25">No saved poses yet</p>
          <p className="text-[10px] text-white/18 mt-0.5">Save your current rotation above</p>
        </div>
      ) : (
        <div className="space-y-0.5 max-h-[280px] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {savedPoses.map((pose) => (
            <PoseRow
              key={pose.id}
              pose={pose}
              onApply={() => { onApply(pose); onClose() }}
              onDelete={() => onDelete(pose.id)}
              onRename={(name) => onRename(pose.id, name)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
