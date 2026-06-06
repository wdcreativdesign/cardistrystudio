import { useState, useRef, useEffect, useCallback } from 'react'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { SliderRow } from '@/components/SliderRow'
import { type Workspace, type CardSettings, type ImageLayer, type BlendMode } from '@/types'
import { trackImageUpload } from '@/lib/analytics'

// ── Collapsible card ──────────────────────────────────────────────
function PanelCard({ title, children, defaultOpen = true, onAdd, addRef }: {
  title:       string
  children:    React.ReactNode
  defaultOpen?: boolean
  onAdd?:      () => void
  addRef?:     React.Ref<HTMLButtonElement>
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-[#242424] flex flex-col items-start w-full shrink-0">
      <div className="flex flex-col items-start p-[16px] w-full">
        <div className="flex items-center justify-between w-full text-white">
          <button onClick={() => setOpen((o) => !o)} className="flex-1 text-left">
            <span className="text-[14px] font-medium">{title}</span>
          </button>
          <div className="flex items-center gap-[8px]">
            {onAdd && (
              <button ref={addRef} onClick={onAdd} className="text-white hover:text-white/70 transition-colors active:scale-95">
                <Icon name="add" size={16} />
              </button>
            )}
            <button onClick={() => setOpen((o) => !o)} className="text-white hover:text-white/70 transition-colors">
              <Icon
                name="keyboard_arrow_down"
                size={16}
                className={cn('transition-transform duration-200', open ? '' : '-rotate-90')}
              />
            </button>
          </div>
        </div>
      </div>
      {open && (
        <div className="flex flex-col items-center pb-[16px] px-[16px] w-full">
          {children}
        </div>
      )}
    </div>
  )
}

// ── Segmented control ─────────────────────────────────────────────
function SegControl<T extends string>({ options, value, onChange }: {
  options: { key: T; label: string }[]
  value:   T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex items-center bg-[#242424] rounded-full p-[4px] h-[40px] w-full">
      {options.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            'flex-1 h-[32px] rounded-full text-[14px] font-medium transition-colors',
            value === key ? 'bg-[#141414] text-white' : 'text-[#999]',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ── Inline rename ─────────────────────────────────────────────────
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
      className="flex-1 min-w-0 bg-transparent text-[14px] text-white font-medium outline-none border-b border-[#9ae600]/60"
      onClick={(e) => e.stopPropagation()}
    />
  )
}

// ── Scene row ─────────────────────────────────────────────────────
function SceneRow({ workspace, isActive, canDelete, onSelect, onDelete, onRename }: {
  workspace: Workspace
  isActive:  boolean
  canDelete: boolean
  onSelect:  () => void
  onDelete:  () => void
  onRename:  (name: string) => void
}) {
  const [renaming, setRenaming] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
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
        'flex gap-[8px] items-center p-[8px] rounded-[8px] w-full cursor-pointer select-none',
        isActive ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]',
      )}
      onClick={onSelect}
    >
      {/* Drag handle */}
      {!renaming && (
        <span className="text-white/30 hover:text-white/70 transition-colors cursor-grab active:cursor-grabbing flex-shrink-0 select-none">
          <Icon name="drag_indicator" size={16} />
        </span>
      )}

      {/* Nom / InlineRename */}
      {renaming ? (
        <InlineRename value={workspace.name} onDone={(v) => { onRename(v); setRenaming(false) }} />
      ) : (
        <span className="flex-1 min-w-0 text-[14px] font-medium text-white truncate">
          {workspace.name}
        </span>
      )}

      {/* more_horiz pill */}
      {!renaming && (
        <div ref={menuRef} className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className={cn(
              'flex items-center justify-center h-[24px] px-[4px] rounded-[4px] bg-[#242424] text-white transition-colors hover:brightness-110',
              menuOpen && 'brightness-125',
            )}
          >
            <Icon name="more_horiz" size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 bottom-full mb-1 z-50 w-[120px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[10px] overflow-hidden shadow-xl py-1">
              <button
                onClick={() => { setMenuOpen(false); setRenaming(true) }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <Icon name="edit" size={12} />
                Rename
              </button>
              {canDelete && (
                <button
                  onClick={() => { setMenuOpen(false); onDelete() }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-white/70 hover:text-red-400 hover:bg-white/[0.06] transition-colors"
                >
                  <Icon name="delete" size={12} />
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

// ── Blend mode options ────────────────────────────────────────────
const BLEND_MODES: { value: BlendMode; label: string }[] = [
  { value: 'source-over', label: 'Normal'     },
  { value: 'multiply',    label: 'Multiply'   },
  { value: 'screen',      label: 'Screen'     },
  { value: 'overlay',     label: 'Overlay'    },
  { value: 'darken',      label: 'Darken'     },
  { value: 'lighten',     label: 'Lighten'    },
  { value: 'color-dodge', label: 'Dodge'      },
  { value: 'color-burn',  label: 'Burn'       },
  { value: 'difference',  label: 'Difference' },
  { value: 'exclusion',   label: 'Exclusion'  },
]

// ── Color row (swatch + hex) — même pattern d'input que SliderRow ──
function ColorRow({ label, value, onChange }: {
  label:    string
  value:    string
  onChange: (v: string) => void
}) {
  const [editing,  setEditing]  = useState(false)
  const [inputVal, setInputVal] = useState(value.toUpperCase())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (!editing) setInputVal(value.toUpperCase()) }, [value, editing])
  useEffect(() => { if (editing) { inputRef.current?.focus(); inputRef.current?.select() } }, [editing])

  function commit(raw = inputVal) {
    const v = raw.trim()
    const full = v.startsWith('#') ? v : `#${v}`
    if (/^#[0-9a-fA-F]{6}$/.test(full)) onChange(full)
    setEditing(false)
  }

  return (
    <div className="flex gap-[10px] items-center w-full">
      <span className="text-[12px] font-medium text-white w-[48px] flex-shrink-0 truncate">{label}</span>
      <div className="flex flex-1 gap-[8px] items-center min-w-0">
        {/* Swatch → color picker natif */}
        <div className="relative flex-shrink-0">
          <div
            className="w-[24px] h-[24px] rounded-[4px] border border-[#242424] cursor-pointer"
            style={{ backgroundColor: value }}
          />
          <input
            type="color"
            value={value}
            onChange={(e) => { onChange(e.target.value); setInputVal(e.target.value.toUpperCase()) }}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </div>
        {/* Hex — span cliquable / input en édition, identique à SliderRow */}
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value.toUpperCase())}
            onBlur={() => commit()}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit() } if (e.key === 'Escape') setEditing(false) }}
            maxLength={7}
            className="flex-1 h-6 rounded-[4px] px-1 text-right text-[12px] font-medium text-white uppercase bg-[#242424] border border-[#9ae600] focus:outline-none"
          />
        ) : (
          <span
            role="button"
            tabIndex={0}
            onClick={() => setEditing(true)}
            onKeyDown={(e) => e.key === 'Enter' && setEditing(true)}
            title="Click to edit"
            className="flex-1 h-6 rounded-[4px] px-1 text-right text-[12px] font-medium text-white uppercase bg-[#242424] cursor-text select-none hover:brightness-110 transition-colors inline-flex items-center justify-end"
          >
            {value.toUpperCase()}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Layer row ─────────────────────────────────────────────────────
function LayerRow({ layer, index, isDragging, dropIndicator, onDelete, onRename, onChangeBlend, onChangeOpacity,
  onDragStart, onDragEnter, onDragOver, onDragEnd, onDrop }: {
  layer:             ImageLayer
  index:             number
  isDragging:        boolean
  dropIndicator:     'before' | 'after' | null
  onDelete:          () => void
  onRename:          (name: string) => void
  onChangeBlend:     (mode: BlendMode) => void
  onChangeOpacity:   (v: number) => void
  onDragStart:       (i: number) => void
  onDragEnter:       (i: number, pos: 'before' | 'after') => void
  onDragOver:        (e: React.DragEvent, i: number) => void
  onDragEnd:         () => void
  onDrop:            (e: React.DragEvent) => void
}) {
  const [blendOpen,  setBlendOpen]  = useState(false)
  const [moreOpen,   setMoreOpen]   = useState(false)
  const [renaming,   setRenaming]   = useState(false)
  const menuRef      = useRef<HTMLDivElement>(null)
  const moreRef      = useRef<HTMLDivElement>(null)
  const committedRef = useRef<BlendMode>(layer.blendMode ?? 'source-over')

  // Close more menu on outside click
  useEffect(() => {
    if (!moreOpen) return
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [moreOpen])

  // Opacity input (même pattern que SliderRow)
  const [opEditing,  setOpEditing]  = useState(false)
  const [opVal,      setOpVal]      = useState(String(layer.opacity ?? 100))
  const opInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (!opEditing) setOpVal(String(layer.opacity ?? 100)) }, [layer.opacity, opEditing])
  useEffect(() => { if (opEditing) { opInputRef.current?.focus(); opInputRef.current?.select() } }, [opEditing])
  function commitOpacity(raw = opVal) {
    const n = Math.round(parseFloat(raw))
    if (!isNaN(n)) onChangeOpacity(Math.min(100, Math.max(0, n)))
    setOpEditing(false)
  }

  // Sync committed ref when the real value changes externally
  useEffect(() => {
    if (!blendOpen) committedRef.current = layer.blendMode ?? 'source-over'
  }, [layer.blendMode, blendOpen])

  function openMenu() { committedRef.current = layer.blendMode ?? 'source-over'; setBlendOpen(true) }
  function closeMenu(commit: boolean) {
    if (!commit) onChangeBlend(committedRef.current)  // revert preview
    setBlendOpen(false)
  }

  useEffect(() => {
    if (!blendOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [blendOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="relative group"
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnter={(e) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        onDragEnter(index, e.clientY < rect.top + rect.height / 2 ? 'before' : 'after')
      }}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
    >
      {/* Insert indicator — before */}
      {dropIndicator === 'before' && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#9ae600] rounded-full -translate-y-[1px] z-10 pointer-events-none" />
      )}

      {/* Row — Figma 149:1593 : tout dans un seul conteneur p-[8px] rounded-[8px] */}
      <div className={cn('flex flex-1 gap-[8px] items-center min-w-0 p-[8px] rounded-[8px] hover:bg-white/[0.04]', isDragging && 'opacity-30')}>

        {/* Drag handle */}
        {!renaming && (
          <span className="text-white/30 group-hover:text-white/70 transition-colors cursor-grab active:cursor-grabbing flex-shrink-0 select-none">
            <Icon name="drag_indicator" size={16} />
          </span>
        )}

        {/* Nom — flex-1 ou InlineRename */}
        {renaming ? (
          <InlineRename
            value={layer.name || `Layer ${index + 1}`}
            onDone={(v) => { onRename(v); setRenaming(false) }}
          />
        ) : (
          <span className="flex-1 min-w-0 text-[14px] font-medium text-white truncate">
            {layer.name || `Layer ${index + 1}`}
          </span>
        )}

        {/* Blend mode — icône opacity */}
        <div ref={menuRef} className="relative flex-shrink-0">
          <button
            title="Blend mode"
            onClick={() => blendOpen ? closeMenu(false) : openMenu()}
            className={cn(
              'flex items-center justify-center h-[24px] px-[4px] rounded-[4px] bg-[#242424] text-white transition-colors hover:brightness-110',
              blendOpen && 'brightness-125',
            )}
          >
            <Icon name="opacity" size={16} />
          </button>
          {blendOpen && (
            <div className="absolute right-0 bottom-full mb-1 z-50 w-[130px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[10px] overflow-hidden shadow-xl py-1">
              {BLEND_MODES.map((m) => (
                <button
                  key={m.value}
                  onMouseEnter={() => onChangeBlend(m.value)}
                  onClick={() => { committedRef.current = m.value; closeMenu(true) }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-1.5 text-[12px] transition-colors',
                    committedRef.current === m.value
                      ? 'text-[#9ae600] bg-white/[0.04]'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.06]',
                  )}
                >
                  {m.label}
                  {committedRef.current === m.value && <Icon name="check" size={12} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Opacity — pill w-[64px] */}
        {opEditing ? (
          <input
            ref={opInputRef}
            type="text"
            value={opVal}
            onChange={(e) => setOpVal(e.target.value)}
            onBlur={() => commitOpacity()}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitOpacity() } if (e.key === 'Escape') setOpEditing(false) }}
            className="w-[64px] h-[24px] flex-shrink-0 rounded-[4px] px-[4px] text-right text-[12px] font-medium text-white bg-[#242424] border border-[#9ae600] focus:outline-none"
          />
        ) : (
          <span
            role="button"
            tabIndex={0}
            onClick={() => setOpEditing(true)}
            onKeyDown={(e) => e.key === 'Enter' && setOpEditing(true)}
            title="Opacity"
            className="w-[64px] h-[24px] flex-shrink-0 rounded-[4px] px-[4px] text-right text-[12px] font-medium text-white bg-[#242424] cursor-text select-none hover:brightness-110 transition-colors inline-flex items-center justify-end"
          >
            {layer.opacity ?? 100}%
          </span>
        )}

        {/* More — Rename / Remove */}
        <div ref={moreRef} className="relative flex-shrink-0">
          <button
            title="Options"
            onClick={() => setMoreOpen((o) => !o)}
            className={cn(
              'flex items-center justify-center h-[24px] px-[4px] rounded-[4px] bg-[#242424] text-white transition-colors hover:brightness-110',
              moreOpen && 'brightness-125',
            )}
          >
            <Icon name="more_horiz" size={16} />
          </button>
          {moreOpen && (
            <div className="absolute right-0 bottom-full mb-1 z-50 w-[120px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[10px] overflow-hidden shadow-xl py-1">
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
                onClick={() => { setMoreOpen(false); setRenaming(true) }}
              >
                <Icon name="edit" size={12} />
                Rename
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-white/70 hover:text-red-400 hover:bg-white/[0.06] transition-colors"
                onClick={() => { setMoreOpen(false); onDelete() }}
              >
                <Icon name="delete" size={12} />
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Insert indicator — after */}
      {dropIndicator === 'after' && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#9ae600] rounded-full translate-y-[1px] z-10 pointer-events-none" />
      )}
    </div>
  )
}

// ── Layer drop zone (add new layer) ──────────────────────────────
function LayerDropZone({ face, onAdd }: {
  face:  'front' | 'back'
  onAdd: (layer: ImageLayer) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'image/svg+xml') return
    const name = file.name.replace(/\.[^/.]+$/, '') // strip extension
    const reader = new FileReader()
    reader.onload = (e) => {
      const image = e.target?.result as string
      if (!image) return
      trackImageUpload(face)
      const id = Math.random().toString(36).slice(2, 9)
      onAdd({ id, name, image, blendMode: 'source-over', opacity: 100 })
    }
    reader.readAsDataURL(file)
  }, [face, onAdd])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <div
      className="flex items-center justify-center h-[40px] w-full rounded-full bg-[#242424] cursor-pointer hover:brightness-110 transition-all"
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <p className="text-[16px] font-medium text-white">Add layer</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.svg"
        className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
      />
    </div>
  )
}

// ── Layers section content ────────────────────────────────────────
function LayersSection({ settings, onChange }: {
  settings: CardSettings
  onChange: (patch: Partial<CardSettings>) => void
}) {
  const [face, setFace] = useState<'front' | 'back'>('front')
  const layers   = face === 'front' ? settings.frontLayers : settings.backLayers
  const layerKey = face === 'front' ? 'frontLayers' : 'backLayers'

  // Drag state
  const dragIndexRef = useRef<number | null>(null)
  const [dropTarget, setDropTarget] = useState<{ index: number; pos: 'before' | 'after' } | null>(null)

  function handleAdd(newLayer: ImageLayer) {
    onChange({ [layerKey]: [{ ...newLayer, blendMode: newLayer.blendMode ?? 'source-over', opacity: newLayer.opacity ?? 100 }, ...layers] })
  }

  function handleDelete(id: string) {
    onChange({ [layerKey]: layers.filter((l) => l.id !== id) })
  }

  function handleChangeBlend(id: string, mode: BlendMode) {
    onChange({ [layerKey]: layers.map((l) => l.id === id ? { ...l, blendMode: mode } : l) })
  }

  function handleChangeOpacity(id: string, opacity: number) {
    onChange({ [layerKey]: layers.map((l) => l.id === id ? { ...l, opacity } : l) })
  }

  function handleRename(id: string, name: string) {
    onChange({ [layerKey]: layers.map((l) => l.id === id ? { ...l, name } : l) })
  }

  function handleDragStart(i: number) {
    dragIndexRef.current = i
  }

  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const pos  = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
    setDropTarget({ index: i, pos })
  }

  function handleDragEnd() {
    dragIndexRef.current = null
    setDropTarget(null)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const from = dragIndexRef.current
    if (from === null || !dropTarget) { handleDragEnd(); return }

    const { index: toIndex, pos } = dropTarget
    const insertAt = pos === 'after' ? toIndex + 1 : toIndex

    if (from === insertAt || from === insertAt - 1) { handleDragEnd(); return }

    const next = [...layers]
    const [moved] = next.splice(from, 1)
    const adjusted = from < insertAt ? insertAt - 1 : insertAt
    next.splice(adjusted, 0, moved)
    onChange({ [layerKey]: next })
    handleDragEnd()
  }

  return (
    <div className="flex flex-col items-start w-full gap-[12px]">
      <SegControl
        options={[{ key: 'front', label: 'Front' }, { key: 'back', label: 'Back' }]}
        value={face}
        onChange={setFace}
      />

      {layers.length > 0 && (
        <div className="flex flex-col w-full" onDragLeave={() => setDropTarget(null)}>
          {layers.map((layer, i) => (
            <LayerRow
              key={layer.id}
              layer={layer}
              index={i}
              isDragging={dragIndexRef.current === i}
              dropIndicator={dropTarget?.index === i ? dropTarget.pos : null}
              onDelete={() => handleDelete(layer.id)}
              onRename={(name) => handleRename(layer.id, name)}
              onChangeBlend={(mode) => handleChangeBlend(layer.id, mode)}
              onChangeOpacity={(v) => handleChangeOpacity(layer.id, v)}
              onDragStart={handleDragStart}
              onDragEnter={(idx, pos) => setDropTarget({ index: idx, pos })}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
            />
          ))}
        </div>
      )}

      <LayerDropZone face={face} onAdd={handleAdd} />
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────
interface LeftPanelProps {
  workspaces:        Workspace[]
  activeWorkspaceId: string
  activeSettings:    CardSettings
  onSelect:          (id: string) => void
  onAdd:             () => void
  onDelete:          (id: string) => void
  onRename:          (id: string, name: string) => void
  onChange:          (patch: Partial<CardSettings>) => void
  // legacy
  savedPoses?:       unknown
  currentSettings?:  unknown
  onSavePose?:       unknown
  onApplyPose?:      unknown
  onDeletePose?:     unknown
  onRenamePose?:     unknown
}

export function LeftPanel({
  workspaces, activeWorkspaceId, activeSettings,
  onSelect, onAdd, onDelete, onRename, onChange,
}: LeftPanelProps) {
  const [tab, setTab] = useState<'pages' | 'style'>('pages')

  return (
    <div
      className="w-[280px] flex-shrink-0 flex flex-col bg-[#111] border-r border-[#242424] overflow-y-auto overflow-x-hidden"
      style={{ marginTop: 72, height: 'calc(100vh - 72px)', scrollbarWidth: 'none' }}
    >
      {/* ── Navigation ── */}
      <div className="border-b border-[#242424] flex flex-col items-start p-[16px] shrink-0 w-full">
        <SegControl
          options={[{ key: 'pages', label: 'Create' }, { key: 'style', label: 'Stylise' }]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {/* ── Create tab ── */}
      {tab === 'pages' && (
        <>
          {/* Pages section */}
          <PanelCard title="Pages">
            <div className="flex flex-col gap-[16px] items-start w-full">
              <div className="flex flex-col items-start w-full">
                {workspaces.map((ws) => (
                  <SceneRow
                    key={ws.id}
                    workspace={ws}
                    isActive={ws.id === activeWorkspaceId}
                    canDelete={workspaces.length > 1}
                    onSelect={() => onSelect(ws.id)}
                    onDelete={() => onDelete(ws.id)}
                    onRename={(name) => onRename(ws.id, name)}
                  />
                ))}
              </div>
              <button
                onClick={onAdd}
                className="flex items-center justify-center h-[40px] w-full rounded-full bg-[#242424] hover:brightness-110 transition-all"
              >
                <span className="text-[16px] font-medium text-white">Add page</span>
              </button>
            </div>
          </PanelCard>

          {/* Layers section */}
          <PanelCard title="Layers">
            <LayersSection settings={activeSettings} onChange={onChange} />
          </PanelCard>

          {/* Card section */}
          <PanelCard title="Card">
            <div className="flex flex-col gap-[8px] w-full">
              {/* Card fill */}
              <ColorRow
                label="Card"
                value={activeSettings.cardColor}
                onChange={(v) => onChange({ cardColor: v })}
              />
              {/* Edge color */}
              <ColorRow
                label="Edge"
                value={activeSettings.edgeColor}
                onChange={(v) => onChange({ edgeColor: v })}
              />
            </div>
          </PanelCard>
        </>
      )}

      {/* ── Stylise tab ── */}
      {tab === 'style' && (
        <>
          <PanelCard title="Lights">
            <div className="w-full">
              <SliderRow
                label="Intensity"
                value={activeSettings.lightIntensity}
                min={0} max={2} step={0.05} unit="×"
                onChange={(v) => onChange({ lightIntensity: v })}
              />
            </div>
          </PanelCard>
        </>
      )}
    </div>
  )
}
