import { Zap, Circle, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Finish } from '@/types'

interface FinishBarProps {
  finish: Finish
  onChange: (f: Finish) => void
}

const OPTIONS: { key: Finish; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    key: 'metallic',
    label: 'Métallisé',
    icon: <Zap className="w-3.5 h-3.5" />,
    desc: 'Chrome & reflets',
  },
  {
    key: 'plastic',
    label: 'Plastique',
    icon: <Circle className="w-3.5 h-3.5" />,
    desc: 'Semi-brillant',
  },
  {
    key: 'matte',
    label: 'Mat',
    icon: <Square className="w-3.5 h-3.5" />,
    desc: 'Texture velours',
  },
]

export function FinishBar({ finish, onChange }: FinishBarProps) {
  return (
    <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-1 bg-white/80 backdrop-blur-xl border border-black/8 rounded-2xl px-1.5 py-1.5 shadow-xl shadow-black/10">
        {OPTIONS.map((opt) => {
          const active = finish === opt.key
          return (
            <button
              key={opt.key}
              onClick={() => onChange(opt.key)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] transition-all duration-200 font-medium',
                active
                  ? 'bg-[#1a1a1a] text-white shadow-sm'
                  : 'text-black/45 hover:text-black/70 hover:bg-black/6'
              )}
            >
              <span className={cn(active ? 'text-white/80' : 'text-black/35')}>
                {opt.icon}
              </span>
              <span>{opt.label}</span>
              {active && (
                <span className="text-[10px] font-normal text-white/50 hidden sm:inline ml-0.5">
                  {opt.desc}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
