import React from 'react'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { type Workspace, type SavedPose, type CardSettings } from '@/types'
import { DEFAULT_FRONT_URL } from '@/constants'

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

function WorkspaceThumb({
  workspace, index, active, canDelete, onSelect, onDelete,
}: {
  workspace: Workspace
  index:     number
  active:    boolean
  canDelete: boolean
  onSelect:  () => void
  onDelete:  () => void
}) {
  const THUMB_W = 80
  const THUMB_H = 50
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
      <button onClick={onSelect} title={workspace.name} className="block w-full h-full">
        <div
          className={cn(
            'relative w-full h-full rounded-[8px] overflow-hidden transition-all duration-100',
            'flex items-center justify-center',
            active
              ? 'border-2 border-[#9ae600]'
              : 'border border-[#242424] hover:border-white/20',
          )}
          style={{ backgroundColor: '#1d1d1d' }}
        >
          <div className="flex items-center" style={{ gap: GAP, width: totalW }}>
            {Array.from({ length: count }).map((_, i) => {
              const page = workspace.pages[i]
              const edgeColor = page?.settings.edgeColor ?? '#9AE600'
              const hasImg    = !!page?.settings.frontImage && page.settings.frontImage !== DEFAULT_FRONT_URL
              return (
                <div
                  key={i}
                  className="relative rounded-[2px] overflow-hidden flex-shrink-0"
                  style={{ width: cw, height: ch, backgroundColor: '#1a1a1a' }}
                >
                  {hasImg ? (
                    <img src={page.settings.frontImage!} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute left-0 top-0 bottom-0" style={{ width: 2, backgroundColor: edgeColor }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </button>

      {/* Index badge */}
      <div className="absolute bottom-0 right-0 text-[7px] font-bold leading-none text-white/60 bg-black/50 px-[3px] py-px rounded-[3px] pointer-events-none">
        {index + 1}
      </div>

      {/* Delete button */}
      {canDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className={cn(
            'absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full',
            'bg-[#252525] shadow-sm',
            'flex items-center justify-center',
            'text-white/35 hover:text-red-400 hover:border-red-400/30 hover:bg-red-500/10',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-100',
          )}
          title="Remove workspace"
        >
          <Icon name="close" size={12} />
        </button>
      )}
    </div>
  )
}

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
  workspaces, activeWorkspaceId, onSelect, onAdd, onDelete,
}: LeftPanelProps) {

  return (
    <div
      className={cn(
        'fixed left-4 top-1/2 -translate-y-1/2 z-40',
        'flex flex-col items-center gap-2',
        'bg-[#111]',
        'rounded-2xl border border-[#242424]',
        'p-4',
      )}
    >
      {/* ── Workspace list ── */}
      <div
        className="flex flex-col items-center gap-2 overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 120px)', scrollbarWidth: 'none' }}
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
      <div className="w-full h-px bg-[#242424]" />

      {/* ── Add workspace button ── */}
      <button
        onClick={onAdd}
        title="New workspace"
        className="w-10 h-10 rounded-full flex items-center justify-center bg-[#252525] text-white/55 hover:text-white/80 hover:bg-[#2e2e2e] transition-all active:scale-95 flex-shrink-0"
      >
        <Icon name="add" size={20} />
      </button>


    </div>
  )
}
