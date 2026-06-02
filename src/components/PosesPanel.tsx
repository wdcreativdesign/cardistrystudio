import { useRef, useEffect, useState } from 'react' // useState used by PoseRow
import { Icon } from '@/components/ui/icon'
import { type SavedPose, type CardSettings } from '@/types'

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

function PoseRow({ pose, onApply, onDelete, onRename }: {
  pose:     SavedPose
  onApply:  () => void
  onDelete: () => void
  onRename: (name: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(pose.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) { inputRef.current?.focus(); inputRef.current?.select() }
  }, [editing])

  function commit() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== pose.name) onRename(trimmed)
    else setDraft(pose.name)
    setEditing(false)
  }

  return (
    <div className="flex items-center gap-2 p-2 rounded-[8px] text-white hover:bg-white/[0.04] transition-colors group">
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter')  { e.preventDefault(); commit() }
            if (e.key === 'Escape') { setDraft(pose.name); setEditing(false) }
          }}
          className="flex-1 text-[12px] font-medium text-white text-left bg-[#242424] h-6 rounded-[4px] px-1 focus:outline-none focus:border focus:border-[#9ae600] min-w-0"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <button
          type="button"
          onClick={onApply}
          className="flex-1 text-[14px] font-medium text-left truncate min-w-0"
        >
          {pose.name}
        </button>
      )}

      {!editing && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setEditing(true) }}
          className="text-white/40 hover:text-white transition-colors flex-shrink-0"
        >
          <Icon name="edit" size={16} />
        </button>
      )}

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="text-white/40 hover:text-red-400 transition-colors flex-shrink-0"
      >
        <Icon name="delete" size={16} />
      </button>
    </div>
  )
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

  function handleSave() {
    const pose: SavedPose = {
      id:         Math.random().toString(36).slice(2, 9),
      name:       `Pose ${savedPoses.length + 1}`,
      rotX:       currentSettings.rotX ?? 0,
      rotY:       currentSettings.rotY ?? 0,
      rotZ:       currentSettings.rotZ ?? 0,
      zoom:       currentSettings.zoom  ?? 1,
      posX:       currentSettings.posX  ?? 0,
      posY:       currentSettings.posY  ?? 0,
      posZ:       currentSettings.posZ  ?? 0,
      autoRotate: currentSettings.autoRotate ?? false,
    }
    onSave(pose)
  }

  return (
    <div
      ref={panelRef}
      className="w-[240px] bg-[#111] border border-[#242424] rounded-[24px] drop-shadow-[0px_8px_12px_rgba(0,0,0,0.32)] animate-in fade-in zoom-in-95 duration-150 origin-bottom-right"
    >
      <div className="flex flex-col gap-2 p-4">

        {/* Label */}
        <div className="flex items-center">
          <span className="text-[12px] font-medium text-[#999]">Saved poses</span>
        </div>

        {/* Pose list */}
        {savedPoses.length > 0 && (
          <div className="flex flex-col">
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

        {/* Save CTA */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleSave() }}
          className="w-full h-[41px] rounded-full text-[16px] font-medium bg-[#242424] hover:bg-[#2e2e2e] text-white transition-all active:scale-[0.98]"
        >
          Save current pose
        </button>

      </div>
    </div>
  )
}
