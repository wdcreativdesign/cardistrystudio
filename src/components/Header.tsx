import { RotateCcw, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { FeedbackButton } from './FeedbackButton'
import { cn } from '@/lib/utils'

interface HeaderProps {
  onRestart:    () => void
  onLogoClick?: () => void
  logoColor?:   '#1a1a1a' | '#ffffff'
}

export function Header({
  onRestart,
  onLogoClick,
  logoColor = '#1a1a1a',
}: HeaderProps) {

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  const dark = logoColor !== '#ffffff'
  const btnClass = dark
    ? 'border-black/12 bg-white/70 hover:bg-white text-black/35 hover:text-black/60'
    : 'border-white/20 bg-white/15 hover:bg-white/25 text-white/60 hover:text-white/90'

  return (
    <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 pointer-events-none">

      {/* Logo */}
      <div className="flex items-center pointer-events-auto">
        <button
          onClick={onLogoClick}
          className="text-[17px] tracking-[-0.02em] transition-all duration-200 hover:opacity-60 active:scale-[0.97] cursor-pointer bg-transparent border-none p-0"
          style={{ color: logoColor }}
        >
          <span className="font-semibold">Cardistry</span>
          <span className="font-normal">
            Studio<sup className="text-[10px] align-super">™</sup>
          </span>
        </button>
      </div>

      {/* Actions */}
      <div className="pointer-events-auto flex items-center gap-2">
        {/* Feedback */}
        <FeedbackButton logoColor={logoColor} />

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          title="Sign out"
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-xl border shadow-sm backdrop-blur-sm transition-all active:scale-[0.97]',
            btnClass,
          )}
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>

        {/* Restart */}
        <button
          onClick={onRestart}
          className={cn(
            'flex items-center gap-2 border text-[13px] font-medium px-4 py-2 h-9 rounded-xl shadow-sm backdrop-blur-sm transition-all active:scale-[0.97]',
            btnClass,
            dark ? 'text-black/55 hover:text-black/80' : '',
          )}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restart
        </button>
      </div>
    </header>
  )
}
