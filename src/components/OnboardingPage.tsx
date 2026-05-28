import { useState } from 'react'
import { supabase } from '@/lib/supabase'

/* ── Role definitions ────────────────────────────────────────────── */
const ROLES = [
  {
    key:   'designer',
    label: 'Designer',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
  },
  {
    key:   'marketing',
    label: 'Marketing',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
      </svg>
    ),
  },
  {
    key:   'executive',
    label: 'Dirigeant',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    key:   'developer',
    label: 'Développeur',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
  },
  {
    key:   'other',
    label: 'Autre',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

/* ── Props ───────────────────────────────────────────────────────── */
interface OnboardingPageProps {
  userId:     string
  onComplete: () => void
}

/* ── OnboardingPage ──────────────────────────────────────────────── */
export function OnboardingPage({ userId, onComplete }: OnboardingPageProps) {
  const [step,      setStep]      = useState<1 | 2>(1)
  const [firstName, setFirstName] = useState('')
  const [role,      setRole]      = useState<string | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  /* ── Step 1 → 2 ── */
  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim()) return
    setStep(2)
  }

  /* ── Step 2 → save ── */
  async function handleRoleSubmit() {
    if (!role) return
    setLoading(true)
    setError(null)
    const { error } = await supabase.from('profiles').upsert({
      id:         userId,
      first_name: firstName.trim(),
      role,
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      onComplete()
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">

      {/* ── Left — onboarding form ───────────────────────────────── */}
      <div className="w-1/2 flex flex-col items-center justify-center bg-[#f5f5f7] px-8">
        <div className="w-full max-w-[340px]">

          {/* Logo */}
          <div className="mb-10 text-center">
            <span className="text-[22px] tracking-[-0.02em] text-[#1a1a1a]">
              <span className="font-semibold">Cardistry</span>
              <span className="font-normal">Studio<sup className="text-[11px] align-super">™</sup></span>
            </span>
            <p className="text-[13px] text-black/35 mt-1">3D Card Visualizer</p>
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-1.5 mb-6">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-5 h-1.5 bg-[#1a1a1a]'
                    : s < step
                    ? 'w-1.5 h-1.5 bg-[#1a1a1a]/40'
                    : 'w-1.5 h-1.5 bg-black/15'
                }`}
              />
            ))}
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl border border-black/[0.07] shadow-xl shadow-black/[0.05] p-6">

            {step === 1 ? (
              /* ── Step 1 : First name ── */
              <form onSubmit={handleNameSubmit} className="space-y-4">
                <div>
                  <h2 className="text-[15px] font-semibold text-black/85 mb-0.5 text-center">
                    Bienvenue 👋
                  </h2>
                  <p className="text-[12px] text-black/35 text-center mb-5">
                    Comment tu t'appelles ?
                  </p>
                  <input
                    type="text"
                    placeholder="Ton prénom"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoFocus
                    className="w-full text-[13px] px-3.5 py-2.5 rounded-xl border border-black/10 bg-black/[0.02] focus:outline-none focus:border-black/25 focus:bg-white transition-all placeholder:text-black/25"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={!firstName.trim()}
                  className="w-full bg-[#1a1a1a] hover:bg-[#2d2d2d] text-white text-[13px] font-medium py-2.5 rounded-xl transition-all disabled:opacity-40 active:scale-[0.99]"
                >
                  Continuer
                </button>
              </form>
            ) : (
              /* ── Step 2 : Role ── */
              <div className="space-y-4">
                <div>
                  <h2 className="text-[15px] font-semibold text-black/85 mb-0.5 text-center">
                    Hey {firstName} !
                  </h2>
                  <p className="text-[12px] text-black/35 text-center mb-5">
                    Quel est ton profil ?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map((r) => (
                      <button
                        key={r.key}
                        onClick={() => setRole(r.key)}
                        className={`flex flex-col items-center gap-2 py-3.5 px-2 rounded-xl border text-[12px] font-medium transition-all active:scale-[0.97] ${
                          role === r.key
                            ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white'
                            : 'border-black/10 bg-black/[0.02] text-black/55 hover:bg-black/[0.05] hover:text-black/75'
                        }`}
                      >
                        <span className={role === r.key ? 'text-white' : 'text-black/35'}>
                          {r.icon}
                        </span>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-[11px] text-red-500/80 text-center">{error}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 border border-black/10 text-black/45 hover:text-black/65 hover:bg-black/[0.03] text-[13px] font-medium py-2.5 rounded-xl transition-all"
                  >
                    Retour
                  </button>
                  <button
                    onClick={handleRoleSubmit}
                    disabled={!role || loading}
                    className="flex-1 bg-[#1a1a1a] hover:bg-[#2d2d2d] text-white text-[13px] font-medium py-2.5 rounded-xl transition-all disabled:opacity-40 active:scale-[0.99]"
                  >
                    {loading ? 'Enregistrement…' : 'Commencer'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right — placeholder ──────────────────────────────────── */}
      <div className="w-1/2 relative bg-[#e8e8ed] overflow-hidden">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 select-none">
          <div className="w-16 h-16 rounded-2xl bg-black/[0.06] flex items-center justify-center">
            <svg className="w-7 h-7 text-black/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 18h16.5M6.75 6.75h.008v.008H6.75V6.75z" />
            </svg>
          </div>
          <p className="text-[12px] text-black/25 font-medium">Image coming soon</p>
        </div>
      </div>

    </div>
  )
}
