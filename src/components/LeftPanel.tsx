import { useState, useRef, useEffect } from 'react'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { type Workspace, type CardSettings } from '@/types'
import { DEFAULT_FRONT_URL } from '@/constants'

// ── Types ────────────────────────────────────────────────────────────
type Tab = 'pages' | 'layers'

interface Layer {
  id:      string
  label:   string
  type:    'image' | 'chip' | 'effect' | 'edge'
  color:   string
  visible: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────
const CARD_RATIO = 85.6 / 54
const GAP        = 3

function getLayers(settings: CardSettings): Layer[] {
  return [
    {
      id:      'front',
      label:   'Front Image',
      type:    'image',
      color:   '#4d7cff',
      visible: !!(settings.frontImage && settings.frontImage !== DEFAULT_FRONT_URL),
    },
    {
      id:      'back',
      label:   'Back Image',
      type:    'image',
      color:   '#4d7cff',
      visible: !!settings.backImage,
    },
    {
      id:      'chip',
      label:   'Chip',
      type:    'chip',
      color:   '#c9a827',
      visible: true,
    },
    {
      id:      'edge',
      label:   'Edge',
      type:    'edge',
      color:   settings.edgeColor,
      visible: true,
    },
    {
      id:      'finish',
      label:   settings.finish.charAt(0).toUpperCase() + settings.finish.slice(1),
      type:    'effect',
      color:   '#9a6fff',
      visible: true,
    },
  ]
}

// ── WorkspaceThumb (mini preview) ─────────────────────────────────────
function WorkspaceThumb({ workspace, count }: { workspace: Workspace; count: number }) {
  const THUMB_W = 44
  const THUMB_H = 28
  const firstCard   = workspace.pages[0]
  const orientation = firstCard?.settings.orientation ?? 'horizontal'
  const isH = orientation === 'horizontal'
  const totalGap = (count - 1) * GAP

  let cw: number, ch: number
  const maxCardW = Math.floor((THUMB_W - totalGap) / count)
  const maxCardH = THUMB_H - 4
  if (isH) {
    cw = maxCardW; ch = Math.round(cw / CARD_RATIO)
    if (ch > maxCardH) { ch = maxCardH; cw = Math.round(ch * CARD_RATIO) }
  } else {
    ch = maxCardH; cw = Math.round(ch / CARD_RATIO)
    if (cw > maxCardW) { cw = maxCardW; ch = Math.round(cw * CARD_RATIO) }
  }

  return (
    <div className="flex items-center justify-center" style={{ width: THUMB_W, height: THUMB_H, gap: GAP }}>
      {Array.from({ length: count }).map((_, i) => {
        const page      = workspace.pages[i]
        const edgeColor = page?.settings.edgeColor ?? '#9AE600'
        const hasImg    = !!page?.settings.frontImage && page.settings.frontImage !== DEFAULT_FRONT_URL
        return (
          <div
            key={i}
            className="rounded-[2px] overflow-hidden flex-shrink-0 relative"
            style={{ width: cw, height: ch, backgroundColor: '#1a1a1a' }}
          >
            {hasImg
              ? <img src={page.settings.frontImage!} alt="" className="absolute inset-0 w-full h-full object-cover" />
              : <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ backgroundColor: edgeColor }} />}
          </div>
        )
      })}
    </div>
  )
}

// ── Inline rename input ───────────────────────────────────────────────
function InlineRename({ value, onDone }: { value: string; onDone: (v: string) => void }) {
  const [val, setVal] = useState(value)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus(); ref.current?.select() }, [])
  return (
    <input
      ref={ref}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => onDone(val.trim() || value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onDone(val.trim() || value)
        if (e.key === 'Escape') onDone(value)
      }}
      className="flex-1 bg-transparent text-[13px] text-white font-medium outline-none border-b border-[#9ae600]/60 min-w-0 leading-none py-0"
      onClick={(e) => e.stopPropagation()}
    />
  )
}

// ── PageRow ───────────────────────────────────────────────────────────
function PageRow({
  workspace, index, isActive, canDelete,
  onSelect, onDelete, onRename,
}: {
  workspace: Workspace
  index:     number
  isActive:  boolean
  canDelete: boolean
  onSelect:  () => void
  onDelete:  () => void
  onRename:  (name: string) => void
}) {
  const [renaming,  setRenaming]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 px-2 h-9 rounded-[8px] cursor-pointer transition-colors select-none',
        isActive ? 'bg-[#9ae600]/10' : 'hover:bg-white/[0.04]',
      )}
      onClick={onSelect}
    >
      {/* Index badge */}
      <div
        className={cn(
          'flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold transition-colors',
          isActive ? 'bg-[#9ae600] text-[#111]' : 'bg-[#242424] text-[#666]',
        )}
      >
        {index + 1}
      </div>

      {/* Name / rename */}
      {renaming ? (
        <InlineRename
          value={workspace.name}
          onDone={(v) => { onRename(v); setRenaming(false) }}
        />
      ) : (
        <span className={cn(
          'flex-1 text-[13px] font-medium truncate',
          isActive ? 'text-white' : 'text-[#999]',
        )}>
          {workspace.name}
        </span>
      )}

      {/* Thumbnail */}
      {!renaming && (
        <div className="flex-shrink-0 opacity-60">
          <WorkspaceThumb workspace={workspace} count={workspace.displayCount} />
        </div>
      )}

      {/* Dots menu */}
      {!renaming && (
        <div ref={menuRef} className="relative flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o) }}
            className={cn(
              'w-6 h-6 rounded flex items-center justify-center transition-opacity',
              'opacity-0 group-hover:opacity-100',
              menuOpen && 'opacity-100',
              'hover:bg-white/10 text-white/50 hover:text-white/80',
            )}
          >
            <Icon name="more_horiz" size={14} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-7 z-50 w-[140px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[10px] overflow-hidden shadow-xl py-1">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setRenaming(true) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <Icon name="edit" size={13} />
                Rename
              </button>
              {canDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete() }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Icon name="delete" size={13} />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── LayerRow ──────────────────────────────────────────────────────────
function LayerRow({ layer }: { layer: Layer }) {
  return (
    <div className="flex items-center gap-2 px-2 h-[30px] rounded-[6px]">
      {/* Type icon */}
      <div
        className="flex-shrink-0 w-[14px] h-[14px] rounded-[3px]"
        style={{ backgroundColor: layer.color }}
      />

      <span className={cn(
        'flex-1 text-[12px] font-medium truncate',
        layer.visible ? 'text-white' : 'text-[#444]',
      )}>
        {layer.label}
      </span>

      {/* Visibility dot */}
      <div
        className="flex-shrink-0 w-[6px] h-[6px] rounded-full"
        style={{ backgroundColor: layer.visible ? '#9ae600' : '#333' }}
      />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────
interface LeftPanelProps {
  workspaces:        Workspace[]
  activeWorkspaceId: string
  activeSettings:    CardSettings
  onSelect:          (id: string) => void
  onAdd:             () => void
  onDelete:          (id: string) => void
  onRename:          (id: string, name: string) => void
  // legacy (unused but kept to avoid breaking call site)
  savedPoses?:       unknown
  currentSettings?:  unknown
  onSavePose?:       unknown
  onApplyPose?:      unknown
  onDeletePose?:     unknown
  onRenamePose?:     unknown
}

export function LeftPanel({
  workspaces, activeWorkspaceId, activeSettings,
  onSelect, onAdd, onDelete, onRename,
}: LeftPanelProps) {
  const [tab, setTab] = useState<Tab>('pages')
  const layers = getLayers(activeSettings)

  return (
    <div className="w-[280px] flex-shrink-0 h-full flex flex-col bg-[#111] border-r border-[#242424] z-10 overflow-hidden">

      {/* ── Segmented control ── */}
      <div className="flex-shrink-0 px-4 py-4 border-b border-[#242424]">
        <div className="flex items-center bg-[#242424] rounded-full p-1 h-10">
          {(['pages', 'layers'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 h-8 rounded-full text-[14px] font-medium transition-all capitalize',
                tab === t
                  ? 'bg-[#141414] text-white'
                  : 'text-[#666] hover:text-[#999]',
              )}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Pages tab ── */}
      {tab === 'pages' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Count */}
          <div className="flex-shrink-0 px-6 pt-3 pb-1">
            <span className="text-[11px] text-[#555] font-medium">
              {workspaces.length} {workspaces.length === 1 ? 'page' : 'pages'}
            </span>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-4 py-1" style={{ scrollbarWidth: 'none' }}>
            <div className="flex flex-col gap-0.5">
              {workspaces.map((ws, i) => (
                <PageRow
                  key={ws.id}
                  workspace={ws}
                  index={i}
                  isActive={ws.id === activeWorkspaceId}
                  canDelete={workspaces.length > 1}
                  onSelect={() => onSelect(ws.id)}
                  onDelete={() => onDelete(ws.id)}
                  onRename={(name) => onRename(ws.id, name)}
                />
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex-shrink-0 mx-4 h-px bg-[#242424]" />

          {/* Add button */}
          <div className="flex-shrink-0 p-4">
            <button
              onClick={onAdd}
              className="w-full h-9 flex items-center justify-center gap-2 rounded-[8px] border border-dashed border-[#333] text-[12px] text-[#555] hover:text-[#888] hover:border-[#444] transition-colors"
            >
              <div className="w-[18px] h-[18px] rounded-full bg-[#242424] flex items-center justify-center text-[12px] leading-none">+</div>
              Add a page
            </button>
          </div>
        </div>
      )}

      {/* ── Layers tab ── */}
      {tab === 'layers' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Scene label */}
          <div className="flex-shrink-0 flex items-center gap-2 px-6 pt-3 pb-1">
            <div className="w-[5px] h-[5px] rounded-full bg-[#9ae600]" />
            <span className="text-[11px] text-[#555] font-medium">
              {workspaces.find(w => w.id === activeWorkspaceId)?.name ?? 'Scene'}
            </span>
          </div>

          {/* Layers list */}
          <div className="flex-1 overflow-y-auto px-4 py-1" style={{ scrollbarWidth: 'none' }}>
            <div className="flex flex-col gap-0.5">
              {layers.map((layer) => (
                <LayerRow key={layer.id} layer={layer} />
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex-shrink-0 mx-4 h-px bg-[#242424]" />

          {/* Add layer (placeholder) */}
          <div className="flex-shrink-0 p-4">
            <button
              disabled
              className="w-full h-9 flex items-center justify-center gap-2 rounded-[8px] border border-dashed border-[#242424] text-[12px] text-[#333] cursor-not-allowed"
            >
              <div className="w-[18px] h-[18px] rounded-full bg-[#1e1e1e] flex items-center justify-center text-[12px] leading-none">+</div>
              Add a layer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
