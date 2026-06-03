import { useEffect, useRef } from 'react'
import { Icon } from '@/components/ui/icon'
import { ROADMAP } from '@/roadmap'

const STATUS_CONFIG = {
  'in-progress': { label: 'In progress', color: 'text-[#9ae600] bg-[#9ae600]/10' },
  'soon':        { label: 'Soon',        color: 'text-white/60 bg-white/[0.06]' },
  'planned':     { label: 'Planned',     color: 'text-white/30 bg-white/[0.04]' },
} as const

interface RoadmapModalProps {
  onClose: () => void
}

export function RoadmapModal({ onClose }: RoadmapModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      <div
        ref={panelRef}
        className="relative bg-[#111] border border-[#242424] rounded-[24px] w-[360px] mx-4 p-6 flex flex-col gap-6 drop-shadow-[0px_8px_24px_rgba(0,0,0,0.48)] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-[16px] font-medium text-white">What's coming</p>
            <p className="text-[14px] font-medium text-[#999]">Features we're building next</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:text-white/60 transition-colors flex-shrink-0"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-4">
          {ROADMAP.map((section) => (
            <div key={section.title} className="flex flex-col gap-2">
              <p className="text-[12px] font-medium text-[#999]">{section.title}</p>
              <div className="flex flex-col">
                {section.items.map((item) => {
                  const cfg = STATUS_CONFIG[item.status]
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 p-2 rounded-[8px] hover:bg-white/[0.03] transition-colors"
                    >
                      <span className="flex-1 text-[14px] font-medium text-white">{item.label}</span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-[12px] text-[#999] text-center">
          Have a feature request? <a href="mailto:hello@cardistrystudio.com" className="text-white hover:text-[#9ae600] transition-colors">Let us know →</a>
        </p>
      </div>
    </div>
  )
}
