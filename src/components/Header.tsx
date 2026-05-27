import { Download, RotateCcw } from 'lucide-react'

interface HeaderProps {
  onExport:  () => void
  onRestart: () => void
}

export function Header({ onExport, onRestart }: HeaderProps) {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 pointer-events-none">
      {/* Logo */}
      <div className="flex items-center pointer-events-auto">
        <span className="text-[17px] tracking-[-0.02em] text-[#1a1a1a]">
          <span className="font-semibold">Floa</span>
          <span className="font-light">
            CardStudio<sup className="text-[10px] align-super">™</sup>
          </span>
        </span>
      </div>

      {/* Actions */}
      <div className="pointer-events-auto flex items-center gap-2">
        {/* Restart */}
        <button
          onClick={onRestart}
          className="flex items-center gap-2 border border-black/12 bg-white/70 hover:bg-white text-black/55 hover:text-black/80 text-[13px] font-medium px-4 py-2 h-9 rounded-xl shadow-sm backdrop-blur-sm transition-all active:scale-[0.97]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restart
        </button>

        {/* Export — opens dialog */}
        <button
          onClick={onExport}
          className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#2d2d2d] text-white text-[13px] font-medium px-4 py-2 h-9 rounded-xl shadow-sm transition-all active:scale-[0.97]"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </div>
    </header>
  )
}
