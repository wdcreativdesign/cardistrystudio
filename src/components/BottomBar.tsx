import { useState } from 'react'
import { cn } from '@/lib/utils'
import { type CardSettings, type Finish, type Orientation } from '@/types'

/* ── Card count icons ────────────────────────────────────────────── */
function CardCountIcon({ count }: { count: 1 | 2 | 3 }) {
  if (count === 1) return (
    <svg width="9" height="13" viewBox="0 0 9 13" fill="none">
      <rect x="0.75" y="0.75" width="7.5" height="11.5" rx="1.75" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
  if (count === 2) return (
    <svg width="19" height="13" viewBox="0 0 19 13" fill="none">
      <rect x="0.75" y="0.75" width="7.5" height="11.5" rx="1.75" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10.75" y="0.75" width="7.5" height="11.5" rx="1.75" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
  return (
    <svg width="29" height="13" viewBox="0 0 29 13" fill="none">
      <rect x="0.75" y="0.75" width="7.5" height="11.5" rx="1.75" stroke="currentColor" strokeWidth="1.3" />
      <rect x="10.75" y="0.75" width="7.5" height="11.5" rx="1.75" stroke="currentColor" strokeWidth="1.3" />
      <rect x="20.75" y="0.75" width="7.5" height="11.5" rx="1.75" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

/* ── Card orientation icons ──────────────────────────────────────── */
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

/* ── Orientations ────────────────────────────────────────────────── */
const ORIENTATIONS: { key: Orientation; label: string }[] = [
  { key: 'horizontal', label: 'Horizontal' },
  { key: 'vertical',   label: 'Vertical'   },
]

/* ── Material spheres ────────────────────────────────────────────── */
const FINISHES: { key: Finish; label: string; gradient: string }[] = [
  {
    key: 'metallic',
    label: 'Metal',
    gradient: 'radial-gradient(circle at 33% 28%, #ffffff 0%, #e8e8e8 18%, #b0b0b0 42%, #6a6a6a 68%, #2a2a2a 100%)',
  },
  {
    key: 'plastic',
    label: 'Plastic',
    gradient: 'radial-gradient(circle at 33% 28%, #ffffff 0%, #c8e8ff 18%, #5aabff 42%, #1a6fd4 68%, #0a3a7a 100%)',
  },
  {
    key: 'matte',
    label: 'Matte',
    gradient: 'radial-gradient(circle at 38% 32%, #c8c8c8 0%, #909090 30%, #606060 60%, #404040 100%)',
  },
]

/* ── Pill wrapper ────────────────────────────────────────────────── */
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1 bg-white/80 backdrop-blur-xl border border-black/8 rounded-2xl px-1.5 py-1.5 shadow-xl shadow-black/10">
      {children}
    </div>
  )
}

/* ── Pill button ─────────────────────────────────────────────────── */
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

/* ── Material sphere button ──────────────────────────────────────── */
function SphereBtn({
  finish, active, onClick,
}: {
  finish: typeof FINISHES[number]
  active: boolean
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div className="relative flex flex-col items-center">
      {/* Tooltip */}
      {hovered && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1a1a1a] text-white text-[10px] font-medium px-2 py-1 rounded-lg whitespace-nowrap pointer-events-none">
          {finish.label}
        </div>
      )}

      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          'relative rounded-full transition-all duration-200 active:scale-95',
          active ? 'ring-2 ring-black/70 ring-offset-2' : 'hover:scale-110',
        )}
        style={{ width: 34, height: 34 }}
      >
        {/* Sphere */}
        <div
          className="w-full h-full rounded-full"
          style={{ background: finish.gradient }}
        />
        {/* Specular highlight */}
        <div
          className="absolute rounded-full"
          style={{
            top: '14%', left: '20%',
            width: '35%', height: '22%',
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.7) 0%, transparent 100%)',
            filter: 'blur(1px)',
          }}
        />
      </button>
    </div>
  )
}

/* ── BottomBar ───────────────────────────────────────────────────── */
interface BottomBarProps {
  settings:             CardSettings
  onChange:             (patch: Partial<CardSettings>) => void
  displayCount:         1 | 2 | 3
  onDisplayCountChange: (count: 1 | 2 | 3) => void
}

const COUNTS: (1 | 2 | 3)[] = [1, 2, 3]

export function BottomBar({ settings, onChange, displayCount, onDisplayCountChange }: BottomBarProps) {
  return (
    <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3">

        {/* Card count */}
        <Pill>
          {COUNTS.map((c) => (
            <PillBtn key={c} active={displayCount === c} onClick={() => onDisplayCountChange(c)}>
              <span className={cn(displayCount === c ? 'text-white' : 'text-black/40')}>
                <CardCountIcon count={c} />
              </span>
            </PillBtn>
          ))}
        </Pill>

        {/* Visual separator */}
        <div className="w-px h-6 bg-black/12 rounded-full" />

        {/* Orientation */}
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

        {/* Visual separator */}
        <div className="w-px h-6 bg-black/12 rounded-full" />

        {/* Material spheres */}
        <div className="flex items-center gap-2.5 bg-white/80 backdrop-blur-xl border border-black/8 rounded-2xl px-3.5 py-2.5 shadow-xl shadow-black/10">
          {FINISHES.map((f) => (
            <SphereBtn
              key={f.key}
              finish={f}
              active={settings.finish === f.key}
              onClick={() => onChange({ finish: f.key })}
            />
          ))}
        </div>

      </div>
    </div>
  )
}
