import { cn } from '@/lib/utils'
import { type CardSettings, type Finish, type Orientation } from '@/types'

/* ── Icônes carte (SVG inline pour la précision) ─────────────────── */
function HorizontalCardIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
      <rect
        x="0.75" y="0.75" width="20.5" height="12.5" rx="2.25"
        stroke="currentColor"
        strokeWidth={active ? 1.8 : 1.4}
      />
    </svg>
  )
}

function VerticalCardIcon({ active }: { active: boolean }) {
  return (
    <svg width="14" height="22" viewBox="0 0 14 22" fill="none">
      <rect
        x="0.75" y="0.75" width="12.5" height="20.5" rx="2.25"
        stroke="currentColor"
        strokeWidth={active ? 1.8 : 1.4}
      />
    </svg>
  )
}

/* ── Options ─────────────────────────────────────────────────────── */
const ORIENTATIONS: { key: Orientation; label: string }[] = [
  { key: 'horizontal', label: 'Horizontal' },
  { key: 'vertical',   label: 'Vertical'   },
]

const FINISHES: { key: Finish; label: string }[] = [
  { key: 'metallic', label: 'Metal'   },
  { key: 'plastic',  label: 'Plastic' },
  { key: 'matte',    label: 'Matte'   },
]

/* ── Pill générique ──────────────────────────────────────────────── */
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1 bg-white/80 backdrop-blur-xl border border-black/8 rounded-2xl px-1.5 py-1.5 shadow-xl shadow-black/10">
      {children}
    </div>
  )
}

/* ── Bouton générique ────────────────────────────────────────────── */
function PillBtn({
  active, onClick, children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] transition-all duration-200 font-medium select-none',
        active
          ? 'bg-[#1a1a1a] text-white shadow-sm'
          : 'text-black/45 hover:text-black/70 hover:bg-black/6',
      )}
    >
      {children}
    </button>
  )
}

/* ── BottomBar ───────────────────────────────────────────────────── */
interface BottomBarProps {
  settings: CardSettings
  onChange: (patch: Partial<CardSettings>) => void
}

export function BottomBar({ settings, onChange }: BottomBarProps) {
  return (
    <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3">

        {/* ── Bloc orientation ── */}
        <Pill>
          {ORIENTATIONS.map((o) => {
            const active = settings.orientation === o.key
            return (
              <PillBtn key={o.key} active={active} onClick={() => onChange({ orientation: o.key })}>
                <span className={cn(active ? 'text-white' : 'text-black/40')}>
                  {o.key === 'horizontal'
                    ? <HorizontalCardIcon active={active} />
                    : <VerticalCardIcon   active={active} />
                  }
                </span>
                <span>{o.label}</span>
              </PillBtn>
            )
          })}
        </Pill>

        {/* ── Séparateur visuel ── */}
        <div className="w-px h-6 bg-black/12 rounded-full" />

        {/* ── Bloc finition ── */}
        <Pill>
          {FINISHES.map((f) => {
            const active = settings.finish === f.key
            return (
              <PillBtn key={f.key} active={active} onClick={() => onChange({ finish: f.key })}>
                {f.label}
              </PillBtn>
            )
          })}
        </Pill>

      </div>
    </div>
  )
}
