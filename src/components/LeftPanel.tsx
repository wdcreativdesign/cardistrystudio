import { useState, useRef } from 'react'
import { Plus, X, Bookmark } from 'lucide-react'
import { PosesPanel } from './PosesPanel'
import { cn } from '@/lib/utils'
import { type Workspace, type SavedPose, type CardSettings } from '@/types'

/* ── Card silhouette sizes ───────────────────────────────────────── */
const CARD_RATIO = 85.6 / 54

function cardDims(orientation: 'horizontal' | 'vertical', maxH: number) {
  if (orientation === 'horizontal') {
    const h = maxH
    return { w: Math.round(h * CARD_RATIO), h }
  } else {
    const w = Math.round(maxH / CARD_RATIO)
    return { w, h: maxH }
  }
}

/* ── Workspace thumbnail ─────────────────────────────────────────── */
function WorkspaceThumb({
  workspace,
  index,
  active,
  canDelete,
  onSelect,
  onDelete,
}: {
  workspace: Workspace
  index:     number
  active:    boolean
  canDelete: boolean
  onSelect:  () => void
  onDelete:  () => void
}) {
  const THUMB_W = 64
  const THUMB_H = 44
  const GAP     = 3

  const count       = workspace.displayCount
  const firstCard   = workspace.pages[0]
  const orientation = firstCard?.settings.orientation ?? 'horizontal'

  const totalGap = (count - 1) * GAP
  const maxCardW = Math.floor((THUMB_W - totalGap - 8) / count)
  const maxCardH = THUMB_H - 8
  const isH      = orientation === 'horizontal'

  let cw: number, ch: number
  if (isH) {
    cw = maxCardW
    ch = Math.round(cw / CARD_RATIO)
    if (ch > maxCardH) { ch = maxCardH; cw = Math.round(ch * CARD_RATIO) }
  } else {
    ch = maxCardH
    cw = Math.round(ch / CARD_RATIO)
    if (cw > maxCardW) { cw = maxCardW; ch = Math.round(cw * CARD_RATIO) }
  }

  const totalW = cw * count + GAP * (count - 1)

  return (
    <div className="relative group flex-shrink-0" style={{ width: THUMB_W, height: THUMB_H }}>
      <button
        onClick={onSelect}
        title={workspace.name}
        className="block w-full h-full"
      >
        <div
          className={cn(
            'relative w-full h-full rounded-[7px] overflow-hidden transition-all duration-100',
            'flex items-center justify-center',
            active
              ? 'ring-2 ring-black/75 ring-offset-2'
              : 'ring-1 ring-black/12 hover:ring-black/30',
          )}
          style={{ backgroundColor: '#e8e8ed' }}
        >
          <div className="flex items-center" style={{ gap: GAP, width: totalW }}>
            {Array.from({ length: count }).map((_, i) => {
              const page = workspace.pages[i]
              const edgeColor = page?.settings.edgeColor ?? '#009FFF'
              const hasImg    = !!page?.settings.frontImage
              return (
                <div
                  key={i}
                  className="relative rounded-[2px] overflow-hidden flex-shrink-0"
                  style={{ width: cw, height: ch, backgroundColor: '#1c1c1e' }}
                >
                  {hasImg ? (
                    <img
                      src={page.settings.frontImage!}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="absolute left-0 top-0 bottom-0"
                      style={{ width: 2, backgroundColor: edgeColor }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </button>

      {/* Index badge */}
      <div className="absolute bottom-0 right-0 text-[7px] font-bold leading-none text-white/80 bg-black/50 px-[3px] py-px rounded-[3px] pointer-events-none">
        {index + 1}
      </div>

      {/* Delete button */}
      {canDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className={cn(
            'absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full',
            'bg-white border border-black/[0.1] shadow-sm',
            'flex items-center justify-center',
            'text-black/35 hover:text-red-500 hover:border-red-200 hover:bg-red-50',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-100',
          )}
          title="Remove workspace"
        >
          <X className="w-2 h-2" />
        </button>
      )}
    </div>
  )
}

/* ── LeftPanel ───────────────────────────────────────────────────── */
interface LeftPanelProps {
  workspaces:        Workspace[]
  activeWorkspaceId: string
  onSelect:          (id: string) => void
  onAdd:             () => void
  onDelete:          (id: string) => void
  savedPoses:        SavedPose[]
  currentSettings:   CardSettings
  onSavePose:        (pose: SavedPose) => void
  onApplyPose:       (pose: SavedPose) => void
  onDeletePose:      (id: string) => void
  onRenamePose:      (id: string, name: string) => void
}

export function LeftPanel({
  workspaces,
  activeWorkspaceId,
  onSelect,
  onAdd,
  onDelete,
  savedPoses,
  currentSettings,
  onSavePose,
  onApplyPose,
  onDeletePose,
  onRenamePose,
}: LeftPanelProps) {
  const [posesOpen, setPosesOpen] = useState(false)
  const posesButtonRef = useRef<HTMLButtonElement>(null)

  return (
    <div
      className={cn(
        'fixed left-4 top-1/2 -translate-y-1/2 z-40',
        'flex flex-col items-center gap-2',
        'bg-white/75 backdrop-blur-2xl',
        'rounded-2xl border border-black/[0.07]',
        'shadow-[0_8px_32px_-8px_rgba(0,0,0,0.14),0_2px_8px_-2px_rgba(0,0,0,0.06)]',
        'p-2',
      )}
    >
      {/* ── Poses button ── */}
      <button
        ref={posesButtonRef}
        onClick={() => setPosesOpen((o) => !o)}
        title="Saved poses"
        className={cn(
          'w-8 h-8 rounded-[10px] flex-shrink-0',
          'flex items-center justify-center',
          'transition-all active:scale-95 cursor-pointer',
          posesOpen
            ? 'bg-black/[0.09] text-black/70'
            : 'bg-black/[0.04] hover:bg-black/[0.09] text-black/30 hover:text-black/60',
        )}
      >
        <Bookmark className="w-3.5 h-3.5" />
      </button>

      {/* PosesPanel — opens to the right */}
      {posesOpen && (
        <PosesPanel
          savedPoses={savedPoses}
          currentSettings={currentSettings}
          onSave={onSavePose}
          onApply={onApplyPose}
          onDelete={onDeletePose}
          onRename={onRenamePose}
          onClose={() => setPosesOpen(false)}
          anchorRef={posesButtonRef}
        />
      )}

      {/* Divider */}
      <div className="w-full h-px bg-black/[0.07]" />

      {/* ── Workspace list ── */}
      <div
        className="flex flex-col items-center gap-2 overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 180px)', scrollbarWidth: 'none' }}
      >
        {workspaces.map((ws, i) => (
          <WorkspaceThumb
            key={ws.id}
            workspace={ws}
            index={i}
            active={ws.id === activeWorkspaceId}
            canDelete={workspaces.length > 1}
            onSelect={() => onSelect(ws.id)}
            onDelete={() => onDelete(ws.id)}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-black/[0.07]" />

      {/* ── Add workspace button ── */}
      <button
        onClick={onAdd}
        title="New workspace"
        className={cn(
          'w-8 h-8 rounded-[10px] flex-shrink-0',
          'flex items-center justify-center',
          'bg-black/[0.04] hover:bg-black/[0.09]',
          'text-black/30 hover:text-black/60',
          'transition-all active:scale-95 cursor-pointer',
        )}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
