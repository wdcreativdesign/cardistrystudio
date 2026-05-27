import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type CardPage } from '@/types'

/* ─── Individual page thumbnail ─────────────────────────────────── */
function PageThumb({
  page,
  index,
  active,
  canDelete,
  onSelect,
  onDelete,
}: {
  page: CardPage
  index: number
  active: boolean
  canDelete: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const isV = page.settings.orientation === 'vertical'
  const W = 48
  const H = isV
    ? Math.round(W * 85.7 / 54)
    : Math.round(W * 54 / 85.7)

  return (
    <div className="relative group flex-shrink-0" style={{ width: W, height: H }}>
      <button onClick={onSelect} title={page.name} className="block w-full h-full">
        <div
          className={cn(
            'relative w-full h-full rounded-[5px] overflow-hidden transition-all duration-100',
            active
              ? 'ring-2 ring-black/75 ring-offset-2'
              : 'ring-1 ring-black/10 hover:ring-black/30',
          )}
          style={{ backgroundColor: '#111' }}
        >
          {/* Edge-color accent strip */}
          {!page.settings.frontImage && (
            <div
              className="absolute left-0 top-0 bottom-0 w-[3px]"
              style={{ backgroundColor: page.settings.edgeColor }}
            />
          )}
          {/* Front image preview */}
          {page.settings.frontImage && (
            <img
              src={page.settings.frontImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </div>
      </button>

      {/* Page-number badge */}
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
          title="Remove card"
        >
          <X className="w-2 h-2" />
        </button>
      )}
    </div>
  )
}

/* ─── LeftPanel ──────────────────────────────────────────────────── */
interface LeftPanelProps {
  pages: CardPage[]
  activePageId: string
  onSelect: (id: string) => void
  onAdd: () => void
  onDelete: (id: string) => void
}

export function LeftPanel({
  pages,
  activePageId,
  onSelect,
  onAdd,
  onDelete,
}: LeftPanelProps) {
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
      {/* Scrollable pages list */}
      <div
        className="flex flex-col items-center gap-2 overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 140px)', scrollbarWidth: 'none' }}
      >
        {pages.map((page, i) => (
          <PageThumb
            key={page.id}
            page={page}
            index={i}
            active={page.id === activePageId}
            canDelete={pages.length > 1}
            onSelect={() => onSelect(page.id)}
            onDelete={() => onDelete(page.id)}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-black/[0.07]" />

      {/* Add page button */}
      <button
        onClick={onAdd}
        title="Add card"
        className={cn(
          'w-8 h-8 rounded-[10px] flex-shrink-0',
          'bg-black/[0.04] hover:bg-black/[0.09]',
          'flex items-center justify-center',
          'text-black/30 hover:text-black/60',
          'transition-all active:scale-95',
        )}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
